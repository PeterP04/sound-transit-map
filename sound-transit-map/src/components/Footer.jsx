export default function Footer() {
  return (
    <div
      style={{
        width: "100%",
        height: "30px",
        background: "rgba(0,0,0,0.85)",
        color: "white",
        fontSize: "11px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
      }}
    >
      {/* Left side */}
      <div>
        🚆Sound Transit Alerts Map • Data: Sound Transit Open Transit Data (GTFS + Live Alerts)
      </div>

      {/* Right side */}
      <div>
        Refresh: 30s • Map: Mapbox
      </div>
    </div>
  );
}
