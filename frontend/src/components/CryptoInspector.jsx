import React, { useState } from 'react';
import { RefreshCw, Play } from 'lucide-react';
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#30362F] tracking-tight">Paillier Cryptosystem</h1>
        <p className="text-sm text-[#6F746B] mt-1">
          How additively homomorphic encryption lets ballots be tallied without decrypting individual votes.
        </p>
      </div>

      {/* Three concepts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            tag: 'Confidentiality',
            title: 'Probabilistic Secrecy',
            body: (
              <>
                Each ballot picks a fresh random salt{' '}
                <code className="font-mono bg-[#E9E8E2] px-1.5 py-0.5 rounded border border-[#D2D2C9] text-[#30362F]">r ∈ ℤ*ₙ</code>.
                {' '}Two voters choosing the same candidate produce completely different, indistinguishable ciphertexts.
              </>
            ),
          },
          {
            tag: 'Homomorphism',
            title: 'Additive Property',
            body: (
              <>
                Multiplying ciphertexts mod <code className="font-mono text-[#30362F]">n²</code> adds the plaintexts:{' '}
                <span className="block font-mono bg-[#F8F7F2] border border-[#D2D2C9] rounded px-2.5 py-1.5 mt-2 text-[11px] text-[#30362F]">
                  D(c₁ · c₂ mod n²) = m₁ + m₂ mod n
                </span>
              </>
            ),
          },
          {
            tag: 'Multi-candidate',
            title: 'Radix Base Encoding',
            body: (
              <>
                Candidate <code className="font-mono text-[#30362F] bg-[#E9E8E2] px-1.5 py-0.5 rounded border border-[#D2D2C9]">i</code>{' '}
                is encoded as{' '}
                <code className="font-mono text-[#30362F]">10,000ⁱ</code>. Decrypting the aggregate sum extracts exact vote counts for all candidates simultaneously.
              </>
            ),
          },
        ].map(({ tag, title, body }) => (
          <div key={tag} className="bg-[#F4F3EE] border border-[#D2D2C9] rounded-xl p-5 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#536A55]">{tag}</span>
            <h3 className="text-sm font-semibold text-[#30362F]">{title}</h3>
            <p className="text-xs text-[#6F746B] leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      {/* Mathematical operations */}
      <div className="bg-[#F4F3EE] border border-[#D2D2C9] rounded-xl p-6 space-y-5">
        <h2 className="text-xs font-mono uppercase tracking-widest text-[#6F746B] border-b border-[#D2D2C9] pb-3">
          Formal Operations
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Key gen & encryption */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-[#30362F]">Key Generation & Encryption</h4>
            <div className="bg-[#F8F7F2] border border-[#D2D2C9] rounded-lg p-4 font-mono text-xs text-[#6F746B] space-y-1.5">
              <div><span className="text-[#30362F] font-semibold">1. Primes:</span> p, q randomly generated</div>
              <div><span className="text-[#30362F] font-semibold">2. Modulus:</span> n = p · q, λ = lcm(p−1, q−1)</div>
              <div><span className="text-[#30362F] font-semibold">3. Generator:</span> g = n + 1</div>
              <div><span className="text-[#30362F] font-semibold">4. Public key:</span> (n, g) published on-chain</div>
              <div><span className="text-[#30362F] font-semibold">5. Private key:</span> (λ, μ) held in session</div>
              <div className="pt-2 mt-1 border-t border-[#D2D2C9] text-[#536A55] font-semibold bg-[#E4EAE1] px-2.5 py-1.5 rounded border border-[#C3D1C0]">
                c = gᵐ · rⁿ mod n²
              </div>
            </div>
          </div>

          {/* Aggregation & decryption */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-[#30362F]">Aggregation & Decryption</h4>
            <div className="bg-[#F8F7F2] border border-[#D2D2C9] rounded-lg p-4 font-mono text-xs text-[#6F746B] space-y-1.5">
              <div><span className="text-[#30362F] font-semibold">1. Ballots:</span> [c₁, c₂, …, cₖ] from contract</div>
              <div><span className="text-[#30362F] font-semibold">2. Product:</span> C = ∏ cᵢ mod n²</div>
              <div><span className="text-[#30362F] font-semibold">3. Decrypt:</span> M = L(C^λ mod n²) · μ mod n</div>
              <div className="pt-2 mt-1 border-t border-[#D2D2C9] text-[#536A55] font-semibold bg-[#E4EAE1] px-2.5 py-1.5 rounded border border-[#C3D1C0]">
                M = ∑ mᵢ mod n
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live sandbox */}
      <div className="bg-[#F4F3EE] border border-[#D2D2C9] rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#D2D2C9] pb-3">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#6F746B]">Live Playground</h2>
            <p className="text-xs text-[#6F746B] mt-0.5">Simulate encryption, homomorphic addition, and decryption in real time.</p>
          </div>
          <button
            onClick={runLiveSimulation}
            disabled={isSimulating}
            className="min-h-[40px] px-4 rounded-lg text-xs font-medium bg-[#536A55] hover:bg-[#465B48] active:scale-[0.99] text-[#F8F7F2] flex items-center space-x-2 transition-all shadow-sm disabled:opacity-50"
          >
            {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Run Simulation</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Voter 1 plaintext (m₁)', value: sandboxM1, onChange: setSandboxM1 },
            { label: 'Voter 2 plaintext (m₂)', value: sandboxM2, onChange: setSandboxM2 },
          ].map(({ label, value, onChange }) => (
            <div key={label} className="space-y-1.5">
              <label className="text-[11px] text-[#6F746B]">{label}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8F7F2] border border-[#D2D2C9] text-[#30362F] font-mono text-xs focus:outline-none focus:border-[#536A55] focus:ring-1 focus:ring-[#536A55]"
              />
            </div>
          ))}
        </div>

        {sandboxCSum && (
          <div className="bg-[#F8F7F2] border border-[#D2D2C9] rounded-lg p-4 font-mono text-xs space-y-2">
            <div className="text-[#6F746B]">
              c₁: <span className="text-[#30362F] font-medium">{truncateCiphertext(sandboxC1, 22)}</span>
            </div>
            <div className="text-[#6F746B]">
              c₂: <span className="text-[#30362F] font-medium">{truncateCiphertext(sandboxC2, 22)}</span>
            </div>
            <div className="pt-2 border-t border-[#D2D2C9] text-[#6F746B]">
              c₁ · c₂ mod n²: <span className="text-[#536A55] font-semibold">{truncateCiphertext(sandboxCSum, 22)}</span>
            </div>
            <div className="pt-2 border-t border-[#D2D2C9] flex items-center justify-between font-sans text-xs">
              <span className="text-[#6F746B]">Decrypted sum (m₁ + m₂):</span>
              <span className="font-mono font-bold text-[#536A55] bg-[#E4EAE1] px-3 py-1 rounded border border-[#C3D1C0]">
                {sandboxDecrypted}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
