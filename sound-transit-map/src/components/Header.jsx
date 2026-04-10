import { useEffect, useState } from "react";

export default function Header() {
  const [time, setTime] = useState(new Date());

  // update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header
      style={{
        top: 0,
        width: "100%",
        zIndex: 3,
        background: "rgba(0,0,0,0.85)",
        color: "white",
        padding: "10px 16px",
        fontWeight: "bold",
        fontSize: "14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>🚆 Transit Alerts Map</div>

      <div style={{ fontSize: "12px", opacity: 0.8 }}>
        {time.toLocaleTimeString()}
      </div>
    </header>
  );
}
