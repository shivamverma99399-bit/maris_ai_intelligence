import math
from typing import List, Tuple, Dict, Any, Optional
import numpy as np
import cv2
from shapely.geometry import Polygon, MultiPolygon, Point, mapping
from shapely.ops import transform
from pydantic import BaseModel, Field

# Mean radius of Earth in kilometers (WGS84 spherical approximation)
EARTH_RADIUS_KM = 6371.0088

class SpillMetrics(BaseModel):
    """Calculated geographic and morphological properties of an oil spill."""
    area_km2: float = Field(..., description="Geodesic surface area in square kilometers")
    perimeter_km: float = Field(..., description="Geodesic perimeter in kilometers")
    centroid_lat: float = Field(..., description="Centroid latitude in EPSG:4326")
    centroid_lon: float = Field(..., description="Centroid longitude in EPSG:4326")
    elongation: float = Field(..., description="Ratio of major axis to minor axis length (>= 1.0)")
    polygon_geojson: Dict[str, Any] = Field(..., description="GeoJSON representation of the slick polygon")

class GeospatialEngine:
    """Core geospatial engine translating satellite SAR pixel masks into physical, georeferenced oil slicks."""

    @staticmethod
    def pixel_to_geo(
        px: float,
        py: float,
        origin_lon: float,
        origin_lat: float,
        pixel_res_lon: float,
        pixel_res_lat: float
    ) -> Tuple[float, float]:
        """Converts pixel coordinate (x, y) to geographic coordinate (lon, lat) via affine transformation.
        
        Args:
            px: Column index (x)
            py: Row index (y)
            origin_lon: Longitude of top-left raster corner (px=0)
            origin_lat: Latitude of top-left raster corner (py=0)
            pixel_res_lon: Longitude spacing per pixel (positive)
            pixel_res_lat: Latitude spacing per pixel (typically negative for top-to-bottom raster)
        """
        lon = origin_lon + px * pixel_res_lon
        lat = origin_lat + py * pixel_res_lat
        return lon, lat

    @staticmethod
    def calculate_geodesic_area_km2(polygon: Polygon) -> float:
        """Calculates geodesic area in km² using spherical trapezoidal integration on WGS84."""
        if polygon.is_empty:
            return 0.0

        coords = list(polygon.exterior.coords)
        if len(coords) < 3:
            return 0.0

        # Spherical polygon area on Earth's surface
        total_rad = 0.0
        n = len(coords)
        for i in range(n - 1):
            lon1, lat1 = math.radians(coords[i][0]), math.radians(coords[i][1])
            lon2, lat2 = math.radians(coords[i + 1][0]), math.radians(coords[i + 1][1])
            total_rad += (lon2 - lon1) * (2.0 + math.sin(lat1) + math.sin(lat2))

        area_km2 = abs(total_rad * (EARTH_RADIUS_KM ** 2) / 2.0)
        
        # Deduct any interior rings (holes)
        for interior in polygon.interiors:
            int_coords = list(interior.coords)
            int_rad = 0.0
            for i in range(len(int_coords) - 1):
                lon1, lat1 = math.radians(int_coords[i][0]), math.radians(int_coords[i][1])
                lon2, lat2 = math.radians(int_coords[i + 1][0]), math.radians(int_coords[i + 1][1])
                int_rad += (lon2 - lon1) * (2.0 + math.sin(lat1) + math.sin(lat2))
            area_km2 -= abs(int_rad * (EARTH_RADIUS_KM ** 2) / 2.0)

        return max(0.0, area_km2)

    @staticmethod
    def calculate_geodesic_perimeter_km(polygon: Polygon) -> float:
        """Calculates geodesic perimeter in km using Haversine distance summation."""
        if polygon.is_empty:
            return 0.0

        coords = list(polygon.exterior.coords)
        total_dist_km = 0.0

        for i in range(len(coords) - 1):
            lon1, lat1 = coords[i]
            lon2, lat2 = coords[i + 1]
            total_dist_km += GeospatialEngine.haversine_distance_km(lat1, lon1, lat2, lon2)

        return total_dist_km

    @staticmethod
    def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Computes the great-circle distance in kilometers between two points."""
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(delta_phi / 2.0) ** 2
            + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return EARTH_RADIUS_KM * c

    @staticmethod
    def calculate_elongation(polygon: Polygon) -> float:
        """Computes elongation ratio (major axis / minor axis >= 1.0) via minimum bounding box."""
        if polygon.is_empty or polygon.area == 0:
            return 1.0

        mbr = polygon.minimum_rotated_rectangle
        if mbr.is_empty or not isinstance(mbr, Polygon):
            return 1.0

        coords = list(mbr.exterior.coords)
        if len(coords) < 4:
            return 1.0

        # Compute lengths of adjacent edges
        edge1 = GeospatialEngine.haversine_distance_km(coords[0][1], coords[0][0], coords[1][1], coords[1][0])
        edge2 = GeospatialEngine.haversine_distance_km(coords[1][1], coords[1][0], coords[2][1], coords[2][0])

        major = max(edge1, edge2)
        minor = min(edge1, edge2)

        if minor < 1e-6:
            return 10.0  # Highly linear feature

        return round(major / minor, 3)

    @staticmethod
    def mask_to_polygons(
        binary_mask: np.ndarray,
        origin_lon: float,
        origin_lat: float,
        pixel_res_lon: float,
        pixel_res_lat: float,
        min_area_pixels: int = 10,
        simplify_tolerance: float = 0.0002
    ) -> List[Polygon]:
        """Vectorizes a 2D binary raster mask into georeferenced Shapely polygons in EPSG:4326.
        
        Args:
            binary_mask: 2D numpy array (uint8, values 0 or 255)
            origin_lon: Upper-left longitude
            origin_lat: Upper-left latitude
            pixel_res_lon: Pixel width in degrees
            pixel_res_lat: Pixel height in degrees (typically negative)
            min_area_pixels: Filter out noise artifacts below this threshold
            simplify_tolerance: Douglas-Peucker simplification tolerance in degrees
        """
        if binary_mask.dtype != np.uint8:
            binary_mask = (binary_mask > 0).astype(np.uint8) * 255

        contours, hierarchy = cv2.findContours(
            binary_mask,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )

        polygons: List[Polygon] = []

        for contour in contours:
            if cv2.contourArea(contour) < min_area_pixels:
                continue

            # Squeeze contour shape from (N, 1, 2) to (N, 2)
            pts = contour.squeeze()
            if len(pts.shape) != 2 or pts.shape[0] < 3:
                continue

            geo_pts = []
            for px, py in pts:
                lon, lat = GeospatialEngine.pixel_to_geo(
                    float(px), float(py), origin_lon, origin_lat, pixel_res_lon, pixel_res_lat
                )
                geo_pts.append((lon, lat))

            # Close ring if not closed
            if geo_pts[0] != geo_pts[-1]:
                geo_pts.append(geo_pts[0])

            poly = Polygon(geo_pts)
            if not poly.is_valid:
                poly = poly.buffer(0)

            if isinstance(poly, Polygon) and not poly.is_empty:
                if simplify_tolerance > 0:
                    poly = poly.simplify(simplify_tolerance, preserve_topology=True)
                polygons.append(poly)

        return polygons

    @classmethod
    def characterize_polygon(cls, polygon: Polygon) -> SpillMetrics:
        """Computes comprehensive morphological and geodesic metrics for a spill polygon."""
        if not polygon.is_valid:
            polygon = polygon.buffer(0)

        area_km2 = cls.calculate_geodesic_area_km2(polygon)
        perimeter_km = cls.calculate_geodesic_perimeter_km(polygon)
        elongation = cls.calculate_elongation(polygon)

        centroid = polygon.centroid
        centroid_lat = round(centroid.y, 6)
        centroid_lon = round(centroid.x, 6)

        return SpillMetrics(
            area_km2=round(area_km2, 4),
            perimeter_km=round(perimeter_km, 4),
            centroid_lat=centroid_lat,
            centroid_lon=centroid_lon,
            elongation=elongation,
            polygon_geojson=mapping(polygon)
        )
