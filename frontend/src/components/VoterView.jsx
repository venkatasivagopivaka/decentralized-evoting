import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, Copy, Lock } from 'lucide-react';
import { CandidateCard } from './CandidateCard';
import { CANDIDATES } from '../utils/constants';
import {
  encodeCandidateVoteRadix,
  encryptVote,
} from '../utils/crypto';
import {
  truncateAddress,
  truncateCiphertext,
  sendContractTransaction,
  formatContractError,
} from '../utils/contract';

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
  const [copied, setCopied] = useState(false);

  // Compute live encryption preview whenever candidate or publicKey changes
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
      setErrorMsg('Please connect your Web3 wallet first.');
      return;
    }
    if (!isWhitelisted) {
      setErrorMsg('Your address is not whitelisted by the election administrator.');
      return;
    }
    if (hasVoted) {
      setErrorMsg('You have already cast your ballot. Double voting is prevented on-chain.');
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

      // Send transaction with authoritative on-chain nonce via sendContractTransaction
      const tx = await sendContractTransaction(contract, 'castVote', [generatedCiphertext]);
      setTxHash(tx.hash);

      const receipt = await tx.wait();
      if (receipt.status === 1) {
        if (onVoteCastSuccess) onVoteCastSuccess(receipt);
      } else {
        throw new Error('Transaction was reverted by the EVM.');
      }
    } catch (err) {
      console.error('Vote submission error:', err);
      setErrorMsg(formatContractError(err));
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

  // Determine button state label
  const buttonLabel = isSubmitting
    ? null
    : hasVoted
    ? 'Ballot Already Recorded'
    : !account
    ? 'Connect Wallet to Vote'
    : !isWhitelisted
    ? 'Address Not Whitelisted'
    : !isElectionOpen
    ? 'Voting Window Closed'
    : !publicKey
    ? 'Awaiting Encryption Key'
    : `Cast Encrypted Ballot for ${selectedCandidate?.name}`;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-7">
      {/* Editorial Header */}
      <div className="border-b border-[#CCCBC1] pb-5">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#A77D60]">
          Official Ballot
        </span>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#292E2A] tracking-tight mt-1">
          Cast Your Encrypted Ballot
        </h1>
        <p className="text-xs text-[#70736C] mt-1 max-w-2xl leading-relaxed">
          Select a candidate below. Your vote is sealed locally using Paillier homomorphic encryption before submission to Ethereum, ensuring individual confidentiality.
        </p>
      </div>

      {/* Eligibility / Status Notices */}
      {!isWhitelisted && account && (
        <div className="flex items-start space-x-3 p-4 rounded-md bg-[#F4EEE8] border border-[#DFCEBF] text-xs text-[#A77D60]">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#A77D60]" />
          <span>
            <strong className="font-semibold">{truncateAddress(account)}</strong> is not currently registered on the voter whitelist. Request access from the election administrator.
          </span>
        </div>
      )}

      {hasVoted && (
        <div className="flex items-start space-x-3 p-4 rounded-md bg-[#E0E8DF] border border-[#BDCEBC] text-xs text-[#425B49]">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#425B49]" />
          <span>
            <strong className="font-semibold">Ballot confirmed:</strong> Your encrypted vote has been sealed on Ethereum. Double voting is strictly prevented.
          </span>
        </div>
      )}

      {/* Candidate Selection Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#70736C]">
            Certified Candidates
          </h2>
          <span className="text-[11px] font-mono text-[#70736C]">
            {CANDIDATES.length} choices available
          </span>
        </div>

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
      </section>

      {/* Cryptographic Seal & Ciphertext Preview */}
      {publicKey && !hasVoted && (
        <section className="bg-[#E8E6DE] border border-[#CCCBC1] rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Lock className="w-3.5 h-3.5 text-[#425B49]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#292E2A] font-medium">
                Encrypted Ballot Payload
              </span>
            </div>
            <button
              onClick={handleCopyCiphertext}
              disabled={!generatedCiphertext}
              className="text-[11px] font-mono text-[#70736C] hover:text-[#292E2A] flex items-center space-x-1 transition-colors"
            >
              <Copy className="w-3 h-3 text-[#A77D60]" />
              <span>{copied ? 'Copied' : 'Copy Payload'}</span>
            </button>
          </div>

          <div className="bg-[#F8F7F3] rounded border border-[#CCCBC1] px-3.5 py-2.5 font-mono text-xs text-[#292E2A] break-all leading-relaxed">
            {isEncrypting
              ? 'Encrypting ballot with Paillier public key…'
              : generatedCiphertext
              ? truncateCiphertext(generatedCiphertext, 68)
              : 'Awaiting encryption key from smart contract…'}
          </div>

          <p className="text-[11px] text-[#70736C] leading-relaxed">
            Blinded by random salt <code className="font-mono text-[#292E2A]">r ∈ ℤ*ₙ</code>. The smart contract tallies encrypted values homomorphically without ever revealing your personal selection.
          </p>
        </section>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-md bg-[#F4EEE8] border border-[#DFCEBF] text-[#A77D60] text-xs font-mono">
          {errorMsg}
        </div>
      )}

      {/* Transaction Confirmation Banner */}
      {txHash && (
        <div className="p-4 rounded-md bg-[#E0E8DF] border border-[#BDCEBC] text-xs font-mono space-y-1">
          <div className="text-[#425B49] font-semibold flex items-center space-x-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-[#425B49]" />
            <span>Transaction Confirmed on Ethereum</span>
          </div>
          <span className="text-[#70736C] break-all block">Tx: {txHash}</span>
        </div>
      )}

      {/* Primary Cast Vote Action Button */}
      <button
        onClick={handleCastVote}
        disabled={!canVote || isSubmitting || !generatedCiphertext}
        className={`w-full min-h-[46px] rounded-md font-medium text-xs transition-all duration-180 flex items-center justify-center space-x-2 ${
          canVote && !isSubmitting && generatedCiphertext
            ? 'bg-[#425B49] hover:bg-[#354B3C] active:scale-[0.99] text-[#F1EFE8] shadow-subtle'
            : 'bg-[#DCDAD1] text-[#70736C] border border-[#CCCBC1] cursor-not-allowed'
        }`}
      >
        {isSubmitting ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-[#F1EFE8]" />
            <span>Broadcasting Encrypted Ballot to Ethereum…</span>
          </>
        ) : (
          <span>{buttonLabel}</span>
        )}
      </button>
    </div>
  );
}
