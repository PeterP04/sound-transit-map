import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function TransitMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const [alerts, setAlerts] = useState([]);
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);

  // -----------------------------
  // FETCH ALERTS (auto-refresh)
  // -----------------------------
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("YOUR_ALERTS_URL_HERE");
        const data = await res.json();

        // prevent duplicates
        const unique = Array.from(
          new Map(data.map(a => [a.id, a])).values()
        );

        setAlerts(unique);
      } catch (err) {
        console.error("Alert fetch error:", err);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);

    return () => clearInterval(interval);
  }, []);

  // -----------------------------
  // INIT MAP (ONCE)
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
      // -----------------------------
      // LOAD STOPS (GeoJSON)
      // -----------------------------
      map.current.addSource("stops", {
        type: "geojson",
        data: "/stops.geojson",
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

      // -----------------------------
      // LOAD ROUTES (NO ALERT COLORS)
      // -----------------------------
      map.current.addSource("routes", {
        type: "geojson",
        data: "/shapes.geojson",
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

      // -----------------------------
      // ROUTE HOVER POPUP
      // -----------------------------
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      map.current.on("mouseenter", "routes-layer", (e) => {
        map.current.getCanvas().style.cursor = "pointer";

        const props = e.features[0].properties;

        popup
          .setLngLat(e.lngLat)
          .setHTML(`
            <div>
              <strong>Route:</strong> ${props.route_id || "Unknown"}<br/>
              <strong>Service:</strong> ${props.service || "N/A"}
            </div>
          `)
          .addTo(map.current);
      });

      map.current.on("mouseleave", "routes-layer", () => {
        map.current.getCanvas().style.cursor = "";
        popup.remove();
      });
    });
  }, []);

  // -----------------------------
  // UPDATE STOP COLORS WHEN ALERTS CHANGE
  // -----------------------------
  useEffect(() => {
    if (!map.current) return;

    const alertStopIds = new Set(
      alerts.flatMap(a => a.stop_ids || [])
    );

    const updatedStops = {
      type: "FeatureCollection",
      features: stops.map(stop => ({
        ...stop,
        properties: {
          ...stop.properties,
          hasAlert: alertStopIds.has(stop.properties.stop_id),
        },
      })),
    };

    const source = map.current.getSource("stops");
    if (source) {
      source.setData(updatedStops);
    }

    // update paint only once source exists
    if (map.current.getLayer("stops-layer")) {
      map.current.setPaintProperty(
        "stops-layer",
        "circle-color",
        [
          "case",
          ["boolean", ["get", "hasAlert"], false],
          "#ff3b30", // red if alert
          "#3388ff", // default blue
        ]
      );
    }
  }, [alerts, stops]);

  // -----------------------------
  // LOAD GTFS STOPS (ONCE)
  // -----------------------------
  useEffect(() => {
    const loadStops = async () => {
      try {
        const res = await fetch("/stops.geojson");
        const data = await res.json();
        setStops(data.features);
      } catch (err) {
        console.error("Stop load error:", err);
      }
    };

    loadStops();
  }, []);

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div style={{ display: "flex" }}>
      {/* MAP */}
      <div
        ref={mapContainer}
        style={{ width: "75%", height: "100vh" }}
      />

      {/* ALERT SIDE PANEL */}
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

        {alerts.map((alert, i) => (
          <div
            key={alert.id || i}
            style={{
              padding: "8px",
              marginBottom: "8px",
              borderBottom: "1px solid #333",
            }}
          >
            <strong>{alert.title || "Alert"}</strong>
            <p style={{ fontSize: "12px" }}>
              {alert.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
