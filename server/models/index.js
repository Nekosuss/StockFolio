import mongoose from "mongoose";
const options = { timestamps: true };
export const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true, maxlength: 80 },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      passwordHash: { type: String, required: true },
      cashBalance: { type: Number, default: 1000000, min: 0 },
    },
    options,
  ),
);
export const Holding = mongoose.model(
  "Holding",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      symbol: { type: String, required: true, uppercase: true },
      companyName: { type: String, required: true },
      quantity: { type: Number, required: true, min: 0 },
      averageBuyPrice: { type: Number, required: true, min: 0 },
    },
    options,
  ).index({ userId: 1, symbol: 1 }, { unique: true }),
);
export const Transaction = mongoose.model(
  "Transaction",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      symbol: { type: String, required: true, uppercase: true },
      companyName: { type: String, required: true },
      type: { type: String, enum: ["BUY", "SELL"], required: true },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true, min: 0 },
      totalValue: { type: Number, required: true, min: 0 },
      timestamp: { type: Date, default: Date.now },
    },
    options,
  ).index({ userId: 1, timestamp: -1 }),
);
export const Watchlist = mongoose.model(
  "Watchlist",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      symbol: { type: String, required: true, uppercase: true },
      companyName: { type: String, required: true },
    },
    options,
  ).index({ userId: 1, symbol: 1 }, { unique: true }),
);
export const PortfolioSnapshot = mongoose.model(
  "PortfolioSnapshot",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      totalValue: Number,
      cashBalance: Number,
      investedValue: Number,
      timestamp: { type: Date, default: Date.now },
    },
    options,
  ).index({ userId: 1, timestamp: -1 }),
);
