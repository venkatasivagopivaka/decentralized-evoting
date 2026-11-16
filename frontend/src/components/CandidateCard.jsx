import React from 'react';
import { Check, Lock, Sparkles } from 'lucide-react';
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

  const tags = candidate.id === 0
    ? ['Cryptoeconomics', 'Decentralization', 'PoW']
    : candidate.id === 1
    ? ['Smart Contracts', 'Scaling', 'Quadratic Funding']
    : ['Homomorphic Encryption', 'Formal Proofs', 'Math'];

  return (
    <div
      onClick={() => !disabled && onSelect(candidate)}
      className={`relative rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between ${
        disabled
          ? 'opacity-60 cursor-not-allowed bg-white border border-[#E8E8E2]'
          : isSelected
          ? `cursor-pointer bg-white border-2 ${candidate.selectedBorder} shadow-cardHover ring-4 ${candidate.selectedRing || 'ring-emerald/10'} scale-[1.01]`
          : 'cursor-pointer bg-white border border-[#E8E8E2] hover:border-[#D0D0C8] hover:shadow-cardHover'
      }`}
    >
      <div>
        {/* Top Status Bar & Selection Indicator */}
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${candidate.tagColor}`}>
            {candidate.role}
          </span>

          <div className="flex items-center space-x-1.5">
            {isSelected ? (
              <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${candidate.barColor} text-white shadow-subtle`}>
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Selected</span>
              </span>
            ) : (
              <span className="text-[10px] font-medium text-ink-muted group-hover:text-ink-secondary">
                Tap to Select
              </span>
            )}
          </div>
        </div>

        {/* Candidate Identifier */}
        <div className="flex items-center space-x-3.5 mb-3">
          <div className={`w-12 h-12 rounded-xl ${candidate.badgeBackground} border border-black/5 flex items-center justify-center text-2xl shadow-subtle`}>
            {candidate.avatar}
          </div>
          <div>
            <h3 className="text-base font-bold text-ink tracking-tight font-sans">
              {candidate.name}
            </h3>
            <p className="text-xs text-ink-muted">Official Ballot Option #{candidate.id + 1}</p>
          </div>
        </div>

        {/* Platform Description */}
        <p className="text-xs text-ink-secondary leading-relaxed mb-4 min-h-[38px]">
          {candidate.platform}
        </p>

        {/* Topic Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F7F6F1] text-ink-secondary border border-[#E8E8E2]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Mathematical Encoding Preview */}
      <div className="pt-3 border-t border-[#E8E8E2] flex items-center justify-between text-xs">
        <span className="flex items-center space-x-1.5 text-ink-muted text-[11px]">
          <Lock className="w-3.5 h-3.5 text-violet" />
          <span className="font-medium">Plaintext Integer (m):</span>
        </span>
        <span className={`font-mono text-xs font-bold ${candidate.accentColor} bg-[#F7F6F1] px-2.5 py-1 rounded-md border border-[#E8E8E2]`}>
          {encodedValue.toString()}
        </span>
      </div>
    </div>
  );
}
