import pandas as pd
import json
from collections import defaultdict, Counter

# -----------------------------
# FILE PATHS
# -----------------------------
SHAPES_FILE = "shapes.txt"
TRIPS_FILE = "trips.txt"
ROUTES_FILE = "routes.txt"

OUTPUT_FILE = r"C:\Users\petph\ReactProjects\sound-transit-gtfs\sound-transit-map\public\shapes.geojson"

# -----------------------------
# LOAD DATA
# -----------------------------
shapes = pd.read_csv(SHAPES_FILE)
trips = pd.read_csv(TRIPS_FILE)
routes = pd.read_csv(ROUTES_FILE)

# -----------------------------
# FORCE STRING TYPES (IMPORTANT)
# -----------------------------
shapes["shape_id"] = shapes["shape_id"].astype(str)
trips["shape_id"] = trips["shape_id"].astype(str)
trips["route_id"] = trips["route_id"].astype(str)
routes["route_id"] = routes["route_id"].astype(str)

# -----------------------------
# ROUTE LOOKUP
# -----------------------------
route_lookup = {}

for _, row in routes.iterrows():
    route_lookup[row["route_id"]] = {
        "route_short_name": row.get("route_short_name", "") or "",
        "route_long_name": row.get("route_long_name", "") or ""
    }

# -----------------------------
# SHAPE → MOST COMMON ROUTE
# -----------------------------
shape_routes = defaultdict(list)

for _, row in trips.iterrows():
    shape_routes[row["shape_id"]].append(row["route_id"])

shape_to_route = {}

for shape_id, route_list in shape_routes.items():
    shape_to_route[shape_id] = Counter(route_list).most_common(1)[0][0]

# -----------------------------
# GROUP SHAPES
# -----------------------------
shapes_grouped = defaultdict(list)

for _, row in shapes.iterrows():
    shapes_grouped[row["shape_id"]].append(row)

# -----------------------------
# BUILD GEOJSON FEATURES
# -----------------------------
features = []

for shape_id, points in shapes_grouped.items():
    points = sorted(points, key=lambda x: x["shape_pt_sequence"])

    coordinates = [
        [row["shape_pt_lon"], row["shape_pt_lat"]]
        for row in points
    ]

    route_id = shape_to_route.get(shape_id)

    # -----------------------------
    # IMPORTANT: SKIP UNKNOWN ROUTES
    # -----------------------------
    if not route_id or route_id not in route_lookup:
        continue

    route_short_name = route_lookup[route_id]["route_short_name"]
    route_long_name = route_lookup[route_id]["route_long_name"]

    # -----------------------------
    # CREATE FEATURE
    # -----------------------------
    feature = {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": coordinates
        },
        "properties": {
            "shape_id": shape_id,
            "route_id": route_id,
            "route_short_name": route_short_name,
            "route_long_name": route_long_name
        }
    }

    features.append(feature)

# -----------------------------
# FINAL GEOJSON
# -----------------------------
geojson = {
    "type": "FeatureCollection",
    "features": features
}

# -----------------------------
# SAVE FILE
# -----------------------------
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(geojson, f)

print("✅ GeoJSON created successfully (NO UNKNOWN ROUTES)")
print(f"📦 Features: {len(features)}")
print(f"📁 Saved to: {OUTPUT_FILE}")
