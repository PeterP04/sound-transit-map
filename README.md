# 🚆 Sound Transit Live Alerts Map

An interactive real-time web map that visualizes Sound Transit rail lines, station stops, and live service alerts using Mapbox GL JS and GTFS-style transit data.

VIEW HERE: https://sound-transit-map.vercel.app/

---

## Overview

This project displays a live transit map of the Sound Transit system in Seattle, showing:

- 🚆 Rail lines and routes
- 🚉 Station stops
- 🚨 Real-time service alerts
- 📍 Interactive popups for routes and stops
- ⚡ Auto-updating alert system (every 30 seconds)

The goal is to provide a fast, visual, and intuitive way to understand transit disruptions and system activity.

---

## Features

- Live Sound Transit service alerts (auto-refresh every 30s)
- Alerts sorted by newest first
- Route and stop name resolution from GTFS data
- Interactive Mapbox layers:
  - Rail lines (hover to view route info)
  - Stops (click for alerts)
- Sidebar showing active alerts
- Efficient lookup system for fast performance (no repeated GeoJSON searching)
- Real-time mapping of alerts to affected stops

---

## Tools Used

- React (Vite)
- Mapbox GL JS
- JavaScript 
- GeoJSON (GTFS-derived data)
- Sound Transit Public Alerts API

---

## Data Sources

- 🚨 Live Alerts API  
  https://s3.amazonaws.com/st-service-alerts-prod/alerts_pb.json

- 🚆 Transit Data (Sound Transit GTFS Schedule Files)
  - `shapes.geojson` — rail routes
  - `stops.geojson` — station stops

---

## How It Works
- Loads Mapbox map
- Fetches GTFS-based GeoJSON data
- Builds fast lookup tables for routes and stops
- Polls Sound Transit alerts every 30 seconds
- Matches alerts to affected stops/routes
Displays:
- Interactive map visualization
- Live alert sidebar

---

## Alerts System
- Polls live API every 30 seconds
Extracts:
- Alert text
- Affected stops
Automatically sorts alerts by newest first
Updates both map and sidebar in real time

## Built by Peter Pham
