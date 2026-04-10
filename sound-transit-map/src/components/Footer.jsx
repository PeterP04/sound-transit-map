export default function Footer() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: "30px",
        background: "rgba(0,0,0,0.85)",
        color: "white",
        fontSize: "11px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        zIndex: 2,
      }}
    >
      {/* Left side */}
      <div>
        🚆 Transit Map • Data: GTFS + Live Alerts
      </div>

      {/* Right side */}
      <div>
        Refresh: 30s • Map: Mapbox
      </div>
    </div>
  );
}
