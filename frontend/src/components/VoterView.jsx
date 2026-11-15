import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle, 
  Lock, 
  Send, 
  Key, 
  Sparkles, 
  Copy, 
  ExternalLink,
  RefreshCw,
  Info
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

      // Invoke castVote on the smart contract
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
      // Clean up common ethers revert reasons
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
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      {/* Voter Eligibility & System Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Whitelist Status */}
        <div className="glass-panel rounded-2xl p-4 flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${isWhitelisted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {isWhitelisted ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Whitelist Status</div>
            <div className={`text-sm font-bold ${isWhitelisted ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isWhitelisted ? 'Whitelisted Voter' : 'Not Whitelisted'}
            </div>
          </div>
        </div>

        {/* Voting Status */}
        <div className="glass-panel rounded-2xl p-4 flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${hasVoted ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'}`}>
            {hasVoted ? <CheckCircle className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Ballot Status</div>
            <div className={`text-sm font-bold ${hasVoted ? 'text-indigo-400' : 'text-amber-400'}`}>
              {hasVoted ? 'Ballot Cast' : 'Ready to Vote'}
            </div>
          </div>
        </div>

        {/* Election State */}
        <div className="glass-panel rounded-2xl p-4 flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${isElectionOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
            <RefreshCw className={`w-5 h-5 ${isElectionOpen ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Election Lifecycle</div>
            <div className={`text-sm font-bold ${isElectionOpen ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isElectionOpen ? 'Active (Open)' : 'Inactive (Closed)'}
            </div>
          </div>
        </div>

        {/* Paillier Public Key */}
        <div className="glass-panel rounded-2xl p-4 flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${publicKey ? 'bg-indigo-500/10 text-indigo-400' : 'bg-rose-500/10 text-rose-400'}`}>
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Paillier Public Key</div>
            <div className={`text-sm font-bold ${publicKey ? 'text-indigo-400' : 'text-rose-400'}`}>
              {publicKey ? 'Synced On-Chain' : 'Not Published'}
            </div>
          </div>
        </div>
      </div>

      {/* Warning/Guidance Alert if not ready to vote */}
      {!isWhitelisted && account && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-start space-x-3">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
          <div>
            <span className="font-semibold">Your address ({truncateAddress(account)}) is not currently whitelisted.</span>
            <p className="text-xs text-amber-200/80 mt-1">
              In a decentralized election, only authorized voter addresses can cast ballots. Switch to the Admin Dashboard (or ask the election administrator) to add your address to the whitelist.
            </p>
          </div>
        </div>
      )}

      {hasVoted && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-sm flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-400" />
          <div>
            <span className="font-semibold">Your encrypted ballot has been permanently confirmed on Ethereum!</span>
            <p className="text-xs text-indigo-300/80 mt-1">
              Your ballot is sealed in the smart contract's encrypted votes array. Double voting is cryptographically prevented. When the election closes, the administrator can perform homomorphic summation without ever revealing your individual vote.
            </p>
          </div>
        </div>
      )}

      {/* Candidate Selection Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
              <span>Select Your Candidate</span>
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </h2>
            <p className="text-sm text-slate-400">
              Choose a candidate. Your selection will be converted into a mathematical integer and encrypted with the election's Paillier public key.
            </p>
          </div>

          {/* Scheme selector */}
          <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 pl-2 font-medium">Scheme:</span>
            <button
              onClick={() => setEncodingMode('radix')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                encodingMode === 'radix'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Radix Base-10000 (Multi)
            </button>
            <button
              onClick={() => setEncodingMode('simple')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                encodingMode === 'simple'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Linear (A=1, B=2)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Cryptography Preview & Ballot Submission */}
      <section className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ballot Encryption Preview</h3>
              <p className="text-xs text-slate-400 font-mono">
                Homomorphic Formula: c = g^m · r^n mod n²
              </p>
            </div>
          </div>
          {isEncrypting && (
            <span className="text-xs text-indigo-400 flex items-center space-x-1 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Computing Ciphertext...</span>
            </span>
          )}
        </div>

        {/* Math & Ciphertext breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              1. Plaintext Message (m)
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-indigo-400">
                {selectedCandidate
                  ? (encodingMode === 'radix'
                      ? encodeCandidateVoteRadix(selectedCandidate.id).toString()
                      : encodeCandidateVoteSimple(selectedCandidate.id).toString())
                  : '0'}
              </span>
              <span className="text-xs text-slate-400">
                ({selectedCandidate?.role}: {selectedCandidate?.name})
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {encodingMode === 'radix'
                ? `Encoded as 10000^${selectedCandidate?.id} to allow multi-candidate homomorphic summation without overflow.`
                : `Encoded as linear integer ${selectedCandidate?.id + 1} for two-candidate simultaneous equations.`}
            </p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              2. Paillier Public Modulus (n)
            </span>
            <div className="font-mono text-xs text-slate-300 break-all bg-slate-950 p-2 rounded border border-slate-800/80">
              {publicKey ? truncateCiphertext(publicKey.n.toString(), 24) : 'Waiting for Admin Key...'}
            </div>
            <p className="text-[11px] text-slate-500">
              Publicly verifiable key generated by election admin and synchronized from smart contract.
            </p>
          </div>
        </div>

        {/* Real-time Generated Ciphertext */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <span>Encrypted Ballot Ciphertext (c)</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                {generatedCiphertext ? `${generatedCiphertext.length * 8} bits` : '0 bits'}
              </span>
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFullCiphertext(!showFullCiphertext)}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                {showFullCiphertext ? 'Collapse' : 'View Full Ciphertext'}
              </button>
              <button
                onClick={handleCopyCiphertext}
                disabled={!generatedCiphertext}
                className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="font-mono text-xs bg-slate-950 text-indigo-200/90 p-4 rounded-xl border border-slate-800 break-all select-all max-h-48 overflow-y-auto">
            {generatedCiphertext ? (
              showFullCiphertext ? (
                generatedCiphertext
              ) : (
                truncateCiphertext(generatedCiphertext, 48)
              )
            ) : (
              <span className="text-slate-500 italic">Connect wallet and ensure public key is published to preview ciphertext...</span>
            )}
          </div>
        </div>

        {/* Error message display */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Transaction Success Confirmation */}
        {txHash && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Ballot Cast Successfully!</span>
            </div>
            <div className="font-mono text-[11px] text-emerald-200/80 break-all">
              Tx Hash: {txHash}
            </div>
          </div>
        )}

        {/* Cast Vote Action Button */}
        <div className="pt-2">
          <button
            onClick={handleCastVote}
            disabled={!canVote || isSubmitting || !generatedCiphertext}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center space-x-3 transition-all ${
              canVote && !isSubmitting && generatedCiphertext
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white shadow-xl shadow-indigo-600/30 hover:scale-[1.005]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
                <span>Broadcasting Encrypted Ballot to Ethereum...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>
                  {hasVoted
                    ? 'Ballot Already Cast (Double-Voting Prevented)'
                    : !isWhitelisted
                    ? 'Address Not Whitelisted (Action Required)'
                    : !isElectionOpen
                    ? 'Election Currently Closed'
                    : `Cast Encrypted Vote for ${selectedCandidate?.name}`}
                </span>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
