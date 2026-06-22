export const formatDateID = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatNumber = (n) => {
  if (n === null || n === undefined) return "-";
  return new Intl.NumberFormat("id-ID").format(Number(n));
};

export const formatPercent = (n) => {
  if (n === null || n === undefined) return "-";
  return `${Number(n).toFixed(2)}%`;
};

export const formatRating = (n) => {
  if (n === null || n === undefined) return "-";
  return Number(n).toFixed(2);
};