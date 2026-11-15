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
  Check
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
      {/* Voter Eligibility & System Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Whitelist Status */}
        <div className="panel-card p-4 flex items-center space-x-3.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isWhitelisted ? 'bg-jade-light text-jade' : 'bg-crimson-light text-crimson'
          }`}>
            {isWhitelisted ? <ShieldCheck className="w-5 h-5 stroke-[2.2]" /> : <ShieldAlert className="w-5 h-5 stroke-[2.2]" />}
          </div>
          <div>
            <div className="text-[11px] uppercase font-semibold text-ink-muted tracking-wider">Voter Status</div>
            <div className={`text-sm font-semibold ${isWhitelisted ? 'text-jade-dark' : 'text-crimson'}`}>
              {isWhitelisted ? 'Whitelisted Voter' : 'Not Whitelisted'}
            </div>
          </div>
        </div>

        {/* Ballot Status */}
        <div className="panel-card p-4 flex items-center space-x-3.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            hasVoted ? 'bg-indigo-light text-indigo' : 'bg-saffron-light text-saffron-dark'
          }`}>
            {hasVoted ? <CheckCircle className="w-5 h-5 stroke-[2.2]" /> : <Lock className="w-5 h-5 stroke-[2.2]" />}
          </div>
          <div>
            <div className="text-[11px] uppercase font-semibold text-ink-muted tracking-wider">Ballot Status</div>
            <div className={`text-sm font-semibold ${hasVoted ? 'text-indigo' : 'text-saffron-dark'}`}>
              {hasVoted ? 'Ballot Recorded' : 'Eligible to Vote'}
            </div>
          </div>
        </div>

        {/* Election State */}
        <div className="panel-card p-4 flex items-center space-x-3.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isElectionOpen ? 'bg-jade-light text-jade' : 'bg-surface-inset text-ink-muted'
          }`}>
            <RefreshCw className={`w-5 h-5 stroke-[2.2] ${isElectionOpen ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <div className="text-[11px] uppercase font-semibold text-ink-muted tracking-wider">Election Phase</div>
            <div className={`text-sm font-semibold ${isElectionOpen ? 'text-jade-dark' : 'text-ink-secondary'}`}>
              {isElectionOpen ? 'Active (Open)' : 'Inactive (Closed)'}
            </div>
          </div>
        </div>

        {/* Paillier Public Key */}
        <div className="panel-card p-4 flex items-center space-x-3.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            publicKey ? 'bg-jade-light text-jade' : 'bg-crimson-light text-crimson'
          }`}>
            <Key className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] uppercase font-semibold text-ink-muted tracking-wider">Public Key</div>
            <div className={`text-sm font-semibold ${publicKey ? 'text-jade-dark' : 'text-crimson'}`}>
              {publicKey ? 'Synced On-Chain' : 'Not Published'}
            </div>
          </div>
        </div>
      </div>

      {/* Information Banner for non-whitelisted address */}
      {!isWhitelisted && account && (
        <div className="p-4 rounded-xl bg-saffron-light border border-saffron-border text-ink text-sm flex items-start space-x-3">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-saffron-dark" />
          <div>
            <span className="font-semibold text-saffron-dark">Address ({truncateAddress(account)}) is not currently whitelisted.</span>
            <p className="text-xs text-ink-secondary mt-0.5">
              To participate in this election, your address must be registered by the election administrator. Switch to the Admin Dashboard (if you are the administrator) or provide your address to the election authority.
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Banner if already voted */}
      {hasVoted && (
        <div className="p-4 rounded-xl bg-jade-light border border-jade-border text-ink text-sm flex items-start space-x-3">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-jade" />
          <div>
            <span className="font-semibold text-jade-dark">Your encrypted ballot has been recorded on Ethereum.</span>
            <p className="text-xs text-ink-secondary mt-0.5">
              The ciphertext is sealed in the smart contract's immutable ballot storage. Double voting is cryptographically prevented. When the election closes, the administrator will compute the homomorphic tally.
            </p>
          </div>
        </div>
      )}

      {/* Candidate Selection Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink tracking-tight">
              Select Candidate
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Your ballot choice is mapped to a mathematical integer and encrypted with the election's Paillier public key.
            </p>
          </div>

          {/* Scheme Selector */}
          <div className="flex items-center space-x-1 bg-surface-inset p-1 rounded-lg border border-surface-border text-xs">
            <span className="text-ink-muted pl-2 font-medium">Scheme:</span>
            <button
              onClick={() => setEncodingMode('radix')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                encodingMode === 'radix'
                  ? 'bg-surface-card text-ink shadow-subtle font-semibold border border-surface-border'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Radix Base-10000 (Multi)
            </button>
            <button
              onClick={() => setEncodingMode('simple')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                encodingMode === 'simple'
                  ? 'bg-surface-card text-ink shadow-subtle font-semibold border border-surface-border'
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

      {/* Cryptography Preview & Ballot Submission Panel */}
      <section className="panel-card p-6 sm:p-7 space-y-6">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-jade-light text-jade flex items-center justify-center">
              <Lock className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">Ballot Cryptographic Inspection</h3>
              <p className="text-xs text-ink-muted font-mono">
                Formula: c = g^m · r^n mod n²
              </p>
            </div>
          </div>
          {isEncrypting && (
            <span className="text-xs text-jade flex items-center space-x-1.5 font-medium">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Computing Ciphertext...</span>
            </span>
          )}
        </div>

        {/* Integer & Modulus Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-subtle p-4 rounded-lg border border-surface-border space-y-1.5">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
              1. Plaintext Message (m)
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-jade">
                {selectedCandidate
                  ? (encodingMode === 'radix'
                      ? encodeCandidateVoteRadix(selectedCandidate.id).toString()
                      : encodeCandidateVoteSimple(selectedCandidate.id).toString())
                  : '0'}
              </span>
              <span className="text-xs text-ink-secondary">
                ({selectedCandidate?.role}: {selectedCandidate?.name})
              </span>
            </div>
            <p className="text-[11px] text-ink-muted">
              {encodingMode === 'radix'
                ? `Encoded as 10000^${selectedCandidate?.id} for radix accumulation.`
                : `Encoded as linear integer ${selectedCandidate?.id + 1} for two-candidate simultaneous linear resolution.`}
            </p>
          </div>

          <div className="bg-surface-subtle p-4 rounded-lg border border-surface-border space-y-1.5">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
              2. Paillier Public Modulus (n)
            </span>
            <div className="font-mono text-xs text-ink break-all bg-surface-card p-2 rounded border border-surface-border">
              {publicKey ? truncateCiphertext(publicKey.n.toString(), 22) : 'Waiting for Admin Public Key...'}
            </div>
            <p className="text-[11px] text-ink-muted">
              Published on Ethereum smart contract by election administrator.
            </p>
          </div>
        </div>

        {/* Generated Ciphertext Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-ink flex items-center space-x-2">
              <span>Encrypted Ballot Ciphertext (c)</span>
              <span className="text-[10px] bg-surface-inset text-ink-secondary px-1.5 py-0.5 rounded font-mono border border-surface-border">
                {generatedCiphertext ? `${generatedCiphertext.length * 8} bits` : '0 bits'}
              </span>
            </span>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFullCiphertext(!showFullCiphertext)}
                className="text-xs text-jade hover:text-jade-hover underline font-medium"
              >
                {showFullCiphertext ? 'Collapse' : 'View Full Ciphertext'}
              </button>
              <button
                onClick={handleCopyCiphertext}
                disabled={!generatedCiphertext}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-surface-subtle hover:bg-surface-inset text-ink-secondary border border-surface-border transition-colors font-medium text-xs"
              >
                {copied ? <Check className="w-3 h-3 text-jade" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="font-mono text-xs bg-surface-subtle text-ink p-3.5 rounded-lg border border-surface-border break-all select-all max-h-36 overflow-y-auto">
            {generatedCiphertext ? (
              showFullCiphertext ? (
                generatedCiphertext
              ) : (
                truncateCiphertext(generatedCiphertext, 44)
              )
            ) : (
              <span className="text-ink-muted italic">Connect wallet and ensure Paillier public key is synced to view ciphertext...</span>
            )}
          </div>
        </div>

        {/* Error Message Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-crimson-light border border-crimson-border text-crimson text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Transaction Confirmation Card */}
        {txHash && (
          <div className="p-4 rounded-lg bg-jade-light border border-jade-border text-jade-dark text-xs space-y-1">
            <div className="flex items-center space-x-2 font-semibold text-sm">
              <CheckCircle className="w-4 h-4 text-jade" />
              <span>Ballot Cast Successfully</span>
            </div>
            <div className="font-mono text-[11px] text-ink-secondary break-all">
              Transaction Hash: {txHash}
            </div>
          </div>
        )}

        {/* Cast Vote Action Button */}
        <div>
          <button
            onClick={handleCastVote}
            disabled={!canVote || isSubmitting || !generatedCiphertext}
            className={`w-full py-3.5 px-6 rounded-lg font-semibold text-sm flex items-center justify-center space-x-2 transition-all ${
              canVote && !isSubmitting && generatedCiphertext
                ? 'bg-jade hover:bg-jade-hover text-white shadow-subtle hover:shadow-card'
                : 'bg-surface-inset text-ink-muted cursor-not-allowed border border-surface-border'
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
                    ? 'Address Not Whitelisted (Action Required)'
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
