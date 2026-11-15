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
      className={`relative group rounded-2xl p-6 transition-all duration-300 ${
        disabled
          ? 'opacity-60 cursor-not-allowed bg-slate-900/50 border border-slate-800'
          : isSelected
          ? 'cursor-pointer bg-slate-900/90 border-2 border-indigo-500 shadow-xl shadow-indigo-500/20 scale-[1.01]'
          : 'cursor-pointer glass-card glass-card-hover border border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Selection Checkmark */}
      <div className="absolute top-4 right-4">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/50 ring-2 ring-indigo-400'
              : 'border border-slate-700 bg-slate-800/50 text-transparent'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      </div>

      {/* Candidate Avatar & Badge */}
      <div className="flex items-center space-x-4 mb-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${candidate.color} p-0.5 shadow-md flex items-center justify-center text-2xl`}>
          <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center">
            {candidate.avatar}
          </div>
        </div>
        <div>
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${candidate.badgeColor} mb-1`}>
            {candidate.role}
          </span>
          <h3 className="text-lg font-bold text-white tracking-tight">{candidate.name}</h3>
        </div>
      </div>

      {/* Platform Description */}
      <p className="text-sm text-slate-300 leading-relaxed mb-5 min-h-[40px]">
        {candidate.platform}
      </p>

      {/* Cryptographic Encoding Preview */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="flex items-center space-x-1">
          <Lock className="w-3 h-3 text-indigo-400" />
          <span>Plaintext Message (m):</span>
        </span>
        <span className="text-indigo-300 font-semibold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          {encodedValue.toString()}
        </span>
      </div>
    </div>
  );
}
