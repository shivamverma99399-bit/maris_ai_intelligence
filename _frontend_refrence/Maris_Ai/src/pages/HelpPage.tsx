import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Compass,
  Ship,
  Waves,
  Search,
  Clock,
  ExternalLink,
  BookOpen,
  Info,
  AlertTriangle,
} from 'lucide-react';

export const HelpPage: React.FC = () => {
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0, 1]); // default open first two

  const toggleFaq = (idx: number) => {
    setOpenFaqIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const faqs = [
    {
      q: 'What is an oil-spill incident?',
      a: 'An oil-spill incident represents an unauthorized petroleum or chemical hydrocarbon discharge into maritime waters detected via Synthetic Aperture Radar (SAR) imagery, satellite multi-spectral bands, or coastal surveillance nodes. MARIS clusters satellite reflectance anomalies into classified plume polygons with caprenis thickness ratings, volume estimations, and trajectory vectors.',
    },
    {
      q: 'How are vessels tracked?',
      a: 'Vessels are tracked through Automatic Identification System (AIS) Class A and B transponders broadcast over VHF frequencies and downlinked via low-earth-orbit constellations. MARIS computes real-time Speed Over Ground (SOG), Course Over Ground (COG), destination, voyage history, and correlates vessel positions against nearby oil slicks to identify potential polluters.',
    },
    {
      q: 'What does CRITICAL mean?',
      a: 'A CRITICAL incident indicates an active, rapidly dispersing tier-1 hydrocarbon slick exceeding 2,000 liters or threatening sensitive coastal ecological zones, maritime sanctuaries, or critical port navigational channels. It immediately triggers emergency inter-agency workflows and automated dispatch of containment assets.',
    },
    {
      q: 'How does the investigation workflow work?',
      a: 'Clicking "Initiate Investigation" on any incident opens the MARIS Forensic Intelligence dossier. The system calculates vessel transit overlap within a 24-hour temporal window, correlates ballast water discharge records, computes hydrodynamic drift vectors using ocean current forecast models, and assigns units such as the Indian Coast Guard (ICG) for physical containment.',
    },
    {
      q: 'Is the displayed data live?',
      a: 'This prototype uses simulated data for demonstration purposes. The vessel telemetry, incidents, synthetic aperture radar passes, and maritime traffic corridors are modeled accurately after real-world Indian maritime geography and operational protocols to provide an authentic command center experience.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-3 sm:p-5 max-w-[1400px] w-full mx-auto animate-fade-in font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(157,0,255,0.14)]">
        <div>
          <div className="text-xs text-[#D9B8FF] font-bold tracking-widest uppercase">
            MARIS
          </div>
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-[#F2EDF7] mt-0.5">
            Maritime Intelligence System
          </h1>
          <p className="text-xs text-[#81758F] mt-1">
            System architecture, satellite telemetry algorithms, incident forensics & operator manual
          </p>
        </div>

        {/* Prototype Disclaimer Badge (Explicit Requirement) */}
        <div className="px-3 py-2 rounded-xl bg-[rgba(176,38,255,0.15)] border border-[rgba(176,38,255,0.4)] text-xs text-[#E9D5FF] max-w-sm">
          <div className="flex items-center gap-1.5 font-bold text-[#D6A7FF]">
            <Info className="w-3.5 h-3.5" />
            <span>PROTOTYPE DISCLAIMER</span>
          </div>
          <p className="text-[11px] text-[#B9ADBF] mt-0.5">
            This prototype uses simulated data for demonstration purposes.
          </p>
        </div>
      </div>

      {/* Guide Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
        {/* SECTION 1: HOW MARIS WORKS */}
        <div className="maris-glass-primary rounded-xl border border-[rgba(157,0,255,0.22)] p-4 sm:p-5 shadow-xl space-y-2.5">
          <div className="flex items-center gap-2 text-[#D6A7FF]">
            <Compass className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              HOW MARIS WORKS
            </h2>
          </div>
          <p className="text-xs text-[#B9ADBF] leading-relaxed">
            MARIS fuses multi-sensor Synthetic Aperture Radar (SAR), multi-spectral orbital imagery, and real-time terrestrial/satellite AIS telemetry to detect marine pollution, track maritime transit corridors, and identify potential polluters in Indian waters.
          </p>
        </div>

        {/* SECTION 2: VESSEL TRACKING */}
        <div className="maris-glass-primary rounded-xl border border-[rgba(157,0,255,0.22)] p-4 sm:p-5 shadow-xl space-y-2.5">
          <div className="flex items-center gap-2 text-[#67E8F9]">
            <Ship className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              VESSEL TRACKING
            </h2>
          </div>
          <p className="text-xs text-[#B9ADBF] leading-relaxed">
            Continuously monitors over 1,200 commercial tankers, container liners, and patrol vessels across the Arabian Sea, Bay of Bengal, and Indian Ocean with live SOG/COG navigation telemetry, IMO registration, and flag status.
          </p>
        </div>

        {/* SECTION 3: OIL SPILL DETECTION */}
        <div className="maris-glass-primary rounded-xl border border-[rgba(157,0,255,0.22)] p-4 sm:p-5 shadow-xl space-y-2.5">
          <div className="flex items-center gap-2 text-[#F87171]">
            <Waves className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              OIL SPILL DETECTION
            </h2>
          </div>
          <p className="text-xs text-[#B9ADBF] leading-relaxed">
            Automated deep neural networks analyze radar backscatter dampening caused by oil films on sea surface capillary waves, providing rapid perimeter mapping and volume estimation before coastal landfall.
          </p>
        </div>

        {/* SECTION 4: INCIDENT INVESTIGATION */}
        <div className="maris-glass-primary rounded-xl border border-[rgba(157,0,255,0.22)] p-4 sm:p-5 shadow-xl space-y-2.5">
          <div className="flex items-center gap-2 text-[#FDE047]">
            <Search className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              INCIDENT INVESTIGATION
            </h2>
          </div>
          <p className="text-xs text-[#B9ADBF] leading-relaxed">
            Enables forensic temporal back-tracking. Correlates historical vessel transit paths against slick origins to compute suspect confidence scores and generate verifiable evidentiary dossiers.
          </p>
        </div>

        {/* SECTION 5: MAP CONTROLS */}
        <div className="maris-glass-primary rounded-xl border border-[rgba(157,0,255,0.22)] p-4 sm:p-5 shadow-xl space-y-2.5">
          <div className="flex items-center gap-2 text-[#B026FF]">
            <ShieldCheck className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              MAP CONTROLS
            </h2>
          </div>
          <p className="text-xs text-[#B9ADBF] leading-relaxed">
            Interact with the 3D WebGL Earth globe: drag to rotate, scroll to zoom, click any incident or vessel badge to inspect live telemetry, and toggle visual layers (AIS, Shipping Routes, Ports, Oil Spills, Ocean Currents).
          </p>
        </div>

        {/* SECTION 6: TIMELINE */}
        <div className="maris-glass-primary rounded-xl border border-[rgba(157,0,255,0.22)] p-4 sm:p-5 shadow-xl space-y-2.5">
          <div className="flex items-center gap-2 text-[#34D399]">
            <Clock className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              TIMELINE
            </h2>
          </div>
          <p className="text-xs text-[#B9ADBF] leading-relaxed">
            The 24-hour temporal scrubber allows operators to reconstruct incident progression, forecast drift vectors, synchronize multi-satellite passes, and evaluate emergency response milestones.
          </p>
        </div>
      </div>

      {/* Expandable FAQ Cards Section (Explicit Requirement) */}
      <div className="mt-4 mb-8 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[rgba(255,255,255,0.08)]">
          <HelpCircle className="w-4 h-4 text-[#B026FF]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#F2EDF7]">
            Frequently Asked Questions (FAQ)
          </h2>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndices.includes(idx);
            return (
              <div
                key={faq.q}
                className="maris-glass-primary rounded-xl border border-[rgba(157,0,255,0.2)] overflow-hidden transition-all shadow-md"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                >
                  <span className="text-xs sm:text-sm font-bold text-[#F2EDF7]">
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#B026FF] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#81758F] shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-[rgba(255,255,255,0.04)] text-xs text-[#B9ADBF] leading-relaxed bg-[rgba(18,13,24,0.4)]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
