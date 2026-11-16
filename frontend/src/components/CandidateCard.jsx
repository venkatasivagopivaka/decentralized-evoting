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
      className={`relative rounded-lg p-5 transition-all duration-180 flex flex-col justify-between ${
        disabled
          ? 'opacity-40 cursor-not-allowed bg-[#E8E6DE] border border-[#CCCBC1]'
          : isSelected
          ? 'cursor-pointer bg-[#F8F7F3] border-2 border-[#425B49] shadow-card'
          : 'cursor-pointer bg-[#E8E6DE] border border-[#CCCBC1] hover:bg-[#F8F7F3] hover:border-[#70736C]'
      }`}
    >
      <div>
        {/* Top Header: Candidate Index & Custom Radio */}
        <div className="flex items-start justify-between mb-3">
          <span className="font-mono text-xs font-semibold tracking-wider text-[#A77D60]">
            {candidate.number || `0${candidate.id + 1}`}
          </span>
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
              isSelected
                ? 'bg-[#425B49] text-[#F1EFE8]'
                : 'border border-[#CCCBC1] bg-[#F1EFE8]'
            }`}
          >
            {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
          </div>
        </div>

        {/* Name & Role */}
        <h3 className="text-base font-semibold text-[#292E2A] tracking-tight leading-snug">
          {candidate.name}
        </h3>
        <p className="text-[11px] font-mono text-[#70736C] mt-0.5 mb-2">
          {candidate.role}
        </p>

        {/* Platform Statement */}
        <p className="text-xs text-[#70736C] leading-relaxed">
          {candidate.platform}
        </p>
      </div>
    </div>
  );
}
