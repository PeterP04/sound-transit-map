import pandas as pd
import json
from collections import defaultdict

# -----------------------------
# FILE PATHS (edit if needed)
# -----------------------------
SHAPES_FILE = "shapes.txt"
TRIPS_FILE = "trips.txt"
ROUTES_FILE = "routes.txt"

OUTPUT_FILE = r"C:\Users\petph\ReactProjects\sound-transit-gtfs\sound-transit-map\public\shapes.geojson"

# -----------------------------
# LOAD GTFS DATA
# -----------------------------
shapes = pd.read_csv(SHAPES_FILE)
trips = pd.read_csv(TRIPS_FILE)
routes = pd.read_csv(ROUTES_FILE)

# -----------------------------
# BUILD ROUTE LOOKUP
# route_id → route_name
# -----------------------------
route_lookup = {}
for _, row in routes.iterrows():
    route_lookup[row["route_id"]] = row.get("route_long_name", row.get("route_short_name", "Unknown Route"))

# -----------------------------
# MAP trip_id → route_id
# -----------------------------
trip_to_route = {}
for _, row in trips.iterrows():
    trip_to_route[row["trip_id"]] = row["route_id"]

# -----------------------------
# GROUP SHAPES INTO LINES
# -----------------------------
shapes_grouped = defaultdict(list)

for _, row in shapes.iterrows():
    shapes_grouped[row["shape_id"]].append(row)

# -----------------------------
# BUILD GEOJSON
# -----------------------------
features = []

for shape_id, points in shapes_grouped.items():
    # sort by sequence
    points = sorted(points, key=lambda x: x["shape_pt_sequence"])

    coordinates = [[row["shape_pt_lon"], row["shape_pt_lat"]] for row in points]

    # try to infer route_id via trips
    route_id = None
    route_name = None

    # find any trip that uses this shape_id
    match = trips[trips["shape_id"] == shape_id]

    if not match.empty:
        route_id = match.iloc[0]["route_id"]
        route_name = route_lookup.get(route_id, "Unknown Route")

    feature = {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": coordinates
        },
        "properties": {
            "shape_id": shape_id,
            "route_id": route_id,
            "route_name": route_name
        }
    }

    features.append(feature)

geojson = {
    "type": "FeatureCollection",
    "features": features
}

# -----------------------------
# SAVE OUTPUT
# -----------------------------
with open(OUTPUT_FILE, "w") as f:
    json.dump(geojson, f)

print(f"✅ GeoJSON created: {OUTPUT_FILE}")
print(f"Features: {len(features)}")