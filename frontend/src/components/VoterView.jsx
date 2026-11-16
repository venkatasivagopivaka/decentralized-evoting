import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle, 
  Lock, 
  Send, 
  Key, 
  Copy, 
  RefreshCw, 
  Info, 
  Check,
  Radio
} from 'lucide-react';
import { CandidateCard } from './CandidateCard';
import { CANDIDATES } from '../utils/constants';
import { 
  encodeCandidateVoteRadix, 
  encodeCandidateVoteSimple, 
  encryptVote 
} from '../utils/crypto';
import { truncateAddress, truncateCiphertext } from '../utils/contract';

export function VoterView({
  account,
  contract,
  isWhitelisted,
  hasVoted,
  isElectionOpen,
  publicKey,
  onVoteCastSuccess,
}) {
  const [selectedCandidate, setSelectedCandidate] = useState(CANDIDATES[0]);
  const [encodingMode, setEncodingMode] = useState('radix'); // 'radix' or 'simple'
  const [generatedCiphertext, setGeneratedCiphertext] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [showFullCiphertext, setShowFullCiphertext] = useState(false);

  // Compute live encryption preview whenever candidate, encodingMode, or publicKey changes
  useEffect(() => {
    if (!publicKey || !selectedCandidate) {
      setGeneratedCiphertext('');
      return;
    }

    try {
      setIsEncrypting(true);
      const plaintext = encodingMode === 'radix'
        ? encodeCandidateVoteRadix(selectedCandidate.id)
        : encodeCandidateVoteSimple(selectedCandidate.id);

      const ciphertext = encryptVote(publicKey, plaintext);
      setGeneratedCiphertext(ciphertext.toString());
      setErrorMsg('');
    } catch (err) {
      console.error("Encryption calculation failed:", err);
      setErrorMsg("Failed to encrypt ballot: " + err.message);
    } finally {
      setIsEncrypting(false);
    }
  }, [publicKey, selectedCandidate, encodingMode]);

  const handleCastVote = async () => {
    if (!contract || !account) {
      setErrorMsg("Please connect your Web3 wallet first.");
      return;
    }
    if (!isWhitelisted) {
      setErrorMsg("Your wallet is not whitelisted by the election administrator.");
      return;
    }
    if (hasVoted) {
      setErrorMsg("You have already cast your ballot. Double voting is prevented by the smart contract.");
      return;
    }
    if (!isElectionOpen) {
      setErrorMsg("The election is currently closed.");
      return;
    }
    if (!publicKey) {
      setErrorMsg("Admin has not yet published the Paillier Public Key to the contract.");
      return;
    }
    if (!generatedCiphertext) {
      setErrorMsg("No encrypted ciphertext generated.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const tx = await contract.castVote(generatedCiphertext);
      setTxHash(tx.hash);

      const receipt = await tx.wait();
      if (receipt.status === 1) {
        if (onVoteCastSuccess) {
          onVoteCastSuccess(receipt);
        }
      } else {
        throw new Error("Transaction was reverted by the EVM.");
      }
    } catch (err) {
      console.error("Error casting vote:", err);
      const reason = err?.reason || err?.message || "Failed to cast vote transaction.";
      setErrorMsg(reason);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCiphertext = () => {
    if (!generatedCiphertext) return;
    navigator.clipboard.writeText(generatedCiphertext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canVote = isWhitelisted && !hasVoted && isElectionOpen && Boolean(publicKey);

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* 1. Four Rich Colourful Statistic Cards with Dedicated Pale Backgrounds */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Whitelist Status (Emerald & Pale Mint) */}
        <div className="rounded-2xl p-4 bg-pale-mint border border-emerald-border/70 flex items-center space-x-3.5 shadow-subtle">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-subtle ${
            isWhitelisted ? 'bg-emerald text-white' : 'bg-coral text-white'
          }`}>
            {isWhitelisted ? <ShieldCheck className="w-5 h-5 stroke-[2.2]" /> : <ShieldAlert className="w-5 h-5 stroke-[2.2]" />}
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-dark/80 tracking-wider">Voter Status</div>
            <div className={`text-sm font-bold ${isWhitelisted ? 'text-emerald-dark' : 'text-coral-dark'}`}>
              {isWhitelisted ? 'Whitelisted Voter' : 'Not Registered'}
            </div>
          </div>
        </div>

        {/* Ballot Status (Royal Indigo & Pale Lavender) */}
        <div className="rounded-2xl p-4 bg-pale-lavender border border-indigo-border/70 flex items-center space-x-3.5 shadow-subtle">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-subtle ${
            hasVoted ? 'bg-indigo text-white' : 'bg-white text-indigo border border-indigo-border'
          }`}>
            {hasVoted ? <CheckCircle className="w-5 h-5 stroke-[2.2]" /> : <Lock className="w-5 h-5 stroke-[2.2]" />}
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-indigo-dark/80 tracking-wider">Ballot Status</div>
            <div className="text-sm font-bold text-indigo-dark">
              {hasVoted ? 'Ballot Recorded' : 'Eligible to Vote'}
            </div>
          </div>
        </div>

        {/* Election Phase (Warm Amber & Pale Amber) */}
        <div className="rounded-2xl p-4 bg-pale-amber border border-amber-border/70 flex items-center space-x-3.5 shadow-subtle">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-subtle ${
            isElectionOpen ? 'bg-amber text-white' : 'bg-white text-amber border border-amber-border'
          }`}>
            <RefreshCw className={`w-5 h-5 stroke-[2.2] ${isElectionOpen ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-dark/80 tracking-wider">Election Phase</div>
            <div className="text-sm font-bold text-amber-dark">
              {isElectionOpen ? 'Active (Open)' : 'Inactive (Closed)'}
            </div>
          </div>
        </div>

        {/* Paillier Key (Violet & Pale Lavender) */}
        <div className="rounded-2xl p-4 bg-[#F3ECFA] border border-violet-border/70 flex items-center space-x-3.5 shadow-subtle">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-subtle ${
            publicKey ? 'bg-violet text-white' : 'bg-white text-ink-muted border border-appBorder'
          }`}>
            <Key className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-violet-dark/80 tracking-wider">Paillier Key</div>
            <div className={`text-sm font-bold ${publicKey ? 'text-violet-dark' : 'text-ink-muted'}`}>
              {publicKey ? 'Synced On-Chain' : 'Not Published'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Educational Hero Banner: How Paillier E-Voting Works (Pale Blue Theme) */}
      <div className="rounded-2xl p-6 bg-pale-blue border border-ocean-border/70 shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white text-ocean-dark border border-ocean-border/80">
                How It Works
              </span>
              <h3 className="text-base font-bold text-ink">
                End-to-End Cryptographic Privacy
              </h3>
            </div>
            <p className="text-xs text-ink-secondary max-w-2xl leading-relaxed">
              Your ballot is sealed on your machine using the election's Paillier homomorphic public key. The smart contract records only the mathematical ciphertext; your choice remains strictly private while enabling verifiable tallying.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:min-w-[340px]">
            <div className="bg-white/80 p-2.5 rounded-xl border border-ocean-border/50 text-center">
              <span className="block font-bold text-ocean-dark text-xs mb-0.5">1. Select</span>
              <span className="text-[10px] text-ink-muted">Choose candidate</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-ocean-border/50 text-center">
              <span className="block font-bold text-violet-dark text-xs mb-0.5">2. Seal</span>
              <span className="text-[10px] text-ink-muted">Encrypt with salt</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-ocean-border/50 text-center">
              <span className="block font-bold text-emerald-dark text-xs mb-0.5">3. Cast</span>
              <span className="text-[10px] text-ink-muted">Ethereum proof</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notice Banner for Non-Whitelisted Account (Pale Amber) */}
      {!isWhitelisted && account && (
        <div className="p-4 rounded-xl bg-pale-amber border border-amber-border text-ink text-xs flex items-start space-x-3 shadow-subtle">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-dark" />
          <div>
            <span className="font-bold text-amber-dark">Connected Wallet ({truncateAddress(account)}) is not currently whitelisted.</span>
            <p className="text-ink-secondary mt-0.5">
              To participate in this election, the administrator must whitelist your address. Switch to the Admin Dashboard (if you are the contract owner) or request whitelisting from the administrator.
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Banner for Already Cast Ballot (Pale Mint) */}
      {hasVoted && (
        <div className="p-4 rounded-xl bg-pale-mint border border-emerald-border text-ink text-xs flex items-start space-x-3 shadow-subtle">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald" />
          <div>
            <span className="font-bold text-emerald-dark">Your encrypted ballot has been permanently cast on Ethereum.</span>
            <p className="text-ink-secondary mt-0.5">
              Your ciphertext is securely recorded on the blockchain. Smart contract rules guarantee that double-voting is rejected. Results will be calculated homomorphically once the election concludes.
            </p>
          </div>
        </div>
      )}

      {/* 3. Candidate Selection Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink tracking-tight flex items-center space-x-2">
              <span>Choose Your Candidate</span>
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Select one candidate to cast your ballot. Your choice is automatically encoded and encrypted in real-time.
            </p>
          </div>

          {/* Scheme Selector */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-[#E8E8E2] text-xs shadow-subtle">
            <span className="text-ink-muted pl-2 font-medium text-[11px]">Tally Scheme:</span>
            <button
              onClick={() => setEncodingMode('radix')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                encodingMode === 'radix'
                  ? 'bg-pale-mint text-emerald-dark border border-emerald-border/60 shadow-subtle'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Radix Base-10000 (Multi)
            </button>
            <button
              onClick={() => setEncodingMode('simple')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                encodingMode === 'simple'
                  ? 'bg-pale-lavender text-indigo-dark border border-indigo-border/60 shadow-subtle'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Linear (A=1, B=2)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CANDIDATES.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              isSelected={selectedCandidate?.id === candidate.id}
              onSelect={setSelectedCandidate}
              disabled={!canVote}
              encodingMode={encodingMode}
            />
          ))}
        </div>
      </section>

      {/* 4. Ballot Cryptographic Sealing Panel (Violet & Ocean Blue) */}
      <section className="panel-card p-6 sm:p-7 space-y-6 border-t-4 border-t-violet">
        <div className="flex items-center justify-between border-b border-[#E8E8E2] pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-pale-lavender text-violet flex items-center justify-center border border-violet-border/60 shadow-subtle">
              <Lock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-ink">Cryptographic Ballot Seal</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-pale-lavender text-violet-dark border border-violet-border/60">
                  Zero-Knowledge Proof
                </span>
              </div>
              <p className="text-xs text-ink-muted font-mono mt-0.5">
                Formula: c = gᵐ · rⁿ mod n²
              </p>
            </div>
          </div>
          {isEncrypting && (
            <span className="text-xs text-violet flex items-center space-x-1.5 font-semibold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Blinding Ballot...</span>
            </span>
          )}
        </div>

        {/* Integer & Modulus Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Plaintext card */}
          <div className="bg-[#FAF9F5] p-4 rounded-xl border border-[#E8E8E2] space-y-1.5">
            <span className="text-[10px] font-bold text-ocean-dark uppercase tracking-wider block">
              1. Plaintext Integer (m)
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-ocean">
                {selectedCandidate
                  ? (encodingMode === 'radix'
                      ? encodeCandidateVoteRadix(selectedCandidate.id).toString()
                      : encodeCandidateVoteSimple(selectedCandidate.id).toString())
                  : '0'}
              </span>
              <span className="text-xs font-semibold text-ink-secondary">
                ({selectedCandidate?.role}: {selectedCandidate?.name})
              </span>
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              {encodingMode === 'radix'
                ? `Encoded as 10000^${selectedCandidate?.id} to isolate vote accumulation without overflow collision.`
                : `Encoded as linear coefficient ${selectedCandidate?.id + 1} for two-candidate simultaneous resolution.`}
            </p>
          </div>

          {/* Public Modulus card */}
          <div className="bg-[#FAF9F5] p-4 rounded-xl border border-[#E8E8E2] space-y-1.5">
            <span className="text-[10px] font-bold text-violet-dark uppercase tracking-wider block">
              2. Paillier Public Modulus (n)
            </span>
            <div className="font-mono text-xs text-ink break-all bg-white p-2.5 rounded-lg border border-[#E8E8E2] shadow-subtle">
              {publicKey ? truncateCiphertext(publicKey.n.toString(), 24) : 'Waiting for published key on contract...'}
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Published on Ethereum smart contract. Used by voters to encrypt choices without revealing plaintext.
            </p>
          </div>
        </div>

        {/* Generated Ciphertext Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-ink flex items-center space-x-2">
              <span>Sealed Ciphertext (c)</span>
              <span className="text-[10px] bg-pale-lavender text-violet-dark px-2 py-0.5 rounded-md font-mono font-bold border border-violet-border/60">
                {generatedCiphertext ? `${generatedCiphertext.length * 8} bits` : '0 bits'}
              </span>
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFullCiphertext(!showFullCiphertext)}
                className="text-xs text-violet hover:text-violet-hover underline font-semibold"
              >
                {showFullCiphertext ? 'Collapse' : 'Expand Full'}
              </button>
              <button
                onClick={handleCopyCiphertext}
                disabled={!generatedCiphertext}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white hover:bg-[#F7F6F1] text-ink-secondary border border-[#E8E8E2] transition-colors font-semibold text-xs shadow-subtle"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="font-mono text-xs bg-[#FAF9F5] text-ink p-4 rounded-xl border border-[#E8E8E2] break-all select-all max-h-36 overflow-y-auto leading-relaxed shadow-inner">
            {generatedCiphertext ? (
              showFullCiphertext ? (
                generatedCiphertext
              ) : (
                truncateCiphertext(generatedCiphertext, 44)
              )
            ) : (
              <span className="text-ink-muted italic">Connect wallet and ensure public key is synced to view sealed ciphertext...</span>
            )}
          </div>
        </div>

        {/* Error Message Alert (Pale Coral) */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-pale-coral border border-coral-border text-coral-dark text-xs flex items-center space-x-2.5 shadow-subtle">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Transaction Confirmation Card (Pale Blue & Emerald) */}
        {txHash && (
          <div className="p-4 rounded-xl bg-pale-blue border border-ocean-border text-ocean-dark text-xs space-y-1 shadow-subtle">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <CheckCircle className="w-4 h-4 text-emerald" />
              <span>Ballot Cast Successfully on Ethereum</span>
            </div>
            <div className="font-mono text-[11px] text-ink-secondary break-all">
              Tx Hash: {txHash}
            </div>
          </div>
        )}

        {/* Cast Vote Action Button (Emerald Primary CTA) */}
        <div>
          <button
            onClick={handleCastVote}
            disabled={!canVote || isSubmitting || !generatedCiphertext}
            className={`w-full py-4 px-6 rounded-xl font-bold text-sm flex items-center justify-center space-x-2.5 transition-all duration-200 ${
              canVote && !isSubmitting && generatedCiphertext
                ? 'bg-emerald hover:bg-emerald-hover text-white shadow-card hover:shadow-cardHover hover:scale-[1.005]'
                : 'bg-[#F1EFE8] text-ink-muted cursor-not-allowed border border-[#E8E8E2]'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Broadcasting Encrypted Ballot to Ethereum...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>
                  {hasVoted
                    ? 'Ballot Already Recorded'
                    : !isWhitelisted
                    ? 'Wallet Not Whitelisted (Action Required)'
                    : !isElectionOpen
                    ? 'Election Currently Closed'
                    : `Cast Encrypted Ballot for ${selectedCandidate?.name}`}
                </span>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
