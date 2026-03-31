import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function TransitMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const [alerts, setAlerts] = useState([]);

  // -----------------------------
  // INIT MAP (NEVER BREAKS)
  // -----------------------------
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-122.3, 47.6],
      zoom: 9,
    });

    map.current.on("load", async () => {
      // LOAD STOPS
      const stopsRes = await fetch("/stops.geojson");
      const stopsData = await stopsRes.json();

      map.current.addSource("stops", {
        type: "geojson",
        data: stopsData,
      });

      map.current.addLayer({
        id: "stops-layer",
        type: "circle",
        source: "stops",
        paint: {
          "circle-radius": 5,
          "circle-color": "#3388ff",
        },
      });

      // LOAD ROUTES (UNCHANGED)
      const routesRes = await fetch("/shapes.geojson");
      const routesData = await routesRes.json();

      map.current.addSource("routes", {
        type: "geojson",
        data: routesData,
      });

      map.current.addLayer({
        id: "routes-layer",
        type: "line",
        source: "routes",
        paint: {
          "line-color": "#888",
          "line-width": 3,
        },
      });
    });
  }, []);

  // -----------------------------
  // LIVE ALERT FETCH (SAFE)
  // -----------------------------
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("YOUR_ALERTS_URL_HERE");
        const data = await res.json();
        setAlerts(data);
      } catch (err) {
        console.error("Alerts error:", err);
      }
    };

    fetchAlerts(); // initial load
    const interval = setInterval(fetchAlerts, 30000);

    return () => clearInterval(interval);
  }, []);

  // -----------------------------
  // APPLY ALERTS TO STOPS (SAFE UPDATE)
  // -----------------------------
  useEffect(() => {
    if (!map.current) return;

    const source = map.current.getSource("stops");
    if (!source) return;

    const stopsData = source._data; // current GeoJSON (safe read)

    if (!stopsData) return;

    // build alert stop set
    const alertStopIds = new Set();

    alerts.forEach(alert => {
      const ids = alert.stop_ids || [];
      ids.forEach(id => alertStopIds.add(String(id)));
    });

    // update features ONLY (no map reset)
    const updated = {
      ...stopsData,
      features: stopsData.features.map(f => ({
        ...f,
        properties: {
          ...f.properties,
          hasAlert: alertStopIds.has(String(f.properties.stop_id)),
        },
      })),
    };

    source.setData(updated);

    // update color styling
    if (map.current.getLayer("stops-layer")) {
      map.current.setPaintProperty("stops-layer", "circle-color", [
        "case",
        ["boolean", ["get", "hasAlert"], false],
        "#ff3b30",
        "#3388ff",
      ]);
    }
  }, [alerts]);

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div style={{ display: "flex" }}>
      <div
        ref={mapContainer}
        style={{ width: "75%", height: "100vh" }}
      />

      <div
        style={{
          width: "25%",
          height: "100vh",
          overflow: "auto",
          padding: "10px",
          background: "#111",
          color: "white",
        }}
      >
        <h3>Active Alerts ({alerts.length})</h3>

        {alerts.map((a, i) => (
          <div key={a.id || i} style={{ marginBottom: "10px" }}>
            <strong>{a.title || "Alert"}</strong>
            <p style={{ fontSize: "12px" }}>
              {a.description || "No details"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
