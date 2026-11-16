import React, { useState } from 'react';
import { 
  Binary, 
  Lock, 
  Cpu, 
  Play, 
  RefreshCw,
  Sparkles
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
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* Title Header */}
      <div>
        <div className="inline-flex items-center space-x-2 text-violet-dark text-xs font-semibold uppercase tracking-wider mb-2 px-2.5 py-1 rounded-full bg-violet-light border border-violet-border">
          <Binary className="w-3.5 h-3.5 text-violet" />
          <span>Cryptographic Specification & Mathematical Foundations</span>
        </div>
        <h2 className="text-2xl font-bold text-ink tracking-tight">
          Paillier Homomorphic Cryptosystem
        </h2>
        <p className="text-xs text-ink-secondary mt-1 max-w-3xl leading-relaxed">
          How additively homomorphic encryption allows smart contracts and off-chain tallying agents to compute the exact aggregate result of an election without decrypting or exposing any individual voter's choice.
        </p>
      </div>

      {/* 3 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="panel-card p-6 space-y-3 border-t-4 border-t-violet shadow-card">
          <span className="text-[10px] font-mono text-violet-dark font-bold uppercase tracking-wider bg-pale-lavender px-2 py-0.5 rounded border border-violet-border/60 inline-block">
            01 / CONFIDENTIALITY
          </span>
          <h3 className="text-sm font-bold text-ink">Probabilistic Semantic Secrecy</h3>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Every ballot chooses a fresh random salt <code className="text-ink font-mono font-bold bg-[#FAF9F5] px-1 py-0.5 rounded border border-[#E8E8E2]">r ∈ ℤ*ₙ</code>. Two voters choosing the same candidate produce completely different, mathematically indistinguishable ciphertexts.
          </p>
        </div>

        <div className="panel-card p-6 space-y-3 border-t-4 border-t-indigo shadow-card">
          <span className="text-[10px] font-mono text-indigo-dark font-bold uppercase tracking-wider bg-pale-lavender px-2 py-0.5 rounded border border-indigo-border/60 inline-block">
            02 / HOMOMORPHISM
          </span>
          <h3 className="text-sm font-bold text-ink">Additive Homomorphism</h3>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Multiplying ciphertexts modulo <code className="text-ink font-mono font-bold">n²</code> corresponds to adding plaintexts:
            <br />
            <span className="font-mono text-indigo-dark font-bold block my-1.5 bg-pale-lavender px-2.5 py-1 rounded-md border border-indigo-border/60 text-[11px]">
              D(c₁ · c₂ mod n²) = m₁ + m₂ mod n
            </span>
            Ballot aggregation occurs entirely in ciphertext space.
          </p>
        </div>

        <div className="panel-card p-6 space-y-3 border-t-4 border-t-sage shadow-card">
          <span className="text-[10px] font-mono text-sage-dark font-bold uppercase tracking-wider bg-pale-mint px-2 py-0.5 rounded border border-sage-border/60 inline-block">
            03 / MULTI-CANDIDATE
          </span>
          <h3 className="text-sm font-bold text-ink">Radix Base Encoding</h3>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Candidate <code className="text-ink font-mono font-bold bg-[#FAF9F5] px-1 py-0.5 rounded border border-[#E8E8E2]">i</code> is encoded as <code className="text-ink font-mono font-bold">Bⁱ</code> (base 10,000). Decrypting the aggregate sum yields the exact vote counts for all candidates without tally collision.
          </p>
        </div>
      </div>

      {/* Mathematical Breakdown Deep-Dive */}
      <section className="panel-card p-6 sm:p-7 space-y-6 border-t-4 border-t-ocean">
        <h3 className="text-base font-bold text-ink border-b border-[#E8E8E2] pb-4 flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-ocean"></span>
          <span>Formal Mathematical Operations & Proofs</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Key Generation & Encryption */}
          <div className="bg-[#FAF9F5] p-5 rounded-2xl border border-[#E8E8E2] space-y-3">
            <h4 className="text-xs font-bold text-violet-dark uppercase tracking-wider flex items-center space-x-2">
              <Lock className="w-4 h-4 text-violet" />
              <span>Key Generation & Ballot Encryption</span>
            </h4>
            <div className="font-mono text-xs bg-white p-4 rounded-xl border border-[#E8E8E2] text-ink-secondary space-y-2 shadow-subtle">
              <div><span className="text-ink font-bold">1. Primes:</span> p, q randomly generated</div>
              <div><span className="text-ink font-bold">2. Modulus:</span> n = p · q, λ = lcm(p-1, q-1)</div>
              <div><span className="text-ink font-bold">3. Generator:</span> g = n + 1</div>
              <div><span className="text-ink font-bold">4. Public Key:</span> (n, g) published on-chain</div>
              <div><span className="text-ink font-bold">5. Private Key:</span> (λ, μ) kept in session</div>
              <div className="pt-2 border-t border-[#E8E8E2] text-violet-dark font-bold bg-pale-lavender px-2.5 py-1.5 rounded-lg border border-violet-border/60">
                c = gᵐ · rⁿ mod n²
              </div>
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Voters fetch public key parameters <code className="text-ink font-mono font-bold">(n, g)</code> from Ethereum, select blinding salt <code className="text-ink font-mono font-bold">r</code>, and seal their ballot integer.
            </p>
          </div>

          {/* Homomorphic Aggregation & Decryption */}
          <div className="bg-[#FAF9F5] p-5 rounded-2xl border border-[#E8E8E2] space-y-3">
            <h4 className="text-xs font-bold text-ocean-dark uppercase tracking-wider flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-ocean" />
              <span>Homomorphic Aggregation & Decryption</span>
            </h4>
            <div className="font-mono text-xs bg-white p-4 rounded-xl border border-[#E8E8E2] text-ink-secondary space-y-2 shadow-subtle">
              <div><span className="text-ink font-bold">1. Ballots:</span> [c₁, c₂, ..., cₖ] from contract</div>
              <div><span className="text-ink font-bold">2. Tally:</span> C_total = ∏ cᵢ mod n²</div>
              <div><span className="text-ink font-bold">3. Decrypt:</span> M_total = L(C_total^λ mod n²) · μ mod n</div>
              <div className="pt-2 border-t border-[#E8E8E2] text-ocean-dark font-bold bg-pale-blue px-2.5 py-1.5 rounded-lg border border-ocean-border/60">
                M_total = ∑ mᵢ mod n
              </div>
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              The administrator computes ciphertext product off-chain. Only the final aggregate sum is decrypted with the private key.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Cryptographic Playground */}
      <section className="panel-card p-6 sm:p-7 space-y-6 border-t-4 border-t-violet">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E8E8E2] pb-4">
          <div>
            <h3 className="text-base font-bold text-ink flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-violet" />
              <span>Interactive Homomorphic Playground</span>
            </h3>
            <p className="text-xs text-ink-secondary mt-0.5">
              Simulate Paillier encryption, homomorphic multiplication, and decryption in real time.
            </p>
          </div>

          <button
            onClick={runLiveSimulation}
            disabled={isSimulating}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-violet hover:bg-violet-hover text-white flex items-center justify-center space-x-2 shadow-card hover:shadow-cardHover transition-all"
          >
            {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Execute Simulation</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#FAF9F5] p-4 rounded-xl border border-[#E8E8E2]">
            <label className="text-[10px] font-bold text-violet-dark uppercase tracking-wider block mb-1.5">
              Voter 1 Plaintext (m₁)
            </label>
            <input
              type="number"
              value={sandboxM1}
              onChange={(e) => setSandboxM1(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E8E8E2] text-ink font-mono text-xs focus:outline-none focus:border-violet shadow-subtle"
            />
          </div>
          <div className="bg-[#FAF9F5] p-4 rounded-xl border border-[#E8E8E2]">
            <label className="text-[10px] font-bold text-violet-dark uppercase tracking-wider block mb-1.5">
              Voter 2 Plaintext (m₂)
            </label>
            <input
              type="number"
              value={sandboxM2}
              onChange={(e) => setSandboxM2(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E8E8E2] text-ink font-mono text-xs focus:outline-none focus:border-violet shadow-subtle"
            />
          </div>
        </div>

        {sandboxCSum && (
          <div className="space-y-3 bg-[#FAF9F5] p-5 rounded-2xl border border-[#E8E8E2] font-mono text-xs shadow-inner">
            <div className="text-ink-secondary">
              Ciphertext 1 (c₁): <span className="text-ink font-mono font-semibold">{truncateCiphertext(sandboxC1, 22)}</span>
            </div>
            <div className="text-ink-secondary">
              Ciphertext 2 (c₂): <span className="text-ink font-mono font-semibold">{truncateCiphertext(sandboxC2, 22)}</span>
            </div>
            <div className="pt-2 border-t border-[#E8E8E2] text-ink-secondary">
              Homomorphic Product (c₁ · c₂ mod n²):{' '}
              <span className="text-indigo font-bold">{truncateCiphertext(sandboxCSum, 22)}</span>
            </div>
            <div className="pt-2 border-t border-[#E8E8E2] text-xs font-bold text-ink flex items-center justify-between font-sans">
              <span>Decrypted Sum (m₁ + m₂):</span>
              <span className="px-3 py-1 rounded-lg bg-pale-mint text-emerald-dark border border-emerald-border font-bold text-sm font-mono shadow-subtle">
                {sandboxDecrypted}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
