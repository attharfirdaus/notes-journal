"use client";

// Replaces the root layout when it fails, so it brings its own document and
// cannot rely on the app's stylesheet or theme.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Georgia, serif", background: "#FFF8E7", color: "#3B2F2A", margin: 0 }}>
        <title>Something went wrong · Keepsake</title>
        <main style={{ maxWidth: 420, margin: "0 auto", padding: "30vh 20px 0", textAlign: "center" }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>Keepsake didn&apos;t load</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", lineHeight: 1.5 }}>
            Something went wrong on our side. Your notes are not affected.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              font: "bold 16px system-ui, sans-serif",
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px solid #3B2F2A",
              background: "#FF8A3D",
              color: "#2B1A0E",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
