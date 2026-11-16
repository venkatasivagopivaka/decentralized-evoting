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
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* 1. Clear Election Header & Minimal Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#353535] pb-6 gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#777477]">
            Decentralized Ballot
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight mt-1">
            Cast Your Vote
          </h1>
        </div>

        {/* Minimal Typographic Status Indicators */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[#A6A3A5]">
          <div>
            Status: <span className={isElectionOpen ? 'text-[#F5F5F5] font-bold' : 'text-[#777477]'}>{isElectionOpen ? 'Voting Open' : 'Closed'}</span>
          </div>
          <span className="text-[#353535]">/</span>
          <div>
            Whitelisted: <span className={isWhitelisted ? 'text-[#F5F5F5] font-bold' : 'text-[#D9225C]'}>{isWhitelisted ? 'Yes' : 'No'}</span>
          </div>
          <span className="text-[#353535]">/</span>
          <div>
            Ballot: <span className={hasVoted ? 'text-[#D9225C] font-bold' : 'text-[#F5F5F5]'}>{hasVoted ? 'Recorded' : 'Pending'}</span>
          </div>
        </div>
      </div>

      {/* Notifications: Not Whitelisted / Already Voted */}
      {!isWhitelisted && account && (
        <div className="p-4 rounded-lg bg-[#181818] border border-[#353535] text-xs text-[#A6A3A5] flex items-center justify-between">
          <span>Your connected address ({truncateAddress(account)}) is not currently whitelisted. Request authorization from the administrator.</span>
        </div>
      )}

      {hasVoted && (
        <div className="p-4 rounded-lg bg-[#181818] border border-[#353535] text-xs text-[#F5F5F5] flex items-center justify-between">
          <span className="text-xs">
            <span className="text-[#D9225C] font-bold mr-2">CONFIRMED:</span>
            Your encrypted ballot has been permanently sealed and recorded on Ethereum. Double voting is prevented.
          </span>
        </div>
      )}

      {/* 2. Candidate Selection Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#777477]">
            Candidates
          </h2>

          {/* Compact Scheme Selector */}
          <div className="flex items-center space-x-1 bg-[#181818] p-1 rounded border border-[#353535] text-xs font-mono">
            <button
              onClick={() => setEncodingMode('radix')}
              className={`px-3 py-1 rounded transition-colors ${
                encodingMode === 'radix'
                  ? 'bg-[#272727] text-[#F5F5F5] font-semibold'
                  : 'text-[#777477] hover:text-[#A6A3A5]'
              }`}
            >
              Radix Base-10000
            </button>
            <button
              onClick={() => setEncodingMode('simple')}
              className={`px-3 py-1 rounded transition-colors ${
                encodingMode === 'simple'
                  ? 'bg-[#272727] text-[#F5F5F5] font-semibold'
                  : 'text-[#777477] hover:text-[#A6A3A5]'
              }`}
            >
              Linear (A=1, B=2)
            </button>
          </div>
        </div>

        {/* 3 Candidate Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* 3. Encrypted Ballot Details & Submission */}
      <section className="bg-[#181818] rounded-lg p-6 border border-[#353535] space-y-5">
        <div className="flex items-center justify-between border-b border-[#353535] pb-4">
          <div>
            <h3 className="text-sm font-bold text-[#F5F5F5] tracking-tight">
              Cryptographic Ballot Seal
            </h3>
            <p className="text-xs text-[#777477] font-mono mt-0.5">
              Paillier Homomorphic Encryption · c = gᵐ · rⁿ mod n²
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <button
              onClick={() => setShowFullCiphertext(!showFullCiphertext)}
              className="text-[#A6A3A5] hover:text-[#F5F5F5] underline"
            >
              {showFullCiphertext ? 'Collapse' : 'Expand'}
            </button>
            <button
              onClick={handleCopyCiphertext}
              disabled={!generatedCiphertext}
              className="px-2.5 py-1 rounded bg-[#202020] text-[#A6A3A5] hover:text-[#F5F5F5] border border-[#353535] flex items-center space-x-1.5 transition-colors"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Selected Plaintext & Ciphertext Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-[#202020] p-3.5 rounded border border-[#353535]">
            <span className="text-[#777477] block text-[10px] uppercase tracking-wider mb-1">Selected Candidate</span>
            <span className="text-[#F5F5F5] font-semibold block">{selectedCandidate?.name}</span>
          </div>

          <div className="bg-[#202020] p-3.5 rounded border border-[#353535]">
            <span className="text-[#777477] block text-[10px] uppercase tracking-wider mb-1">Plaintext Message (m)</span>
            <span className="text-[#F5F5F5] font-semibold block">
              {selectedCandidate
                ? (encodingMode === 'radix'
                    ? encodeCandidateVoteRadix(selectedCandidate.id).toString()
                    : encodeCandidateVoteSimple(selectedCandidate.id).toString())
                : '0'}
            </span>
          </div>

          <div className="bg-[#202020] p-3.5 rounded border border-[#353535]">
            <span className="text-[#777477] block text-[10px] uppercase tracking-wider mb-1">Paillier Modulus (n)</span>
            <span className="text-[#A6A3A5] truncate block">
              {publicKey ? truncateCiphertext(publicKey.n.toString(), 14) : 'Not published'}
            </span>
          </div>
        </div>

        {/* Sealed Ciphertext Preview */}
        <div className="bg-[#111111] p-3.5 rounded border border-[#353535] font-mono text-xs text-[#A6A3A5] break-all max-h-28 overflow-y-auto">
          {generatedCiphertext ? (
            showFullCiphertext ? generatedCiphertext : truncateCiphertext(generatedCiphertext, 56)
          ) : (
            <span className="text-[#777477] italic">Waiting for Paillier public key synchronization...</span>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded bg-[#202020] border border-[#D9225C]/50 text-[#D9225C] text-xs font-mono">
            {errorMsg}
          </div>
        )}

        {/* Transaction Hash Confirmation */}
        {txHash && (
          <div className="p-3.5 rounded bg-[#202020] border border-[#353535] text-xs font-mono space-y-1">
            <span className="text-[#F5F5F5] font-bold block">Transaction Confirmed on Ethereum</span>
            <span className="text-[#777477] break-all block">Tx: {txHash}</span>
          </div>
        )}

        {/* Primary Action Button: Hot Pink */}
        <button
          onClick={handleCastVote}
          disabled={!canVote || isSubmitting || !generatedCiphertext}
          className={`w-full py-4 rounded font-bold text-sm tracking-wide uppercase transition-colors ${
            canVote && !isSubmitting && generatedCiphertext
              ? 'bg-[#D9225C] hover:bg-[#BA1B4E] text-white shadow-sm'
              : 'bg-[#202020] text-[#777477] border border-[#353535] cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Broadcasting Encrypted Ballot...</span>
            </span>
          ) : hasVoted ? (
            'Ballot Already Recorded'
          ) : !isWhitelisted ? (
            'Address Not Whitelisted'
          ) : !isElectionOpen ? (
            'Election Closed'
          ) : (
            `Cast Encrypted Ballot for ${selectedCandidate?.name}`
          )}
        </button>
      </section>
    </div>
  );
}
