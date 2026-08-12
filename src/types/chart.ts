// Minimal shape for Recharts' custom Tooltip `content` render-prop.
// Recharts' own TooltipProps<...> generic is heavier than needed here —
// this covers exactly the fields these pages' CustomTooltip components read.
export interface ChartTooltipPayloadEntry {
  color?: string;
  fill?: string;
  value?: number | string;
  name?: string;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayloadEntry[];
  label?: string | number;
}