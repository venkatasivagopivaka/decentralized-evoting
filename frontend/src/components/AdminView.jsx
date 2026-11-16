import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  Play,
  Square,
  RefreshCw,
  CheckCircle,
  UserPlus,
  Users,
  Unlock,
  Cpu,
  ShieldAlert,
  AlertTriangle,
  Key,
  Crown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CANDIDATES, RADIX_BASE } from '../utils/constants';
import {
  generatePaillierKeys,
  serializePublicKey,
  serializePrivateKey,
  deserializePublicKey,
  deserializePrivateKey,
  homomorphicAddition,
  decryptTally,
  decodeRadixTally,
  decodeSimpleTally,
} from '../utils/crypto';
import {
  truncateAddress,
  truncateCiphertext,
  executeContractTransaction,
} from '../utils/contract';

export function AdminView({
  account,
  contract,
  adminAddress,
  isAdmin,
  isElectionOpen,
  publicKey,
  onRefreshContractData,
}) {
  // Keypair state
  const [localPrivateKey, setLocalPrivateKey] = useState(null);
  const [keyBitLength, setKeyBitLength] = useState(1024);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [localSessionMsg, setLocalSessionMsg] = useState('');

  // Modals
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  // Whitelist inputs
  const [singleVoterAddress, setSingleVoterAddress] = useState('');
  const [batchVoterAddresses, setBatchVoterAddresses] = useState('');

  // Tally & Decryption
  const [encryptedVotesList, setEncryptedVotesList] = useState([]);
  const [isLoadingVotes, setIsLoadingVotes] = useState(false);
  const [homomorphicSumCiphertext, setHomomorphicSumCiphertext] = useState('');
  const [isAggregating, setIsAggregating] = useState(false);
  const [decryptedSum, setDecryptedSum] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [tallyResults, setTallyResults] = useState(null);
  const [tallyMode, setTallyMode] = useState('radix');

  // Unified Transaction Lifecycle State
  const [txStatus, setTxStatus] = useState({
    stage: 'idle', // 'idle' | 'submitting' | 'waiting' | 'confirmed' | 'failed'
    message: '',
    txHash: null,
    error: null,
  });

  // Restore private key from sessionStorage if available
  useEffect(() => {
    try {
      const savedPriv = sessionStorage.getItem('paillier_admin_privkey');
      const savedPubN = sessionStorage.getItem('paillier_admin_pubkey_n');
      const savedPubG = sessionStorage.getItem('paillier_admin_pubkey_g');
      if (savedPriv && savedPubN && savedPubG) {
        const pub = deserializePublicKey(savedPubN, savedPubG);
        const priv = deserializePrivateKey(JSON.parse(savedPriv), pub);
        if (priv) setLocalPrivateKey(priv);
      }
    } catch (err) {
      console.warn('Could not restore private key:', err);
    }
  }, []);

  const fetchEncryptedVotes = async () => {
    if (!contract) return;
    try {
      setIsLoadingVotes(true);
      const votes = await contract.getEncryptedVotes();
      setEncryptedVotesList(Array.from(votes));
    } catch (err) {
      console.error('Error fetching votes:', err);
    } finally {
      setIsLoadingVotes(false);
    }
  };

  useEffect(() => {
    fetchEncryptedVotes();
  }, [contract, isElectionOpen]);

  // Local browser Paillier key generation (not on-chain)
  const handleGenerateKeys = async () => {
    try {
      setIsGeneratingKeys(true);
      setLocalSessionMsg('');
      const { publicKey: pub, privateKey: priv } = await generatePaillierKeys(keyBitLength);
      setLocalPrivateKey(priv);
      const serPub = serializePublicKey(pub);
      const serPriv = serializePrivateKey(priv);
      sessionStorage.setItem('paillier_admin_pubkey_n', serPub.n);
      sessionStorage.setItem('paillier_admin_pubkey_g', serPub.g);
      sessionStorage.setItem('paillier_admin_privkey', JSON.stringify(serPriv));
      setLocalSessionMsg(`Generated ${keyBitLength}-bit Paillier keypair in browser session. Click Publish to write to Ethereum.`);
      setTimeout(() => setLocalSessionMsg(''), 8000);
    } catch (err) {
      setTxStatus({
        stage: 'failed',
        message: 'Key generation failed: ' + err.message,
        error: err.message,
        txHash: null,
      });
    } finally {
      setIsGeneratingKeys(false);
    }
  };

  // Publish public key to smart contract with receipt & on-chain verification
  const handlePublishKey = async () => {
    if (!contract) return;
    const pubN = localPrivateKey?.publicKey?.n?.toString() || sessionStorage.getItem('paillier_admin_pubkey_n');
    const pubG = localPrivateKey?.publicKey?.g?.toString() || sessionStorage.getItem('paillier_admin_pubkey_g');

    if (!pubN || !pubG) {
      setTxStatus({
        stage: 'failed',
        message: 'No key found. Please click "Generate Keys" first.',
        error: 'Missing public key parameters.',
        txHash: null,
      });
      return;
    }

    try {
      await executeContractTransaction(contract, 'setPaillierPublicKey', [pubN, pubG], {
        onStageChange: setTxStatus,
        verifyOnChain: async () => {
          const [n] = await contract.getPaillierPublicKey();
          if (!n || n !== pubN) {
            throw new Error('On-chain verification failed: Paillier key was not stored on the smart contract.');
          }
        },
      });

      if (onRefreshContractData) onRefreshContractData();
    } catch (err) {
      console.error('Publish key error:', err);
    }
  };

  // Start election with receipt & on-chain verification
  const handleStartElection = async () => {
    if (!contract) return;
    try {
      await executeContractTransaction(contract, 'startElection', [], {
        onStageChange: setTxStatus,
        verifyOnChain: async () => {
          const isOpen = await contract.isElectionOpen();
          if (!isOpen) {
            throw new Error('On-chain verification failed: Smart contract electionState did not transition to Open.');
          }
        },
      });

      setShowStartModal(false);
      if (onRefreshContractData) onRefreshContractData();
    } catch (err) {
      console.error('Start election error:', err);
    }
  };

  // End election with receipt & on-chain verification
  const handleEndElection = async () => {
    if (!contract) return;
    try {
      await executeContractTransaction(contract, 'endElection', [], {
        onStageChange: setTxStatus,
        verifyOnChain: async () => {
          const isOpen = await contract.isElectionOpen();
          if (isOpen) {
            throw new Error('On-chain verification failed: Smart contract electionState did not transition to Closed.');
          }
        },
      });

      setShowEndModal(false);
      if (onRefreshContractData) onRefreshContractData();
      fetchEncryptedVotes();
    } catch (err) {
      console.error('End election error:', err);
    }
  };

  // Whitelist single voter with validation & on-chain verification
  const handleAddSingleVoter = async (e) => {
    e?.preventDefault();
    if (!contract || !singleVoterAddress) return;

    const targetAddr = singleVoterAddress.trim();
    if (!ethers.isAddress(targetAddr)) {
      setTxStatus({
        stage: 'failed',
        message: `Invalid Ethereum address: "${targetAddr}". Please enter a valid 0x address.`,
        error: 'Invalid address format.',
        txHash: null,
      });
      return;
    }

    try {
      await executeContractTransaction(contract, 'addVoter', [targetAddr], {
        onStageChange: setTxStatus,
        verifyOnChain: async () => {
          const whitelisted = await contract.isWhitelisted(targetAddr);
          if (!whitelisted) {
            throw new Error(`On-chain verification failed: Address ${targetAddr} was not registered on the whitelist.`);
          }
        },
      });

      setSingleVoterAddress('');
      if (onRefreshContractData) onRefreshContractData();
    } catch (err) {
      console.error('Add voter error:', err);
    }
  };

  // Whitelist batch voters with validation & on-chain verification
  const handleBatchAddVoters = async (e) => {
    e?.preventDefault();
    if (!contract || !batchVoterAddresses) return;

    const addresses = batchVoterAddresses
      .split(/[\n,]+/)
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    if (addresses.length === 0) {
      setTxStatus({
        stage: 'failed',
        message: 'Please enter at least one address.',
        error: 'Empty address list.',
        txHash: null,
      });
      return;
    }

    for (const addr of addresses) {
      if (!ethers.isAddress(addr)) {
        setTxStatus({
          stage: 'failed',
          message: `Invalid address detected in batch: "${addr}". Please correct before submitting.`,
          error: 'Invalid address in batch.',
          txHash: null,
        });
        return;
      }
    }

    try {
      await executeContractTransaction(contract, 'batchAddVoters', [addresses], {
        onStageChange: setTxStatus,
        verifyOnChain: async () => {
          for (const addr of addresses) {
            const whitelisted = await contract.isWhitelisted(addr);
            if (!whitelisted) {
              throw new Error(`On-chain verification failed: Address ${addr} is not registered.`);
            }
          }
        },
      });

      setBatchVoterAddresses('');
      if (onRefreshContractData) onRefreshContractData();
    } catch (err) {
      console.error('Batch add voters error:', err);
    }
  };

  // Step 1: Compute Homomorphic Addition off-chain
  const handleComputeHomomorphicAddition = () => {
    try {
      setIsAggregating(true);
      if (!publicKey) throw new Error('Paillier public key is not set on the smart contract.');
      if (encryptedVotesList.length === 0) throw new Error('No encrypted votes recorded on-chain.');

      const aggregateCiphertext = homomorphicAddition(publicKey, encryptedVotesList);
      setHomomorphicSumCiphertext(aggregateCiphertext.toString());
      setTxStatus({
        stage: 'confirmed',
        message: 'Homomorphic addition of all encrypted ballots computed successfully.',
        txHash: null,
      });
    } catch (err) {
      console.error('Aggregation error:', err);
      setTxStatus({
        stage: 'failed',
        message: 'Aggregation failed: ' + err.message,
        error: err.message,
        txHash: null,
      });
    } finally {
      setIsAggregating(false);
    }
  };

  // Step 2: Decrypt Aggregate Ciphertext & Reveal Results
  const handleDecryptAndTally = () => {
    try {
      setIsDecrypting(true);
      if (!localPrivateKey) throw new Error('Admin Paillier private key required in session. Generate keys first.');
      if (!homomorphicSumCiphertext) throw new Error('Please compute homomorphic product first.');

      const rawSum = decryptTally(localPrivateKey, homomorphicSumCiphertext);
      setDecryptedSum(rawSum);

      let results = [];
      if (tallyMode === 'radix') {
        const decoded = decodeRadixTally(rawSum, CANDIDATES.length, RADIX_BASE);
        results = CANDIDATES.map((cand) => {
          const match = decoded.find((d) => d.candidateId === cand.id);
          return { ...cand, votes: match ? match.count : 0 };
        });
      } else {
        const decoded = decodeSimpleTally(rawSum, encryptedVotesList.length);
        results = CANDIDATES.slice(0, 2).map((cand) => {
          const match = decoded.find((d) => d.candidateId === cand.id);
          return { ...cand, votes: match ? match.count : 0 };
        });
      }

      results.sort((a, b) => b.votes - a.votes);
      setTallyResults(results);

      confetti({
        particleCount: 85,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#FFD426', '#FFE066', '#FFFFFF', '#8B909D'],
      });

      setTxStatus({
        stage: 'confirmed',
        message: 'Homomorphic tally decrypted and winner certified.',
        txHash: null,
      });
    } catch (err) {
      console.error('Decryption error:', err);
      setTxStatus({
        stage: 'failed',
        message: 'Decryption failed: ' + err.message,
        error: err.message,
        txHash: null,
      });
    } finally {
      setIsDecrypting(false);
    }
  };

  const isTxBusy = txStatus.stage === 'submitting' || txStatus.stage === 'waiting';

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      {/* Confirmation Modal: Start Election */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 bg-[#08090B]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1115] border border-[#232730] rounded-xl max-w-sm w-full p-6 space-y-4 shadow-popover">
            <h3 className="text-base font-bold text-white tracking-tight">Open Voting Window?</h3>
            <p className="text-xs text-[#8B909D] leading-relaxed">
              Opening the election enables whitelisted addresses to submit encrypted Paillier ballots. This action updates the on-chain state machine.
            </p>

            {isTxBusy && (
              <div className="p-3 rounded-md bg-[#08090B] border border-[#232730] text-xs font-mono text-white flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FFD426]" />
                <span>{txStatus.message}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowStartModal(false)}
                disabled={isTxBusy}
                className="btn-secondary-dark"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartElection}
                disabled={isTxBusy}
                className="btn-primary-gold"
              >
                {isTxBusy && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#08090B]" />}
                <span>{isTxBusy ? 'Processing…' : 'Confirm & Open'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: End Election */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-[#08090B]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1115] border border-[#232730] rounded-xl max-w-sm w-full p-6 space-y-4 shadow-popover">
            <h3 className="text-base font-bold text-white tracking-tight">Close Voting Window?</h3>
            <p className="text-xs text-[#8B909D] leading-relaxed">
              Closing the election permanently prevents further ballot submissions and seals the encrypted ballot pool, enabling off-chain homomorphic tallying.
            </p>

            {isTxBusy && (
              <div className="p-3 rounded-md bg-[#08090B] border border-[#232730] text-xs font-mono text-white flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF5C5C]" />
                <span>{txStatus.message}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                disabled={isTxBusy}
                className="btn-secondary-dark"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEndElection}
                disabled={isTxBusy}
                className="btn-destructive-dark"
              >
                {isTxBusy && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isTxBusy ? 'Sealing…' : 'Confirm & Seal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Large Editorial Headline */}
      <div className="border-b border-[#232730] pb-6">
        <div className="flex items-center space-x-2 text-[11px] font-mono tracking-widest text-[#FFD426] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFD426]" />
          <span>Console // Administrative Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
          Election Administration
        </h1>
        <p className="text-xs sm:text-sm text-[#8B909D] mt-2 max-w-2xl leading-relaxed">
          Manage lifecycle state transitions, configure Paillier homomorphic parameters, authorize voter addresses, and compute aggregate results.
        </p>
      </div>

      {/* Non-Admin Warning Banner */}
      {!isAdmin && account && (
        <div className="p-4 rounded-md bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 text-white flex items-start space-x-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#FF5C5C] mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-[#FF5C5C] block">Connected Wallet is Not the Administrator</span>
            <p className="text-[#8B909D] leading-relaxed">
              Your active address (<code className="font-mono text-white">{truncateAddress(account)}</code>) does not match the contract deployer (<code className="font-mono text-[#FFD426]">{truncateAddress(adminAddress)}</code>). Switch to Account #0 in MetaMask to authorize admin operations.
            </p>
          </div>
        </div>
      )}

      {/* Local Session Key Notice */}
      {localSessionMsg && (
        <div className="p-3.5 rounded-md bg-[#FFD426]/10 border border-[#FFD426]/30 text-[#FFD426] text-xs flex items-center space-x-2 font-mono">
          <Key className="w-4 h-4 text-[#FFD426] flex-shrink-0" />
          <span>{localSessionMsg}</span>
        </div>
      )}

      {/* Explicit On-Chain Transaction Feedback Banner */}
      {txStatus.stage === 'submitting' && (
        <div className="p-4 rounded-md bg-[#0F1115] border border-[#232730] text-xs font-mono space-y-1 text-white">
          <div className="flex items-center space-x-2 text-[#FFD426] font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Submitting to Wallet…</span>
          </div>
          <p className="text-[#8B909D]">Please review and sign the transaction in MetaMask.</p>
        </div>
      )}

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

      {txStatus.stage === 'confirmed' && (
        <div className="p-4 rounded-md bg-[#FFD426]/10 border border-[#FFD426]/40 text-xs font-mono space-y-1 text-[#FFD426]">
          <div className="font-semibold flex items-center space-x-1.5">
            <CheckCircle className="w-4 h-4 text-[#FFD426]" />
            <span>{txStatus.message}</span>
          </div>
          {txStatus.txHash && (
            <span className="text-[#8B909D] break-all block text-[11px]">Tx: {txStatus.txHash}</span>
          )}
        </div>
      )}

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

      {/* ── Section 1: Election Lifecycle ──────────────────────────────── */}
      <section className="bg-[#0F1115] border border-[#232730] rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#232730] pb-4">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#8B909D]">
            Election Lifecycle
          </h2>
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isElectionOpen
                  ? 'bg-[#FFD426] shadow-[0_0_8px_#FFD426] animate-pulse'
                  : 'bg-[#525765]'
              }`}
            />
            <span className={`font-bold ${isElectionOpen ? 'text-[#FFD426]' : 'text-[#8B909D]'}`}>
              {isElectionOpen ? 'POLLS OPEN' : 'POLLS CLOSED'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#8B909D]">
          <span>Current Ballots in Storage: <strong className="font-mono text-[#FFD426]">{encryptedVotesList.length}</strong></span>
          <span className="font-mono">{isElectionOpen ? 'Accepting encrypted ballots' : 'Ballot recording sealed'}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setShowStartModal(true)}
            disabled={isElectionOpen || isTxBusy || !isAdmin}
            className="btn-primary-gold"
          >
            {isTxBusy && showStartModal ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#08090B]" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Open Voting</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEndModal(true)}
            disabled={!isElectionOpen || isTxBusy || !isAdmin}
            className="btn-destructive-dark"
          >
            {isTxBusy && showEndModal ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Square className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Close Voting</span>
          </button>
        </div>
      </section>

      {/* ── Section 2: Paillier Encryption Keys ────────────────────────── */}
      <section className="bg-[#0F1115] border border-[#232730] rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#232730] pb-4">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#8B909D]">
            Paillier Cryptographic Keys
          </h2>
          <span className={`text-xs font-mono ${publicKey ? 'text-[#FFD426]' : 'text-[#8B909D]'}`}>
            {publicKey ? 'Key Published On-Chain' : 'Key Not Published'}
          </span>
        </div>

        {/* Bitlength Segmented Control */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8B909D]">Key Bitlength</span>
          <div className="flex items-center space-x-1 bg-[#08090B] p-1 rounded-md border border-[#232730]">
            {[512, 1024, 2048].map((bits) => (
              <button
                key={bits}
                type="button"
                onClick={() => setKeyBitLength(bits)}
                className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                  keyBitLength === bits
                    ? 'bg-[#16191F] text-[#FFD426] font-bold border border-[#FFD426]/30 shadow-sm'
                    : 'text-[#8B909D] hover:text-white'
                }`}
              >
                {bits}-bit
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleGenerateKeys}
            disabled={isGeneratingKeys || isTxBusy || !isAdmin}
            className="btn-secondary-dark"
          >
            {isGeneratingKeys ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FFD426]" />
            ) : (
              <Key className="w-3.5 h-3.5 text-[#FFD426]" />
            )}
            <span>Generate {keyBitLength}-bit Keys</span>
          </button>

          <button
            type="button"
            onClick={handlePublishKey}
            disabled={isTxBusy || (!localPrivateKey && !publicKey) || !isAdmin}
            className="btn-primary-gold"
          >
            {isTxBusy ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#08090B]" /> : null}
            <span>Publish Public Key On-Chain</span>
          </button>
        </div>

        {/* Key Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="bg-[#08090B] p-3.5 rounded-md border border-[#232730]">
            <span className="text-[10px] text-[#8B909D] font-mono uppercase block mb-1">Modulus n</span>
            <span className="font-mono text-xs text-white truncate block font-medium">
              {publicKey ? truncateCiphertext(publicKey.n.toString(), 20) : 'Not published'}
            </span>
          </div>
          <div className="bg-[#08090B] p-3.5 rounded-md border border-[#232730]">
            <span className="text-[10px] text-[#8B909D] font-mono uppercase block mb-1">Private Key (λ, μ)</span>
            <span className="font-mono text-xs text-[#FFD426] truncate block font-medium">
              {localPrivateKey ? 'Active in Browser Session' : 'Not Generated'}
            </span>
          </div>
        </div>
      </section>

      {/* ── Section 3: Voter Access Whitelist ─────────────────────────── */}
      <section className="bg-[#0F1115] border border-[#232730] rounded-xl p-6 space-y-5">
        <h2 className="text-xs font-mono uppercase tracking-widest text-[#8B909D] border-b border-[#232730] pb-4">
          Voter Access Whitelist
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Single Address */}
          <form onSubmit={handleAddSingleVoter} className="space-y-3 bg-[#08090B] p-4 rounded-lg border border-[#232730]">
            <label className="text-xs text-[#8B909D] block font-medium">Single Address Registration</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="0x…"
                value={singleVoterAddress}
                onChange={(e) => setSingleVoterAddress(e.target.value)}
                disabled={isTxBusy}
                className="flex-1 px-3.5 py-2 rounded-md bg-[#0F1115] border border-[#232730] text-white placeholder-[#525765] font-mono text-xs focus:outline-none focus:border-[#FFD426]"
              />
              <button
                type="submit"
                disabled={isTxBusy || !singleVoterAddress || !isAdmin}
                className="btn-primary-gold min-h-[38px] px-4"
              >
                {isTxBusy ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#08090B]" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>Add</span>
              </button>
            </div>
          </form>

          {/* Batch Addresses */}
          <form onSubmit={handleBatchAddVoters} className="space-y-3 bg-[#08090B] p-4 rounded-lg border border-[#232730]">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#8B909D] font-medium">Batch Addresses</label>
              <button
                type="button"
                onClick={() =>
                  setBatchVoterAddresses(
                    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8\n0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC\n0x90F79bf6EB2c4f870365E785982E1f101E93b906'
                  )
                }
                disabled={isTxBusy}
                className="text-[11px] text-[#FFD426] hover:underline font-mono"
              >
                Auto-fill test accounts
              </button>
            </div>
            <textarea
              rows={2}
              placeholder="0x7099…&#10;0x3C44…"
              value={batchVoterAddresses}
              onChange={(e) => setBatchVoterAddresses(e.target.value)}
              disabled={isTxBusy}
              className="w-full px-3.5 py-2 rounded-md bg-[#0F1115] border border-[#232730] text-white placeholder-[#525765] font-mono text-xs focus:outline-none focus:border-[#FFD426] resize-none"
            />
            <button
              type="submit"
              disabled={isTxBusy || !batchVoterAddresses || !isAdmin}
              className="btn-secondary-dark w-full min-h-[38px]"
            >
              {isTxBusy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5 text-[#FFD426]" />}
              <span>Batch Whitelist Addresses</span>
            </button>
          </form>
        </div>
      </section>

      {/* ── Section 4: Homomorphic Tally & Results ─────────────────────── */}
      <section className="bg-[#0F1115] border border-[#232730] rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#232730] pb-4">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#8B909D]">
            Homomorphic Tally & Results
          </h2>
          <div className="flex items-center space-x-2">
            {/* Scheme Selector */}
            <div className="flex items-center space-x-1 bg-[#08090B] p-1 rounded-md border border-[#232730]">
              <button
                type="button"
                onClick={() => setTallyMode('radix')}
                className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                  tallyMode === 'radix'
                    ? 'bg-[#16191F] text-[#FFD426] font-bold border border-[#FFD426]/30 shadow-sm'
                    : 'text-[#8B909D] hover:text-white'
                }`}
              >
                Radix Multi
              </button>
              <button
                type="button"
                onClick={() => setTallyMode('simple')}
                className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                  tallyMode === 'simple'
                    ? 'bg-[#16191F] text-[#FFD426] font-bold border border-[#FFD426]/30 shadow-sm'
                    : 'text-[#8B909D] hover:text-white'
                }`}
              >
                Linear
              </button>
            </div>
            <button
              type="button"
              onClick={fetchEncryptedVotes}
              disabled={isLoadingVotes}
              className="p-1.5 rounded-md bg-[#08090B] hover:bg-[#16191F] border border-[#232730] text-[#8B909D] hover:text-white transition-colors"
              title="Refresh ballots from blockchain"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVotes ? 'animate-spin text-[#FFD426]' : ''}`} />
            </button>
          </div>
        </div>

        <div className="text-xs text-[#8B909D] font-mono">
          {encryptedVotesList.length} encrypted ballot{encryptedVotesList.length !== 1 ? 's' : ''} stored on-chain
          {!isElectionOpen && encryptedVotesList.length > 0 && (
            <span className="text-[#FFD426] ml-2 font-bold">— Ready to aggregate and decrypt</span>
          )}
        </div>

        {/* 2-Step Homomorphic Workflow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleComputeHomomorphicAddition}
            disabled={encryptedVotesList.length === 0 || isAggregating || !isAdmin}
            className="btn-secondary-dark"
          >
            {isAggregating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FFD426]" />
            ) : (
              <Cpu className="w-3.5 h-3.5 text-[#FFD426]" />
            )}
            <span>Step 1: Aggregate Ciphertexts</span>
          </button>

          <button
            type="button"
            onClick={handleDecryptAndTally}
            disabled={!homomorphicSumCiphertext || !localPrivateKey || isDecrypting || !isAdmin}
            className="btn-primary-gold"
          >
            {isDecrypting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#08090B]" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
            <span>Step 2: Decrypt & Reveal Results</span>
          </button>
        </div>

        {/* Aggregated Ciphertext Box */}
        {homomorphicSumCiphertext && (
          <div className="bg-[#08090B] border border-[#232730] rounded-md p-4 font-mono text-xs text-white space-y-2">
            <span className="text-[10px] text-[#8B909D] uppercase tracking-wider block">
              Aggregated Ciphertext Product (C_total = ∏ cᵢ mod n²)
            </span>
            <div className="break-all text-xs text-[#FFD426] leading-relaxed">
              {truncateCiphertext(homomorphicSumCiphertext, 44)}
            </div>
            {decryptedSum !== null && (
              <div className="pt-2 border-t border-[#232730] flex items-center justify-between font-sans text-xs">
                <span className="text-[#8B909D]">Decrypted Plaintext Sum:</span>
                <span className="font-mono font-bold text-lg text-[#FFD426]">{decryptedSum.toString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Certified Results Presentation */}
        {tallyResults && tallyResults.length > 0 && (
          <div className="space-y-4 pt-3 border-t border-[#232730]">
            {/* Monumental Winner Spotlight Card with Electric Gold Glow */}
            <div className="rounded-lg bg-[#16191F] border-2 border-[#FFD426] p-6 flex items-center justify-between gap-4 shadow-goldGlow">
              <div>
                <div className="flex items-center space-x-1.5 mb-1 text-[#FFD426]">
                  <Crown className="w-4 h-4 fill-current" />
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
                    Certified Winner
                  </span>
                </div>
                <h4 className="text-xl font-bold text-white tracking-tight">{tallyResults[0].name}</h4>
                <p className="text-xs text-[#8B909D] mt-0.5">{tallyResults[0].role} · {tallyResults[0].platform}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-4xl font-mono font-extrabold text-[#FFD426]">{tallyResults[0].votes}</div>
                <div className="text-[10px] text-[#8B909D] font-mono uppercase tracking-wider">Votes Recorded</div>
              </div>
            </div>

            {/* Candidate Breakdown */}
            <div className="space-y-3 bg-[#08090B] border border-[#232730] rounded-lg p-5">
              {tallyResults.map((candidate, idx) => {
                const totalBallots = encryptedVotesList.length || 1;
                const pct = Math.round((candidate.votes / totalBallots) * 100);
                return (
                  <div key={candidate.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{candidate.name}</span>
                      <span className="font-mono text-[#FFD426]">
                        {candidate.votes} <span className="text-[#8B909D] font-normal font-sans">votes ({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-[#16191F] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          idx === 0
                            ? 'bg-[#FFD426] shadow-[0_0_8px_#FFD426]'
                            : 'bg-white/40'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
