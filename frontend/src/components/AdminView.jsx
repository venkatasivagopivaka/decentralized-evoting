import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Play, 
  Square, 
  Key, 
  UserPlus, 
  Users, 
  Cpu, 
  Trophy, 
  Lock, 
  Unlock, 
  RefreshCw, 
  CheckCircle, 
  Copy, 
  Sparkles,
  AlertTriangle,
  Award
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
  decodeSimpleTally 
} from '../utils/crypto';
import { truncateAddress, truncateCiphertext } from '../utils/contract';

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

  // Election state actions
  const [isStartingElection, setIsStartingElection] = useState(false);
  const [isEndingElection, setIsEndingElection] = useState(false);

  // Whitelist state
  const [singleVoterAddress, setSingleVoterAddress] = useState('');
  const [batchVoterAddresses, setBatchVoterAddresses] = useState('');
  const [isWhitelisting, setIsWhitelisting] = useState(false);
  const [whitelistSuccessMsg, setWhitelistSuccessMsg] = useState('');

  // Encrypted votes & tally state
  const [encryptedVotesList, setEncryptedVotesList] = useState([]);
  const [isLoadingVotes, setIsLoadingVotes] = useState(false);
  const [homomorphicSumCiphertext, setHomomorphicSumCiphertext] = useState('');
  const [isAggregating, setIsAggregating] = useState(false);
  const [decryptedSum, setDecryptedSum] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [tallyResults, setTallyResults] = useState(null);
  const [tallyMode, setTallyMode] = useState('radix'); // 'radix' or 'simple'

  // Notification / Error state
  const [actionError, setActionError] = useState('');

  // Load private key from sessionStorage if available
  useEffect(() => {
    try {
      const savedPriv = sessionStorage.getItem('paillier_admin_privkey');
      const savedPubN = sessionStorage.getItem('paillier_admin_pubkey_n');
      const savedPubG = sessionStorage.getItem('paillier_admin_pubkey_g');
      if (savedPriv && savedPubN && savedPubG) {
        const pub = deserializePublicKey(savedPubN, savedPubG);
        const priv = deserializePrivateKey(JSON.parse(savedPriv), pub);
        if (priv) {
          setLocalPrivateKey(priv);
        }
      }
    } catch (err) {
      console.warn("Could not restore private key from storage:", err);
    }
  }, []);

  // Fetch encrypted votes whenever election ends or on mount
  const fetchEncryptedVotes = async () => {
    if (!contract) return;
    try {
      setIsLoadingVotes(true);
      const votes = await contract.getEncryptedVotes();
      setEncryptedVotesList(Array.from(votes));
    } catch (err) {
      console.error("Error fetching encrypted votes:", err);
    } finally {
      setIsLoadingVotes(false);
    }
  };

  useEffect(() => {
    fetchEncryptedVotes();
  }, [contract, isElectionOpen]);

  // Handle Paillier Key Generation
  const handleGenerateKeys = async () => {
    try {
      setIsGeneratingKeys(true);
      setActionError('');
      const { publicKey: pub, privateKey: priv } = await generatePaillierKeys(keyBitLength);
      setLocalPrivateKey(priv);

      // Save to sessionStorage
      const serPub = serializePublicKey(pub);
      const serPriv = serializePrivateKey(priv);
      sessionStorage.setItem('paillier_admin_pubkey_n', serPub.n);
      sessionStorage.setItem('paillier_admin_pubkey_g', serPub.g);
      sessionStorage.setItem('paillier_admin_privkey', JSON.stringify(serPriv));

      setWhitelistSuccessMsg(`Generated ${keyBitLength}-bit Paillier keypair. Ready to publish on-chain.`);
      setTimeout(() => setWhitelistSuccessMsg(''), 5000);
    } catch (err) {
      console.error("Key generation error:", err);
      setActionError("Failed to generate Paillier keys: " + err.message);
    } finally {
      setIsGeneratingKeys(false);
    }
  };

  // Publish Public Key to Contract
  const handlePublishKey = async () => {
    if (!contract) return;
    try {
      setIsPublishingKey(true);
      setActionError('');

      const pubN = localPrivateKey?.publicKey?.n?.toString() || sessionStorage.getItem('paillier_admin_pubkey_n');
      const pubG = localPrivateKey?.publicKey?.g?.toString() || sessionStorage.getItem('paillier_admin_pubkey_g');

      if (!pubN || !pubG) {
        throw new Error("No key found. Please click 'Generate Paillier Keys' first.");
      }

      const tx = await contract.setPaillierPublicKey(pubN, pubG);
      await tx.wait();

      setWhitelistSuccessMsg("Paillier Public Key successfully published to Ethereum.");
      setTimeout(() => setWhitelistSuccessMsg(''), 5000);
      if (onRefreshContractData) onRefreshContractData();
    } catch (err) {
      console.error("Publish key error:", err);
      setActionError(err?.reason || err?.message || "Failed to publish public key.");
    } finally {
      setIsPublishingKey(false);
    }
  };

  // Election Lifecycle: Start
  const handleStartElection = async () => {
    if (!contract) return;
    try {
      setIsStartingElection(true);
      setActionError('');
      const tx = await contract.startElection();
      await tx.wait();
      setWhitelistSuccessMsg("Election is now OPEN. Whitelisted voters may cast encrypted ballots.");
      setTimeout(() => setWhitelistSuccessMsg(''), 5000);
      if (onRefreshContractData) onRefreshContractData();
    } catch (err) {
      console.error("Start election error:", err);
      setActionError(err?.reason || err?.message || "Failed to start election.");
    } finally {
      setIsStartingElection(false);
    }
  };

  // Election Lifecycle: End
  const handleEndElection = async () => {
    if (!contract) return;
    try {
      setIsEndingElection(true);
      setActionError('');
      const tx = await contract.endElection();
      await tx.wait();
      setWhitelistSuccessMsg("Election is now CLOSED. You can now execute homomorphic tallying.");
      setTimeout(() => setWhitelistSuccessMsg(''), 5000);
      if (onRefreshContractData) onRefreshContractData();
      fetchEncryptedVotes();
    } catch (err) {
      console.error("End election error:", err);
      setActionError(err?.reason || err?.message || "Failed to end election.");
    } finally {
      setIsEndingElection(false);
    }
  };

  // Whitelist single voter
  const handleAddSingleVoter = async (e) => {
    e?.preventDefault();
    if (!contract || !singleVoterAddress) return;
    try {
      setIsWhitelisting(true);
      setActionError('');
      const tx = await contract.addVoter(singleVoterAddress.trim());
      await tx.wait();
      setWhitelistSuccessMsg(`Address ${truncateAddress(singleVoterAddress.trim())} has been whitelisted.`);
      setSingleVoterAddress('');
      setTimeout(() => setWhitelistSuccessMsg(''), 5000);
      if (onRefreshContractData) onRefreshContractData();
    } catch (err) {
      console.error("Add voter error:", err);
      setActionError(err?.reason || err?.message || "Failed to whitelist voter.");
    } finally {
      setIsWhitelisting(false);
    }
  };

  // Whitelist batch voters
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

      if (addresses.length === 0) {
        throw new Error("Please enter at least one valid address.");
      }

      const tx = await contract.batchAddVoters(addresses);
      await tx.wait();
      setWhitelistSuccessMsg(`Successfully whitelisted batch of ${addresses.length} voters.`);
      setBatchVoterAddresses('');
      setTimeout(() => setWhitelistSuccessMsg(''), 5000);
      if (onRefreshContractData) onRefreshContractData();
    } catch (err) {
      console.error("Batch add voters error:", err);
      setActionError(err?.reason || err?.message || "Failed to batch whitelist voters.");
    } finally {
      setIsWhitelisting(false);
    }
  };

  // Step 1: Compute Homomorphic Addition off-chain
  const handleComputeHomomorphicAddition = () => {
    try {
      setIsAggregating(true);
      setActionError('');

      if (!publicKey) {
        throw new Error("Election public key is not set on the smart contract.");
      }
      if (encryptedVotesList.length === 0) {
        throw new Error("No votes have been cast in this election.");
      }

      const aggregateCiphertext = homomorphicAddition(publicKey, encryptedVotesList);
      setHomomorphicSumCiphertext(aggregateCiphertext.toString());
    } catch (err) {
      console.error("Homomorphic aggregation error:", err);
      setActionError("Aggregation failed: " + err.message);
    } finally {
      setIsAggregating(false);
    }
  };

  // Step 2 & 3: Decrypt Aggregate Ciphertext & Reveal Winner
  const handleDecryptAndTally = () => {
    try {
      setIsDecrypting(true);
      setActionError('');

      if (!localPrivateKey) {
        throw new Error("Admin Paillier Private Key is required in session to decrypt the tally.");
      }
      if (!homomorphicSumCiphertext) {
        throw new Error("Please compute the homomorphic addition of ciphertexts first.");
      }

      const rawSum = decryptTally(localPrivateKey, homomorphicSumCiphertext);
      setDecryptedSum(rawSum);

      let results = [];
      if (tallyMode === 'radix') {
        const decoded = decodeRadixTally(rawSum, CANDIDATES.length, RADIX_BASE);
        results = CANDIDATES.map((cand) => {
          const match = decoded.find((d) => d.candidateId === cand.id);
          return {
            ...cand,
            votes: match ? match.count : 0,
          };
        });
      } else {
        const decoded = decodeSimpleTally(rawSum, encryptedVotesList.length);
        results = CANDIDATES.slice(0, 2).map((cand) => {
          const match = decoded.find((d) => d.candidateId === cand.id);
          return {
            ...cand,
            votes: match ? match.count : 0,
          };
        });
      }

      results.sort((a, b) => b.votes - a.votes);
      setTallyResults(results);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#087F6A', '#4959C8', '#D99A35', '#202B2A'],
      });
    } catch (err) {
      console.error("Decryption error:", err);
      setActionError("Decryption failed: " + err.message);
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* Non-Admin Warning Banner */}
      {!isAdmin && account && (
        <div className="p-4 rounded-xl bg-saffron-light border border-saffron-border text-ink flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-saffron-dark mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-saffron-dark">Connected Account is Not Election Administrator</span>
            <p className="text-xs text-ink-secondary mt-0.5">
              Your connected account ({truncateAddress(account)}) is not the contract administrator ({truncateAddress(adminAddress)}).
              Admin transactions (whitelisting voters, starting/ending elections, setting keys) will revert if submitted from non-admin accounts.
              Please switch accounts in MetaMask to the deployer account (Hardhat Account #0).
            </p>
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {whitelistSuccessMsg && (
        <div className="p-4 rounded-xl bg-jade-light border border-jade-border text-jade-dark text-xs flex items-center space-x-2 font-medium">
          <CheckCircle className="w-4 h-4 text-jade flex-shrink-0" />
          <span>{whitelistSuccessMsg}</span>
        </div>
      )}

      {/* Error Notification Alert */}
      {actionError && (
        <div className="p-4 rounded-xl bg-crimson-light border border-crimson-border text-crimson text-xs flex items-center space-x-2 font-medium">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Top Grid: Election Phase & Paillier Keys */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Election Lifecycle Controls */}
        <div className="panel-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-surface-border pb-3.5">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-light text-indigo flex items-center justify-center">
                <Cpu className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Election Lifecycle Control</h3>
                <p className="text-xs text-ink-muted">On-chain state machine</p>
              </div>
            </div>
            <div
              className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                isElectionOpen
                  ? 'bg-jade-light text-jade-dark border-jade-border'
                  : 'bg-surface-inset text-ink-muted border-surface-border'
              }`}
            >
              {isElectionOpen ? '● Active' : '○ Closed'}
            </div>
          </div>

          <p className="text-xs text-ink-secondary leading-relaxed">
            When <span className="font-semibold text-jade">Open</span>, verified voter accounts can broadcast encrypted ciphertexts to the contract.
            When <span className="font-semibold text-ink">Closed</span>, no new ballots are accepted, enabling deterministic homomorphic summation.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleStartElection}
              disabled={isElectionOpen || isStartingElection}
              className={`py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center space-x-2 transition-all ${
                !isElectionOpen && !isStartingElection
                  ? 'bg-jade hover:bg-jade-hover text-white shadow-subtle'
                  : 'bg-surface-inset text-ink-muted cursor-not-allowed border border-surface-border'
              }`}
            >
              {isStartingElection ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Start Election</span>
            </button>

            <button
              onClick={handleEndElection}
              disabled={!isElectionOpen || isEndingElection}
              className={`py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center space-x-2 transition-all ${
                isElectionOpen && !isEndingElection
                  ? 'bg-surface-card hover:bg-crimson-light text-crimson border border-crimson-border shadow-subtle'
                  : 'bg-surface-inset text-ink-muted cursor-not-allowed border border-surface-border'
              }`}
            >
              {isEndingElection ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Square className="w-3.5 h-3.5 fill-current" />
              )}
              <span>End Election</span>
            </button>
          </div>
        </div>

        {/* Card 2: Paillier Key Management */}
        <div className="panel-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-surface-border pb-3.5">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-jade-light text-jade flex items-center justify-center">
                <Key className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Paillier Key Management</h3>
                <p className="text-xs text-ink-muted">Asymmetric homomorphic keypair</p>
              </div>
            </div>
            <div className="text-xs font-mono text-ink-secondary bg-surface-inset px-2 py-0.5 rounded border border-surface-border">
              {publicKey ? 'Key Published' : 'No Key On-Chain'}
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleGenerateKeys}
              disabled={isGeneratingKeys}
              className="flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold bg-indigo hover:bg-indigo-hover text-white flex items-center justify-center space-x-1.5 shadow-subtle"
            >
              {isGeneratingKeys ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Generate {keyBitLength}-bit Keys</span>
            </button>

            <button
              onClick={handlePublishKey}
              disabled={isPublishingKey || (!localPrivateKey && !publicKey)}
              className="py-2.5 px-3.5 rounded-lg text-xs font-semibold bg-surface-card hover:bg-surface-inset text-jade border border-jade-border flex items-center space-x-1.5 disabled:opacity-50 shadow-subtle"
            >
              {isPublishingKey ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span>Publish to Contract</span>
            </button>
          </div>

          {/* Key Status Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-surface-subtle p-3 rounded-lg border border-surface-border">
              <span className="text-[11px] text-ink-muted uppercase font-semibold block mb-0.5">Public Modulus (n)</span>
              <span className="font-mono text-ink block truncate">
                {publicKey ? truncateCiphertext(publicKey.n.toString(), 14) : 'Not published'}
              </span>
            </div>
            <div className="bg-surface-subtle p-3 rounded-lg border border-surface-border">
              <span className="text-[11px] text-ink-muted uppercase font-semibold block mb-0.5">Private Key (λ, μ)</span>
              <span className="font-mono text-jade-dark font-medium block truncate">
                {localPrivateKey ? 'Active in Session' : 'Not Loaded'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Voter Whitelisting Center */}
      <section className="panel-card p-6 sm:p-7 space-y-6">
        <div className="flex items-center space-x-3 border-b border-surface-border pb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-light text-indigo flex items-center justify-center">
            <Users className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">Voter Whitelisting Engine</h3>
            <p className="text-xs text-ink-muted">Authorize voter addresses on Ethereum to submit encrypted ballots</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Single Voter Whitelist */}
          <form onSubmit={handleAddSingleVoter} className="space-y-3">
            <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
              Whitelist Individual Address
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="0x..."
                value={singleVoterAddress}
                onChange={(e) => setSingleVoterAddress(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-surface-subtle border border-surface-border text-ink placeholder-ink-muted font-mono text-xs focus:outline-none focus:border-jade focus:bg-surface-card"
              />
              <button
                type="submit"
                disabled={isWhitelisting || !singleVoterAddress}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-jade hover:bg-jade-hover text-white flex items-center space-x-1.5 disabled:opacity-50 shadow-subtle"
              >
                {isWhitelisting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>Add</span>
              </button>
            </div>
            <p className="text-[11px] text-ink-muted">
              Calls contract method <code className="text-ink font-semibold">addVoter(address)</code>.
            </p>
          </form>

          {/* Batch Voter Whitelist */}
          <form onSubmit={handleBatchAddVoters} className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                Batch Whitelist (Comma or Newline Separated)
              </label>
              <button
                type="button"
                onClick={() => {
                  setBatchVoterAddresses(
                    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8\n0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC\n0x90F79bf6EB2c4f870365E785982E1f101E93b906"
                  );
                }}
                className="text-[11px] text-jade hover:text-jade-hover underline font-medium"
              >
                Fill Hardhat Test Accounts
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="0x709979...&#10;0x3C44Cd...&#10;0x90F79b..."
              value={batchVoterAddresses}
              onChange={(e) => setBatchVoterAddresses(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-surface-subtle border border-surface-border text-ink placeholder-ink-muted font-mono text-xs focus:outline-none focus:border-jade focus:bg-surface-card"
            />
            <button
              type="submit"
              disabled={isWhitelisting || !batchVoterAddresses}
              className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-surface-subtle hover:bg-surface-inset text-ink border border-surface-border flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              {isWhitelisting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5 text-indigo" />}
              <span>Batch Whitelist Addresses</span>
            </button>
          </form>
        </div>
      </section>

      {/* Encrypted Ballots Ledger & Homomorphic Tallying */}
      <section className="panel-card p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-saffron-light text-saffron-dark flex items-center justify-center">
              <Trophy className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">Homomorphic Tally & Winner Decryption</h3>
              <p className="text-xs text-ink-muted">Aggregate encrypted ballots directly in ciphertext space off-chain</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-ink-muted font-medium">Scheme:</span>
            <div className="flex items-center space-x-1 bg-surface-inset p-1 rounded-md border border-surface-border text-xs">
              <button
                onClick={() => setTallyMode('radix')}
                className={`px-2.5 py-1 rounded text-xs font-medium ${
                  tallyMode === 'radix'
                    ? 'bg-surface-card text-ink shadow-subtle font-semibold border border-surface-border'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Radix Multi
              </button>
              <button
                onClick={() => setTallyMode('simple')}
                className={`px-2.5 py-1 rounded text-xs font-medium ${
                  tallyMode === 'simple'
                    ? 'bg-surface-card text-ink shadow-subtle font-semibold border border-surface-border'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Linear (A=1, B=2)
              </button>
            </div>
            <button
              onClick={fetchEncryptedVotes}
              disabled={isLoadingVotes}
              className="p-1.5 rounded-lg bg-surface-subtle hover:bg-surface-inset text-ink-secondary border border-surface-border"
              title="Refresh Ballots"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVotes ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Ledger Overview Card */}
        <div className="bg-surface-subtle rounded-lg p-4 border border-surface-border flex items-center justify-between">
          <div>
            <span className="text-[11px] text-ink-muted uppercase font-semibold">Total Encrypted Ballots:</span>
            <div className="text-2xl font-bold text-ink font-mono mt-0.5">
              {encryptedVotesList.length} <span className="text-xs text-ink-secondary font-sans font-normal">ballots cast</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-ink-muted uppercase font-semibold">Ready for Tally:</span>
            <div className={`text-xs font-bold mt-0.5 ${
              !isElectionOpen && encryptedVotesList.length > 0 ? 'text-jade' : 'text-saffron-dark'
            }`}>
              {!isElectionOpen && encryptedVotesList.length > 0
                ? 'Yes (Election Closed)'
                : isElectionOpen
                ? 'No (Close Election First)'
                : 'No Ballots Recorded'}
            </div>
          </div>
        </div>

        {/* Step-by-Step Tally Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleComputeHomomorphicAddition}
            disabled={encryptedVotesList.length === 0 || isAggregating}
            className={`py-3 px-4 rounded-lg font-semibold text-xs flex items-center justify-center space-x-2 transition-all ${
              encryptedVotesList.length > 0 && !isAggregating
                ? 'bg-surface-subtle hover:bg-surface-inset text-ink border border-surface-border shadow-subtle'
                : 'bg-surface-inset text-ink-muted cursor-not-allowed border border-surface-border'
            }`}
          >
            {isAggregating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-jade" />
            ) : (
              <Cpu className="w-3.5 h-3.5 text-jade" />
            )}
            <span>Step 1: Compute Homomorphic Sum (∏ cᵢ mod n²)</span>
          </button>

          <button
            onClick={handleDecryptAndTally}
            disabled={!homomorphicSumCiphertext || !localPrivateKey || isDecrypting}
            className={`py-3 px-4 rounded-lg font-semibold text-xs flex items-center justify-center space-x-2 transition-all ${
              homomorphicSumCiphertext && localPrivateKey && !isDecrypting
                ? 'bg-jade hover:bg-jade-hover text-white shadow-subtle'
                : 'bg-surface-inset text-ink-muted cursor-not-allowed border border-surface-border'
            }`}
          >
            {isDecrypting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
            <span>Step 2 & 3: Decrypt Tally & Declare Winner</span>
          </button>
        </div>

        {/* Aggregated Ciphertext Box */}
        {homomorphicSumCiphertext && (
          <div className="space-y-2 bg-surface-subtle p-4 rounded-lg border border-surface-border font-mono text-xs">
            <span className="text-ink-muted block font-semibold text-[11px] uppercase tracking-wider">
              Aggregated Ciphertext (C_total = c₁ · c₂ · ... mod n²):
            </span>
            <div className="break-all text-ink text-[11px]">
              {truncateCiphertext(homomorphicSumCiphertext, 44)}
            </div>
            {decryptedSum !== null && (
              <div className="pt-2 border-t border-surface-border flex items-center justify-between text-xs">
                <span className="text-ink-muted">Decrypted Plaintext Sum (M_total):</span>
                <span className="text-jade font-bold text-sm">{decryptedSum.toString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Election Results & Winner Presentation */}
        {tallyResults && tallyResults.length > 0 && (
          <div className="space-y-5 pt-3 border-t border-surface-border">
            {/* Editorial Winner Card */}
            <div className="rounded-xl bg-surface-subtle p-6 border-2 border-saffron-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-saffron-light border border-saffron-border flex items-center justify-center text-2xl">
                  👑
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-saffron-dark block">
                    Winner Declared
                  </span>
                  <h4 className="text-xl font-bold text-ink">
                    {tallyResults[0].name}
                  </h4>
                  <p className="text-xs text-ink-secondary">{tallyResults[0].role} · {tallyResults[0].platform}</p>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-surface-border sm:pl-6">
                <div className="text-3xl font-extrabold text-jade font-mono">
                  {tallyResults[0].votes}
                </div>
                <div className="text-[10px] text-ink-muted uppercase font-semibold">Total Verified Votes</div>
              </div>
            </div>

            {/* Candidate Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tallyResults.map((candidate, idx) => {
                const totalBallots = encryptedVotesList.length || 1;
                const percentage = Math.round((candidate.votes / totalBallots) * 100);

                return (
                  <div
                    key={candidate.id}
                    className="bg-surface-card rounded-lg p-4 border border-surface-border space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{candidate.avatar}</span>
                        <div>
                          <span className="font-semibold text-xs text-ink block">{candidate.name}</span>
                          <span className="text-[10px] text-ink-muted">{candidate.role}</span>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-bold text-ink">
                        {candidate.votes} <span className="text-[10px] text-ink-muted font-normal">votes</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-surface-inset rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0 ? 'bg-jade' : 'bg-indigo'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-ink-muted">
                      <span>Vote Share:</span>
                      <span className="font-semibold text-ink">{percentage}%</span>
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
