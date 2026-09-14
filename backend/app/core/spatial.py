from sqlalchemy.types import TypeDecorator, Text
from geoalchemy2 import Geometry

class PostGISGeometry(TypeDecorator):
    """Dialect-aware PostGIS geometry column type.
    
    When running against PostgreSQL with PostGIS, it produces native PostGIS geometries.
    When running against SQLite (e.g. during standalone testing), it safely falls back to Text (WKT/GeoJSON).
    """
    impl = Text
    cache_ok = True

    def __init__(self, geometry_type: str = "GEOMETRY", srid: int = 4326, **kwargs):
        super().__init__()
        self.geometry_type = geometry_type
        self.srid = srid
        self.geo_type = Geometry(geometry_type=geometry_type, srid=srid, **kwargs)

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(self.geo_type)
        return dialect.type_descriptor(Text())
