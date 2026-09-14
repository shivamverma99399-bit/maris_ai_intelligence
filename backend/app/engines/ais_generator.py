import datetime
import math
import random
from typing import List, Dict, Any

class IndianEezAisGenerator:
    """Generates a realistic, curated synthetic AIS dataset for the Mumbai High / Arabian Sea corridor.
    
    IMPORTANT (Rule 6): All synthetic AIS records are explicitly tagged with `is_synthetic=True`.
    """

    @staticmethod
    def generate_demo_traffic(
        origin_lat: float,
        origin_lon: float,
        observation_time: datetime.datetime
    ) -> List[Dict[str, Any]]:
        """Generates realistic synthetic vessel traffic surrounding the probable origin and release window."""
        records: List[Dict[str, Any]] = []

        # -------------------------------------------------------------
        # Vessel 1: Prime Candidate (MT Sagar Ratna - Crude Oil Tanker)
        # MMSI: 419001234, Flag: IN, IMO: 9345612
        # Crosses probable origin right in the release window with a speed drop
        # -------------------------------------------------------------
        mmsi_1 = 419001234
        name_1 = "MT Sagar Ratna"
        type_1 = "Oil Tanker"
        imo_1 = "IMO9345612"
        flag_1 = "IN"

        # Trajectory: Approaches from South-Southwest towards North-Northeast
        start_time_1 = observation_time - datetime.timedelta(hours=16)
        curr_time = start_time_1
        lat_1 = origin_lat - 0.28
        lon_1 = origin_lon - 0.12

        while curr_time <= observation_time - datetime.timedelta(hours=8):
            # Check if vessel is near probable origin (within release window ~ T-15h to T-11h)
            hours_from_obs = (observation_time - curr_time).total_seconds() / 3600.0

            if 11.5 <= hours_from_obs <= 14.5:
                # Anomaly: loitering / speed drop near origin
                sog = round(random.uniform(4.0, 5.2), 1)
                cog = 28.0
            else:
                sog = round(random.uniform(13.5, 14.8), 1)
                cog = 32.0

            records.append({
                "mmsi": mmsi_1,
                "timestamp": curr_time,
                "latitude": round(lat_1, 6),
                "longitude": round(lon_1, 6),
                "sog": sog,
                "cog": cog,
                "heading": cog,
                "nav_status": 0,
                "is_synthetic": True,
                "vessel_name": name_1,
                "vessel_type": type_1,
                "imo": imo_1,
                "flag": flag_1
            })

            # Advance coordinates (at 14 kt, ~0.06 deg per 15 min; at 4.5 kt, ~0.019 deg)
            dist_deg = (sog * 1.852 / 111.0) * (15.0 / 60.0)
            lat_1 += dist_deg * math.cos(math.radians(cog))
            lon_1 += dist_deg * math.sin(math.radians(cog))
            curr_time += datetime.timedelta(minutes=15)

        # -------------------------------------------------------------
        # Vessel 2: AIS Gap Suspect (Pacific Chemist - Chemical Tanker)
        # MMSI: 419005678, Flag: LR, IMO: 9487123
        # Has an intentional AIS gap overlapping the estimated release window
        # -------------------------------------------------------------
        mmsi_2 = 419005678
        name_2 = "Pacific Chemist"
        type_2 = "Chemical Tanker"
        imo_2 = "IMO9487123"
        flag_2 = "LR"

        curr_time = observation_time - datetime.timedelta(hours=16)
        lat_2 = origin_lat - 0.25
        lon_2 = origin_lon + 0.05

        while curr_time <= observation_time - datetime.timedelta(hours=9):
            hours_from_obs = (observation_time - curr_time).total_seconds() / 3600.0

            # AIS GAP: Transmitter goes dark between T-14.5h and T-11.5h (3.0 hours)
            if 11.5 <= hours_from_obs <= 14.5:
                # Suppress pings
                pass
            else:
                sog = round(random.uniform(12.0, 13.0), 1)
                cog = 345.0
                records.append({
                    "mmsi": mmsi_2,
                    "timestamp": curr_time,
                    "latitude": round(lat_2, 6),
                    "longitude": round(lon_2, 6),
                    "sog": sog,
                    "cog": cog,
                    "heading": cog,
                    "nav_status": 0,
                    "is_synthetic": True,
                    "vessel_name": name_2,
                    "vessel_type": type_2,
                    "imo": imo_2,
                    "flag": flag_2
                })

            dist_deg = (12.0 * 1.852 / 111.0) * (20.0 / 60.0)
            lat_2 += dist_deg * math.cos(math.radians(345.0))
            lon_2 += dist_deg * math.sin(math.radians(345.0))
            curr_time += datetime.timedelta(minutes=20)

        # -------------------------------------------------------------
        # Vessel 3: Normal Through-Traffic (Ever Apex - Container Ship)
        # MMSI: 419009999, Flag: PA, IMO: 9812450
        # High speed, passes 15 km away, outside origin
        # -------------------------------------------------------------
        mmsi_3 = 419009999
        name_3 = "Ever Apex"
        type_3 = "Container Ship"
        imo_3 = "IMO9812450"
        flag_3 = "PA"

        curr_time = observation_time - datetime.timedelta(hours=18)
        lat_3 = origin_lat - 0.35
        lon_3 = origin_lon - 0.25  # 15+ km to the west

        while curr_time <= observation_time - datetime.timedelta(hours=4):
            sog = round(random.uniform(18.5, 19.8), 1)
            cog = 15.0
            records.append({
                "mmsi": mmsi_3,
                "timestamp": curr_time,
                "latitude": round(lat_3, 6),
                "longitude": round(lon_3, 6),
                "sog": sog,
                "cog": cog,
                "heading": cog,
                "nav_status": 0,
                "is_synthetic": True,
                "vessel_name": name_3,
                "vessel_type": type_3,
                "imo": imo_3,
                "flag": flag_3
            })
            dist_deg = (sog * 1.852 / 111.0) * (30.0 / 60.0)
            lat_3 += dist_deg * math.cos(math.radians(cog))
            lon_3 += dist_deg * math.sin(math.radians(cog))
            curr_time += datetime.timedelta(minutes=30)

        # -------------------------------------------------------------
        # Vessel 4: Offshore Supply Vessel (Halani Tide)
        # MMSI: 419004321, Flag: IN, IMO: 9152345
        # Steady supply vessel outside release window
        # -------------------------------------------------------------
        mmsi_4 = 419004321
        name_4 = "Halani Tide"
        type_4 = "Offshore Supply"
        imo_4 = "IMO9152345"
        flag_4 = "IN"

        curr_time = observation_time - datetime.timedelta(hours=24)
        lat_4 = origin_lat + 0.18
        lon_4 = origin_lon + 0.15

        while curr_time <= observation_time - datetime.timedelta(hours=18):
            sog = round(random.uniform(10.0, 11.2), 1)
            cog = 180.0
            records.append({
                "mmsi": mmsi_4,
                "timestamp": curr_time,
                "latitude": round(lat_4, 6),
                "longitude": round(lon_4, 6),
                "sog": sog,
                "cog": cog,
                "heading": cog,
                "nav_status": 0,
                "is_synthetic": True,
                "vessel_name": name_4,
                "vessel_type": type_4,
                "imo": imo_4,
                "flag": flag_4
            })
            dist_deg = (sog * 1.852 / 111.0) * (20.0 / 60.0)
            lat_4 += dist_deg * math.cos(math.radians(cog))
            lon_4 += dist_deg * math.sin(math.radians(cog))
            curr_time += datetime.timedelta(minutes=20)

        return records
