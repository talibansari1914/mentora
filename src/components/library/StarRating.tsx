export default function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
      <span style={{ color: "#F59E0B", fontSize: "0.75rem" }}>★</span>
      <span style={{ fontSize: "0.75rem", color: "#CBD5E1", fontWeight: 600 }}>{rating}</span>
    </div>
  );
}