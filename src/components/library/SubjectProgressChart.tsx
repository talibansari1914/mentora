import { G } from "@/constants/colors";
import { examColor } from "@/constants/library";

interface SubjectProgress {
  exam: string;
  avgProgress: number;
  bookCount: number;
}

export default function SubjectProgressChart({ data }: { data: SubjectProgress[] }) {
  return (
    <div style={{ ...G.card, padding: "22px" }}>
      <h3 style={{ fontWeight: 700, marginBottom: "6px" }}>Subject-wise Progress</h3>
      <p style={{ color: "#64748B", fontSize: ".8rem", marginBottom: "18px" }}>
        Average progress across all books in each category (untouched books count as 0%).
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {data.map((item) => (
          <div key={item.exam}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: ".88rem", fontWeight: 600 }}>{item.exam}</span>
              <span style={{ fontSize: ".8rem", color: "#94A3B8" }}>
                {item.avgProgress}% · {item.bookCount} book{item.bookCount !== 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ background: "rgba(255,255,255,.06)", borderRadius: "999px", height: "10px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${item.avgProgress}%`,
                  height: "100%",
                  background: examColor(item.exam),
                  borderRadius: "999px",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}