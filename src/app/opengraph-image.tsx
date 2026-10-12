import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Space of Founders: the verified space for the world's founders";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const mark = `data:image/png;base64,${(await readFile(join(process.cwd(), "public/brand/mark-512.png"))).toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: 72, background: "radial-gradient(circle at 80% 20%, #0b4a35 0%, #021510 55%)", color: "#eefaf3",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} width={96} height={96} alt="" style={{ borderRadius: 22 }} />
          <div style={{ display: "flex", fontSize: 52, fontWeight: 800, letterSpacing: -2 }}>
            Space of&nbsp;<span style={{ color: "#1BE58D" }}>Founders</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 88, fontWeight: 800, lineHeight: 1.04, letterSpacing: -3 }}>
          <span>Where the world&apos;s founders</span>
          <span style={{ color: "#1BE58D" }}>build together.</span>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#9fd9bd" }}>Verified founders · Investors worldwide · Reviewed by hand</div>
      </div>
    ),
    size,
  );
}
