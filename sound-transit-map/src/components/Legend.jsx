import { useState } from "react";

export default function Legend() {
  const [open, setOpen] = useState(true);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        right: 20,
        zIndex: 2,
        fontSize: "12px",
        color: "white",
      }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          marginBottom: "8px",
          padding: "6px 10px",
          borderRadius: "6px",
          border: "none",
          background: "#111",
          color: "white",
          cursor: "pointer",
          width: "100%",
        }}
      >
        {open ? "Hide Legend" : "Show Legend"}
      </button>

      {/* Legend Box */}
      {open && (
        <div
          style={{
            background: "rgba(0,0,0,0.85)",
            padding: "12px",
            borderRadius: "8px",
            minWidth: "180px",
          }}
        >
          <strong style={{ display: "block", marginBottom: "8px" }}>
            Legend
          </strong>

          {/* Rail Lines */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}>
            <div
              style={{
                width: "20px",
                height: "3px",
                background: "#6b7280",
                marginRight: "8px",
              }}
            />
            Rail Line
          </div>

          {/* Normal Stop */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#2563eb",
                marginRight: "8px",
              }}
            />
            Stop
          </div>

          {/* Alert Stop */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#ef4444",
                marginRight: "8px",
              }}
            />
            Stop (Alert)
          </div>
        </div>
      )}
    </div>
  );
}
