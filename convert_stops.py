import pandas as pd
import geopandas as gpd
import os

# Load GTFS stops
stops = pd.read_csv("gtfs/stops.txt")

# Convert to GeoDataFrame
gdf = gpd.GeoDataFrame(
    stops,
    geometry=gpd.points_from_xy(stops.stop_lon, stops.stop_lat),
    crs="EPSG:4326"
)

# Make output folder if it doesn't exist
os.makedirs("output", exist_ok=True)

# Save as GeoJSON
gdf.to_file("output/stops.geojson", driver="GeoJSON")

print("Stops GeoJSON created ✔")