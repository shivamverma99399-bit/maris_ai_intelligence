import csv
import datetime
import io
import re
from typing import List, Dict, Any, Tuple, Optional
from dateutil import parser as date_parser
from app.core.logging import logger

class AisCleaner:
    """Sanitizes raw AIS feeds by validating kinematics, coordinates, and timestamps.
    
    Supports structured dictionaries, CSV text/streams, and basic NMEA log lines.
    """

    @staticmethod
    def parse_timestamp(ts_raw: Any) -> Optional[datetime.datetime]:
        """Parses various timestamp representations into timezone-aware UTC datetime."""
        if isinstance(ts_raw, datetime.datetime):
            if ts_raw.tzinfo is None:
                return ts_raw.replace(tzinfo=datetime.timezone.utc)
            return ts_raw.astimezone(datetime.timezone.utc)

        if isinstance(ts_raw, (int, float)):
            # Epoch timestamp in seconds or milliseconds
            if ts_raw > 1e11:  # milliseconds
                ts_raw /= 1000.0
            return datetime.datetime.fromtimestamp(ts_raw, tz=datetime.timezone.utc)

        if isinstance(ts_raw, str):
            ts_str = ts_raw.strip()
            if not ts_str:
                return None
            try:
                # If numeric string
                if re.match(r"^\d+(\.\d+)?$", ts_str):
                    val = float(ts_str)
                    if val > 1e11:
                        val /= 1000.0
                    return datetime.datetime.fromtimestamp(val, tz=datetime.timezone.utc)

                dt = date_parser.parse(ts_str)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=datetime.timezone.utc)
                return dt.astimezone(datetime.timezone.utc)
            except Exception:
                return None
        return None

    @classmethod
    def clean_record(cls, raw: Dict[str, Any], default_synthetic: bool = False) -> Optional[Dict[str, Any]]:
        """Validates an individual raw AIS message. Returns sanitized dict or None if invalid."""
        try:
            # 1. MMSI check (standard 9-digit maritime mobile service identity)
            mmsi = int(raw.get("mmsi", 0))
            if mmsi <= 0 or mmsi > 999999999:
                return None

            # 2. Timestamp check
            timestamp = cls.parse_timestamp(raw.get("timestamp"))
            if not timestamp:
                return None

            # 3. Geographic bounds check
            lat_val = raw.get("latitude", raw.get("lat"))
            lon_val = raw.get("longitude", raw.get("lon", raw.get("lng")))
            if lat_val is None or lon_val is None:
                return None

            lat = float(lat_val)
            lon = float(lon_val)
            if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
                return None

            # 4. Kinematic bounds check: SOG (knots)
            sog_val = raw.get("sog", raw.get("speed", 0.0))
            sog = float(sog_val) if sog_val not in (None, "") else 0.0
            if sog < 0.0 or sog > 60.0:  # Commercial ships < 30 kt; fast craft < 60 kt
                return None

            # 5. COG (Course Over Ground, degrees)
            cog_val = raw.get("cog", raw.get("course", 0.0))
            cog = float(cog_val) if cog_val not in (None, "") else 0.0
            cog = cog % 360.0

            # 6. Heading (degrees)
            heading_val = raw.get("heading", cog)
            heading = float(heading_val) if heading_val not in (None, "") else cog
            heading = heading % 360.0

            # 7. Navigation status (default 0: under way using engine)
            nav_status_val = raw.get("nav_status", raw.get("status", 0))
            nav_status = int(nav_status_val) if nav_status_val not in (None, "") else 0

            is_synth = raw.get("is_synthetic", raw.get("synthetic", default_synthetic))
            if isinstance(is_synth, str):
                is_synthetic = is_synth.strip().lower() in ("true", "1", "yes", "t")
            else:
                is_synthetic = bool(is_synth)

            # Helper to extract first non-empty value
            def _get_val(*keys, fallback=None):
                for k in keys:
                    v = raw.get(k)
                    if v is not None and str(v).strip() != "" and str(v).strip().lower() != "none":
                        return str(v).strip()
                return fallback

            vessel_name = _get_val("vessel_name", "ship_name", "vesselname", "shipname", "name", fallback=f"Vessel-{mmsi}")
            vessel_type = _get_val("vessel_type", "ship_type", "vesseltype", "shiptype", "type", fallback="Unknown")
            flag = _get_val("flag", "country", "nationality", fallback="Unknown")
            imo = _get_val("imo", "imo_number", fallback=None)

            return {
                "mmsi": mmsi,
                "timestamp": timestamp,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "sog": round(sog, 2),
                "cog": round(cog, 1),
                "heading": round(heading, 1),
                "nav_status": nav_status,
                "is_synthetic": is_synthetic,
                "vessel_name": vessel_name,
                "vessel_type": vessel_type,
                "imo": imo,
                "flag": flag
            }
        except (ValueError, TypeError):
            return None

    @classmethod
    def clean_batch(
        cls,
        raw_records: List[Dict[str, Any]],
        default_synthetic: bool = False
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Cleans a batch of raw AIS records and deduplicates by (MMSI, timestamp)."""
        cleaned: List[Dict[str, Any]] = []
        seen_keys = set()
        dropped_count = 0

        for r in raw_records:
            sanitized = cls.clean_record(r, default_synthetic=default_synthetic)
            if not sanitized:
                dropped_count += 1
                continue

            dedup_key = (sanitized["mmsi"], sanitized["timestamp"])
            if dedup_key in seen_keys:
                dropped_count += 1
                continue

            seen_keys.add(dedup_key)
            cleaned.append(sanitized)

        # Sort chronologically
        cleaned.sort(key=lambda x: x["timestamp"])
        return cleaned, dropped_count

    @classmethod
    def parse_csv_content(cls, csv_text: str, default_synthetic: bool = False) -> List[Dict[str, Any]]:
        """Parses CSV text representation into structured raw AIS record dicts."""
        if not csv_text or not csv_text.strip():
            return []

        records: List[Dict[str, Any]] = []
        reader = csv.DictReader(io.StringIO(csv_text.strip()))

        # Normalize field names: lower case, stripped
        field_mapping = {}
        if reader.fieldnames:
            for fn in reader.fieldnames:
                norm = fn.strip().lower()
                field_mapping[fn] = norm

        for row in reader:
            normalized_row = {field_mapping.get(k, k): v for k, v in row.items()}
            
            def get_val(*keys):
                for k in keys:
                    v = normalized_row.get(k)
                    if v is not None and str(v).strip() != "":
                        return str(v).strip()
                return None

            record: Dict[str, Any] = {
                "mmsi": get_val("mmsi", "vessel_mmsi", "ship_mmsi"),
                "timestamp": get_val("timestamp", "time", "datetime", "date_time"),
                "latitude": get_val("latitude", "lat", "lat_deg", "y"),
                "longitude": get_val("longitude", "lon", "lng", "lon_deg", "x"),
                "sog": get_val("sog", "speed", "speed_over_ground", "speed_knots"),
                "cog": get_val("cog", "course", "course_over_ground"),
                "heading": get_val("heading", "true_heading", "hdg"),
                "nav_status": get_val("nav_status", "navstatus", "status"),
                "vessel_name": get_val("vessel_name", "ship_name", "vesselname", "shipname", "name"),
                "vessel_type": get_val("vessel_type", "ship_type", "vesseltype", "shiptype", "type"),
                "imo": get_val("imo", "imo_number"),
                "flag": get_val("flag", "country", "nationality"),
                "is_synthetic": get_val("is_synthetic", "synthetic") or default_synthetic
            }
            records.append(record)

        return records

    @classmethod
    def parse_nmea_sentence(cls, sentence: str, default_synthetic: bool = False) -> Optional[Dict[str, Any]]:
        """Extracts positions from simplified AIS NMEA or formatted sentence logs."""
        line = sentence.strip()
        if not line:
            return None

        # Handle simplified comma-separated NMEA-like log or standard !AIVDM
        parts = [p.strip() for p in line.split(",")]
        # Example structured log: $AIS,mmsi,timestamp,lat,lon,sog,cog,vessel_name
        if parts[0].upper() in ("$AIS", "!AIS", "$GPRMC") and len(parts) >= 6:
            try:
                mmsi = int(parts[1])
                timestamp = parts[2]
                lat = float(parts[3])
                lon = float(parts[4])
                sog = float(parts[5]) if len(parts) > 5 and parts[5] else 0.0
                cog = float(parts[6]) if len(parts) > 6 and parts[6] else 0.0
                name = parts[7] if len(parts) > 7 and parts[7] else f"Vessel-{mmsi}"
                return {
                    "mmsi": mmsi,
                    "timestamp": timestamp,
                    "latitude": lat,
                    "longitude": lon,
                    "sog": sog,
                    "cog": cog,
                    "vessel_name": name,
                    "is_synthetic": default_synthetic
                }
            except Exception:
                return None
        return None
