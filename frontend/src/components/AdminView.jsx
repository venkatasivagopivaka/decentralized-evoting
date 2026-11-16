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
  ArrowRight,
  Search,
  Check,
  XCircle,
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

  // Live On-Chain Voter Lookup Tool State
  const [lookupAddress, setLookupAddress] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');

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

  // Live on-chain voter status verification (read-only call)
  const handleLookupVoter = async (addrToLookup) => {
    const target = (addrToLookup || lookupAddress).trim();
    if (!target) return;
    if (!ethers.isAddress(target)) {
      setLookupError(`"${target}" is not a valid Ethereum address.`);
      setLookupResult(null);
      return;
    }

    try {
      setIsLookingUp(true);
      setLookupError('');
      if (!contract) throw new Error('Smart contract connection not available.');
      const [isWhitelisted, hasVoted] = await contract.getVoterStatus(target);
      setLookupResult({
        address: target,
        isWhitelisted: Boolean(isWhitelisted),
        hasVoted: Boolean(hasVoted),
      });
    } catch (err) {
      console.error('Lookup voter error:', err);
      setLookupError('On-chain query failed: ' + (err.message || 'Unknown error'));
      setLookupResult(null);
    } finally {
      setIsLookingUp(false);
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
        message: 'Homomorphic product of all encrypted ballots computed successfully.',
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
        particleCount: 95,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C6FF00', '#D4FF33', '#FFFFFF', '#8B909D'],
      });

      setTxStatus({
        stage: 'confirmed',
        message: 'Homomorphic tally decrypted and certified winner revealed.',
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
    <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-16 space-y-12">
      
      {/* Confirmation Modal: Start Election */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 bg-[#08090B]/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#0F1115] border border-[#232730] rounded-3xl max-w-md w-full p-8 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-2 text-[11px] font-mono uppercase tracking-widest text-[#C6FF00]">
              <span className="w-2 h-2 rounded-full bg-[#C6FF00]" />
              <span>State Transition</span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">Open Voting Window?</h3>
            <p className="text-sm text-[#8B909D] leading-relaxed">
              Opening the election enables registered addresses to cast encrypted ballots. This triggers an immutable state transition on the Ethereum contract.
            </p>

            {isTxBusy && (
              <div className="p-4 rounded-xl bg-[#08090B] border border-[#232730] text-xs font-mono text-white flex items-center space-x-2.5">
                <RefreshCw className="w-4 h-4 animate-spin text-[#C6FF00]" />
                <span>{txStatus.message}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setShowStartModal(false)}
                disabled={isTxBusy}
                className="btn-pill-outline !min-h-[42px] !py-2 !px-6 !text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartElection}
                disabled={isTxBusy}
                className="btn-pill-lime !min-h-[42px] !py-2 !px-6 !text-xs"
              >
                {isTxBusy && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#08090B]" />}
                <span>{isTxBusy ? 'Broadcasting…' : 'Confirm & Open'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: End Election */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-[#08090B]/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#0F1115] border border-[#232730] rounded-3xl max-w-md w-full p-8 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-2 text-[11px] font-mono uppercase tracking-widest text-[#FF5C5C]">
              <span className="w-2 h-2 rounded-full bg-[#FF5C5C]" />
              <span>Seal Ballot Box</span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">Close Voting Window?</h3>
            <p className="text-sm text-[#8B909D] leading-relaxed">
              Closing the election permanently seals the encrypted ballot pool and halts further voting. The aggregate sum can then be decrypted off-chain.
            </p>

            {isTxBusy && (
              <div className="p-4 rounded-xl bg-[#08090B] border border-[#232730] text-xs font-mono text-white flex items-center space-x-2.5">
                <RefreshCw className="w-4 h-4 animate-spin text-[#FF5C5C]" />
                <span>{txStatus.message}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                disabled={isTxBusy}
                className="btn-pill-outline !min-h-[42px] !py-2 !px-6 !text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEndElection}
                disabled={isTxBusy}
                className="btn-pill-destructive !min-h-[42px] !py-2 !px-6 !text-xs"
              >
                {isTxBusy && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isTxBusy ? 'Sealing…' : 'Confirm & Seal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section Header: Bold Editorial Typography on Soft Ivory */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#08090B]/15 gap-6">
        <div>
          <div className="flex items-center space-x-2.5 text-[11px] font-mono tracking-widest text-[#08090B]/70 uppercase mb-2">
            <span className="w-2 h-2 rounded-[2px] bg-[#C6FF00]" />
            <span>OPERATIONAL SUITE // ADMINISTRATOR ENGINE</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black text-[#08090B] tracking-tighter uppercase leading-none">
            Election Administration<span className="text-[#C6FF00]">.</span>
          </h2>
        </div>
        <p className="text-sm sm:text-base text-[#525765] max-w-md leading-relaxed">
          Manage election lifecycle, generate and publish Paillier keys, whitelist authorized voters, and tally encrypted ballots homomorphically.
        </p>
      </div>

      {/* Non-Admin Warning Banner */}
      {!isAdmin && account && (
        <div className="p-6 rounded-2xl bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 text-white flex items-start space-x-4">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-[#FF5C5C] mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-[#FF5C5C] block text-sm">Connected Wallet is Not the Administrator</span>
            <p className="text-xs text-[#8B909D] leading-relaxed">
              Your active address (<code className="font-mono text-white">{truncateAddress(account)}</code>) does not match the contract deployer (<code className="font-mono text-[#C6FF00]">{truncateAddress(adminAddress)}</code>). Switch to Account #0 in MetaMask to authorize admin operations.
            </p>
          </div>
        </div>
      )}

      {/* Local Session Key Notice */}
      {localSessionMsg && (
        <div className="p-4 rounded-2xl bg-[#C6FF00]/10 border border-[#C6FF00]/30 text-[#08090B] text-xs flex items-center space-x-3 font-mono font-bold">
          <Key className="w-4 h-4 text-[#08090B] flex-shrink-0" />
          <span>{localSessionMsg}</span>
        </div>
      )}

      {/* Explicit On-Chain Transaction Feedback Banner */}
      {txStatus.stage === 'submitting' && (
        <div className="p-5 rounded-2xl bg-[#08090B] border border-[#232730] text-xs font-mono space-y-1 text-white shadow-xl">
          <div className="flex items-center space-x-2 text-[#C6FF00] font-bold">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Submitting to Wallet…</span>
          </div>
          <p className="text-[#8B909D]">Please review and sign the transaction in MetaMask.</p>
        </div>
      )}

      {txStatus.stage === 'waiting' && (
        <div className="p-5 rounded-2xl bg-[#08090B] border border-[#C6FF00]/40 text-xs font-mono space-y-1.5 text-white shadow-xl">
          <div className="flex items-center space-x-2 text-[#C6FF00] font-bold">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Waiting for Block Confirmation…</span>
          </div>
          <div className="text-[#8B909D] break-all">
            Transaction broadcast to Ethereum. Tx: <code className="text-[#C6FF00] font-semibold">{txStatus.txHash}</code>
          </div>
          <p className="text-[11px] text-[#8B909D]">Awaiting mined block receipt with status 1.</p>
        </div>
      )}

      {txStatus.stage === 'confirmed' && (
        <div className="p-5 rounded-2xl bg-[#C6FF00]/15 border border-[#C6FF00]/40 text-xs font-mono space-y-1 text-[#08090B] shadow-xl">
          <div className="font-bold flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-[#08090B]" />
            <span>{txStatus.message}</span>
          </div>
          {txStatus.txHash && (
            <span className="text-[#08090B]/70 break-all block text-[11px]">Tx: {txStatus.txHash}</span>
          )}
        </div>
      )}

      {txStatus.stage === 'failed' && (
        <div className="p-5 rounded-2xl bg-[#FF5C5C]/10 border border-[#FF5C5C]/40 text-xs font-mono space-y-1.5 text-[#FF5C5C] shadow-xl">
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

      {/* ── Section 1: Election Lifecycle (Expansive Horizontal Layout) ── */}
      <section className="p-8 sm:p-10 rounded-3xl bg-[#08090B] border border-[#1F232B] text-white shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#232730] gap-4">
          <div>
            <span className="text-[10px] font-mono text-[#8B909D] uppercase tracking-widest block mb-1">
              SECTION 01
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight uppercase">
              Election Lifecycle
            </h3>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-[#0F1115] border border-[#232730] text-xs font-mono">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isElectionOpen
                  ? 'bg-[#C6FF00] shadow-[0_0_10px_#C6FF00] animate-pulse'
                  : 'bg-[#525765]'
              }`}
            />
            <span className={`font-bold ${isElectionOpen ? 'text-[#C6FF00]' : 'text-[#8B909D]'}`}>
              {isElectionOpen ? 'POLLS OPEN (ACTIVE)' : 'POLLS CLOSED (SEALED)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-6 space-y-2">
            <span className="text-xs font-mono text-[#8B909D] uppercase tracking-wider block">
              Current Ballots Recorded On-Chain
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-black text-[#C6FF00]">
              {encryptedVotesList.length}
            </div>
            <p className="text-xs text-[#8B909D] leading-relaxed">
              {isElectionOpen
                ? 'Accepting encrypted Paillier ballots from registered voters.'
                : 'Ballot collection is sealed. Ready for homomorphic tallying.'}
            </p>
          </div>

          <div className="md:col-span-6 flex flex-wrap gap-4 justify-start md:justify-end">
            <button
              type="button"
              onClick={() => setShowStartModal(true)}
              disabled={isElectionOpen || isTxBusy || !isAdmin}
              className="btn-pill-lime !min-h-[50px]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Open Voting Window</span>
            </button>

            <button
              type="button"
              onClick={() => setShowEndModal(true)}
              disabled={!isElectionOpen || isTxBusy || !isAdmin}
              className="btn-pill-destructive !min-h-[50px]"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Close & Seal Voting</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 2: Paillier Cryptographic Keys ─────────────────────── */}
      <section className="p-8 sm:p-10 rounded-3xl bg-[#08090B] border border-[#1F232B] text-white shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#232730] gap-4">
          <div>
            <span className="text-[10px] font-mono text-[#8B909D] uppercase tracking-widest block mb-1">
              SECTION 02
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight uppercase">
              Paillier Encryption Parameters
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${publicKey ? 'bg-[#C6FF00]' : 'bg-[#525765]'}`} />
            <span className={publicKey ? 'text-[#C6FF00] font-semibold' : 'text-[#8B909D]'}>
              {publicKey ? 'Public Key Active On-Chain' : 'Key Not Published'}
            </span>
          </div>
        </div>

        {/* Bitlength Selector & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-3">
            <label className="text-xs font-mono uppercase text-[#8B909D] tracking-wider block">
              Cryptographic Bitlength
            </label>
            <div className="inline-flex bg-[#0F1115] p-1.5 rounded-full border border-[#232730]">
              {[512, 1024, 2048].map((bits) => (
                <button
                  key={bits}
                  type="button"
                  onClick={() => setKeyBitLength(bits)}
                  className={`px-5 py-2 rounded-full text-xs font-mono transition-all ${
                    keyBitLength === bits
                      ? 'bg-[#C6FF00] text-[#08090B] font-bold shadow-[0_0_12px_rgba(198,255,0,0.3)]'
                      : 'text-[#8B909D] hover:text-white'
                  }`}
                >
                  {bits}-bit
                </button>
              ))}
            </div>
            <p className="text-xs text-[#8B909D]">
              Select bitlength for composite modulus <code className="text-[#C6FF00] font-mono">n = p · q</code>. 1024-bit recommended for local development.
            </p>
          </div>

          <div className="lg:col-span-7 flex flex-wrap gap-4 justify-start lg:justify-end">
            <button
              type="button"
              onClick={handleGenerateKeys}
              disabled={isGeneratingKeys || isTxBusy || !isAdmin}
              className="btn-pill-outline !min-h-[50px]"
            >
              {isGeneratingKeys ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#C6FF00]" />
              ) : (
                <Key className="w-4 h-4 text-[#C6FF00]" />
              )}
              <span>Generate {keyBitLength}-bit Keys</span>
            </button>

            <button
              type="button"
              onClick={handlePublishKey}
              disabled={isTxBusy || (!localPrivateKey && !publicKey) || !isAdmin}
              className="btn-pill-lime !min-h-[50px]"
            >
              {isTxBusy ? <RefreshCw className="w-4 h-4 animate-spin text-[#08090B]" /> : null}
              <span>Publish Public Key On-Chain</span>
            </button>
          </div>
        </div>

        {/* Key Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-[#0F1115] p-5 rounded-2xl border border-[#232730] space-y-1">
            <span className="text-[10px] text-[#8B909D] font-mono uppercase tracking-wider block">
              Modulus n (Public)
            </span>
            <span className="font-mono text-sm text-white truncate block font-bold">
              {publicKey ? truncateCiphertext(publicKey.n.toString(), 28) : 'Not published'}
            </span>
          </div>
          <div className="bg-[#0F1115] p-5 rounded-2xl border border-[#232730] space-y-1">
            <span className="text-[10px] text-[#8B909D] font-mono uppercase tracking-wider block">
              Private Key (λ, μ)
            </span>
            <span className="font-mono text-sm text-[#C6FF00] truncate block font-bold">
              {localPrivateKey ? 'Active in Secure Browser Session' : 'Not Generated'}
            </span>
          </div>
        </div>
      </section>

      {/* ── Section 3: Voter Admission & Whitelist ─────────────────────── */}
      <section className="p-8 sm:p-10 rounded-3xl bg-[#08090B] border border-[#1F232B] text-white shadow-2xl space-y-6">
        <div className="pb-6 border-b border-[#232730]">
          <span className="text-[10px] font-mono text-[#8B909D] uppercase tracking-widest block mb-1">
            SECTION 03
          </span>
          <h3 className="text-2xl font-black text-white tracking-tight uppercase">
            Voter Access & Whitelist
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Single Voter Registration */}
          <form onSubmit={handleAddSingleVoter} className="space-y-4 bg-[#0F1115] p-6 rounded-2xl border border-[#232730]">
            <label className="text-xs font-mono uppercase text-[#8B909D] tracking-wider block">
              Single Address Registration
            </label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="0x…"
                value={singleVoterAddress}
                onChange={(e) => setSingleVoterAddress(e.target.value)}
                disabled={isTxBusy}
                className="w-full px-5 py-3.5 rounded-full bg-[#08090B] border border-[#232730] text-white placeholder-[#525765] font-mono text-xs focus:outline-none focus:border-[#C6FF00]"
              />
              <button
                type="submit"
                disabled={isTxBusy || !singleVoterAddress || !isAdmin}
                className="btn-pill-lime w-full !min-h-[46px] !text-xs"
              >
                {isTxBusy ? <RefreshCw className="w-4 h-4 animate-spin text-[#08090B]" /> : <UserPlus className="w-4 h-4" />}
                <span>Whitelist Single Address</span>
              </button>
            </div>
          </form>

          {/* Batch Voter Registration */}
          <form onSubmit={handleBatchAddVoters} className="space-y-4 bg-[#0F1115] p-6 rounded-2xl border border-[#232730]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase text-[#8B909D] tracking-wider">
                Batch Voter Registration
              </label>
              <button
                type="button"
                onClick={() =>
                  setBatchVoterAddresses(
                    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8\n0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC\n0x90F79bf6EB2c4f870365E785982E1f101E93b906'
                  )
                }
                disabled={isTxBusy}
                className="text-xs text-[#C6FF00] hover:underline font-mono"
              >
                Auto-fill test accounts
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="0x7099…&#10;0x3C44…"
              value={batchVoterAddresses}
              onChange={(e) => setBatchVoterAddresses(e.target.value)}
              disabled={isTxBusy}
              className="w-full p-4 rounded-xl bg-[#08090B] border border-[#232730] text-white placeholder-[#525765] font-mono text-xs focus:outline-none focus:border-[#C6FF00] resize-none"
            />
            <button
              type="submit"
              disabled={isTxBusy || !batchVoterAddresses || !isAdmin}
              className="btn-pill-outline w-full !min-h-[46px] !text-xs"
            >
              {isTxBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4 text-[#C6FF00]" />}
              <span>Batch Whitelist Addresses</span>
            </button>
          </form>
        </div>

        {/* Live On-Chain Voter Status Inspection Tool */}
        <div className="bg-[#0F1115] p-6 sm:p-7 rounded-2xl border border-[#232730] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-[#C6FF00]" />
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Live On-Chain Voter Status Verification
                </h4>
              </div>
              <p className="text-xs text-[#8B909D] mt-0.5">
                Query the deployed smart contract to inspect whitelisting and ballot submission status for any Ethereum address.
              </p>
            </div>
            
            {/* Quick Presets */}
            <div className="flex items-center space-x-2 text-[11px] font-mono text-[#8B909D]">
              <span className="text-[#525765]">Test Presets:</span>
              {[
                { label: 'Acct #1', addr: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
                { label: 'Acct #2', addr: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' },
                { label: 'Acct #3', addr: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' },
              ].map(({ label, addr }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setLookupAddress(addr);
                    handleLookupVoter(addr);
                  }}
                  className="px-2.5 py-1 rounded bg-[#08090B] border border-[#232730] hover:border-[#C6FF00] hover:text-[#C6FF00] transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookupVoter();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              placeholder="Enter 0x address to verify on-chain status…"
              value={lookupAddress}
              onChange={(e) => setLookupAddress(e.target.value)}
              className="flex-1 px-5 py-3 rounded-full bg-[#08090B] border border-[#232730] text-white placeholder-[#525765] font-mono text-xs focus:outline-none focus:border-[#C6FF00]"
            />
            <button
              type="submit"
              disabled={isLookingUp || !lookupAddress}
              className="btn-pill-lime !min-h-[42px] !py-2 !px-6 !text-xs self-start sm:self-auto"
            >
              {isLookingUp ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#08090B]" /> : <Search className="w-3.5 h-3.5" />}
              <span>Verify On-Chain</span>
            </button>
          </form>

          {lookupError && (
            <div className="p-3.5 rounded-xl bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 text-xs text-[#FF5C5C] font-mono">
              {lookupError}
            </div>
          )}

          {lookupResult && (
            <div className="bg-[#08090B] border border-[#232730] rounded-xl p-4 font-mono text-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#232730]">
                <span className="text-[#8B909D]">Queried Address:</span>
                <span className="text-white font-bold break-all">{lookupResult.address}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[#8B909D]">Whitelist Status:</span>
                  {lookupResult.isWhitelisted ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#C6FF00]/15 text-[#C6FF00] font-bold text-[11px] border border-[#C6FF00]/30">
                      <Check className="w-3 h-3" />
                      <span>Whitelisted & Eligible</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#FF5C5C]/15 text-[#FF5C5C] font-bold text-[11px] border border-[#FF5C5C]/30">
                      <XCircle className="w-3 h-3" />
                      <span>Not Registered</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[#8B909D]">Ballot Status:</span>
                  {lookupResult.hasVoted ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#C6FF00]/15 text-[#C6FF00] font-bold text-[11px] border border-[#C6FF00]/30">
                      <Check className="w-3 h-3" />
                      <span>Ballot Recorded On-Chain</span>
                    </span>
                  ) : (
                    <span className="text-[#8B909D] text-[11px]">No ballot cast yet</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 4: Homomorphic Tally & Results ─────────────────────── */}
      <section className="p-8 sm:p-10 rounded-3xl bg-[#08090B] border border-[#1F232B] text-white shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#232730] gap-4">
          <div>
            <span className="text-[10px] font-mono text-[#8B909D] uppercase tracking-widest block mb-1">
              SECTION 04
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight uppercase">
              Homomorphic Tally & Certified Outcome
            </h3>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="inline-flex bg-[#0F1115] p-1 rounded-full border border-[#232730]">
              <button
                type="button"
                onClick={() => setTallyMode('radix')}
                className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all ${
                  tallyMode === 'radix'
                    ? 'bg-[#C6FF00] text-[#08090B] font-bold'
                    : 'text-[#8B909D] hover:text-white'
                }`}
              >
                Radix Multi
              </button>
              <button
                type="button"
                onClick={() => setTallyMode('simple')}
                className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all ${
                  tallyMode === 'simple'
                    ? 'bg-[#C6FF00] text-[#08090B] font-bold'
                    : 'text-[#8B909D] hover:text-white'
                }`}
              >
                Linear (2)
              </button>
            </div>

            <button
              type="button"
              onClick={fetchEncryptedVotes}
              disabled={isLoadingVotes}
              className="p-2.5 rounded-full bg-[#0F1115] hover:bg-[#16191F] border border-[#232730] text-[#8B909D] hover:text-white transition-colors"
              title="Refresh ballots from blockchain"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingVotes ? 'animate-spin text-[#C6FF00]' : ''}`} />
            </button>
          </div>
        </div>

        <div className="text-xs text-[#8B909D] font-mono">
          {encryptedVotesList.length} encrypted ballot{encryptedVotesList.length !== 1 ? 's' : ''} stored on-chain
          {!isElectionOpen && encryptedVotesList.length > 0 && (
            <span className="text-[#C6FF00] ml-2 font-bold">— Ready to aggregate and decrypt</span>
          )}
        </div>

        {encryptedVotesList.length === 0 && (
          <div className="bg-[#0F1115] border border-[#232730] rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#08090B] border border-[#232730] flex items-center justify-center mx-auto text-[#8B909D]">
              <Users className="w-5 h-5 text-[#8B909D]" />
            </div>
            <div className="text-sm font-bold text-white uppercase tracking-wider">
              No Encrypted Ballots Recorded On-Chain
            </div>
            <p className="text-xs text-[#8B909D] max-w-md mx-auto leading-relaxed">
              The smart contract ballot box is currently empty. Open the election in Section 01 and submit ballots from whitelisted voter accounts to enable homomorphic tallying.
            </p>
          </div>
        )}

        {/* 2-Step Homomorphic Workflow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={handleComputeHomomorphicAddition}
            disabled={encryptedVotesList.length === 0 || isAggregating || !isAdmin}
            className="btn-pill-outline !min-h-[52px]"
          >
            {isAggregating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#C6FF00]" />
            ) : (
              <Cpu className="w-4 h-4 text-[#C6FF00]" />
            )}
            <span>Step 1: Aggregate Ciphertexts</span>
          </button>

          <button
            type="button"
            onClick={handleDecryptAndTally}
            disabled={!homomorphicSumCiphertext || !localPrivateKey || isDecrypting || !isAdmin}
            className="btn-pill-lime !min-h-[52px]"
          >
            {isDecrypting ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#08090B]" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
            <span>Step 2: Decrypt & Reveal Results</span>
          </button>
        </div>

        {/* Aggregated Ciphertext Box */}
        {homomorphicSumCiphertext && (
          <div className="bg-[#0F1115] border border-[#232730] rounded-2xl p-6 font-mono text-xs text-white space-y-3">
            <span className="text-[10px] text-[#8B909D] uppercase tracking-wider block">
              Aggregated Ciphertext Product (C_total = ∏ cᵢ mod n²)
            </span>
            <div className="break-all text-xs text-[#C6FF00] leading-relaxed">
              {truncateCiphertext(homomorphicSumCiphertext, 68)}
            </div>
            {decryptedSum !== null && (
              <div className="pt-3 border-t border-[#232730] flex items-center justify-between font-sans text-xs">
                <span className="text-[#8B909D]">Decrypted Plaintext Sum:</span>
                <span className="font-mono font-bold text-xl text-[#C6FF00]">{decryptedSum.toString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Certified Winner Showcase */}
        {tallyResults && tallyResults.length > 0 && (() => {
          const isTie = tallyResults.length > 1 && tallyResults[0].votes === tallyResults[1].votes && tallyResults[0].votes > 0;
          const isAllZero = tallyResults[0].votes === 0;

          return (
            <div className="space-y-6 pt-4 border-t border-[#232730]">
              {isAllZero ? (
                <div className="rounded-3xl bg-[#0F1115] border border-[#232730] p-8 text-center space-y-2">
                  <div className="text-xs font-mono uppercase tracking-widest text-[#8B909D]">Tally Result</div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tight">Zero Ballots Recorded</h4>
                  <p className="text-xs text-[#8B909D]">All candidates received 0 votes in this election cycle.</p>
                </div>
              ) : isTie ? (
                <div className="rounded-3xl bg-[#0F1115] border-2 border-[#C6FF00]/60 p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-[0_0_30px_rgba(198,255,0,0.15)]">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-[#C6FF00]">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-xs font-mono uppercase tracking-widest font-black">
                        Statistical Tie // Runoff Required
                      </span>
                    </div>
                    <h4 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                      {tallyResults.filter((c) => c.votes === tallyResults[0].votes).map((c) => c.name).join(' & ')}
                    </h4>
                    <p className="text-sm text-[#8B909D]">
                      Equal votes recorded for top nominees. A runoff or protocol tiebreaker is recommended.
                    </p>
                  </div>
                  <div className="sm:text-right flex-shrink-0">
                    <div className="text-5xl sm:text-6xl font-mono font-black text-[#C6FF00]">{tallyResults[0].votes}</div>
                    <div className="text-xs text-[#8B909D] font-mono uppercase tracking-wider">Tied Votes Each</div>
                  </div>
                </div>
              ) : (
                /* Monumental Winner Card with Neon Lime Ambient Glow */
                <div className="rounded-3xl bg-[#0F1115] border-2 border-[#C6FF00] p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-[0_0_40px_rgba(198,255,0,0.25)]">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-[#C6FF00]">
                      <Crown className="w-5 h-5 fill-current" />
                      <span className="text-xs font-mono uppercase tracking-widest font-black">
                        Certified Winner
                      </span>
                    </div>
                    <h4 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
                      {tallyResults[0].name}
                    </h4>
                    <p className="text-sm text-[#8B909D]">{tallyResults[0].role} · {tallyResults[0].platform}</p>
                  </div>
                  <div className="sm:text-right flex-shrink-0">
                    <div className="text-5xl sm:text-6xl font-mono font-black text-[#C6FF00]">{tallyResults[0].votes}</div>
                    <div className="text-xs text-[#8B909D] font-mono uppercase tracking-wider">Votes Certified</div>
                  </div>
                </div>
              )}

            {/* Candidate Breakdown */}
            <div className="space-y-4 bg-[#0F1115] border border-[#232730] rounded-2xl p-6 sm:p-8">
              {tallyResults.map((candidate, idx) => {
                const totalBallots = encryptedVotesList.length || 1;
                const pct = Math.round((candidate.votes / totalBallots) * 100);
                return (
                  <div key={candidate.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-bold text-white uppercase tracking-wide">{candidate.name}</span>
                      <span className="font-mono text-[#C6FF00] font-bold">
                        {candidate.votes} <span className="text-[#8B909D] font-normal font-sans">votes ({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-[#08090B] rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          idx === 0
                            ? 'bg-[#C6FF00] shadow-[0_0_10px_#C6FF00]'
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
        );
      })()}
      </section>

    </div>
  );
}
export default AdminView;
