#!/usr/bin/env python3
"""
MARIS — Smart India Hackathon 2026 / NTRO
Turn-key scenario seeding script for live demonstration.
Pre-populates Mumbai High oil slick, OpenDrift hindcast, AIS traffic, and attribution dossiers.
"""
import sys
import os

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, init_db
from app.services.demo_seeder import DemoSeeder

def main():
    print("=" * 65)
    print(" MARIS — Autonomous Maritime Intelligence System")
    print(" Smart India Hackathon 2026 (PS-26143 / NTRO)")
    print(" Turn-Key Demo Scenario Seeder (Mumbai High)")
    print("=" * 65)

    # Initialize tables
    print("[*] Initializing database schema...")
    init_db()

    db = SessionLocal()
    try:
        print("[*] Seeding Mumbai High demonstration scenario...")
        summary = DemoSeeder.seed_mumbai_high_demo(db, reset_if_exists=True)
        print("\n[+] Demo Seeding Complete!")
        print(f"    - Incident ID: {summary['incident_id']}")
        print(f"    - Title: {summary['title']}")
        print(f"    - Spill Area: {summary['spill_area_km2']} sq km")
        print(f"    - Probable Origin: ({summary['origin_lat']:.3f}°N, {summary['origin_lon']:.3f}°E)")
        print(f"    - Uncertainty Radius: ±{summary['uncertainty_radius_km']:.1f} km")
        print(f"    - AIS Positions Ingested: {summary['ingested_positions']}")
        print(f"    - Candidate Suspects Ranked: {summary['total_candidates']}")
        print(f"    - Top Suspect Vessel: {summary['top_suspect']} ({summary['top_score']:.1f}% confidence)")
        print(f"    - Counterfactual Physical Consistency: {summary['counterfactual_consistency_score']}% ({summary['counterfactual_verdict']})")
        print(f"    - Execution Time: {summary['seed_duration_ms']} ms")
        print("=" * 65)
    finally:
        db.close()

if __name__ == "__main__":
    main()
