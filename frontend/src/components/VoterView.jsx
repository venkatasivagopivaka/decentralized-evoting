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
      {/* 1. Clear Election Header & Reassuring Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#D2D2C9] pb-6 gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#A48B70]">
            Official Ballot
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#30362F] tracking-tight mt-1">
            Ballot Submission
          </h1>
          <p className="text-xs text-[#6F746B] mt-1">
            Cast an end-to-end confidential ballot using Paillier additively homomorphic encryption.
          </p>
        </div>

        {/* Minimal Typographic Status Indicators */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[#6F746B] bg-[#F4F3EE] px-3.5 py-2 rounded-lg border border-[#D2D2C9]">
          <div className="flex items-center space-x-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isElectionOpen ? 'bg-[#536A55]' : 'bg-[#93958C]'}`} />
            <span>Window: <strong className="text-[#30362F] font-semibold">{isElectionOpen ? 'Open' : 'Closed'}</strong></span>
          </div>
          <span className="text-[#D2D2C9]">|</span>
          <div>
            Eligibility: <strong className={isWhitelisted ? 'text-[#536A55] font-semibold' : 'text-[#A87565] font-semibold'}>{isWhitelisted ? 'Whitelisted' : 'Not Registered'}</strong>
          </div>
          <span className="text-[#D2D2C9]">|</span>
          <div>
            Status: <strong className={hasVoted ? 'text-[#536A55] font-semibold' : 'text-[#30362F] font-semibold'}>{hasVoted ? 'Recorded' : 'Pending'}</strong>
          </div>
        </div>
      </div>

      {/* Notifications: Not Whitelisted / Already Voted */}
      {!isWhitelisted && account && (
        <div className="p-4 rounded-lg bg-[#F7EFEB] border border-[#DEC2B9] text-xs text-[#A87565] flex items-center justify-between">
          <span>Your connected address ({truncateAddress(account)}) is not currently whitelisted. Request authorization from the election administrator.</span>
        </div>
      )}

      {hasVoted && (
        <div className="p-4 rounded-lg bg-[#E8F0EA] border border-[#C3D1C0] text-xs text-[#457354] flex items-center justify-between">
          <span>
            <strong className="font-semibold mr-2">BALLOT CONFIRMED:</strong>
            Your encrypted vote has been sealed on the Ethereum blockchain. Double voting is cryptographically prevented.
          </span>
        </div>
      )}

      {/* 2. Candidate Selection Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#6F746B]">
            Certified Candidates
          </h2>

          {/* Compact Scheme Selector */}
          <div className="flex items-center space-x-1 bg-[#DEDED5] p-1 rounded-lg border border-[#D2D2C9]/60 text-xs font-mono">
            <button
              onClick={() => setEncodingMode('radix')}
              className={`px-3 py-1 rounded-md transition-colors ${
                encodingMode === 'radix'
                  ? 'bg-[#F8F7F2] text-[#30362F] font-semibold shadow-sm border border-[#D2D2C9]'
                  : 'text-[#6F746B] hover:text-[#30362F]'
              }`}
            >
              Radix Base-10,000
            </button>
            <button
              onClick={() => setEncodingMode('simple')}
              className={`px-3 py-1 rounded-md transition-colors ${
                encodingMode === 'simple'
                  ? 'bg-[#F8F7F2] text-[#30362F] font-semibold shadow-sm border border-[#D2D2C9]'
                  : 'text-[#6F746B] hover:text-[#30362F]'
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
      <section className="bg-[#F4F3EE] rounded-xl p-6 sm:p-7 border border-[#D2D2C9] space-y-5">
        <div className="flex items-center justify-between border-b border-[#D2D2C9] pb-4">
          <div>
            <h3 className="text-sm font-semibold text-[#30362F] tracking-tight">
              Cryptographic Ballot Seal
            </h3>
            <p className="text-xs text-[#6F746B] font-mono mt-0.5">
              Paillier Homomorphic Encryption · c = gᵐ · rⁿ mod n²
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <button
              onClick={() => setShowFullCiphertext(!showFullCiphertext)}
              className="text-[#6F746B] hover:text-[#30362F] underline"
            >
              {showFullCiphertext ? 'Collapse' : 'Expand'}
            </button>
            <button
              onClick={handleCopyCiphertext}
              disabled={!generatedCiphertext}
              className="px-2.5 py-1 rounded-md bg-[#F8F7F2] text-[#30362F] hover:bg-[#DEDED5] border border-[#D2D2C9] flex items-center space-x-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-[#A48B70]" />
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Selected Plaintext & Ciphertext Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-[#F8F7F2] p-3.5 rounded-lg border border-[#D2D2C9]">
            <span className="text-[#93958C] block text-[10px] uppercase tracking-wider mb-1">Selected Candidate</span>
            <span className="text-[#30362F] font-semibold block">{selectedCandidate?.name}</span>
          </div>

          <div className="bg-[#F8F7F2] p-3.5 rounded-lg border border-[#D2D2C9]">
            <span className="text-[#93958C] block text-[10px] uppercase tracking-wider mb-1">Plaintext Message (m)</span>
            <span className="text-[#536A55] font-semibold block">
              {selectedCandidate
                ? (encodingMode === 'radix'
                    ? encodeCandidateVoteRadix(selectedCandidate.id).toString()
                    : encodeCandidateVoteSimple(selectedCandidate.id).toString())
                : '0'}
            </span>
          </div>

          <div className="bg-[#F8F7F2] p-3.5 rounded-lg border border-[#D2D2C9]">
            <span className="text-[#93958C] block text-[10px] uppercase tracking-wider mb-1">Paillier Modulus (n)</span>
            <span className="text-[#6F746B] truncate block">
              {publicKey ? truncateCiphertext(publicKey.n.toString(), 14) : 'Not published'}
            </span>
          </div>
        </div>

        {/* Sealed Ciphertext Preview */}
        <div className="bg-[#E9E8E2] p-3.5 rounded-lg border border-[#D2D2C9] font-mono text-xs text-[#30362F] break-all max-h-28 overflow-y-auto">
          {generatedCiphertext ? (
            showFullCiphertext ? generatedCiphertext : truncateCiphertext(generatedCiphertext, 56)
          ) : (
            <span className="text-[#93958C] italic">Awaiting Paillier public key synchronization from Ethereum...</span>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-[#F7EFEB] border border-[#DEC2B9] text-[#A87565] text-xs font-mono">
            {errorMsg}
          </div>
        )}

        {/* Transaction Hash Confirmation */}
        {txHash && (
          <div className="p-3.5 rounded-lg bg-[#E8F0EA] border border-[#C3D1C0] text-xs font-mono space-y-1">
            <span className="text-[#457354] font-semibold block">Transaction Confirmed on Ethereum</span>
            <span className="text-[#6F746B] break-all block">Tx: {txHash}</span>
          </div>
        )}

        {/* Primary Action Button: Olive */}
        <button
          onClick={handleCastVote}
          disabled={!canVote || isSubmitting || !generatedCiphertext}
          className={`min-h-[48px] w-full rounded-lg font-medium text-sm transition-all duration-150 flex items-center justify-center space-x-2 ${
            canVote && !isSubmitting && generatedCiphertext
              ? 'bg-[#536A55] hover:bg-[#465B48] active:scale-[0.99] text-[#F8F7F2] shadow-sm'
              : 'bg-[#DEDED5] text-[#93958C] border border-[#D2D2C9] cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#F8F7F2]" />
              <span>Broadcasting Encrypted Ballot to Network...</span>
            </span>
          ) : hasVoted ? (
            'Ballot Already Recorded'
          ) : !isWhitelisted ? (
            'Address Not Whitelisted'
          ) : !isElectionOpen ? (
            'Voting Window Closed'
          ) : (
            `Cast Encrypted Ballot for ${selectedCandidate?.name}`
          )}
        </button>
      </section>
    </div>
  );
}
