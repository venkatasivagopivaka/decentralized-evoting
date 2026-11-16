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
      className={`relative rounded-xl p-6 transition-all duration-150 flex flex-col justify-between ${
        disabled
          ? 'opacity-40 cursor-not-allowed bg-[#E9E8E2] border border-[#D2D2C9]'
          : isSelected
          ? 'cursor-pointer bg-[#F8F7F2] border-2 border-[#536A55] shadow-sm'
          : 'cursor-pointer bg-[#F4F3EE] border border-[#D2D2C9] hover:bg-[#F8F7F2] hover:border-[#A48B70]'
      }`}
    >
      <div>
        {/* Top Header: Candidate Number & Radio Indicator */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-xs font-semibold tracking-wider text-[#A48B70]">
            CANDIDATE {candidate.number || `0${candidate.id + 1}`}
          </span>

          <div className="flex items-center space-x-2">
            {isSelected && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#536A55] font-semibold bg-[#E4EAE1] px-2 py-0.5 rounded">
                Selected
              </span>
            )}
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-[#536A55] text-[#F8F7F2]'
                  : 'border border-[#D2D2C9] bg-[#F8F7F2]'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
            </div>
          </div>
        </div>

        {/* Candidate Name & Role */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-[#30362F] tracking-tight">
            {candidate.name}
          </h3>
          <p className="text-xs font-mono text-[#6F746B] mt-0.5">
            {candidate.role}
          </p>
        </div>

        {/* Platform Statement */}
        <p className="text-xs text-[#6F746B] leading-relaxed mb-6">
          {candidate.platform}
        </p>
      </div>

      {/* Integer Encoding Footer */}
      <div className="pt-3 border-t border-[#D2D2C9] flex items-center justify-between text-xs">
        <span className="flex items-center space-x-1.5 text-[#93958C] text-xs font-mono">
          <Lock className="w-3.5 h-3.5 text-[#A48B70]" />
          <span>m =</span>
        </span>
        <span className="font-mono text-xs font-semibold text-[#30362F] bg-[#E9E8E2] px-2 py-0.5 rounded border border-[#D2D2C9]">
          {encodedValue.toString()}
        </span>
      </div>
    </div>
  );
}
