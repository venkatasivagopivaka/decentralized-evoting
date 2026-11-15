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
        <div className="panel-card p-5 space-y-2.5 border-t-2 border-t-violet">
          <span className="text-[11px] font-mono text-violet-dark font-semibold tracking-wider">01 / CONFIDENTIALITY</span>
          <h3 className="text-sm font-bold text-ink">Probabilistic Semantic Secrecy</h3>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Every ballot chooses a fresh random salt <code className="text-ink font-semibold">r ∈ ℤ*ₙ</code>. Two voters choosing the same candidate produce completely different, mathematically indistinguishable ciphertexts.
          </p>
        </div>

        <div className="panel-card p-5 space-y-2.5 border-t-2 border-t-indigo">
          <span className="text-[11px] font-mono text-indigo font-semibold tracking-wider">02 / HOMOMORPHISM</span>
          <h3 className="text-sm font-bold text-ink">Additive Homomorphism</h3>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Multiplying ciphertexts modulo <code className="text-ink font-semibold">n²</code> corresponds to adding plaintexts:
            <br />
            <span className="font-mono text-indigo-dark font-semibold block my-1 bg-indigo-light/60 px-2 py-0.5 rounded border border-indigo-border/50 text-[11px]">
              D(c₁ · c₂ mod n²) = m₁ + m₂ mod n
            </span>
            Ballot aggregation occurs entirely in ciphertext space.
          </p>
        </div>

        <div className="panel-card p-5 space-y-2.5 border-t-2 border-t-sage">
          <span className="text-[11px] font-mono text-sage-dark font-semibold tracking-wider">03 / MULTI-CANDIDATE</span>
          <h3 className="text-sm font-bold text-ink">Radix Base Encoding</h3>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Candidate <code className="text-ink font-semibold">i</code> is encoded as <code className="text-ink font-semibold">Bⁱ</code> (base 10,000). Decrypting the aggregate sum yields the exact vote counts for all candidates without tally collision.
          </p>
        </div>
      </div>

      {/* Mathematical Breakdown Deep-Dive */}
      <section className="panel-card p-6 sm:p-7 space-y-6">
        <h3 className="text-base font-bold text-ink border-b border-surface-border pb-3.5 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-violet"></span>
          <span>Formal Mathematical Operations & Proofs</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Key Generation & Encryption */}
          <div className="bg-surface-subtle p-5 rounded-lg border border-surface-border space-y-3">
            <h4 className="text-xs font-bold text-violet-dark uppercase tracking-wider flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-violet" />
              <span>Key Generation & Ballot Encryption</span>
            </h4>
            <div className="font-mono text-xs bg-surface-card p-3.5 rounded border border-surface-border text-ink-secondary space-y-1.5">
              <div><span className="text-ink font-semibold">1. Primes:</span> p, q randomly generated</div>
              <div><span className="text-ink font-semibold">2. Modulus:</span> n = p · q, λ = lcm(p-1, q-1)</div>
              <div><span className="text-ink font-semibold">3. Generator:</span> g = n + 1</div>
              <div><span className="text-ink font-semibold">4. Public Key:</span> (n, g) published on-chain</div>
              <div><span className="text-ink font-semibold">5. Private Key:</span> (λ, μ) kept in session</div>
              <div className="pt-2 border-t border-surface-border text-violet-dark font-semibold bg-violet-light/50 px-2 py-1 rounded">
                c = gᵐ · rⁿ mod n²
              </div>
            </div>
            <p className="text-[11px] text-ink-secondary leading-relaxed">
              Voters pull public key parameters <code className="text-ink font-semibold">(n, g)</code> from Ethereum, choose blinding salt <code className="text-ink font-semibold">r</code>, and seal their ballot integer.
            </p>
          </div>

          {/* Homomorphic Aggregation & Decryption */}
          <div className="bg-surface-subtle p-5 rounded-lg border border-surface-border space-y-3">
            <h4 className="text-xs font-bold text-ocean-dark uppercase tracking-wider flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-ocean" />
              <span>Homomorphic Aggregation & Decryption</span>
            </h4>
            <div className="font-mono text-xs bg-surface-card p-3.5 rounded border border-surface-border text-ink-secondary space-y-1.5">
              <div><span className="text-ink font-semibold">1. Ballots:</span> [c₁, c₂, ..., cₖ] from contract</div>
              <div><span className="text-ink font-semibold">2. Tally:</span> C_total = ∏ cᵢ mod n²</div>
              <div><span className="text-ink font-semibold">3. Decrypt:</span> M_total = L(C_total^λ mod n²) · μ mod n</div>
              <div className="pt-2 border-t border-surface-border text-ocean-dark font-semibold bg-ocean-light/50 px-2 py-1 rounded">
                M_total = ∑ mᵢ mod n
              </div>
            </div>
            <p className="text-[11px] text-ink-secondary leading-relaxed">
              The administrator multiplies all ciphertexts off-chain. Only the final aggregate sum is decrypted with the private key.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Cryptographic Playground */}
      <section className="panel-card p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-surface-border pb-3.5">
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
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-violet hover:bg-violet-hover text-white flex items-center justify-center space-x-1.5 shadow-subtle transition-colors"
          >
            {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Execute Simulation</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
              Voter 1 Plaintext (m₁)
            </label>
            <input
              type="number"
              value={sandboxM1}
              onChange={(e) => setSandboxM1(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-subtle border border-surface-border text-ink font-mono text-xs focus:outline-none focus:border-violet focus:bg-surface-card"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
              Voter 2 Plaintext (m₂)
            </label>
            <input
              type="number"
              value={sandboxM2}
              onChange={(e) => setSandboxM2(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-subtle border border-surface-border text-ink font-mono text-xs focus:outline-none focus:border-violet focus:bg-surface-card"
            />
          </div>
        </div>

        {sandboxCSum && (
          <div className="space-y-2.5 bg-surface-subtle p-4 rounded-lg border border-surface-border font-mono text-xs">
            <div className="text-ink-secondary">
              Ciphertext 1 (c₁): <span className="text-ink font-mono">{truncateCiphertext(sandboxC1, 22)}</span>
            </div>
            <div className="text-ink-secondary">
              Ciphertext 2 (c₂): <span className="text-ink font-mono">{truncateCiphertext(sandboxC2, 22)}</span>
            </div>
            <div className="pt-2 border-t border-surface-border text-ink-secondary">
              Homomorphic Product (c₁ · c₂ mod n²):{' '}
              <span className="text-indigo font-semibold">{truncateCiphertext(sandboxCSum, 22)}</span>
            </div>
            <div className="pt-2 border-t border-surface-border text-xs font-semibold text-ink flex items-center justify-between">
              <span>Decrypted Sum (m₁ + m₂):</span>
              <span className="px-2.5 py-0.5 rounded bg-mint text-emerald-dark border border-mint-border font-bold text-sm">
                {sandboxDecrypted}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
