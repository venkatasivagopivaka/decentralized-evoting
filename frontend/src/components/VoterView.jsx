import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { CandidateCard } from './CandidateCard';
import { CANDIDATES } from '../utils/constants';
import {
  encodeCandidateVoteRadix,
  encryptVote,
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
  const [generatedCiphertext, setGeneratedCiphertext] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Live encryption preview whenever candidate or publicKey changes
  useEffect(() => {
    if (!publicKey || !selectedCandidate) {
      setGeneratedCiphertext('');
      return;
    }
    try {
      setIsEncrypting(true);
      const plaintext = encodeCandidateVoteRadix(selectedCandidate.id);
      const ciphertext = encryptVote(publicKey, plaintext);
      setGeneratedCiphertext(ciphertext.toString());
      setErrorMsg('');
    } catch (err) {
      console.error('Encryption failed:', err);
      setErrorMsg('Failed to encrypt ballot: ' + err.message);
    } finally {
      setIsEncrypting(false);
    }
  }, [publicKey, selectedCandidate]);

  const handleCastVote = async () => {
    if (!contract || !account) {
      setErrorMsg('Please connect your wallet first.');
      return;
    }
    if (!isWhitelisted) {
      setErrorMsg('Your address is not whitelisted by the administrator.');
      return;
    }
    if (hasVoted) {
      setErrorMsg('You have already cast your ballot.');
      return;
    }
    if (!isElectionOpen) {
      setErrorMsg('The election is currently closed.');
      return;
    }
    if (!publicKey) {
      setErrorMsg('The administrator has not yet published the encryption key.');
      return;
    }
    if (!generatedCiphertext) {
      setErrorMsg('No encrypted ballot generated.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const tx = await contract.castVote(generatedCiphertext);
      setTxHash(tx.hash);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        if (onVoteCastSuccess) onVoteCastSuccess(receipt);
      } else {
        throw new Error('Transaction was reverted by the EVM.');
      }
    } catch (err) {
      console.error('Vote submission error:', err);
      setErrorMsg(err?.reason || err?.message || 'Failed to submit vote.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canVote = isWhitelisted && !hasVoted && isElectionOpen && Boolean(publicKey);

  // Determine the disabled button label
  const buttonLabel = isSubmitting
    ? null
    : hasVoted
    ? 'Ballot Recorded'
    : !account
    ? 'Connect Wallet to Vote'
    : !isWhitelisted
    ? 'Address Not Whitelisted'
    : !isElectionOpen
    ? 'Voting Window Closed'
    : !publicKey
    ? 'Awaiting Encryption Key'
    : `Cast Vote for ${selectedCandidate?.name}`;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#30362F] tracking-tight">Cast Your Vote</h1>
        <p className="text-sm text-[#6F746B] mt-1">
          Select a candidate and submit your encrypted ballot to the blockchain.
        </p>
      </div>

      {/* Eligibility notices */}
      {!isWhitelisted && account && (
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-[#F7EFEB] border border-[#DEC2B9] text-xs text-[#A87565]">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong className="font-semibold">{truncateAddress(account)}</strong> is not registered to vote. Contact the election administrator.
          </span>
        </div>
      )}

      {hasVoted && (
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-[#E8F0EA] border border-[#C3D1C0] text-xs text-[#457354]">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong className="font-semibold">Ballot confirmed.</strong> Your encrypted vote is sealed on the Ethereum blockchain.
          </span>
        </div>
      )}

      {/* Candidate selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CANDIDATES.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            isSelected={selectedCandidate?.id === candidate.id}
            onSelect={setSelectedCandidate}
            disabled={!canVote}
          />
        ))}
      </div>

      {/* Encrypted ballot preview — only shown when a key is available */}
      {publicKey && !hasVoted && (
        <div className="bg-[#F4F3EE] border border-[#D2D2C9] rounded-xl p-5 space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#93958C]">
            Encrypted Ballot Preview
          </span>
          <div className="bg-[#E9E8E2] rounded-lg px-4 py-3 font-mono text-xs text-[#30362F] break-all leading-relaxed">
            {isEncrypting
              ? 'Encrypting…'
              : generatedCiphertext
              ? truncateCiphertext(generatedCiphertext, 72)
              : 'No ciphertext generated'}
          </div>
          <p className="text-[11px] text-[#93958C]">
            Each ballot generates a unique ciphertext using a fresh random salt — your selection is never revealed on-chain.
          </p>
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-[#F7EFEB] border border-[#DEC2B9] text-[#A87565] text-xs font-mono">
          {errorMsg}
        </div>
      )}

      {/* Transaction confirmation */}
      {txHash && (
        <div className="p-3.5 rounded-lg bg-[#E8F0EA] border border-[#C3D1C0] text-xs font-mono space-y-1">
          <span className="text-[#457354] font-semibold block">Transaction confirmed on Ethereum</span>
          <span className="text-[#6F746B] break-all block">Tx: {txHash}</span>
        </div>
      )}

      {/* Cast vote button */}
      <button
        onClick={handleCastVote}
        disabled={!canVote || isSubmitting || !generatedCiphertext}
        className={`w-full min-h-[48px] rounded-lg font-medium text-sm transition-all duration-150 flex items-center justify-center space-x-2 ${
          canVote && !isSubmitting && generatedCiphertext
            ? 'bg-[#536A55] hover:bg-[#465B48] active:scale-[0.99] text-[#F8F7F2] shadow-sm'
            : 'bg-[#DEDED5] text-[#93958C] border border-[#D2D2C9] cursor-not-allowed'
        }`}
      >
        {isSubmitting ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Submitting to Blockchain…</span>
          </>
        ) : (
          <span>{buttonLabel}</span>
        )}
      </button>
    </div>
  );
}
