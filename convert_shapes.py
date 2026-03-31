import pandas as pd
import json
from collections import defaultdict

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
# ROUTE LOOKUP
# route_id → {short, long}
# -----------------------------
route_lookup = {}

for _, row in routes.iterrows():
    route_lookup[row["route_id"]] = {
        "route_short_name": row.get("route_short_name", ""),
        "route_long_name": row.get("route_long_name", "")
    }

# -----------------------------
# SHAPE → ROUTE LOOKUP (FASTER)
# -----------------------------
shape_to_route = {}

for _, row in trips.iterrows():
    shape_id = row["shape_id"]
    route_id = row["route_id"]

    # only assign first match (good enough)
    if shape_id not in shape_to_route:
        shape_to_route[shape_id] = route_id

# -----------------------------
# GROUP SHAPES
# -----------------------------
shapes_grouped = defaultdict(list)

for _, row in shapes.iterrows():
    shapes_grouped[row["shape_id"]].append(row)

# -----------------------------
# BUILD GEOJSON
# -----------------------------
features = []

for shape_id, points in shapes_grouped.items():
    points = sorted(points, key=lambda x: x["shape_pt_sequence"])

    coordinates = [
        [row["shape_pt_lon"], row["shape_pt_lat"]] for row in points
    ]

    route_id = shape_to_route.get(shape_id)

    route_short_name = None
    route_long_name = None

    if route_id and route_id in route_lookup:
        route_short_name = route_lookup[route_id]["route_short_name"]
        route_long_name = route_lookup[route_id]["route_long_name"]

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

geojson = {
    "type": "FeatureCollection",
    "features": features
}

# -----------------------------
# SAVE
# -----------------------------
with open(OUTPUT_FILE, "w") as f:
    json.dump(geojson, f)

print(f"✅ GeoJSON created: {OUTPUT_FILE}")
print(f"Features: {len(features)}")
