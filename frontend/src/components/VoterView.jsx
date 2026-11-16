import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, Copy, Lock, ShieldAlert, ArrowRight } from 'lucide-react';
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
    <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-16">
      
      {/* Section Header: Bold Editorial Typography */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-10 border-b border-[#232730] gap-6">
        <div>
          <div className="flex items-center space-x-2.5 text-[11px] font-mono tracking-widest text-[#FFD426] uppercase mb-2">
            <span className="w-2 h-2 rounded-[2px] bg-[#FFD426]" />
            <span>OFFICIAL BALLOT // 2026 GENERAL ELECTION</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase leading-none">
            Elect Your Representative<span className="text-[#FFD426]">.</span>
          </h2>
        </div>
        <p className="text-sm sm:text-base text-[#8B909D] max-w-md leading-relaxed">
          Ballots are sealed in the browser with Paillier homomorphic encryption. Individual choices are never visible to miners or administrators.
        </p>
      </div>

      {/* Main Expansive Composition: Left Control & Ciphertext Stream, Right Candidate Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 pt-10">
        
        {/* Left Column: Ballot Actions & Cryptographic Payload (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Eligibility Banner */}
          {!account ? (
            <div className="p-6 rounded-2xl bg-[#0F1115] border border-[#232730] space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B909D] block">
                AUTHENTICATION
              </span>
              <h4 className="text-lg font-bold text-white">Wallet Connection Required</h4>
              <p className="text-xs text-[#8B909D] leading-relaxed">
                Connect your Ethereum wallet using the header button to verify voter whitelisting and sign your encrypted ballot.
              </p>
            </div>
          ) : !isWhitelisted ? (
            <div className="p-6 rounded-2xl bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 space-y-2 text-[#FF5C5C]">
              <div className="flex items-center space-x-2 font-mono text-xs font-bold uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Non-Whitelisted Address</span>
              </div>
              <p className="text-xs text-white/90 leading-relaxed">
                <strong className="font-mono text-[#FFD426]">{truncateAddress(account)}</strong> is not registered. Contact the election administrator to obtain voter credentials.
              </p>
            </div>
          ) : hasVoted ? (
            <div className="p-6 rounded-2xl bg-[#FFD426]/10 border border-[#FFD426]/30 space-y-2 text-[#FFD426]">
              <div className="flex items-center space-x-2 font-mono text-xs font-bold uppercase tracking-wider">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Ballot Sealed On Ethereum</span>
              </div>
              <p className="text-xs text-white/90 leading-relaxed">
                Your encrypted vote has been verified and permanently recorded on the blockchain. Double-voting is strictly prevented.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#0F1115] border border-[#232730] space-y-2">
              <div className="flex items-center space-x-2 text-[10px] font-mono text-[#FFD426] uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-[#FFD426] animate-pulse" />
                <span>CREDENTIALS VERIFIED</span>
              </div>
              <p className="text-xs text-[#8B909D]">
                Connected as <span className="font-mono text-white font-semibold">{truncateAddress(account)}</span>. Authorized to cast one encrypted ballot.
              </p>
            </div>
          )}

          {/* Cryptographic Seal & Ciphertext Inspection */}
          {publicKey && !hasVoted && (
            <div className="p-6 sm:p-7 rounded-2xl bg-[#0F1115] border border-[#232730] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-[#FFD426]" />
                  <span className="text-xs font-mono uppercase tracking-wider text-white font-bold">
                    Homomorphic Ciphertext
                  </span>
                </div>
                <button
                  onClick={handleCopyCiphertext}
                  disabled={!generatedCiphertext}
                  className="text-[11px] font-mono text-[#8B909D] hover:text-[#FFD426] flex items-center space-x-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="bg-[#08090B] rounded-xl border border-[#232730] p-4 font-mono text-xs text-[#FFD426] break-all leading-relaxed max-h-36 overflow-y-auto">
                {isEncrypting
                  ? 'Generating fresh Paillier encryption…'
                  : generatedCiphertext
                  ? truncateCiphertext(generatedCiphertext, 92)
                  : 'Awaiting encryption key…'}
              </div>

              <p className="text-[11px] text-[#8B909D] leading-relaxed">
                Formula: <code className="font-mono text-[#FFD426]">c = g^m · r^n mod n²</code>. Salt <code className="font-mono text-[#FFD426]">r</code> is randomized per ballot, rendering identical votes mathematically indistinguishable.
              </p>
            </div>
          )}

          {/* 4-Stage Explicit Transaction Lifecycle Feedback */}
          {txStatus.stage === 'submitting' && (
            <div className="p-5 rounded-2xl bg-[#0F1115] border border-[#232730] text-xs font-mono space-y-1 text-white">
              <div className="flex items-center space-x-2 text-[#FFD426] font-bold">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Awaiting Wallet Signature…</span>
              </div>
              <p className="text-[#8B909D]">Please confirm the ballot submission in MetaMask.</p>
            </div>
          )}

          {txStatus.stage === 'waiting' && (
            <div className="p-5 rounded-2xl bg-[#0F1115] border border-[#FFD426]/40 text-xs font-mono space-y-2 text-white">
              <div className="flex items-center space-x-2 text-[#FFD426] font-bold">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Mining On-Chain Block…</span>
              </div>
              <div className="text-[#8B909D] break-all text-[11px]">
                Tx Hash: <code className="text-[#FFD426] font-semibold">{txStatus.txHash}</code>
              </div>
              <p className="text-[11px] text-[#8B909D]">Awaiting mined block confirmation with status 1.</p>
            </div>
          )}

          {txStatus.stage === 'confirmed' && (
            <div className="p-5 rounded-2xl bg-[#FFD426]/10 border border-[#FFD426]/40 text-xs font-mono space-y-1.5 text-[#FFD426]">
              <div className="font-bold flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-[#FFD426]" />
                <span>Ballot Successfully Confirmed on Ethereum</span>
              </div>
              <span className="text-[#8B909D] break-all block text-[11px]">Tx: {txStatus.txHash}</span>
            </div>
          )}

          {txStatus.stage === 'failed' && (
            <div className="p-5 rounded-2xl bg-[#FF5C5C]/10 border border-[#FF5C5C]/40 text-xs font-mono space-y-1.5 text-[#FF5C5C]">
              <div className="font-bold flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-[#FF5C5C]" />
                <span>Transaction Failed</span>
              </div>
              <p className="text-white">{txStatus.error || txStatus.message}</p>
              {txStatus.txHash && (
                <span className="text-[#8B909D] break-all block text-[11px]">Tx: {txStatus.txHash}</span>
              )}
            </div>
          )}

          {/* Primary Action Button (Capsule Pill) */}
          <button
            onClick={handleCastVote}
            disabled={!canVote}
            className={`w-full btn-pill-gold group !min-h-[56px] !text-sm ${
              !canVote ? '!opacity-40 !cursor-not-allowed !shadow-none' : ''
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

        {/* Right Column: Distinctive Candidate Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#8B909D]">
              CERTIFIED CANDIDATES
            </span>
            <span className="text-xs font-mono text-[#FFD426] font-bold">
              {CANDIDATES.length} CANDIDATES REGISTERED
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5">
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

      </div>
    </div>
  );
}
export default VoterView;
