import React from 'react';
import { Check, Shield, Sparkles, Binary } from 'lucide-react';

export function CandidateCard({
  candidate,
  isSelected,
  onSelect,
  disabled,
}) {
  // Visual icons for distinctive candidate identity
  const getCandidateIcon = (id) => {
    switch (id) {
      case 0:
        return <Binary className="w-6 h-6 text-[#FFD426]" />;
      case 1:
        return <Sparkles className="w-6 h-6 text-[#FFD426]" />;
      case 2:
      default:
        return <Shield className="w-6 h-6 text-[#FFD426]" />;
    }
  };

  return (
    <div
      onClick={() => !disabled && onSelect(candidate)}
      className={`relative rounded-2xl p-7 sm:p-8 transition-all duration-250 flex flex-col justify-between overflow-hidden ${
        disabled
          ? 'opacity-35 cursor-not-allowed bg-[#0F1115] border border-[#232730]'
          : isSelected
          ? 'cursor-pointer bg-[#14171E] border-2 border-[#FFD426] shadow-[0_0_30px_rgba(255,212,38,0.2)] transform -translate-y-1'
          : 'cursor-pointer bg-[#0F1115] border border-[#232730] hover:bg-[#12151B] hover:border-white/30 hover:-translate-y-0.5'
      }`}
    >
      {/* Background Decorative Number Watermark */}
      <span className="absolute -bottom-4 -right-2 text-7xl sm:text-8xl font-black font-mono text-white/[0.03] select-none pointer-events-none">
        {candidate.number || `0${candidate.id + 1}`}
      </span>

      <div className="relative z-10 space-y-6">
        {/* Top Header: Candidate Index & Custom Radio Selector */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
              isSelected ? 'bg-[#FFD426]/10 border-[#FFD426]' : 'bg-[#08090B] border-[#232730]'
            }`}>
              {getCandidateIcon(candidate.id)}
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#8B909D] uppercase tracking-widest block">
                CANDIDATE
              </span>
              <span className="font-mono text-xl sm:text-2xl font-black text-[#FFD426]">
                {candidate.number || `0${candidate.id + 1}`}
              </span>
            </div>
          </div>

          {/* Selection Indicator Check */}
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
              isSelected
                ? 'bg-[#FFD426] text-[#08090B] shadow-[0_0_12px_#FFD426] scale-105'
                : 'border border-[#232730] bg-[#08090B]'
            }`}
          >
            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
          </div>
        </div>

        {/* Candidate Name in Confident Editorial Scale */}
        <div className="space-y-1.5">
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            {candidate.name}
          </h3>
          <p className="text-xs font-mono text-[#FFD426] tracking-wide uppercase">
            {candidate.role}
          </p>
        </div>

        {/* Platform Statement */}
        <p className="text-sm text-[#8B909D] leading-relaxed font-normal">
          {candidate.platform}
        </p>
      </div>

      {/* Selected Indicator Bottom Bar */}
      <div className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-mono transition-colors duration-200 ${
        isSelected ? 'border-[#FFD426]/40 text-[#FFD426]' : 'border-[#232730] text-[#525765]'
      }`}>
        <span className="uppercase tracking-wider">
          {isSelected ? 'SELECTED CANDIDATE' : 'CLICK TO SELECT'}
        </span>
        <span className="font-bold">
          {isSelected ? '● ACTIVE' : '○ AVAILABLE'}
        </span>
      </div>
    </div>
  );
}
export default CandidateCard;
