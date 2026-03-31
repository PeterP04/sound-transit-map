import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

export default function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const [alerts, setAlerts] = useState([]);

  // Load alerts
  useEffect(() => {
    fetch("https://s3.amazonaws.com/st-service-alerts-prod/alerts_pb.json")
      .then((res) => res.json())
      .then((data) => setAlerts(data.entity || []))
      .catch(console.error);
  }, []);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-122.3321, 47.6062],
      zoom: 10,
    });

    map.current.on("load", () => {
      // 🚆 Rail lines
      map.current.addSource("shapes", {
        type: "geojson",
        data: "/shapes.geojson",
      });

      map.current.addLayer({
        id: "rail-lines",
        type: "line",
        source: "shapes",
        paint: {
          "line-color": "#e11d48",
          "line-width": 3,
        },
      });

      // 🚉 Stops
      map.current.addSource("stops", {
        type: "geojson",
        data: "/stops.geojson",
      });

      map.current.addLayer({
        id: "stops",
        type: "circle",
        source: "stops",
        paint: {
          "circle-radius": 5,
          "circle-color": "#2563eb",
        },
      });

      // 🟡 Alerts popup layer
      map.current.on("click", "stops", (e) => {
        const feature = e.features[0];
        const props = feature.properties;

        const alertMatch = findAlertForStop(props.stop_id, alerts);

        new mapboxgl.Popup()
          .setLngLat(feature.geometry.coordinates)
          .setHTML(
            `<strong>${props.stop_name}</strong><br/>
             ${alertMatch ? alertMatch : "No alerts"}`
          )
          .addTo(map.current);
      });
    });
  }, [alerts]);

  return <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />;
}

// 🔎 match alerts to stop_id (simple version)
function findAlertForStop(stopId, alerts) {
  for (const e of alerts) {
    const alert = e.alert;
    if (!alert?.informed_entity) continue;

    for (const ent of alert.informed_entity) {
      if (ent.stop_id === stopId) {
        return (
          alert.header_text?.translation?.[0]?.text ||
          "Service Alert"
        );
      }
    }
  }
  return null;
}