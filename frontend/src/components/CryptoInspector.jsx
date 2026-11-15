import React, { useState } from 'react';
import { 
  Binary, 
  Lock, 
  Unlock, 
  Cpu, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  RefreshCw,
  Copy
} from 'lucide-react';
import { 
  generatePaillierKeys, 
  encryptVote, 
  homomorphicAddition, 
  decryptTally 
} from '../utils/crypto';
import { truncateCiphertext } from '../utils/contract';

export function CryptoInspector({ publicKey }) {
  // Live Sandbox state
  const [sandboxM1, setSandboxM1] = useState('1'); // Candidate A
  const [sandboxM2, setSandboxM2] = useState('10000'); // Candidate B
  const [sandboxC1, setSandboxC1] = useState('');
  const [sandboxC2, setSandboxC2] = useState('');
  const [sandboxCSum, setSandboxCSum] = useState('');
  const [sandboxDecrypted, setSandboxDecrypted] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const runLiveSimulation = async () => {
    try {
      setIsSimulating(true);
      // Generate a fast 512-bit key for instant in-browser demonstration
      const { publicKey: simPub, privateKey: simPriv } = await generatePaillierKeys(512);

      const m1 = BigInt(sandboxM1);
      const m2 = BigInt(sandboxM2);

      const c1 = encryptVote(simPub, m1);
      const c2 = encryptVote(simPub, m2);

      const cSum = homomorphicAddition(simPub, [c1, c2]);
      const decrypted = decryptTally(simPriv, cSum);

      setSandboxC1(c1.toString());
      setSandboxC2(c2.toString());
      setSandboxCSum(cSum.toString());
      setSandboxDecrypted(decrypted.toString());
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      {/* Title Header */}
      <div>
        <div className="flex items-center space-x-2 text-indigo-400 text-sm font-semibold mb-1">
          <Binary className="w-4 h-4" />
          <span>Cryptographic Specification & Mathematical Foundations</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Paillier Homomorphic Cryptosystem
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Discover how additive homomorphic encryption allows Ethereum nodes and smart contracts to store and tally sealed ballots without decrypting or exposing any voter's individual choice.
        </p>
      </div>

      {/* 3 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pillar 1 */}
        <div className="glass-panel rounded-2xl p-6 space-y-3 border-t-2 border-t-indigo-500">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
            1
          </div>
          <h3 className="text-base font-bold text-white">Probabilistic Semantic Secrecy</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every encryption picks a random blinding salt <code className="text-indigo-300">r ∈ ℤ*ₙ</code>.
            Even if 1,000 voters vote for the same candidate, each produces a unique, mathematically indistinguishable ciphertext.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="glass-panel rounded-2xl p-6 space-y-3 border-t-2 border-t-emerald-500">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            2
          </div>
          <h3 className="text-base font-bold text-white">Additive Homomorphism</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Multiplying ciphertexts modulo <code className="text-emerald-300">n²</code> maps to adding plaintexts:
            <br />
            <span className="font-mono text-emerald-300 block my-1">
              D(c₁ · c₂ mod n²) = m₁ + m₂ mod n
            </span>
            Ballot aggregation occurs entirely in ciphertext space.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="glass-panel rounded-2xl p-6 space-y-3 border-t-2 border-t-purple-500">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
            3
          </div>
          <h3 className="text-base font-bold text-white">Radix Super-increasing Encoding</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            To prevent tally collision across multiple candidates without interactive zero-knowledge proofs, Candidate <code className="text-purple-300">i</code> is encoded as <code className="text-purple-300">Bⁱ</code> (base 10,000). The decrypted sum cleanly yields each candidate's vote count.
          </p>
        </div>
      </div>

      {/* Mathematical Breakdown Deep-Dive */}
      <section className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
        <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-4">
          Cryptographic Operations & Equations
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Generation & Encryption */}
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>Key Generation & Ballot Encryption</span>
            </h4>
            <div className="font-mono text-xs bg-slate-950 p-4 rounded-lg text-slate-300 space-y-2 border border-slate-800">
              <div><span className="text-indigo-400">1. Primes:</span> p, q randomly selected</div>
              <div><span className="text-indigo-400">2. Modulus:</span> n = p · q, λ = lcm(p-1, q-1)</div>
              <div><span className="text-indigo-400">3. Generator:</span> g = n + 1</div>
              <div><span className="text-indigo-400">4. Public Key:</span> (n, g) published on-chain</div>
              <div><span className="text-indigo-400">5. Private Key:</span> (λ, μ) held by Admin</div>
              <div className="pt-2 border-t border-slate-800 text-emerald-300">
                <span className="text-slate-400">Encryption:</span> c = gᵐ · rⁿ mod n²
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Voters fetch <code className="text-indigo-300">n</code> and <code className="text-indigo-300">g</code> from the smart contract, select a random salt <code className="text-indigo-300">r</code>, and encrypt their candidate integer into ciphertext <code className="text-indigo-300">c</code>.
            </p>
          </div>

          {/* Homomorphic Aggregation & Decryption */}
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-emerald-300 uppercase tracking-wider flex items-center space-x-2">
              <Cpu className="w-4 h-4" />
              <span>Homomorphic Aggregation & Decryption</span>
            </h4>
            <div className="font-mono text-xs bg-slate-950 p-4 rounded-lg text-slate-300 space-y-2 border border-slate-800">
              <div><span className="text-emerald-400">1. Array of Ballots:</span> [c₁, c₂, ..., cₖ]</div>
              <div><span className="text-emerald-400">2. Aggregation:</span> C_total = ∏ cᵢ mod n²</div>
              <div><span className="text-emerald-400">3. Decryption:</span> M_total = L(C_total^λ mod n²) · μ mod n</div>
              <div className="pt-2 border-t border-slate-800 text-indigo-300">
                <span className="text-slate-400">Result:</span> M_total = ∑ mᵢ
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              The administrator computes the product of all ciphertexts without decrypting any individual ballot. Only the final aggregate total <code className="text-emerald-300">M_total</code> is decrypted using the private key.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Cryptographic Playground */}
      <section className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>Interactive Homomorphic Playground</span>
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </h3>
            <p className="text-xs text-slate-400">
              Run an interactive proof showing that multiplying two encrypted integers yields the encryption of their sum.
            </p>
          </div>

          <button
            onClick={runLiveSimulation}
            disabled={isSimulating}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-2 shadow-lg shadow-indigo-600/25"
          >
            {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Execute Cryptographic Simulation</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Voter 1 Plaintext (m₁):</label>
            <input
              type="number"
              value={sandboxM1}
              onChange={(e) => setSandboxM1(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Voter 2 Plaintext (m₂):</label>
            <input
              type="number"
              value={sandboxM2}
              onChange={(e) => setSandboxM2(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs"
            />
          </div>
        </div>

        {sandboxCSum && (
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs">
            <div className="text-slate-400">
              Ciphertext 1 (c₁): <span className="text-indigo-300">{truncateCiphertext(sandboxC1, 24)}</span>
            </div>
            <div className="text-slate-400">
              Ciphertext 2 (c₂): <span className="text-indigo-300">{truncateCiphertext(sandboxC2, 24)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 text-slate-400">
              Homomorphic Product (c₁ · c₂ mod n²):{' '}
              <span className="text-emerald-300">{truncateCiphertext(sandboxCSum, 24)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 text-sm font-bold text-white flex items-center justify-between">
              <span>Decrypted Sum (m₁ + m₂):</span>
              <span className="text-emerald-400 text-base">{sandboxDecrypted}</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
