import {
  BriefcaseBusiness,
  Clock3,
  Compass,
  LayoutDashboard,
  Watch,
} from "lucide-react";

export const seed = [
  {
    symbol: "RELIANCE",
    name: "Reliance Industries Limited",
    sector: "Energy",
    price: 1450,
    change: 0.62,
    qty: 14,
    avg: 1390,
    color: "#426B4F",
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services Limited",
    sector: "Information Technology",
    price: 3200,
    change: 0.44,
    qty: 8,
    avg: 3050,
    color: "#8C958D",
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank Limited",
    sector: "Financial Services",
    price: 1700,
    change: -0.28,
    qty: 12,
    avg: 1740,
    color: "#737F76",
  },
  {
    symbol: "INFY",
    name: "Infosys Limited",
    sector: "Information Technology",
    price: 1500,
    change: 1.12,
    qty: 15,
    avg: 1440,
    color: "#A49B87",
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank Limited",
    sector: "Financial Services",
    price: 1300,
    change: 0.35,
    qty: 10,
    avg: 1240,
    color: "#92968F",
  },
];

export const nav = [
  ["Overview", "/dashboard", LayoutDashboard],
  ["Portfolio", "/portfolio", BriefcaseBusiness],
  ["Markets", "/markets", Compass],
  ["Watchlist", "/watchlist", Watch],
  ["Activity", "/transactions", Clock3],
];

export const chartData = Array.from({ length: 26 }, (_, i) => ({
  day: new Date(Date.now() - (25 - i) * 86400000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  }),
  value: 92000 + Math.round(i * 520 + Math.sin(i * 0.8) * 1800 + i * i * 9),
}));

export const marketStocks = [
  ...seed,
  {
    symbol: "SBIN",
    name: "State Bank of India",
    sector: "Financial Services",
    price: 800,
    change: -0.18,
    qty: 0,
    avg: 800,
  },
  {
    symbol: "BHARTIARTL",
    name: "Bharti Airtel Limited",
    sector: "Telecommunication",
    price: 1750,
    change: 0.73,
    qty: 0,
    avg: 1750,
  },
  {
    symbol: "ITC",
    name: "ITC Limited",
    sector: "Consumer Goods",
    price: 430,
    change: 0.21,
    qty: 0,
    avg: 430,
  },
  {
    symbol: "LT",
    name: "Larsen & Toubro Limited",
    sector: "Industrials",
    price: 3600,
    change: -0.15,
    qty: 0,
    avg: 3600,
  },
  {
    symbol: "MARUTI",
    name: "Maruti Suzuki India Limited",
    sector: "Automobile",
    price: 12500,
    change: 0.38,
    qty: 0,
    avg: 12500,
  },
];
