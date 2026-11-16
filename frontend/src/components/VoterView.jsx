import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, Copy, Lock, ShieldAlert } from 'lucide-react';
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

  // Determine button label
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
    : `Cast Encrypted Ballot for ${selectedCandidate?.name}`;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      {/* Large Editorial Headline */}
      <div className="border-b border-[#232730] pb-6">
        <div className="flex items-center space-x-2 text-[11px] font-mono tracking-widest text-[#FFD426] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFD426]" />
          <span>Official Ballot // 2026 General Election</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
          Cast Your Encrypted Ballot
        </h1>
        <p className="text-xs sm:text-sm text-[#8B909D] mt-2 max-w-2xl leading-relaxed">
          Select a candidate below. Your vote is sealed locally using Paillier homomorphic encryption before submission to Ethereum, ensuring individual confidentiality.
        </p>
      </div>

      {/* Eligibility / Status Notices */}
      {!isWhitelisted && account && (
        <div className="flex items-start space-x-3 p-4 rounded-md bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 text-xs text-[#FF5C5C]">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#FF5C5C]" />
          <span>
            <strong className="font-semibold">{truncateAddress(account)}</strong> is not currently registered on the voter whitelist. Request access from the election administrator.
          </span>
        </div>
      )}

      {hasVoted && (
        <div className="flex items-start space-x-3 p-4 rounded-md bg-[#FFD426]/10 border border-[#FFD426]/30 text-xs text-[#FFD426]">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#FFD426]" />
          <span>
            <strong className="font-semibold">Ballot verified on-chain:</strong> Your encrypted vote has been confirmed and sealed on the Ethereum blockchain. Double voting is strictly prevented.
          </span>
        </div>
      )}

      {/* Candidate Selection Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#8B909D]">
            Certified Candidates
          </h2>
          <span className="text-xs font-mono text-[#FFD426]">
            {CANDIDATES.length} Choices Available
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
        <section className="bg-[#0F1115] border border-[#232730] rounded-lg p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-[#FFD426]" />
              <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                Encrypted Ballot Payload
              </span>
            </div>
            <button
              onClick={handleCopyCiphertext}
              disabled={!generatedCiphertext}
              className="text-[11px] font-mono text-[#8B909D] hover:text-[#FFD426] flex items-center space-x-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied' : 'Copy Payload'}</span>
            </button>
          </div>

          <div className="bg-[#08090B] rounded border border-[#232730] px-4 py-3 font-mono text-xs text-[#FFD426] break-all leading-relaxed">
            {isEncrypting
              ? 'Encrypting ballot with Paillier public key…'
              : generatedCiphertext
              ? truncateCiphertext(generatedCiphertext, 68)
              : 'Awaiting encryption key from smart contract…'}
          </div>

          <p className="text-[11px] text-[#8B909D] leading-relaxed">
            Blinded by random salt <code className="font-mono text-[#FFD426]">r ∈ ℤ*ₙ</code>. The smart contract tallies encrypted values homomorphically without ever revealing your personal selection.
          </p>
        </section>
      )}

      {/* Explicit Transaction Lifecycle Feedback */}

      {/* 1. Submitting State (Awaiting user signature in MetaMask) */}
      {txStatus.stage === 'submitting' && (
        <div className="p-4 rounded-md bg-[#0F1115] border border-[#232730] text-xs font-mono space-y-1 text-white">
          <div className="flex items-center space-x-2 text-[#FFD426] font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Submitting to Wallet…</span>
          </div>
          <p className="text-[#8B909D]">Please review and sign the transaction in MetaMask.</p>
        </div>
      )}

      {/* 2. Waiting State (Broadcasted with TxHash, waiting for on-chain block mining) */}
      {txStatus.stage === 'waiting' && (
        <div className="p-4 rounded-md bg-[#0F1115] border border-[#FFD426]/30 text-xs font-mono space-y-1.5 text-white">
          <div className="flex items-center space-x-2 text-[#FFD426] font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Waiting for Block Confirmation…</span>
          </div>
          <div className="text-[#8B909D] break-all">
            Transaction broadcast to Ethereum. Tx: <code className="text-[#FFD426] font-semibold">{txStatus.txHash}</code>
          </div>
          <p className="text-[11px] text-[#8B909D]">Awaiting mined block receipt with status 1.</p>
        </div>
      )}

      {/* 3. Confirmed State (ONLY after status === 1 and on-chain verification) */}
      {txStatus.stage === 'confirmed' && (
        <div className="p-4 rounded-md bg-[#FFD426]/10 border border-[#FFD426]/40 text-xs font-mono space-y-1 text-[#FFD426]">
          <div className="font-semibold flex items-center space-x-1.5">
            <CheckCircle className="w-4 h-4 text-[#FFD426]" />
            <span>Transaction Confirmed on Ethereum</span>
          </div>
          <span className="text-[#8B909D] break-all block text-[11px]">Tx: {txStatus.txHash}</span>
        </div>
      )}

      {/* 4. Failed State (Clear error reason and preservation of state) */}
      {txStatus.stage === 'failed' && (
        <div className="p-4 rounded-md bg-[#FF5C5C]/10 border border-[#FF5C5C]/40 text-xs font-mono space-y-1.5 text-[#FF5C5C]">
          <div className="font-semibold flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-[#FF5C5C]" />
            <span>Transaction Failed</span>
          </div>
          <p className="text-white">{txStatus.error || txStatus.message}</p>
          {txStatus.txHash && (
            <span className="text-[#8B909D] break-all block text-[11px]">Tx: {txStatus.txHash}</span>
          )}
        </div>
      )}

      {/* Primary Cast Vote Action Button in Electric Gold */}
      <button
        onClick={handleCastVote}
        disabled={!canVote}
        className={`w-full min-h-[48px] rounded-md font-bold text-xs tracking-wider uppercase transition-all duration-180 flex items-center justify-center space-x-2 ${
          canVote
            ? 'btn-primary-gold'
            : 'bg-[#16191F] text-[#525765] border border-[#232730] cursor-not-allowed'
        }`}
      >
        {isBusy ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-[#08090B]" />
            <span>{buttonLabel}</span>
          </>
        ) : (
          <span>{buttonLabel}</span>
        )}
      </button>
    </div>
  );
}
