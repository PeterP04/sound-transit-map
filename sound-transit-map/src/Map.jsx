import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const [alerts, setAlerts] = useState([]);

  const stopAlertMap = useRef({});
  const stopSeverityMap = useRef({});

  const shapesRef = useRef(null);
  const stopsRef = useRef(null);

  // -----------------------------
  // ⚡ FAST LOOKUP MAPS (REF-BASED)
  // -----------------------------
  const routeMapRef = useRef({});
  const stopMapRef = useRef({});

  // -----------------------------
  // 🚀 FAST HELPERS (O(1) LOOKUP)
  // -----------------------------
  const getRouteName = (routeId) => {
    const route = routeMapRef.current[String(routeId)];

    return (
      route?.short ||
      route?.long ||
      routeId ||
      "Unknown"
    );
  };

  const getStopName = (stopId) => {
    return stopMapRef.current[String(stopId)] || stopId;
  };

  // -----------------------------
  // 🚨 LIVE ALERTS
  // -----------------------------
  useEffect(() => {
    const fetchAlerts = () => {
      fetch("https://s3.amazonaws.com/st-service-alerts-prod/alerts_pb.json")
        .then((res) => res.json())
        .then((data) => {
          const entities = data.entity || [];
          setAlerts(entities);

          const stopMap = {};
          const severityMap = {};

          entities.forEach((e) => {
            const alert = e.alert;

            const text =
              alert?.header_text?.translation?.[0]?.text ||
              "Service Alert";

            const seenStops = new Set();

            alert?.informed_entity?.forEach((ent) => {
              if (ent.stop_id && !seenStops.has(ent.stop_id)) {
                seenStops.add(ent.stop_id);

                if (!stopMap[ent.stop_id]) {
                  stopMap[ent.stop_id] = new Set();
                }

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

          // refresh map source
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
  // 🗺️ INIT MAP
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

      // -----------------------------
      // 🚆 BUILD ROUTE MAP (FAST FIX HERE)
      // -----------------------------
      const routeMap = {};

      shapesRef.current.features.forEach((f) => {
        const r = f.properties;

        if (r.route_id) {
          routeMap[String(r.route_id)] = {
            short: r.route_short_name,
            long: r.route_long_name,
          };
        }
      });

      routeMapRef.current = routeMap;

      // -----------------------------
      // 🚉 BUILD STOP MAP (FAST FIX HERE)
      // -----------------------------
      const stopMap = {};

      stopsRef.current.features.forEach((f) => {
        stopMap[String(f.properties.stop_id)] =
          f.properties.stop_name;
      });

      stopMapRef.current = stopMap;

      // -----------------------------
      // 🚆 SHAPES SOURCE
      // -----------------------------
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

      // -----------------------------
      // 🚉 STOPS SOURCE
      // -----------------------------
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
          "circle-color": "#2563eb",
        },
      });

      // -----------------------------
      // 🚆 HOVER POPUP
      // -----------------------------
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
          getRouteName(props.route_id);

        linePopup
          .setLngLat(e.lngLat)
          .setHTML(`<strong>🚆 ${routeName}</strong>`)
          .addTo(map.current);
      });

      map.current.on("mouseleave", "rail-lines", () => {
        map.current.getCanvas().style.cursor = "";
        linePopup.remove();
      });

      // -----------------------------
      // 🚉 STOP POPUP
      // -----------------------------
      map.current.on("click", "stops", (e) => {
        const props = e.features[0].properties;

        const alertsForStop =
          stopAlertMap.current[props.stop_id] || [];

        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <strong>${getStopName(props.stop_id)}</strong><br/><br/>
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
  // 🚨 SIDE PANEL
  // -----------------------------
  return (
    <div style={{ position: "relative" }}>
      {alerts.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 1,
            background: "rgba(0,0,0,0.9)",
            color: "white",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "12px",
            maxWidth: "360px",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
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
        </div>
      )}

      <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />
    </div>
  );
}
