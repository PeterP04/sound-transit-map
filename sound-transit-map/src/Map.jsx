import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function TransitMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const [alerts, setAlerts] = useState([]);
  const [stops, setStops] = useState([]);

  // -----------------------------
  // HELP: normalize IDs (VERY IMPORTANT)
  // -----------------------------
  const normalizeId = (id) => String(id).replace(/\s/g, "");

  // -----------------------------
  // LIVE ALERT FETCH (FIXED)
  // -----------------------------
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("YOUR_ALERTS_URL_HERE");
        const data = await res.json();

        setAlerts(data);
      } catch (err) {
        console.error("Alert fetch error:", err);
      }
    };

    fetchAlerts(); // initial load

    const interval = setInterval(fetchAlerts, 30000); // live updates

    return () => clearInterval(interval);
  }, []);

  // -----------------------------
  // LOAD STOPS ONCE
  // -----------------------------
  useEffect(() => {
    const loadStops = async () => {
      const res = await fetch("/stops.geojson");
      const data = await res.json();
      setStops(data.features);
    };

    loadStops();
  }, []);

  // -----------------------------
  // INIT MAP
  // -----------------------------
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-122.3, 47.6],
      zoom: 9,
    });

    map.current.on("load", () => {
      map.current.addSource("stops", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
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
    });
  }, []);

  // -----------------------------
  // APPLY ALERTS → STOPS (FIXED LOGIC)
  // -----------------------------
  useEffect(() => {
    if (!map.current || stops.length === 0) return;

    // 🔥 SAFE ALERT PARSING (handles different GTFS formats)
    const alertStopIds = new Set();

    alerts.forEach((alert) => {
      // TRY MULTIPLE COMMON FIELDS
      const ids =
        alert.stop_ids ||
        alert.stops ||
        alert.informedEntity?.map(e => e.stopId) ||
        [];

      ids.forEach((id) => {
        if (id) alertStopIds.add(normalizeId(id));
      });
    });

    // rebuild GeoJSON
    const updatedStops = {
      type: "FeatureCollection",
      features: stops.map((stop) => {
        const stopId = normalizeId(stop.properties.stop_id);

        return {
          ...stop,
          properties: {
            ...stop.properties,
            hasAlert: alertStopIds.has(stopId),
          },
        };
      }),
    };

    const source = map.current.getSource("stops");

    if (source) {
      source.setData(updatedStops);
    }

    // update styling
    if (map.current.getLayer("stops-layer")) {
      map.current.setPaintProperty(
        "stops-layer",
        "circle-color",
        [
          "case",
          ["boolean", ["get", "hasAlert"], false],
          "#ff3b30",
          "#3388ff",
        ]
      );
    }
  }, [alerts, stops]);

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
              {a.description || "No description"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
