import React, { useState } from 'react';
import { RefreshCw, Play, Shield, Lock, Cpu } from 'lucide-react';
import {
  generatePaillierKeys,
  encryptVote,
  homomorphicAddition,
  decryptTally,
} from '../utils/crypto';
import { truncateCiphertext } from '../utils/contract';

export function CryptoInspector({ publicKey }) {
  const [sandboxM1, setSandboxM1] = useState('1');
  const [sandboxM2, setSandboxM2] = useState('10000');
  const [sandboxC1, setSandboxC1] = useState('');
  const [sandboxC2, setSandboxC2] = useState('');
  const [sandboxCSum, setSandboxCSum] = useState('');
  const [sandboxDecrypted, setSandboxDecrypted] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const runLiveSimulation = async () => {
    try {
      setIsSimulating(true);
      const { publicKey: simPub, privateKey: simPriv } = await generatePaillierKeys(512);
      const c1 = encryptVote(simPub, BigInt(sandboxM1));
      const c2 = encryptVote(simPub, BigInt(sandboxM2));
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
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      {/* Large Editorial Headline */}
      <div className="border-b border-[#232730] pb-6">
        <div className="flex items-center space-x-2 text-[11px] font-mono tracking-widest text-[#FFD426] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFD426]" />
          <span>Specification // Homomorphic Protocol</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
          Paillier Homomorphic Cryptosystem
        </h1>
        <p className="text-xs sm:text-sm text-[#8B909D] mt-2 max-w-2xl leading-relaxed">
          How additively homomorphic encryption allows the election authority to calculate exact aggregate vote counts in ciphertext space without exposing or decrypting any individual ballot.
        </p>
      </div>

      {/* 3 Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            tag: '01 / CONFIDENTIALITY',
            title: 'Probabilistic Semantic Secrecy',
            body: (
              <>
                Every ballot picks a fresh random salt{' '}
                <code className="font-mono bg-[#08090B] px-1.5 py-0.5 rounded border border-[#232730] text-[#FFD426]">
                  r ∈ ℤ*ₙ
                </code>.
                {' '}Two voters choosing the same candidate generate completely distinct, mathematically indistinguishable ciphertexts.
              </>
            ),
          },
          {
            tag: '02 / HOMOMORPHISM',
            title: 'Additive Ciphertext Homomorphism',
            body: (
              <>
                Multiplying ciphertexts mod <code className="font-mono text-[#FFD426]">n²</code> corresponds to adding plaintexts:
                <span className="block font-mono bg-[#08090B] border border-[#232730] rounded px-3 py-2 mt-2 text-[11px] text-[#FFD426]">
                  D(c₁ · c₂ mod n²) = m₁ + m₂ mod n
                </span>
              </>
            ),
          },
          {
            tag: '03 / MULTI-CANDIDATE',
            title: 'Radix Base-10,000 Encoding',
            body: (
              <>
                Candidate <code className="font-mono text-[#FFD426] bg-[#08090B] px-1.5 py-0.5 rounded border border-[#232730]">i</code>{' '}
                is encoded as{' '}
                <code className="font-mono text-[#FFD426]">10,000ⁱ</code>. Decrypting the aggregate sum yields the exact vote counts for all candidates without collision.
              </>
            ),
          },
        ].map(({ tag, title, body }) => (
          <div key={tag} className="bg-[#0F1115] border border-[#232730] rounded-lg p-6 space-y-3 shadow-sm">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#FFD426] font-bold">{tag}</span>
            <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-[#8B909D] leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      {/* Formal Operations Breakdown */}
      <div className="bg-[#0F1115] border border-[#232730] rounded-xl p-6 space-y-5">
        <h2 className="text-xs font-mono uppercase tracking-widest text-[#8B909D] border-b border-[#232730] pb-4">
          Formal Operations & Proofs
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Key Generation & Encryption */}
          <div className="bg-[#08090B] border border-[#232730] rounded-lg p-5 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Key Generation & Ballot Encryption</h4>
            <div className="font-mono text-xs text-[#8B909D] space-y-2">
              <div><span className="text-white font-semibold">1. Primes:</span> p, q randomly generated</div>
              <div><span className="text-white font-semibold">2. Modulus:</span> n = p · q, λ = lcm(p−1, q−1)</div>
              <div><span className="text-white font-semibold">3. Generator:</span> g = n + 1</div>
              <div><span className="text-white font-semibold">4. Public Key:</span> (n, g) published on-chain</div>
              <div><span className="text-white font-semibold">5. Private Key:</span> (λ, μ) kept in session</div>
              <div className="pt-2.5 mt-1 border-t border-[#232730] text-[#FFD426] font-bold bg-[#16191F] px-3 py-2 rounded border border-[#FFD426]/30">
                c = gᵐ · rⁿ mod n²
              </div>
            </div>
          </div>

          {/* Aggregation & Decryption */}
          <div className="bg-[#08090B] border border-[#232730] rounded-lg p-5 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Aggregation & Decryption</h4>
            <div className="font-mono text-xs text-[#8B909D] space-y-2">
              <div><span className="text-white font-semibold">1. Ballots:</span> [c₁, c₂, …, cₖ] from contract</div>
              <div><span className="text-white font-semibold">2. Product:</span> C = ∏ cᵢ mod n²</div>
              <div><span className="text-white font-semibold">3. Decrypt:</span> M = L(C^λ mod n²) · μ mod n</div>
              <div className="pt-2.5 mt-1 border-t border-[#232730] text-[#FFD426] font-bold bg-[#16191F] px-3 py-2 rounded border border-[#FFD426]/30">
                M = ∑ mᵢ mod n
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Interactive Playground */}
      <div className="bg-[#0F1115] border border-[#232730] rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232730] pb-4">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#8B909D]">Interactive Homomorphic Playground</h2>
            <p className="text-xs text-[#8B909D] mt-0.5">Simulate Paillier encryption, homomorphic product, and decryption in real time.</p>
          </div>
          <button
            type="button"
            onClick={runLiveSimulation}
            disabled={isSimulating}
            className="btn-primary-gold"
          >
            {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#08090B]" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Execute Simulation</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Voter 1 Plaintext (m₁)', value: sandboxM1, onChange: setSandboxM1 },
            { label: 'Voter 2 Plaintext (m₂)', value: sandboxM2, onChange: setSandboxM2 },
          ].map(({ label, value, onChange }) => (
            <div key={label} className="bg-[#08090B] p-4 rounded-lg border border-[#232730] space-y-1.5">
              <label className="text-[11px] text-[#8B909D] block font-mono font-medium">{label}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md bg-[#0F1115] border border-[#232730] text-[#FFD426] font-mono text-xs focus:outline-none focus:border-[#FFD426]"
              />
            </div>
          ))}
        </div>

        {sandboxCSum && (
          <div className="bg-[#08090B] border border-[#232730] rounded-lg p-5 font-mono text-xs space-y-2.5">
            <div className="text-[#8B909D]">
              c₁: <span className="text-white font-medium">{truncateCiphertext(sandboxC1, 24)}</span>
            </div>
            <div className="text-[#8B909D]">
              c₂: <span className="text-white font-medium">{truncateCiphertext(sandboxC2, 24)}</span>
            </div>
            <div className="pt-2 border-t border-[#232730] text-[#8B909D]">
              c₁ · c₂ mod n²: <span className="text-[#FFD426] font-semibold">{truncateCiphertext(sandboxCSum, 24)}</span>
            </div>
            <div className="pt-2 border-t border-[#232730] flex items-center justify-between font-sans text-xs">
              <span className="text-[#8B909D]">Decrypted Plaintext Sum (m₁ + m₂):</span>
              <span className="font-mono font-extrabold text-base text-[#08090B] bg-[#FFD426] px-3 py-1 rounded shadow-sm">
                {sandboxDecrypted}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
