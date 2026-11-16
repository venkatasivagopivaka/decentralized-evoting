import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

export function CandidateCard({
  candidate,
  isSelected,
  onSelect,
  disabled,
}) {
  return (
    <div
      onClick={() => !disabled && onSelect(candidate)}
      className={`group relative rounded-3xl p-8 sm:p-10 lg:p-12 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-2xl ${
        disabled
          ? 'opacity-35 cursor-not-allowed bg-[#08090B] border border-[#1F232B]'
          : isSelected
          ? 'cursor-pointer bg-[#0B0E14] border-2 border-[#C6FF00] shadow-[0_0_45px_rgba(198,255,0,0.25)] transform -translate-y-1'
          : 'cursor-pointer bg-[#08090B] border border-[#1F232B] hover:bg-[#101319] hover:border-black/50 hover:-translate-y-1'
      }`}
    >
      {/* Selected Indicator Left Vertical Accent Bar in Neon Lime */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-[#C6FF00] shadow-[0_0_20px_#C6FF00]" />
      )}

      {/* Decorative Oversized Watermark Numeral */}
      <span className="absolute -bottom-8 -right-4 text-8xl sm:text-9xl lg:text-[160px] font-black font-mono text-white/[0.025] select-none pointer-events-none tracking-tighter">
        {candidate.number || `0${candidate.id + 1}`}
      </span>

      <div className="relative z-10 space-y-6 sm:space-y-8">
        
        {/* Top Header Row: Candidate Identifier & Selection Pill */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs sm:text-sm font-black text-[#C6FF00] tracking-widest uppercase bg-[#C6FF00]/10 px-3.5 py-1.5 rounded-full border border-[#C6FF00]/30">
              CANDIDATE {candidate.number || `0${candidate.id + 1}`}
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-[#8B909D] hidden sm:inline">
              // VERIFIED NOMINEE
            </span>
          </div>

          {/* Distinctive Selection Pill Badge (Neon Lime paired with Midnight Black text) */}
          <div>
            {isSelected ? (
              <div className="inline-flex items-center space-x-2 bg-[#C6FF00] text-[#08090B] px-5 py-2 rounded-full font-mono text-xs font-black uppercase tracking-wider shadow-[0_0_18px_#C6FF00] scale-105 transition-transform duration-200">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Selected</span>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-2 bg-[#0F1115] border border-[#232730] group-hover:border-[#C6FF00] group-hover:text-white text-[#8B909D] px-5 py-2 rounded-full font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200">
                <span className="w-2 h-2 rounded-full border border-[#8B909D] group-hover:border-[#C6FF00]" />
                <span>Select Candidate</span>
              </div>
            )}
          </div>
        </div>

        {/* Centerpiece: Monumental Candidate Name (Visual Focus) */}
        <div className="space-y-2 pt-2">
          <h3 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white tracking-tighter uppercase leading-[0.92] transition-colors duration-200 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#C6FF00]">
            {candidate.name}
          </h3>
          <p className="text-xs sm:text-sm font-mono text-[#C6FF00] tracking-widest uppercase pt-1">
            {candidate.role}
          </p>
        </div>

        {/* Minimal Hairline Separator */}
        <div className={`h-[1px] w-full transition-colors duration-200 ${
          isSelected ? 'bg-[#C6FF00]/40' : 'bg-[#232730]'
        }`} />

        {/* Bottom Platform Manifesto with Generous Breathing Room */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm sm:text-base text-[#8B909D] leading-relaxed font-normal max-w-2xl">
            {candidate.platform}
          </p>

          <div className="flex items-center space-x-2 font-mono text-xs text-[#8B909D] group-hover:text-[#C6FF00] transition-colors flex-shrink-0">
            <span>{isSelected ? 'Ready to cast' : 'Click to select'}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

      </div>
    </div>
  );
}
export default CandidateCard;
