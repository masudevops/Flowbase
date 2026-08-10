import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_ALT =
  "Kelbara — flexible work management for projects, tasks, and workflows";

const markData = await readFile(join(process.cwd(), "src/app/og-mark.png"), "base64");
const markSrc = `data:image/png;base64,${markData}`;

const corner = (side: "top-left" | "bottom-right") => ({
  position: "absolute" as const,
  width: 28,
  height: 28,
  ...(side === "top-left"
    ? { top: 40, left: 40, borderTop: "2px solid #2A4E5E", borderLeft: "2px solid #2A4E5E" }
    : { bottom: 40, right: 40, borderBottom: "2px solid #2A4E5E", borderRight: "2px solid #2A4E5E" }),
});

export function BrandOgImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#0B1F2E",
        padding: "72px",
        position: "relative",
      }}
    >
      <div style={corner("top-left")} />
      <div style={corner("bottom-right")} />

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={markSrc} alt="" width={72} height={72} style={{ borderRadius: 18 }} />
        <span
          style={{
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: 4,
            color: "#E7EEF0",
          }}
        >
          KELBARA
        </span>
      </div>

      <span
        style={{
          display: "flex",
          marginTop: 56,
          maxWidth: 880,
          fontSize: 32,
          lineHeight: 1.45,
          color: "#B9CAD1",
        }}
      >
        Flexible work management for projects, tasks, and workflows — built
        to adapt to how your team works.
      </span>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
          paddingTop: 28,
          borderTop: "1px solid #23414F",
        }}
      >
        <span
          style={{
            fontSize: 22,
            letterSpacing: 2,
            color: "#5FB4E0",
          }}
        >
          kelbara.com
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#1D5C8A" }} />
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#C1440E" }} />
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#0F7A5C" }} />
        </div>
      </div>
    </div>
  );
}
