import type { CSSProperties } from "react";

// React's CSSProperties type doesn't officially include arbitrary custom
// properties (e.g. "--i"). This extends it with an index signature scoped
// to "--"-prefixed keys, so inline styles can set CSS custom properties
// without an `as any` cast at every call site.
export type CSSPropertiesWithVars = CSSProperties & {
  [customProperty: `--${string}`]: string | number | undefined;
};