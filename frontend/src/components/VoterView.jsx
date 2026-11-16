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
      // Clear previous error if any
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
          // Verify directly from smart contract that voter's on-chain status is now voted === true
          const [, voted] = await contract.getVoterStatus(account);
          if (!voted) {
            throw new Error('On-chain verification failed: Smart contract did not record ballot.');
          }
        },
      });

      // ONLY notify parent coordinator after verified on-chain confirmation
      if (onVoteCastSuccess) {
        onVoteCastSuccess();
      }
    } catch (err) {
      console.error('Vote casting execution failed:', err);
      // txStatus is already set to 'failed' with formatted error inside executeContractTransaction
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
    ? 'Ballot Confirmed & Recorded'
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
            <strong className="font-semibold">Ballot verified on-chain:</strong> Your encrypted vote has been confirmed and sealed on the Ethereum blockchain. Double voting is strictly prevented.
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

      {/* Explicit Transaction Lifecycle Feedback */}

      {/* 1. Submitting State (Awaiting user signature in MetaMask) */}
      {txStatus.stage === 'submitting' && (
        <div className="p-4 rounded-md bg-[#F8F7F3] border border-[#CCCBC1] text-xs font-mono space-y-1 text-[#292E2A]">
          <div className="flex items-center space-x-2 text-[#A77D60] font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Submitting to Wallet…</span>
          </div>
          <p className="text-[#70736C]">Please review and sign the transaction in MetaMask.</p>
        </div>
      )}

      {/* 2. Waiting State (Broadcasted with TxHash, waiting for on-chain block mining) */}
      {txStatus.stage === 'waiting' && (
        <div className="p-4 rounded-md bg-[#F8F7F3] border border-[#CCCBC1] text-xs font-mono space-y-1.5 text-[#292E2A]">
          <div className="flex items-center space-x-2 text-[#425B49] font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Waiting for Block Confirmation…</span>
          </div>
          <div className="text-[#70736C] break-all">
            Transaction broadcast to Ethereum. Tx: <code className="text-[#292E2A] font-semibold">{txStatus.txHash}</code>
          </div>
          <p className="text-[11px] text-[#9A9C96]">Awaiting mined receipt with status 1.</p>
        </div>
      )}

      {/* 3. Confirmed State (ONLY after status === 1 and on-chain verification) */}
      {txStatus.stage === 'confirmed' && (
        <div className="p-4 rounded-md bg-[#E0E8DF] border border-[#BDCEBC] text-xs font-mono space-y-1">
          <div className="text-[#425B49] font-semibold flex items-center space-x-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-[#425B49]" />
            <span>Transaction Confirmed on Ethereum</span>
          </div>
          <span className="text-[#70736C] break-all block">Tx: {txStatus.txHash}</span>
        </div>
      )}

      {/* 4. Failed State (Clear error reason and preservation of state) */}
      {txStatus.stage === 'failed' && (
        <div className="p-4 rounded-md bg-[#F4EEE8] border border-[#DFCEBF] text-xs font-mono space-y-1.5 text-[#A77D60]">
          <div className="font-semibold flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#A77D60]" />
            <span>Transaction Failed</span>
          </div>
          <p className="text-[#292E2A]">{txStatus.error || txStatus.message}</p>
          {txStatus.txHash && (
            <span className="text-[#70736C] break-all block text-[11px]">Tx: {txStatus.txHash}</span>
          )}
        </div>
      )}

      {/* Primary Cast Vote Action Button */}
      <button
        onClick={handleCastVote}
        disabled={!canVote}
        className={`w-full min-h-[46px] rounded-md font-medium text-xs transition-all duration-180 flex items-center justify-center space-x-2 ${
          canVote
            ? 'bg-[#425B49] hover:bg-[#354B3C] active:scale-[0.99] text-[#F1EFE8] shadow-subtle'
            : 'bg-[#DCDAD1] text-[#70736C] border border-[#CCCBC1] cursor-not-allowed'
        }`}
      >
        {isBusy ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-[#F1EFE8]" />
            <span>{buttonLabel}</span>
          </>
        ) : (
          <span>{buttonLabel}</span>
        )}
      </button>
    </div>
  );
}
