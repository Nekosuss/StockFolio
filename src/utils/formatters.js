export const money = (n, dec = 0) =>
  "₹" +
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });

export const cx = (...a) => a.filter(Boolean).join(" ");
