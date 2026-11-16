import React, { useState } from 'react';
import { RefreshCw, Play, Shield, Lock, Cpu, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import {
  generatePaillierKeys,
  encryptVote,
  homomorphicAddition,
  decryptTally,
  decodeRadixTally,
} from '../utils/crypto';
import { CANDIDATES, RADIX_BASE } from '../utils/constants';
import { truncateCiphertext } from '../utils/contract';

export function CryptoInspector({ publicKey }) {
  const [sandboxM1, setSandboxM1] = useState('1');
  const [sandboxM2, setSandboxM2] = useState('10000');
  const [sandboxC1, setSandboxC1] = useState('');
  const [sandboxC2, setSandboxC2] = useState('');
  const [sandboxCSum, setSandboxCSum] = useState('');
  const [sandboxDecrypted, setSandboxDecrypted] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const presets = [
    {
      name: 'Satoshi Plurality',
      desc: 'm₁ = 1 (Satoshi), m₂ = 1 (Satoshi)',
      m1: '1',
      m2: '1',
    },
    {
      name: 'Split Election',
      desc: 'm₁ = 1 (Satoshi), m₂ = 10,000 (Vitalik)',
      m1: '1',
      m2: '10000',
    },
    {
      name: 'Multi-Candidate Radix',
      desc: 'm₁ = 10,001 (Satoshi + Vitalik), m₂ = 100,000,000 (Ada Lovelace)',
      m1: '10001',
      m2: '100000000',
    },
  ];

  const runLiveSimulation = async (overrideM1, overrideM2) => {
    try {
      setIsSimulating(true);
      const val1 = overrideM1 !== undefined ? overrideM1 : sandboxM1;
      const val2 = overrideM2 !== undefined ? overrideM2 : sandboxM2;

      const { publicKey: simPub, privateKey: simPriv } = await generatePaillierKeys(512);
      const c1 = encryptVote(simPub, BigInt(val1));
      const c2 = encryptVote(simPub, BigInt(val2));
      const cSum = homomorphicAddition(simPub, [c1, c2]);
      const decrypted = decryptTally(simPriv, cSum);
      setSandboxC1(c1.toString());
      setSandboxC2(c2.toString());
      setSandboxCSum(cSum.toString());
      setSandboxDecrypted(decrypted.toString());
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-16 space-y-12">
      
      {/* Section Header: Bold Editorial Typography on Soft Ivory */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#08090B]/15 gap-6">
        <div>
          <div className="flex items-center space-x-2.5 text-[11px] font-mono tracking-widest text-[#08090B]/70 uppercase mb-2">
            <span className="w-2 h-2 rounded-[2px] bg-[#C6FF00]" />
            <span>CRYPTOGRAPHIC SPECIFICATION // PAILLIER HOMOMORPHISM</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black text-[#08090B] tracking-tighter uppercase leading-none">
            The Mathematics of Secrecy<span className="text-[#C6FF00]">.</span>
          </h2>
        </div>
        <p className="text-sm sm:text-base text-[#525765] max-w-md leading-relaxed">
          How additively homomorphic encryption allows the election authority to calculate exact vote tallies in ciphertext space without ever decrypting an individual ballot.
        </p>
      </div>

      {/* 3 Core Mathematical Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {[
          {
            num: '01',
            tag: 'CONFIDENTIALITY',
            title: 'Probabilistic Semantic Secrecy',
            body: (
              <>
                Every ballot picks a fresh random salt{' '}
                <code className="font-mono bg-[#08090B] px-2 py-0.5 rounded border border-[#232730] text-[#C6FF00]">
                  r ∈ ℤ*ₙ
                </code>.
                {' '}Two voters choosing the same candidate generate completely distinct, mathematically indistinguishable ciphertexts.
              </>
            ),
          },
          {
            num: '02',
            tag: 'HOMOMORPHISM',
            title: 'Additive Ciphertext Homomorphism',
            body: (
              <>
                Multiplying ciphertexts mod <code className="font-mono text-[#C6FF00]">n²</code> corresponds directly to adding plaintexts:
                <span className="block font-mono bg-[#08090B] border border-[#232730] rounded-xl px-4 py-2.5 mt-3 text-xs text-[#C6FF00]">
                  D(c₁ · c₂ mod n²) = m₁ + m₂ mod n
                </span>
              </>
            ),
          },
          {
            num: '03',
            tag: 'MULTI-CANDIDATE',
            title: 'Radix Base-10,000 Encoding',
            body: (
              <>
                Candidate <code className="font-mono text-[#C6FF00] bg-[#08090B] px-1.5 py-0.5 rounded border border-[#232730]">i</code>{' '}
                is encoded as{' '}
                <code className="font-mono text-[#C6FF00]">10,000ⁱ</code>. Decrypting the aggregate sum yields the exact vote counts for all candidates without collision.
              </>
            ),
          },
        ].map(({ num, tag, title, body }) => (
          <div key={tag} className="p-8 sm:p-9 rounded-3xl bg-[#08090B] border border-[#1F232B] text-white shadow-2xl space-y-4 relative overflow-hidden">
            <span className="absolute -bottom-3 -right-2 text-7xl font-black font-mono text-white/[0.03] select-none pointer-events-none">
              {num}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C6FF00] font-bold">
                {num} // {tag}
              </span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight uppercase leading-snug">
              {title}
            </h3>
            <p className="text-sm text-[#8B909D] leading-relaxed font-normal">{body}</p>
          </div>
        ))}
      </div>

      {/* Formal Mathematical Proofs */}
      <section className="p-8 sm:p-10 rounded-3xl bg-[#0F1115] border border-[#232730] space-y-6">
        <div className="pb-6 border-b border-[#232730]">
          <span className="text-[10px] font-mono text-[#8B909D] uppercase tracking-widest block mb-1">
            CRYPTOGRAPHIC PROOF
          </span>
          <h3 className="text-2xl font-black text-white tracking-tight uppercase">
            Formal Operations & Proof Equations
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Key Generation & Encryption */}
          <div className="bg-[#0F1115] border border-[#232730] rounded-2xl p-6 sm:p-7 space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              1. Key Generation & Ballot Encryption
            </h4>
            <div className="font-mono text-xs text-[#8B909D] space-y-2.5">
              <div><span className="text-white font-bold">Primes:</span> p, q randomly generated large primes</div>
              <div><span className="text-white font-bold">Modulus:</span> n = p · q, λ = lcm(p−1, q−1)</div>
              <div><span className="text-white font-bold">Generator:</span> g = n + 1</div>
              <div><span className="text-white font-bold">Public Key:</span> (n, g) published on-chain</div>
              <div><span className="text-white font-bold">Private Key:</span> (λ, μ) kept in session</div>
              <div className="pt-3 mt-2 border-t border-[#232730] text-[#C6FF00] font-bold bg-[#08090B] px-4 py-3 rounded-xl border border-[#C6FF00]/30 text-sm">
                c = gᵐ · rⁿ mod n²
              </div>
            </div>
          </div>

          {/* Aggregation & Decryption */}
          <div className="bg-[#0F1115] border border-[#232730] rounded-2xl p-6 sm:p-7 space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              2. Homomorphic Product & Tallying
            </h4>
            <div className="font-mono text-xs text-[#8B909D] space-y-2.5">
              <div><span className="text-white font-bold">Ballots:</span> [c₁, c₂, …, cₖ] from contract</div>
              <div><span className="text-white font-bold">Homomorphic Product:</span> C = ∏ cᵢ mod n²</div>
              <div><span className="text-white font-bold">Plaintext Extraction:</span> M = L(C^λ mod n²) · μ mod n</div>
              <div><span className="text-white font-bold">Security:</span> Zero individual ballot reveal</div>
              <div><span className="text-white font-bold">Decryption:</span> Completed off-chain by Admin</div>
              <div className="pt-3 mt-2 border-t border-[#232730] text-[#C6FF00] font-bold bg-[#08090B] px-4 py-3 rounded-xl border border-[#C6FF00]/30 text-sm">
                M = ∑ mᵢ mod n
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Homomorphic Playground */}
      <section className="p-8 sm:p-10 rounded-3xl bg-[#08090B] border border-[#1F232B] text-white shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#232730]">
          <div>
            <span className="text-[10px] font-mono text-[#8B909D] uppercase tracking-widest block mb-1">
              LIVE LABORATORY
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight uppercase">
              Interactive Homomorphic Sandbox
            </h3>
            <p className="text-xs sm:text-sm text-[#8B909D] mt-1">
              Simulate Paillier key generation, ballot encryption, homomorphic product, and aggregate decryption in real time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => runLiveSimulation()}
            disabled={isSimulating}
            className="btn-pill-lime !min-h-[48px] self-start sm:self-auto"
          >
            {isSimulating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#08090B]" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>{isSimulating ? 'Computing…' : 'Execute Simulation'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Interactive Demo Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-[#8B909D] uppercase tracking-wider mr-1">
            Demo Presets:
          </span>
          {presets.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => {
                setSandboxM1(p.m1);
                setSandboxM2(p.m2);
                runLiveSimulation(p.m1, p.m2);
              }}
              disabled={isSimulating}
              className="px-3 py-1.5 rounded-full bg-[#0F1115] hover:bg-[#16191F] border border-[#232730] hover:border-[#C6FF00] text-xs font-mono text-[#8B909D] hover:text-[#C6FF00] transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { label: 'Voter 1 Plaintext Ballot (m₁)', value: sandboxM1, onChange: setSandboxM1 },
            { label: 'Voter 2 Plaintext Ballot (m₂)', value: sandboxM2, onChange: setSandboxM2 },
          ].map(({ label, value, onChange }) => (
            <div key={label} className="bg-[#0F1115] p-6 rounded-2xl border border-[#232730] space-y-2">
              <label className="text-xs text-[#8B909D] block font-mono uppercase tracking-wider">{label}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-[#08090B] border border-[#232730] text-[#C6FF00] font-mono text-sm focus:outline-none focus:border-[#C6FF00]"
              />
            </div>
          ))}
        </div>

        {sandboxCSum && (
          <div className="bg-[#0F1115] border border-[#232730] rounded-2xl p-6 sm:p-8 font-mono text-xs space-y-4">
            <div className="text-[#8B909D] break-all">
              c₁: <span className="text-white font-medium">{truncateCiphertext(sandboxC1, 48)}</span>
            </div>
            <div className="text-[#8B909D] break-all">
              c₂: <span className="text-white font-medium">{truncateCiphertext(sandboxC2, 48)}</span>
            </div>
            <div className="pt-3 border-t border-[#232730] text-[#8B909D] break-all">
              c₁ · c₂ mod n² (Homomorphic Product): <span className="text-[#C6FF00] font-semibold">{truncateCiphertext(sandboxCSum, 48)}</span>
            </div>
            <div className="pt-4 border-t border-[#232730] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
              <span className="text-sm text-[#8B909D]">Decrypted Plaintext Sum (m₁ + m₂):</span>
              <span className="font-mono font-black text-2xl text-[#08090B] bg-[#C6FF00] px-5 py-2 rounded-full shadow-[0_0_15px_rgba(198,255,0,0.3)] self-start sm:self-auto">
                {sandboxDecrypted}
              </span>
            </div>

            {/* Radix Base-10,000 Decomposition Showcase */}
            {sandboxDecrypted && (() => {
              let radixDecomposition = [];
              try {
                const sumBig = BigInt(sandboxDecrypted);
                const decoded = decodeRadixTally(sumBig, CANDIDATES.length, RADIX_BASE);
                radixDecomposition = CANDIDATES.map((cand) => {
                  const match = decoded.find((d) => d.candidateId === cand.id);
                  return { ...cand, count: match ? match.count : 0 };
                });
              } catch (err) {
                radixDecomposition = [];
              }

              return (
                <div className="pt-4 border-t border-[#232730] space-y-3 font-sans">
                  <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#C6FF00]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Radix Base-10,000 Decomposition Output</span>
                  </div>
                  <p className="text-xs text-[#8B909D]">
                    Individual candidate tallies recovered simultaneously from the aggregate plaintext sum without ballot decryption:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {radixDecomposition.map((c, i) => (
                      <div key={c.id} className="bg-[#08090B] border border-[#232730] rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-[#8B909D]">10,000^{i}</span>
                          <span className="text-sm font-bold text-white">{c.name.split(' ')[0]}</span>
                        </div>
                        <div className="flex items-baseline justify-between pt-1 border-t border-[#232730]/60">
                          <span className="text-[10px] text-[#8B909D] font-mono uppercase">Calculated Votes:</span>
                          <span className="text-xl font-mono font-black text-[#C6FF00]">{c.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </section>

    </div>
  );
}
export default CryptoInspector;
