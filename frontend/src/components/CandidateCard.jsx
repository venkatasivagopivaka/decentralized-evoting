import React from 'react';
import { Check } from 'lucide-react';
import { encodeCandidateVoteRadix } from '../utils/crypto';

export function CandidateCard({
  candidate,
  isSelected,
  onSelect,
  disabled,
}) {
  return (
    <div
      onClick={() => !disabled && onSelect(candidate)}
      className={`relative rounded-xl p-5 transition-all duration-150 flex flex-col ${
        disabled
          ? 'opacity-40 cursor-not-allowed bg-[#E9E8E2] border border-[#D2D2C9]'
          : isSelected
          ? 'cursor-pointer bg-[#F8F7F2] border-2 border-[#536A55] shadow-sm'
          : 'cursor-pointer bg-[#F4F3EE] border border-[#D2D2C9] hover:bg-[#F8F7F2] hover:border-[#A48B70]'
      }`}
    >
      {/* Selection indicator */}
      <div className="flex items-start justify-between mb-4">
        <span className="font-mono text-[10px] font-medium tracking-wider text-[#93958C]">
          {candidate.number}
        </span>
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
            isSelected ? 'bg-[#536A55] text-[#F8F7F2]' : 'border border-[#D2D2C9] bg-[#F8F7F2]'
          }`}
        >
          {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
        </div>
      </div>

      {/* Name & platform */}
      <h3 className="text-base font-semibold text-[#30362F] tracking-tight leading-snug">
        {candidate.name}
      </h3>
      <p className="text-xs text-[#6F746B] mt-1 leading-relaxed">
        {candidate.platform}
      </p>
    </div>
  );
}
