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
      className={`relative rounded-xl p-6 transition-all duration-150 ${
        disabled
          ? 'opacity-60 cursor-not-allowed bg-surface-subtle border border-surface-border'
          : isSelected
          ? 'cursor-pointer bg-surface-card border-2 border-jade shadow-card ring-2 ring-jade/10'
          : 'cursor-pointer bg-surface-card border border-surface-border panel-card-hover'
      }`}
    >
      {/* Selection Indicator */}
      <div className="absolute top-5 right-5">
        <div
          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-jade text-white shadow-subtle'
              : 'border border-surface-border bg-surface-subtle text-transparent'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      </div>

      {/* Candidate Identifier & Role Badge */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-surface-inset border border-surface-border flex items-center justify-center text-lg">
          {candidate.avatar}
        </div>
        <div>
          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${candidate.tagColor} mb-0.5`}>
            {candidate.role}
          </span>
          <h3 className="text-base font-semibold text-ink tracking-tight">{candidate.name}</h3>
        </div>
      </div>

      {/* Platform Description */}
      <p className="text-sm text-ink-secondary leading-relaxed mb-5 min-h-[44px]">
        {candidate.platform}
      </p>

      {/* Mathematical Encoding Preview */}
      <div className="pt-3 border-t border-surface-border/80 flex items-center justify-between text-xs">
        <span className="flex items-center space-x-1.5 text-ink-muted">
          <Lock className="w-3.5 h-3.5 text-jade" />
          <span className="font-medium">Plaintext Integer (m):</span>
        </span>
        <span className="font-mono text-xs font-semibold text-ink bg-surface-subtle px-2 py-0.5 rounded border border-surface-border">
          {encodedValue.toString()}
        </span>
      </div>
    </div>
  );
}
