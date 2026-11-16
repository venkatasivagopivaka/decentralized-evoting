import React from 'react';
import { Check } from 'lucide-react';

export function CandidateCard({
  candidate,
  isSelected,
  onSelect,
  disabled,
}) {
  return (
    <div
      onClick={() => !disabled && onSelect(candidate)}
      className={`relative rounded-lg p-6 transition-all duration-200 flex flex-col justify-between ${
        disabled
          ? 'opacity-35 cursor-not-allowed bg-[#0F1115] border border-[#232730]'
          : isSelected
          ? 'cursor-pointer bg-[#16191F] border-2 border-[#FFD426] shadow-goldGlow'
          : 'cursor-pointer bg-[#0F1115] border border-[#232730] hover:bg-[#16191F] hover:border-white/40'
      }`}
    >
      <div>
        {/* Top Header: Candidate Index in Electric Gold & Custom Radio Indicator */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-[10px] font-mono text-[#8B909D] uppercase tracking-wider">CANDIDATE</span>
            <span className="font-mono text-sm font-bold text-[#FFD426]">
              {candidate.number || `0${candidate.id + 1}`}
            </span>
          </div>

          <div
            className={`w-5 h-5 rounded-[4px] flex items-center justify-center transition-all duration-180 flex-shrink-0 ${
              isSelected
                ? 'bg-[#FFD426] text-[#08090B] shadow-[0_0_10px_#FFD426]'
                : 'border border-[#232730] bg-[#08090B]'
            }`}
          >
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </div>

        {/* Candidate Name in Bold Pure White */}
        <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
          {candidate.name}
        </h3>

        {/* Candidate Role */}
        <p className="text-xs font-mono text-[#FFD426]/90 mt-1 mb-3">
          {candidate.role}
        </p>

        {/* Platform Statement */}
        <p className="text-xs text-[#8B909D] leading-relaxed">
          {candidate.platform}
        </p>
      </div>

      {/* Selected Indicator Bar */}
      {isSelected && (
        <div className="mt-5 pt-3 border-t border-[#232730] flex items-center justify-between text-[11px] font-mono text-[#FFD426]">
          <span>BALLOT SELECTION</span>
          <span className="font-bold">ACTIVE</span>
        </div>
      )}
    </div>
  );
}
