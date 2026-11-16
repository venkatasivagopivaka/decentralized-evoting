import React, { useState } from 'react';
import { RefreshCw, Play, Sparkles } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-7">
      {/* Editorial Header */}
      <div className="border-b border-[#CCCBC1] pb-5">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#A77D60]">
          Cryptographic Foundations
        </span>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#292E2A] tracking-tight mt-1">
          Paillier Homomorphic Cryptosystem
        </h1>
        <p className="text-xs text-[#70736C] mt-1 max-w-2xl leading-relaxed">
          How additively homomorphic encryption allows the election authority to calculate exact aggregate vote counts in ciphertext space without exposing or decrypting any individual ballot.
        </p>
      </div>

      {/* 3 Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            tag: '01 / Confidentiality',
            title: 'Probabilistic Semantic Secrecy',
            body: (
              <>
                Every ballot picks a fresh random salt{' '}
                <code className="font-mono bg-[#E8E6DE] px-1.5 py-0.5 rounded border border-[#CCCBC1] text-[#292E2A]">r ∈ ℤ*ₙ</code>.
                {' '}Two voters choosing the same candidate generate completely distinct, mathematically indistinguishable ciphertexts.
              </>
            ),
          },
          {
            tag: '02 / Homomorphism',
            title: 'Additive Ciphertext Homomorphism',
            body: (
              <>
                Multiplying ciphertexts mod <code className="font-mono text-[#292E2A]">n²</code> corresponds to adding plaintexts:
                <span className="block font-mono bg-[#F8F7F3] border border-[#CCCBC1] rounded px-2.5 py-1.5 mt-2 text-[11px] text-[#292E2A]">
                  D(c₁ · c₂ mod n²) = m₁ + m₂ mod n
                </span>
              </>
            ),
          },
          {
            tag: '03 / Multi-Candidate',
            title: 'Radix Base-10,000 Encoding',
            body: (
              <>
                Candidate <code className="font-mono text-[#292E2A] bg-[#E8E6DE] px-1.5 py-0.5 rounded border border-[#CCCBC1]">i</code>{' '}
                is encoded as{' '}
                <code className="font-mono text-[#292E2A]">10,000ⁱ</code>. Decrypting the aggregate sum yields the exact vote counts for all candidates without collision.
              </>
            ),
          },
        ].map(({ tag, title, body }) => (
          <div key={tag} className="bg-[#E8E6DE] border border-[#CCCBC1] rounded-lg p-5 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#A77D60]">{tag}</span>
            <h3 className="text-sm font-semibold text-[#292E2A]">{title}</h3>
            <p className="text-xs text-[#70736C] leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      {/* Formal Operations Breakdown */}
      <div className="bg-[#E8E6DE] border border-[#CCCBC1] rounded-xl p-5 sm:p-6 space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-[#70736C] border-b border-[#CCCBC1] pb-3">
          Formal Operations & Proofs
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Key Generation & Encryption */}
          <div className="bg-[#F8F7F3] border border-[#CCCBC1] rounded-lg p-4 space-y-2">
            <h4 className="text-xs font-semibold text-[#292E2A]">Key Generation & Ballot Encryption</h4>
            <div className="font-mono text-xs text-[#70736C] space-y-1.5">
              <div><span className="text-[#292E2A] font-semibold">1. Primes:</span> p, q randomly generated</div>
              <div><span className="text-[#292E2A] font-semibold">2. Modulus:</span> n = p · q, λ = lcm(p−1, q−1)</div>
              <div><span className="text-[#292E2A] font-semibold">3. Generator:</span> g = n + 1</div>
              <div><span className="text-[#292E2A] font-semibold">4. Public Key:</span> (n, g) published on-chain</div>
              <div><span className="text-[#292E2A] font-semibold">5. Private Key:</span> (λ, μ) kept in session</div>
              <div className="pt-2 mt-1 border-t border-[#CCCBC1] text-[#425B49] font-semibold bg-[#E0E8DF] px-2.5 py-1.5 rounded border border-[#BDCEBC]">
                c = gᵐ · rⁿ mod n²
              </div>
            </div>
          </div>

          {/* Aggregation & Decryption */}
          <div className="bg-[#F8F7F3] border border-[#CCCBC1] rounded-lg p-4 space-y-2">
            <h4 className="text-xs font-semibold text-[#292E2A]">Aggregation & Decryption</h4>
            <div className="font-mono text-xs text-[#70736C] space-y-1.5">
              <div><span className="text-[#292E2A] font-semibold">1. Ballots:</span> [c₁, c₂, …, cₖ] from contract</div>
              <div><span className="text-[#292E2A] font-semibold">2. Product:</span> C = ∏ cᵢ mod n²</div>
              <div><span className="text-[#292E2A] font-semibold">3. Decrypt:</span> M = L(C^λ mod n²) · μ mod n</div>
              <div className="pt-2 mt-1 border-t border-[#CCCBC1] text-[#425B49] font-semibold bg-[#E0E8DF] px-2.5 py-1.5 rounded border border-[#BDCEBC]">
                M = ∑ mᵢ mod n
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Interactive Playground */}
      <div className="bg-[#E8E6DE] border border-[#CCCBC1] rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#CCCBC1] pb-3">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#70736C]">Interactive Homomorphic Playground</h2>
            <p className="text-xs text-[#70736C] mt-0.5">Simulate Paillier encryption, homomorphic product, and decryption in real time.</p>
          </div>
          <button
            type="button"
            onClick={runLiveSimulation}
            disabled={isSimulating}
            className="btn-primary"
          >
            {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Execute Simulation</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Voter 1 Plaintext (m₁)', value: sandboxM1, onChange: setSandboxM1 },
            { label: 'Voter 2 Plaintext (m₂)', value: sandboxM2, onChange: setSandboxM2 },
          ].map(({ label, value, onChange }) => (
            <div key={label} className="bg-[#F8F7F3] p-3.5 rounded-lg border border-[#CCCBC1] space-y-1">
              <label className="text-[11px] text-[#70736C] block font-medium">{label}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[#F1EFE8] border border-[#CCCBC1] text-[#292E2A] font-mono text-xs focus:outline-none focus:border-[#425B49]"
              />
            </div>
          ))}
        </div>

        {sandboxCSum && (
          <div className="bg-[#F8F7F3] border border-[#CCCBC1] rounded-lg p-4 font-mono text-xs space-y-2">
            <div className="text-[#70736C]">
              c₁: <span className="text-[#292E2A] font-medium">{truncateCiphertext(sandboxC1, 24)}</span>
            </div>
            <div className="text-[#70736C]">
              c₂: <span className="text-[#292E2A] font-medium">{truncateCiphertext(sandboxC2, 24)}</span>
            </div>
            <div className="pt-2 border-t border-[#CCCBC1] text-[#70736C]">
              c₁ · c₂ mod n²: <span className="text-[#425B49] font-semibold">{truncateCiphertext(sandboxCSum, 24)}</span>
            </div>
            <div className="pt-2 border-t border-[#CCCBC1] flex items-center justify-between font-sans text-xs">
              <span className="text-[#70736C]">Decrypted Plaintext Sum (m₁ + m₂):</span>
              <span className="font-mono font-bold text-sm text-[#425B49] bg-[#E0E8DF] px-3 py-1 rounded border border-[#BDCEBC]">
                {sandboxDecrypted}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
