import { G } from "@/constants/colors";

interface AnalyticsSummaryCardsProps {
  booksStarted: number;
  booksCompleted: number;
  completionPercent: number;
  estimatedPagesRead: number;
}

export default function AnalyticsSummaryCards({
  booksStarted,
  booksCompleted,
  completionPercent,
  estimatedPagesRead,
}: AnalyticsSummaryCardsProps) {
  const cards = [
    { label: "Books Started", value: booksStarted, color: "white" },
    { label: "Books Completed", value: booksCompleted, color: "#22C55E" },
    { label: "Completion Rate", value: `${completionPercent}%`, color: "#F59E0B" },
    { label: "Estimated Pages Read", value: estimatedPagesRead.toLocaleString(), color: "#38BDF8" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
        gap: "14px",
        marginBottom: "24px",
      }}
    >
      {cards.map((card) => (
        <div key={card.label} style={{ ...G.card, padding: "18px" }}>
          <p style={{ color: "#64748B", fontSize: ".75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "6px" }}>
            {card.label}
          </p>
          <p style={{ fontSize: "1.6rem", fontWeight: 800, color: card.color }}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}