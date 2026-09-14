import math
import numpy as np
import cv2
from shapely.geometry import Polygon, Point
from app.engines.geospatial_engine import GeospatialEngine, SpillMetrics

def test_pixel_to_geo_affine():
    origin_lon = 72.0
    origin_lat = 19.0
    res_lon = 0.0002
    res_lat = -0.0002

    lon, lat = GeospatialEngine.pixel_to_geo(100, 50, origin_lon, origin_lat, res_lon, res_lat)
    assert round(lon, 4) == 72.02
    assert round(lat, 4) == 18.99

def test_haversine_distance():
    # 1 degree of latitude is approximately 111.19 km
    dist = GeospatialEngine.haversine_distance_km(18.0, 72.0, 19.0, 72.0)
    assert 110.5 < dist < 111.5

def test_geodesic_area_and_perimeter_known_box():
    # 0.1 degree lat ~ 11.1 km; 0.1 degree lon at lat 19 ~ 11.1 * cos(19 deg) ~ 10.5 km
    # Total area approx ~ 116.5 km2
    poly = Polygon([
        (72.0, 19.0),
        (72.1, 19.0),
        (72.1, 19.1),
        (72.0, 19.1),
        (72.0, 19.0)
    ])

    area = GeospatialEngine.calculate_geodesic_area_km2(poly)
    perimeter = GeospatialEngine.calculate_geodesic_perimeter_km(poly)

    assert 110.0 < area < 125.0
    assert 40.0 < perimeter < 46.0

def test_elongation_circular_vs_sheared():
    # 1. Approximate circle (8-point regular polygon)
    angles = np.linspace(0, 2 * np.pi, 16, endpoint=False)
    radius = 0.02
    circle_pts = [(72.0 + radius * np.cos(a), 19.0 + radius * np.sin(a)) for a in angles]
    circle_pts.append(circle_pts[0])
    circle_poly = Polygon(circle_pts)

    circle_elongation = GeospatialEngine.calculate_elongation(circle_poly)
    assert 1.0 <= circle_elongation <= 1.25

    # 2. Elongated ribbon (4:1 aspect ratio)
    ribbon_poly = Polygon([
        (72.0, 19.0),
        (72.08, 19.0),
        (72.08, 19.02),
        (72.0, 19.02),
        (72.0, 19.0)
    ])
    ribbon_elongation = GeospatialEngine.calculate_elongation(ribbon_poly)
    assert ribbon_elongation >= 3.0

def test_mask_to_polygons_and_characterization():
    # Create 100x100 synthetic binary image with an ellipse
    mask = np.zeros((100, 100), dtype=np.uint8)
    cv2.ellipse(mask, (50, 50), (35, 12), 20, 0, 360, 255, -1)

    origin_lon = 72.15
    origin_lat = 18.90
    res_lon = 0.0001
    res_lat = -0.0001

    polygons = GeospatialEngine.mask_to_polygons(
        binary_mask=mask,
        origin_lon=origin_lon,
        origin_lat=origin_lat,
        pixel_res_lon=res_lon,
        pixel_res_lat=res_lat
    )

    assert len(polygons) == 1
    poly = polygons[0]
    assert poly.is_valid
    assert not poly.is_empty

    metrics: SpillMetrics = GeospatialEngine.characterize_polygon(poly)
    assert metrics.area_km2 > 0.0
    assert metrics.perimeter_km > 0.0
    assert metrics.elongation > 2.0
    assert 72.15 < metrics.centroid_lon < 72.16
    assert 18.89 < metrics.centroid_lat < 18.90
    assert metrics.polygon_geojson["type"] == "Polygon"
