import React, { useState, useEffect } from 'react';
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
  Copy,
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
  sendContractTransaction,
  formatContractError,
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
  const [isPublishingKey, setIsPublishingKey] = useState(false);

  // Election lifecycle
  const [isStartingElection, setIsStartingElection] = useState(false);
  const [isEndingElection, setIsEndingElection] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  // Whitelist
  const [singleVoterAddress, setSingleVoterAddress] = useState('');
  const [batchVoterAddresses, setBatchVoterAddresses] = useState('');
  const [isWhitelisting, setIsWhitelisting] = useState(false);

  // Tally & Decryption
  const [encryptedVotesList, setEncryptedVotesList] = useState([]);
  const [isLoadingVotes, setIsLoadingVotes] = useState(false);
  const [homomorphicSumCiphertext, setHomomorphicSumCiphertext] = useState('');
  const [isAggregating, setIsAggregating] = useState(false);
  const [decryptedSum, setDecryptedSum] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [tallyResults, setTallyResults] = useState(null);
  const [tallyMode, setTallyMode] = useState('radix');

  // Notifications
  const [successMsg, setSuccessMsg] = useState('');
  const [actionError, setActionError] = useState('');

  const notify = (msg) => {
    setSuccessMsg(msg);
    setActionError('');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

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

  // Paillier key generation
  const handleGenerateKeys = async () => {
    try {
      setIsGeneratingKeys(true);
      setActionError('');
      const { publicKey: pub, privateKey: priv } = await generatePaillierKeys(keyBitLength);
      setLocalPrivateKey(priv);
      const serPub = serializePublicKey(pub);
      const serPriv = serializePrivateKey(priv);
      sessionStorage.setItem('paillier_admin_pubkey_n', serPub.n);
      sessionStorage.setItem('paillier_admin_pubkey_g', serPub.g);
      sessionStorage.setItem('paillier_admin_privkey', JSON.stringify(serPriv));
      notify(`Generated ${keyBitLength}-bit Paillier keypair. Ready to publish on-chain.`);
    } catch (err) {
      setActionError('Key generation failed: ' + err.message);
    } finally {
      setIsGeneratingKeys(false);
    }
  };

  // Publish public key to smart contract with authoritative on-chain nonce
  const handlePublishKey = async () => {
    if (!contract) return;
    try {
      setIsPublishingKey(true);
      setActionError('');
      const pubN = localPrivateKey?.publicKey?.n?.toString() || sessionStorage.getItem('paillier_admin_pubkey_n');
      const pubG = localPrivateKey?.publicKey?.g?.toString() || sessionStorage.getItem('paillier_admin_pubkey_g');
      if (!pubN || !pubG) throw new Error('No key found. Please click "Generate Keys" first.');

      const tx = await sendContractTransaction(contract, 'setPaillierPublicKey', [pubN, pubG]);
      await tx.wait();

      notify('Paillier Public Key successfully published to Ethereum.');
      if (onRefreshContractData) onRefreshContractData();
    } catch (err) {
      console.error('Publish key error:', err);
      setActionError(formatContractError(err));
    } finally {
      setIsPublishingKey(false);
    }
  };

  // Start election with authoritative on-chain nonce
  const handleStartElection = async () => {
    if (!contract) return;
    try {
      setIsStartingElection(true);
      setActionError('');

      const tx = await sendContractTransaction(contract, 'startElection');
      await tx.wait();

      notify('Election is now OPEN. Whitelisted voters can cast encrypted ballots.');
      if (onRefreshContractData) onRefreshContractData();
    } catch (err) {
      console.error('Start election error:', err);
      setActionError(formatContractError(err));
    } finally {
      setIsStartingElection(false);
      setShowStartModal(false);
    }
  };

  // End election with authoritative on-chain nonce
  const handleEndElection = async () => {
    if (!contract) return;
    try {
      setIsEndingElection(true);
      setActionError('');

      const tx = await sendContractTransaction(contract, 'endElection');
      await tx.wait();

      notify('Election CLOSED. Homomorphic aggregation and tallying are now unlocked.');
      if (onRefreshContractData) onRefreshContractData();
      fetchEncryptedVotes();
    } catch (err) {
      console.error('End election error:', err);
      setActionError(formatContractError(err));
    } finally {
      setIsEndingElection(false);
      setShowEndModal(false);
    }
  };

  // Whitelist single voter with authoritative on-chain nonce
  const handleAddSingleVoter = async (e) => {
    e?.preventDefault();
    if (!contract || !singleVoterAddress) return;
    try {
      setIsWhitelisting(true);
      setActionError('');

      const targetAddr = singleVoterAddress.trim();
      const tx = await sendContractTransaction(contract, 'addVoter', [targetAddr]);
      await tx.wait();

      notify(`Address ${truncateAddress(targetAddr)} successfully whitelisted.`);
      setSingleVoterAddress('');
      if (onRefreshContractData) onRefreshContractData();
    } catch (err) {
      console.error('Add voter error:', err);
      setActionError(formatContractError(err));
    } finally {
      setIsWhitelisting(false);
    }
  };

  // Whitelist batch voters with authoritative on-chain nonce
  const handleBatchAddVoters = async (e) => {
    e?.preventDefault();
    if (!contract || !batchVoterAddresses) return;
    try {
      setIsWhitelisting(true);
      setActionError('');

      const addresses = batchVoterAddresses
        .split(/[\n,]+/)
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      if (addresses.length === 0) throw new Error('Please enter at least one valid address.');

      const tx = await sendContractTransaction(contract, 'batchAddVoters', [addresses]);
      await tx.wait();

      notify(`Successfully whitelisted batch of ${addresses.length} voters.`);
      setBatchVoterAddresses('');
      if (onRefreshContractData) onRefreshContractData();
    } catch (err) {
      console.error('Batch add voters error:', err);
      setActionError(formatContractError(err));
    } finally {
      setIsWhitelisting(false);
    }
  };

  // Step 1: Compute Homomorphic Addition off-chain
  const handleComputeHomomorphicAddition = () => {
    try {
      setIsAggregating(true);
      setActionError('');
      if (!publicKey) throw new Error('Paillier public key is not set on the smart contract.');
      if (encryptedVotesList.length === 0) throw new Error('No encrypted votes recorded on-chain.');

      const aggregateCiphertext = homomorphicAddition(publicKey, encryptedVotesList);
      setHomomorphicSumCiphertext(aggregateCiphertext.toString());
    } catch (err) {
      console.error('Aggregation error:', err);
      setActionError('Aggregation failed: ' + err.message);
    } finally {
      setIsAggregating(false);
    }
  };

  // Step 2: Decrypt Aggregate Ciphertext & Reveal Results
  const handleDecryptAndTally = () => {
    try {
      setIsDecrypting(true);
      setActionError('');
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
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#425B49', '#A77D60', '#DCDAD1', '#B7A6C2'],
      });
    } catch (err) {
      console.error('Decryption error:', err);
      setActionError('Decryption failed: ' + err.message);
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-7">
      {/* Confirmation Modal: Start Election */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 bg-[#292E2A]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F8F7F3] border border-[#CCCBC1] rounded-xl max-w-sm w-full p-6 space-y-4 shadow-popover">
            <h3 className="text-base font-semibold text-[#292E2A]">Open Voting Window?</h3>
            <p className="text-xs text-[#70736C] leading-relaxed">
              Opening the election enables whitelisted addresses to submit encrypted Paillier ballots. This action updates the on-chain state machine.
            </p>
            <div className="flex items-center justify-end space-x-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowStartModal(false)}
                disabled={isStartingElection}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartElection}
                disabled={isStartingElection}
                className="btn-primary"
              >
                {isStartingElection && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Open</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: End Election */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-[#292E2A]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F8F7F3] border border-[#CCCBC1] rounded-xl max-w-sm w-full p-6 space-y-4 shadow-popover">
            <h3 className="text-base font-semibold text-[#292E2A]">Close Voting Window?</h3>
            <p className="text-xs text-[#70736C] leading-relaxed">
              Closing the election permanently prevents further ballot submissions and seals the encrypted ballot pool, enabling off-chain homomorphic tallying.
            </p>
            <div className="flex items-center justify-end space-x-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                disabled={isEndingElection}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEndElection}
                disabled={isEndingElection}
                className="btn-destructive"
              >
                {isEndingElection && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Seal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editorial Page Header */}
      <div className="border-b border-[#CCCBC1] pb-5">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#A77D60]">
          Console
        </span>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#292E2A] tracking-tight mt-1">
          Election Administration
        </h1>
        <p className="text-xs text-[#70736C] mt-1 max-w-2xl leading-relaxed">
          Manage lifecycle state transitions, configure Paillier homomorphic parameters, authorize voter addresses, and compute aggregate results.
        </p>
      </div>

      {/* Non-Admin Warning Banner */}
      {!isAdmin && account && (
        <div className="p-4 rounded-md bg-[#F4EEE8] border border-[#DFCEBF] text-[#292E2A] flex items-start space-x-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#A77D60] mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-semibold text-[#A77D60] block">Connected Wallet is Not the Administrator</span>
            <p className="text-[#70736C] leading-relaxed">
              Your active address (<code className="font-mono text-[#292E2A]">{truncateAddress(account)}</code>) does not match the contract deployer (<code className="font-mono text-[#292E2A]">{truncateAddress(adminAddress)}</code>). Switch to Account #0 in MetaMask to authorize admin operations.
            </p>
          </div>
        </div>
      )}

      {/* Notification Alerts */}
      {successMsg && (
        <div className="p-3.5 rounded-md bg-[#E0E8DF] border border-[#BDCEBC] text-[#425B49] text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 rounded-md bg-[#F4EEE8] border border-[#DFCEBF] text-[#A77D60] text-xs flex items-center space-x-2 font-mono">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* ── Section 1: Election Lifecycle ──────────────────────────────── */}
      <section className="bg-[#E8E6DE] border border-[#CCCBC1] rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#CCCBC1] pb-3">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#70736C]">
            Election Lifecycle
          </h2>
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${isElectionOpen ? 'bg-[#425B49]' : 'bg-[#9A9C96]'}`} />
            <span className="font-medium text-[#292E2A]">
              {isElectionOpen ? 'POLLS OPEN' : 'POLLS CLOSED'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#70736C]">
          <span>Current On-Chain Ballots: <strong className="font-mono text-[#292E2A]">{encryptedVotesList.length}</strong></span>
          <span className="font-mono">{isElectionOpen ? 'Accepting encrypted ballots' : 'Ballot recording sealed'}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setShowStartModal(true)}
            disabled={isElectionOpen || isStartingElection || !isAdmin}
            className="btn-primary"
          >
            {isStartingElection ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Open Voting</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEndModal(true)}
            disabled={!isElectionOpen || isEndingElection || !isAdmin}
            className="btn-destructive"
          >
            {isEndingElection ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Square className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Close Voting</span>
          </button>
        </div>
      </section>

      {/* ── Section 2: Paillier Encryption Keys ────────────────────────── */}
      <section className="bg-[#E8E6DE] border border-[#CCCBC1] rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#CCCBC1] pb-3">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#70736C]">
            Paillier Cryptographic Keys
          </h2>
          <span className="text-xs font-mono text-[#70736C]">
            {publicKey ? 'Key Published On-Chain' : 'Key Not Published'}
          </span>
        </div>

        {/* Bitlength Segmented Control */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#70736C]">Key Bitlength</span>
          <div className="flex items-center space-x-1 bg-[#DCDAD1] p-1 rounded-md border border-[#CCCBC1]">
            {[512, 1024, 2048].map((bits) => (
              <button
                key={bits}
                type="button"
                onClick={() => setKeyBitLength(bits)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                  keyBitLength === bits
                    ? 'bg-[#F8F7F3] text-[#292E2A] font-semibold shadow-subtle border border-[#CCCBC1]'
                    : 'text-[#70736C] hover:text-[#292E2A]'
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
            disabled={isGeneratingKeys || !isAdmin}
            className="btn-secondary"
          >
            {isGeneratingKeys ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Key className="w-3.5 h-3.5 text-[#A77D60]" />
            )}
            <span>Generate {keyBitLength}-bit Keys</span>
          </button>

          <button
            type="button"
            onClick={handlePublishKey}
            disabled={isPublishingKey || (!localPrivateKey && !publicKey) || !isAdmin}
            className="btn-primary"
          >
            {isPublishingKey && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Publish Public Key On-Chain</span>
          </button>
        </div>

        {/* Key Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="bg-[#F8F7F3] p-3 rounded-md border border-[#CCCBC1]">
            <span className="text-[10px] text-[#9A9C96] font-mono uppercase block mb-0.5">Modulus n</span>
            <span className="font-mono text-[11px] text-[#292E2A] truncate block font-medium">
              {publicKey ? truncateCiphertext(publicKey.n.toString(), 18) : 'Not published'}
            </span>
          </div>
          <div className="bg-[#F8F7F3] p-3 rounded-md border border-[#CCCBC1]">
            <span className="text-[10px] text-[#9A9C96] font-mono uppercase block mb-0.5">Private Key (λ, μ)</span>
            <span className="font-mono text-[11px] text-[#425B49] truncate block font-medium">
              {localPrivateKey ? 'Active in Session Storage' : 'Not Generated'}
            </span>
          </div>
        </div>
      </section>

      {/* ── Section 3: Voter Access Whitelist ─────────────────────────── */}
      <section className="bg-[#E8E6DE] border border-[#CCCBC1] rounded-xl p-5 sm:p-6 space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-[#70736C] border-b border-[#CCCBC1] pb-3">
          Voter Access Whitelist
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Single Address */}
          <form onSubmit={handleAddSingleVoter} className="space-y-2 bg-[#F8F7F3] p-4 rounded-lg border border-[#CCCBC1]">
            <label className="text-xs text-[#70736C] block font-medium">Single Address</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="0x…"
                value={singleVoterAddress}
                onChange={(e) => setSingleVoterAddress(e.target.value)}
                className="flex-1 px-3 py-2 rounded-md bg-[#F1EFE8] border border-[#CCCBC1] text-[#292E2A] placeholder-[#9A9C96] font-mono text-xs focus:outline-none focus:border-[#425B49]"
              />
              <button
                type="submit"
                disabled={isWhitelisting || !singleVoterAddress || !isAdmin}
                className="btn-primary min-h-[38px] px-3.5"
              >
                {isWhitelisting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>Add</span>
              </button>
            </div>
          </form>

          {/* Batch Addresses */}
          <form onSubmit={handleBatchAddVoters} className="space-y-2 bg-[#F8F7F3] p-4 rounded-lg border border-[#CCCBC1]">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#70736C] font-medium">Batch Addresses</label>
              <button
                type="button"
                onClick={() =>
                  setBatchVoterAddresses(
                    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8\n0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC\n0x90F79bf6EB2c4f870365E785982E1f101E93b906'
                  )
                }
                className="text-[11px] text-[#A77D60] hover:underline font-mono"
              >
                Auto-fill test accounts
              </button>
            </div>
            <textarea
              rows={2}
              placeholder="0x7099…&#10;0x3C44…"
              value={batchVoterAddresses}
              onChange={(e) => setBatchVoterAddresses(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-[#F1EFE8] border border-[#CCCBC1] text-[#292E2A] placeholder-[#9A9C96] font-mono text-xs focus:outline-none focus:border-[#425B49] resize-none"
            />
            <button
              type="submit"
              disabled={isWhitelisting || !batchVoterAddresses || !isAdmin}
              className="btn-secondary w-full min-h-[38px]"
            >
              {isWhitelisting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5 text-[#425B49]" />}
              <span>Batch Whitelist Addresses</span>
            </button>
          </form>
        </div>
      </section>

      {/* ── Section 4: Homomorphic Tally & Results ─────────────────────── */}
      <section className="bg-[#E8E6DE] border border-[#CCCBC1] rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#CCCBC1] pb-3">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#70736C]">
            Homomorphic Tally & Results
          </h2>
          <div className="flex items-center space-x-2">
            {/* Scheme Selector */}
            <div className="flex items-center space-x-1 bg-[#DCDAD1] p-1 rounded-md border border-[#CCCBC1]">
              <button
                type="button"
                onClick={() => setTallyMode('radix')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                  tallyMode === 'radix'
                    ? 'bg-[#F8F7F3] text-[#292E2A] font-medium shadow-subtle border border-[#CCCBC1]'
                    : 'text-[#70736C] hover:text-[#292E2A]'
                }`}
              >
                Radix Multi
              </button>
              <button
                type="button"
                onClick={() => setTallyMode('simple')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                  tallyMode === 'simple'
                    ? 'bg-[#F8F7F3] text-[#292E2A] font-medium shadow-subtle border border-[#CCCBC1]'
                    : 'text-[#70736C] hover:text-[#292E2A]'
                }`}
              >
                Linear
              </button>
            </div>
            <button
              type="button"
              onClick={fetchEncryptedVotes}
              disabled={isLoadingVotes}
              className="p-1.5 rounded-md bg-[#F8F7F3] hover:bg-[#DCDAD1] border border-[#CCCBC1] text-[#70736C] transition-colors"
              title="Refresh ballots from blockchain"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVotes ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="text-xs text-[#70736C] font-mono">
          {encryptedVotesList.length} encrypted ballot{encryptedVotesList.length !== 1 ? 's' : ''} stored on-chain
          {!isElectionOpen && encryptedVotesList.length > 0 && (
            <span className="text-[#425B49] ml-2 font-medium">— Ready to aggregate and decrypt</span>
          )}
        </div>

        {/* 2-Step Homomorphic Workflow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleComputeHomomorphicAddition}
            disabled={encryptedVotesList.length === 0 || isAggregating || !isAdmin}
            className="btn-secondary"
          >
            {isAggregating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Cpu className="w-3.5 h-3.5 text-[#425B49]" />
            )}
            <span>Step 1: Aggregate Ciphertexts</span>
          </button>

          <button
            type="button"
            onClick={handleDecryptAndTally}
            disabled={!homomorphicSumCiphertext || !localPrivateKey || isDecrypting || !isAdmin}
            className="btn-primary"
          >
            {isDecrypting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-[#F1EFE8]" />
            )}
            <span>Step 2: Decrypt & Reveal Results</span>
          </button>
        </div>

        {/* Aggregated Ciphertext Box */}
        {homomorphicSumCiphertext && (
          <div className="bg-[#F8F7F3] border border-[#CCCBC1] rounded-md p-4 font-mono text-xs text-[#292E2A] space-y-2">
            <span className="text-[10px] text-[#9A9C96] uppercase tracking-wider block">
              Aggregated Ciphertext Product (C_total = ∏ cᵢ mod n²)
            </span>
            <div className="break-all text-[11px] leading-relaxed">
              {truncateCiphertext(homomorphicSumCiphertext, 44)}
            </div>
            {decryptedSum !== null && (
              <div className="pt-2 border-t border-[#CCCBC1] flex items-center justify-between font-sans text-xs">
                <span className="text-[#70736C]">Decrypted Plaintext Sum:</span>
                <span className="font-mono font-bold text-base text-[#425B49]">{decryptedSum.toString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Certified Results Presentation */}
        {tallyResults && tallyResults.length > 0 && (
          <div className="space-y-4 pt-3 border-t border-[#CCCBC1]">
            {/* Winner Spotlight */}
            <div className="rounded-lg bg-[#F8F7F3] border-2 border-[#425B49] p-5 flex items-center justify-between gap-4 shadow-card">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#425B49] block mb-0.5 font-semibold">
                  Certified Winner
                </span>
                <h4 className="text-lg font-semibold text-[#292E2A] tracking-tight">{tallyResults[0].name}</h4>
                <p className="text-xs text-[#70736C] mt-0.5">{tallyResults[0].role} · {tallyResults[0].platform}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-3xl font-mono font-semibold text-[#425B49]">{tallyResults[0].votes}</div>
                <div className="text-[10px] text-[#9A9C96] font-mono uppercase tracking-wider">Votes</div>
              </div>
            </div>

            {/* Candidate Breakdown */}
            <div className="space-y-3 bg-[#F8F7F3] border border-[#CCCBC1] rounded-lg p-4">
              {tallyResults.map((candidate, idx) => {
                const totalBallots = encryptedVotesList.length || 1;
                const pct = Math.round((candidate.votes / totalBallots) * 100);
                return (
                  <div key={candidate.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#292E2A]">{candidate.name}</span>
                      <span className="font-mono text-[#292E2A]">
                        {candidate.votes} <span className="text-[#9A9C96] font-normal font-sans">votes ({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-[#E8E6DE] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${idx === 0 ? 'bg-[#425B49]' : 'bg-[#A77D60]'}`}
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
