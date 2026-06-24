import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "#4338ca",
              color: "white",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            G
          </div>
          <div style={{ fontSize: 44, fontWeight: 600, color: "#0f172a" }}>Ledgerly</div>
        </div>
        <div style={{ fontSize: 36, fontWeight: 600, color: "#0f172a" }}>
          Invoices in. Tally-ready data out.
        </div>
        <div style={{ marginTop: 16, fontSize: 22, color: "#64748b" }}>
          GST invoice extraction for Indian CAs and SMEs
        </div>
      </div>
    ),
    { ...size }
  );
}
