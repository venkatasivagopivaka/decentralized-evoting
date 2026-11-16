import React from 'react';
import { Check, Lock } from 'lucide-react';
import { encodeCandidateVoteRadix, encodeCandidateVoteSimple } from '../utils/crypto';

export function CandidateCard({
  candidate,
  isSelected,
  onSelect,
  disabled,
  encodingMode = 'radix', // 'radix' or 'simple'
}) {
  const encodedValue = encodingMode === 'radix'
    ? encodeCandidateVoteRadix(candidate.id)
    : encodeCandidateVoteSimple(candidate.id);

  return (
    <div
      onClick={() => !disabled && onSelect(candidate)}
      className={`relative rounded-lg p-6 transition-all duration-150 flex flex-col justify-between ${
        disabled
          ? 'opacity-40 cursor-not-allowed bg-[#181818] border border-[#353535]'
          : isSelected
          ? 'cursor-pointer bg-[#272727] border-2 border-[#D9225C]'
          : 'cursor-pointer bg-[#202020] border border-[#353535] hover:border-[#555555] hover:bg-[#232323]'
      }`}
    >
      <div>
        {/* Top Header: Candidate Number & Radio Indicator */}
        <div className="flex items-center justify-between mb-4">
          <span className={`font-mono text-xs font-bold tracking-widest ${
            isSelected ? 'text-[#D9225C]' : 'text-[#777477]'
          }`}>
            {candidate.number || `0${candidate.id + 1}`}
          </span>

          <div className="flex items-center space-x-2">
            {isSelected && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#D9225C] font-semibold">
                Selected
              </span>
            )}
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-[#D9225C] text-white'
                  : 'border border-[#555555] bg-transparent'
              }`}
            >
              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </div>
        </div>

        {/* Candidate Name & Role */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-[#F5F5F5] tracking-tight">
            {candidate.name}
          </h3>
          <p className="text-[11px] font-mono text-[#777477] uppercase tracking-wider mt-0.5">
            {candidate.role}
          </p>
        </div>

        {/* Platform Statement */}
        <p className="text-xs text-[#A6A3A5] leading-relaxed mb-6">
          {candidate.platform}
        </p>
      </div>

      {/* Integer Encoding Footer */}
      <div className="pt-3 border-t border-[#353535] flex items-center justify-between text-xs">
        <span className="flex items-center space-x-1.5 text-[#777477] text-[11px] font-mono">
          <Lock className="w-3 h-3" />
          <span>m =</span>
        </span>
        <span className="font-mono text-xs font-semibold text-[#F5F5F5]">
          {encodedValue.toString()}
        </span>
      </div>
    </div>
  );
}
