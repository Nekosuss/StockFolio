import {Router} from 'express';import mongoose from 'mongoose';import {Holding,Transaction,Watchlist,User,PortfolioSnapshot} from '../models/index.js';import{marketDataService}from'../services/marketDataService.js';import{requireAuth}from'../middleware/auth.js';import auth from'./auth.js';
const api=Router();api.use('/auth',auth);api.use(requireAuth);const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);const quote=s=>marketDataService.getQuote(s);
api.get('/market/headlines',wrap(async(_req,res)=>res.json({headlines:await marketDataService.getMarketHeadlines()})));api.get('/stocks/search',wrap(async(req,res)=>{const q=String(req.query.q||'').trim();if(!q)return res.json({results:[]});res.json({results:await marketDataService.searchStocks(q)})}));api.get('/stocks/:symbol/history',wrap(async(req,res)=>res.json({history:await marketDataService.getHistoricalData(req.params.symbol,req.query.range)})));api.get('/stocks/:symbol',wrap(async(req,res)=>res.json({stock:await quote(req.params.symbol)})));
api.get('/holdings',wrap(async(req,res)=>{const list=await Holding.find({userId:req.user.id}).lean();const holdings=await Promise.all(list.map(async h=>({...h,quote:await quote(h.symbol)})));res.json({holdings})}));api.get('/holdings/:symbol',wrap(async(req,res)=>{const h=await Holding.findOne({userId:req.user.id,symbol:req.params.symbol.toUpperCase()});if(!h)return res.status(404).json({error:'Holding not found'});res.json({holding:h,quote:await quote(h.symbol)})}));
api.get('/portfolio',wrap(async(req,res)=>{const user=await User.findById(req.user.id).select('cashBalance');const rows=await Holding.find({userId:req.user.id});const holdings=await Promise.all(rows.map(async h=>({holding:h,quote:await quote(h.symbol)})));const invested=holdings.reduce((n,x)=>n+x.holding.quantity*x.holding.averageBuyPrice,0),market=holdings.reduce((n,x)=>n+x.holding.quantity*x.quote.price,0);res.json({cashBalance:user.cashBalance,investedValue:invested,holdingsValue:market,totalValue:user.cashBalance+market,unrealizedPL:market-invested,returnPercent:invested?(market-invested)/invested*100:0})}));api.get('/portfolio/allocation',wrap(async(req,res)=>{const rows=await Holding.find({userId:req.user.id});const allocation={};for(const h of rows){const q=await quote(h.symbol);allocation[q.sector||'Other']=(allocation[q.sector||'Other']||0)+h.quantity*q.price}res.json({allocation})}));api.get('/portfolio/performance',wrap(async(req,res)=>res.json({snapshots:await PortfolioSnapshot.find({userId:req.user.id}).sort({timestamp:1}).limit(500)})));
async function trade(req,res,type){
 const symbol=String(req.body.symbol||'').toUpperCase(),quantity=Number(req.body.quantity);
 if(!/^[A-Z.]{1,12}$/.test(symbol)||!Number.isSafeInteger(quantity)||quantity<1)return res.status(400).json({error:'Valid stock symbol and whole share quantity are required'});
 const q=await quote(symbol),session=await mongoose.startSession();let failure=null,standalone=false;
 try{await session.withTransaction(async()=>{
  const user=await User.findById(req.user.id).session(session),existing=await Holding.findOne({userId:req.user.id,symbol}).session(session),total=q.price*quantity;
  if(type==='BUY'&&total>user.cashBalance){failure={status:400,message:'Insufficient virtual cash'};throw Object.assign(new Error(failure.message),{status:400})}
  if(type==='SELL'&&(!existing||quantity>existing.quantity)){failure={status:400,message:'Insufficient shares to sell'};throw Object.assign(new Error(failure.message),{status:400})}
  if(type==='BUY'){user.cashBalance-=total;await user.save({session});if(existing){existing.averageBuyPrice=(existing.averageBuyPrice*existing.quantity+q.price*quantity)/(existing.quantity+quantity);existing.quantity+=quantity;await existing.save({session})}else await Holding.create([{userId:user._id,symbol,companyName:q.name,quantity,averageBuyPrice:q.price}],{session})}
  else{user.cashBalance+=total;await user.save({session});existing.quantity-=quantity;if(existing.quantity===0)await existing.deleteOne({session});else await existing.save({session})}
  await Transaction.create([{userId:user._id,symbol,companyName:q.name,type,quantity,price:q.price,totalValue:total}],{session});res.locals.trade={cashBalance:user.cashBalance,price:q.price};
 })}catch(e){
  if(failure)return res.status(failure.status).json({error:failure.message});
  if(e.code===20||/transaction numbers are only allowed|transactions are not supported|replica set member or mongos/i.test(e.message||''))standalone=true;
  else throw e;
 }finally{await session.endSession()}
 if(standalone){
  const total=q.price*quantity,userId=req.user.id;
  if(type==='BUY'){
   const debited=await User.findOneAndUpdate({_id:userId,cashBalance:{$gte:total}},{$inc:{cashBalance:-total}},{new:true});
   if(!debited)return res.status(400).json({error:'Insufficient virtual cash'});
   let prior=null,created=false;
   try{
    prior=await Holding.findOne({userId,symbol});
    if(prior){const nextQty=prior.quantity+quantity,nextAverage=(prior.averageBuyPrice*prior.quantity+q.price*quantity)/nextQty;await Holding.updateOne({_id:prior._id},{$set:{quantity:nextQty,averageBuyPrice:nextAverage,companyName:q.name}})}
    else{await Holding.create({userId,symbol,companyName:q.name,quantity,averageBuyPrice:q.price});created=true}
    await Transaction.create({userId,symbol,companyName:q.name,type,quantity,price:q.price,totalValue:total});
   }catch(e){
    if(created)await Holding.deleteOne({userId,symbol});
    else if(prior)await Holding.updateOne({_id:prior._id},{$set:{quantity:prior.quantity,averageBuyPrice:prior.averageBuyPrice}});
    await User.updateOne({_id:userId},{$inc:{cashBalance:total}});throw e;
   }
   return res.status(201).json({ok:true,cashBalance:debited.cashBalance,price:q.price});
  }
  const reduced=await Holding.findOneAndUpdate({userId,symbol,quantity:{$gte:quantity}},{$inc:{quantity:-quantity}},{new:true});
  if(!reduced)return res.status(400).json({error:'Insufficient shares to sell'});
  let credited=false;
  try{
   const user=await User.findByIdAndUpdate(userId,{$inc:{cashBalance:total}},{new:true});
   if(!user)throw Object.assign(new Error('User account not found'),{status:404});
   credited=true;
   await Transaction.create({userId,symbol,companyName:q.name,type,quantity,price:q.price,totalValue:total});
   if(reduced.quantity===0)await Holding.deleteOne({_id:reduced._id,quantity:0});
   return res.status(201).json({ok:true,cashBalance:user.cashBalance,price:q.price});
  }catch(e){
   if(credited)await User.updateOne({_id:userId},{$inc:{cashBalance:-total}});
   await Holding.updateOne({_id:reduced._id},{$inc:{quantity}});throw e;
  }
 }
 res.status(201).json({ok:true,...res.locals.trade})
}
api.post('/trades/buy',async(req,res,next)=>{try{await trade(req,res,'BUY')}catch(e){next(e)}});api.post('/trades/sell',async(req,res,next)=>{try{await trade(req,res,'SELL')}catch(e){next(e)}});api.get('/transactions',wrap(async(req,res)=>{const filter={userId:req.user.id};if(['BUY','SELL'].includes(req.query.type))filter.type=req.query.type;res.json({transactions:await Transaction.find(filter).sort({timestamp:-1}).limit(500)})}));api.get('/watchlist',wrap(async(req,res)=>res.json({watchlist:await Watchlist.find({userId:req.user.id})})));api.post('/watchlist',wrap(async(req,res)=>{const symbol=String(req.body.symbol||'').toUpperCase();if(!/^[A-Z.]{1,12}$/.test(symbol))return res.status(400).json({error:'Invalid stock symbol'});const stock=await quote(symbol);const item=await Watchlist.findOneAndUpdate({userId:req.user.id,symbol},{companyName:stock.name},{upsert:true,new:true,setDefaultsOnInsert:true});res.status(201).json({watchlist:item})}));api.delete('/watchlist/:symbol',wrap(async(req,res)=>{await Watchlist.deleteOne({userId:req.user.id,symbol:req.params.symbol.toUpperCase()});res.status(204).end()}));export default api;

