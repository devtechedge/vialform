"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f4f6f9", color: "#0b1220", display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 28 }}>VIALFORM encountered an error</h1>
          <p style={{ color: "#3a4658" }}>Please retry. If it persists, contact the procurement desk.</p>
          <button type="button" onClick={reset} style={{ marginTop: 16, padding: "10px 16px", borderRadius: 8, border: "none", background: "#2456e6", color: "#fff", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}