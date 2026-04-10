import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const [alerts, setAlerts] = useState([]);
  const [isOpen, setIsOpen] = useState(true);

  const stopAlertMap = useRef({});
  const stopSeverityMap = useRef({});

  const shapesRef = useRef(null);
  const stopsRef = useRef(null);

  // -----------------------------
  // HELPERS
  // -----------------------------
  const getRouteName = (routeId) => {
    const f = shapesRef.current?.features?.find(
      (x) => String(x.properties.route_id) === String(routeId)
    );

    return (
      f?.properties?.route_short_name ||
      f?.properties?.route_long_name ||
      routeId ||
      "Unknown"
    );
  };

  const getStopName = (stopId) => {
    const f = stopsRef.current?.features?.find(
      (x) => String(x.properties.stop_id) === String(stopId)
    );

    return f?.properties?.stop_name || stopId;
  };

  // -----------------------------
  // FETCH ALERTS
  // -----------------------------
  useEffect(() => {
    const fetchAlerts = () => {
      fetch("https://s3.amazonaws.com/st-service-alerts-prod/alerts_pb.json")
        .then((res) => res.json())
        .then((data) => {
          const entities = data.entity || [];

          // sort newest first
          const sorted = [...entities].sort((a, b) => {
            const getTime = (e) => {
              const alert = e.alert;
              return (
                Number(alert?.timestamp) ||
                Number(alert?.active_period?.[0]?.start) ||
                0
              );
            };

            return getTime(b) - getTime(a);
          });

          setAlerts(sorted);

          const stopMap = {};
          const severityMap = {};

          entities.forEach((e) => {
            const alert = e.alert;
            if (!alert) return;

            const text =
              alert?.header_text?.translation?.[0]?.text ||
              "Service Alert";

            const seenStops = new Set();

            alert?.informed_entity?.forEach((ent) => {
              if (ent.stop_id && !seenStops.has(ent.stop_id)) {
                seenStops.add(ent.stop_id);

                if (!stopMap[ent.stop_id]) stopMap[ent.stop_id] = new Set();
                stopMap[ent.stop_id].add(text);

                severityMap[ent.stop_id] =
                  alert?.severity_level || "unknown";
              }
            });
          });

          stopAlertMap.current = Object.fromEntries(
            Object.entries(stopMap).map(([k, v]) => [k, [...v]])
          );

          stopSeverityMap.current = severityMap;

          // update map if loaded
          if (map.current?.getSource("stops")) {
            map.current.getSource("stops").setData(stopsRef.current);
          }
        })
        .catch(console.error);
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // -----------------------------
  // INIT MAP
  // -----------------------------
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-122.3321, 47.6062],
      zoom: 10,
    });

    map.current.on("load", async () => {
      const [shapesRes, stopsRes] = await Promise.all([
        fetch("/shapes.geojson"),
        fetch("/stops.geojson"),
      ]);

      shapesRef.current = await shapesRes.json();
      stopsRef.current = await stopsRes.json();

      // ROUTES
      map.current.addSource("shapes", {
        type: "geojson",
        data: shapesRef.current,
      });

      map.current.addLayer({
        id: "rail-lines",
        type: "line",
        source: "shapes",
        paint: {
          "line-width": 3,
          "line-color": "#6b7280",
        },
      });

      // STOPS
      map.current.addSource("stops", {
        type: "geojson",
        data: stopsRef.current,
      });

      map.current.addLayer({
        id: "stops",
        type: "circle",
        source: "stops",
        paint: {
          "circle-radius": 6,
          "circle-color": [
            "case",
            [
              "in",
              ["get", "stop_id"],
              ["literal", Object.keys(stopSeverityMap.current)],
            ],
            "#ef4444",
            "#2563eb",
          ],
        },
      });

      // POPUPS
      const linePopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      map.current.on("mouseenter", "rail-lines", (e) => {
        map.current.getCanvas().style.cursor = "pointer";

        const props = e.features[0].properties;

        const routeName =
          props.route_short_name ||
          props.route_long_name ||
          props.route_id;

        linePopup
          .setLngLat(e.lngLat)
          .setHTML(`<strong>🚆 Route</strong><br/>${routeName}`)
          .addTo(map.current);
      });

      map.current.on("mouseleave", "rail-lines", () => {
        map.current.getCanvas().style.cursor = "";
        linePopup.remove();
      });

      map.current.on("click", "stops", (e) => {
        const props = e.features[0].properties;

        const alertsForStop =
          stopAlertMap.current[props.stop_id] || [];

        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <strong>${props.stop_name}</strong><br/><br/>
            ${
              alertsForStop.length
                ? alertsForStop.map((a) => `⚠️ ${a}`).join("<br/>")
                : "No alerts"
            }
          `)
          .addTo(map.current);
      });

      map.current.on("mouseenter", "stops", () => {
        map.current.getCanvas().style.cursor = "pointer";
      });

      map.current.on("mouseleave", "stops", () => {
        map.current.getCanvas().style.cursor = "";
      });
    });
  }, []);

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "absolute",
          top: 10,
          left: isOpen ? 370 : 10,
          zIndex: 2,
          padding: "6px 10px",
          borderRadius: "6px",
          border: "none",
          background: "#111",
          color: "white",
          cursor: "pointer",
        }}
      >
        {isOpen ? "← close" : "open →"}
      </button>

      {/* Sidebar */}
      {alerts.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 1,
            background: "rgba(0,0,0,0.9)",
            color: "white",
            padding: isOpen ? "12px" : "0px",
            borderRadius: "8px",
            fontSize: "12px",
            width: isOpen ? "360px" : "0px",
            maxHeight: "400px",
            overflowY: isOpen ? "auto" : "hidden",
            overflowX: "hidden",
            transition: "all 0.3s ease",
          }}
        >
          {isOpen && (
            <>
              <strong>🚨 Active Alerts ({alerts.length})</strong>

              {alerts.map((a, i) => {
                const alert = a.alert;

                const text =
                  alert?.header_text?.translation?.[0]?.text ||
                  "No description";

                const routes = [
                  ...new Set(
                    alert?.informed_entity
                      ?.map((e) => getRouteName(e.route_id))
                      .filter(Boolean)
                  ),
                ].join(", ");

                const stops = [
                  ...new Set(
                    alert?.informed_entity
                      ?.map((e) => getStopName(e.stop_id))
                      .filter(Boolean)
                  ),
                ].join(", ");

                return (
                  <div key={i} style={{ marginTop: "10px" }}>
                    <div>⚠️ {text}</div>
                    <div style={{ opacity: 0.7 }}>Routes: {routes}</div>
                    <div style={{ opacity: 0.7 }}>Stops: {stops}</div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* MAP */}
      <div style={{ width: "100%", height: "100%" }}>
        <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
