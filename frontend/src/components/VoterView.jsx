import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, Copy, Lock, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';
import { CandidateCard } from './CandidateCard';
import { CANDIDATES } from '../utils/constants';
import {
  encodeCandidateVoteRadix,
  encryptVote,
} from '../utils/crypto';
import {
  truncateAddress,
  truncateCiphertext,
  executeContractTransaction,
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
  const [copied, setCopied] = useState(false);

  // Structured transaction lifecycle state
  const [txStatus, setTxStatus] = useState({
    stage: 'idle', // 'idle' | 'submitting' | 'waiting' | 'confirmed' | 'failed'
    message: '',
    txHash: null,
    error: null,
  });

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
      if (txStatus.stage === 'failed') {
        setTxStatus({ stage: 'idle', message: '', txHash: null, error: null });
      }
    } catch (err) {
      console.error('Encryption failed:', err);
      setTxStatus({
        stage: 'failed',
        message: 'Failed to encrypt ballot: ' + err.message,
        error: err.message,
        txHash: null,
      });
    } finally {
      setIsEncrypting(false);
    }
  }, [publicKey, selectedCandidate]);

  const handleCastVote = async () => {
    if (!contract || !account) {
      setTxStatus({
        stage: 'failed',
        message: 'Please connect your Web3 wallet first.',
        error: 'Wallet not connected.',
        txHash: null,
      });
      return;
    }
    if (!isWhitelisted) {
      setTxStatus({
        stage: 'failed',
        message: 'Your address is not whitelisted by the election administrator.',
        error: 'Address not whitelisted.',
        txHash: null,
      });
      return;
    }
    if (hasVoted) {
      setTxStatus({
        stage: 'failed',
        message: 'You have already cast your ballot. Double voting is strictly prevented on-chain.',
        error: 'Already voted.',
        txHash: null,
      });
      return;
    }
    if (!isElectionOpen) {
      setTxStatus({
        stage: 'failed',
        message: 'The election is currently closed.',
        error: 'Election closed.',
        txHash: null,
      });
      return;
    }
    if (!publicKey) {
      setTxStatus({
        stage: 'failed',
        message: 'The administrator has not yet published the Paillier encryption key.',
        error: 'Missing public key.',
        txHash: null,
      });
      return;
    }
    if (!generatedCiphertext) {
      setTxStatus({
        stage: 'failed',
        message: 'No encrypted ballot generated.',
        error: 'Empty ciphertext.',
        txHash: null,
      });
      return;
    }

    try {
      // Execute transaction with rigorous 6-stage lifecycle and on-chain confirmation verification
      await executeContractTransaction(contract, 'castVote', [generatedCiphertext], {
        onStageChange: (status) => {
          setTxStatus(status);
        },
        verifyOnChain: async () => {
          const [, voted] = await contract.getVoterStatus(account);
          if (!voted) {
            throw new Error('On-chain verification failed: Smart contract did not record ballot.');
          }
        },
      });

      if (onVoteCastSuccess) {
        onVoteCastSuccess();
      }
    } catch (err) {
      console.error('Vote casting execution failed:', err);
    }
  };

  const handleCopyCiphertext = () => {
    if (!generatedCiphertext) return;
    navigator.clipboard.writeText(generatedCiphertext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBusy = txStatus.stage === 'submitting' || txStatus.stage === 'waiting';
  const canVote = isWhitelisted && !hasVoted && isElectionOpen && Boolean(publicKey) && !isBusy;

  // Button Label logic
  const buttonLabel = isBusy
    ? txStatus.stage === 'submitting'
      ? 'Awaiting Wallet Approval…'
      : 'Waiting for Block Confirmation…'
    : hasVoted
    ? 'Ballot Verified & Sealed On-Chain'
    : !account
    ? 'Connect Wallet to Vote'
    : !isWhitelisted
    ? 'Address Not Whitelisted'
    : !isElectionOpen
    ? 'Voting Window Closed'
    : !publicKey
    ? 'Awaiting Encryption Key'
    : `Cast Ballot for ${selectedCandidate?.name}`;

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-16 py-10 sm:py-16">
      
      {/* Section Header: Bold Editorial Typography on Soft Ivory */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#08090B]/15 gap-6">
        <div>
          <div className="flex items-center space-x-2.5 text-[11px] font-mono tracking-widest text-[#08090B]/70 uppercase mb-2">
            <span className="w-2 h-2 rounded-[2px] bg-[#C6FF00]" />
            <span>OFFICIAL BALLOT // 2026 GENERAL ELECTION</span>
          </div>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#08090B] tracking-tighter uppercase leading-none">
            Elect Your Representative<span className="text-[#C6FF00]">.</span>
          </h2>
        </div>
        <p className="text-sm sm:text-base text-[#525765] max-w-md leading-relaxed">
          Select a candidate below. Your vote is sealed locally with Paillier homomorphic encryption before submission to Ethereum, ensuring mathematical secrecy.
        </p>
      </div>

      {/* Main Expansive Composition: Left Candidate Gallery (8 cols), Right Sticky Verification Console (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 pt-10 items-start">
        
        {/* Left Column: Monumental Candidate Gallery (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#525765]">
              CERTIFIED CANDIDATES // {CANDIDATES.length} CHOICES AVAILABLE
            </span>
            <span className="text-xs font-mono text-[#08090B] font-bold">
              CLICK TO CHOOSE
            </span>
          </div>

          <div className="space-y-6">
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
        </div>

        {/* Right Column: Sticky Verification Console & Action Button (4 cols) */}
        <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
          
          {/* Selected Candidate Summary Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#08090B] border border-[#1F232B] text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C6FF00] font-bold">
                ACTIVE SELECTION
              </span>
              <span className="text-xs font-mono text-[#8B909D]">
                CANDIDATE {selectedCandidate?.number || `0${selectedCandidate?.id + 1}`}
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                {selectedCandidate?.name}
              </h4>
              <p className="text-xs font-mono text-[#C6FF00] uppercase">
                {selectedCandidate?.role}
              </p>
            </div>

            {/* Eligibility Banner */}
            <div className="pt-2">
              {!account ? (
                <div className="p-4 rounded-2xl bg-[#08090B] border border-[#232730] space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B909D] block font-bold">
                    Wallet Required
                  </span>
                  <p className="text-xs text-[#8B909D]">
                    Connect your wallet using the top bar to verify whitelist eligibility.
                  </p>
                </div>
              ) : !isWhitelisted ? (
                <div className="p-4 rounded-2xl bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 space-y-1 text-[#FF5C5C]">
                  <div className="flex items-center space-x-1.5 font-mono text-xs font-bold uppercase">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Not Whitelisted</span>
                  </div>
                  <p className="text-xs text-white/90">
                    <strong className="font-mono text-[#C6FF00]">{truncateAddress(account)}</strong> is not authorized to vote.
                  </p>
                </div>
              ) : hasVoted ? (
                <div className="p-4 rounded-2xl bg-[#C6FF00]/10 border border-[#C6FF00]/30 space-y-1 text-[#C6FF00]">
                  <div className="flex items-center space-x-1.5 font-mono text-xs font-bold uppercase">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Ballot Sealed</span>
                  </div>
                  <p className="text-xs text-white/90">
                    Your encrypted vote is permanently verified on Ethereum.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#08090B] border border-[#232730] space-y-1">
                  <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[#C6FF00] uppercase font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C6FF00]" />
                    <span>ELIGIBILITY VERIFIED</span>
                  </div>
                  <p className="text-xs text-[#8B909D]">
                    Authorized address: <span className="font-mono text-white">{truncateAddress(account)}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Cryptographic Seal & Ciphertext Inspection */}
            {publicKey && !hasVoted && (
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#C6FF00]" />
                    <span className="text-xs font-mono uppercase tracking-wider text-white font-bold">
                      Paillier Ciphertext
                    </span>
                  </div>
                  <button
                    onClick={handleCopyCiphertext}
                    disabled={!generatedCiphertext}
                    className="text-[11px] font-mono text-[#8B909D] hover:text-[#C6FF00] flex items-center space-x-1 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="bg-[#08090B] rounded-xl border border-[#232730] p-3 font-mono text-xs text-[#C6FF00] break-all leading-relaxed max-h-28 overflow-y-auto">
                  {isEncrypting
                    ? 'Encrypting ballot locally…'
                    : generatedCiphertext
                    ? truncateCiphertext(generatedCiphertext, 44)
                    : 'Awaiting encryption key…'}
                </div>

                <p className="text-[10px] text-[#8B909D] leading-relaxed">
                  Blinded with salt <code className="font-mono text-[#C6FF00]">r ∈ ℤ*ₙ</code>. Ciphertext is tallied homomorphically on-chain.
                </p>
              </div>
            )}

            {/* 4-Stage Transaction Feedback */}
            {txStatus.stage === 'submitting' && (
              <div className="p-4 rounded-2xl bg-[#08090B] border border-[#232730] text-xs font-mono space-y-1 text-white">
                <div className="flex items-center space-x-2 text-[#C6FF00] font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Awaiting Wallet Signature…</span>
                </div>
                <p className="text-[#8B909D] text-[11px]">Confirm the transaction in MetaMask.</p>
              </div>
            )}

            {txStatus.stage === 'waiting' && (
              <div className="p-4 rounded-2xl bg-[#08090B] border border-[#C6FF00]/40 text-xs font-mono space-y-1 text-white">
                <div className="flex items-center space-x-2 text-[#C6FF00] font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Mining On-Chain Block…</span>
                </div>
                <div className="text-[#8B909D] break-all text-[10px]">
                  Tx: <code className="text-[#C6FF00]">{txStatus.txHash}</code>
                </div>
              </div>
            )}

            {txStatus.stage === 'confirmed' && (
              <div className="p-4 rounded-2xl bg-[#C6FF00]/10 border border-[#C6FF00]/40 text-xs font-mono space-y-1 text-[#C6FF00]">
                <div className="font-bold flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-[#C6FF00]" />
                  <span>Ballot Confirmed On Ethereum</span>
                </div>
                <span className="text-[#8B909D] break-all block text-[10px]">Tx: {txStatus.txHash}</span>
              </div>
            )}

            {txStatus.stage === 'failed' && (
              <div className="p-4 rounded-2xl bg-[#FF5C5C]/10 border border-[#FF5C5C]/40 text-xs font-mono space-y-1 text-[#FF5C5C]">
                <div className="font-bold flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#FF5C5C]" />
                  <span>Transaction Failed</span>
                </div>
                <p className="text-white text-[11px]">{txStatus.error || txStatus.message}</p>
              </div>
            )}

            {/* Primary Action Button (Neon Lime paired with Midnight Black text) */}
            <button
              onClick={handleCastVote}
              disabled={!canVote}
              className={`w-full btn-pill-lime group !min-h-[54px] !text-xs sm:!text-sm ${
                !canVote ? '!opacity-35 !cursor-not-allowed !shadow-none' : ''
              }`}
            >
              {isBusy ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#08090B]" />
                  <span>{buttonLabel}</span>
                </>
              ) : (
                <>
                  <span>{buttonLabel}</span>
                  {canVote && <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />}
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
export default VoterView;
