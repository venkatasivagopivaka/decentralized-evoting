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
  Download,
  AlertTriangle
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
      // Generate keys
      const { publicKey: pub, privateKey: priv } = await generatePaillierKeys(keyBitLength);
      setLocalPrivateKey(priv);

      // Save to sessionStorage
      const serPub = serializePublicKey(pub);
      const serPriv = serializePrivateKey(priv);
      sessionStorage.setItem('paillier_admin_pubkey_n', serPub.n);
      sessionStorage.setItem('paillier_admin_pubkey_g', serPub.g);
      sessionStorage.setItem('paillier_admin_privkey', JSON.stringify(serPriv));

      setWhitelistSuccessMsg(`Generated new ${keyBitLength}-bit Paillier keypair! You can now publish it on-chain.`);
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

      // Look for public key either in local private key object or stored in sessionStorage
      const pubN = localPrivateKey?.publicKey?.n?.toString() || sessionStorage.getItem('paillier_admin_pubkey_n');
      const pubG = localPrivateKey?.publicKey?.g?.toString() || sessionStorage.getItem('paillier_admin_pubkey_g');

      if (!pubN || !pubG) {
        throw new Error("No public key found. Please generate a Paillier keypair first.");
      }

      const tx = await contract.setPaillierPublicKey(pubN, pubG);
      await tx.wait();

      setWhitelistSuccessMsg("Paillier Public Key successfully published to Ethereum!");
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
      setWhitelistSuccessMsg("Election is now OPEN! Whitelisted voters may cast ballots.");
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
      setWhitelistSuccessMsg("Election is now CLOSED! You may now perform homomorphic tallying.");
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
      setWhitelistSuccessMsg(`Address ${truncateAddress(singleVoterAddress.trim())} has been whitelisted!`);
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
      setWhitelistSuccessMsg(`Successfully whitelisted batch of ${addresses.length} voters!`);
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
        throw new Error("Election public key is not set.");
      }
      if (encryptedVotesList.length === 0) {
        throw new Error("No votes have been cast yet.");
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
        throw new Error("Admin Paillier Private Key is required to decrypt the aggregate tally.");
      }
      if (!homomorphicSumCiphertext) {
        throw new Error("Please compute the homomorphic addition of ciphertexts first.");
      }

      // Decrypt aggregate sum
      const rawSum = decryptTally(localPrivateKey, homomorphicSumCiphertext);
      setDecryptedSum(rawSum);

      // Decode according to scheme
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
        // Simple linear scheme
        const decoded = decodeSimpleTally(rawSum, encryptedVotesList.length);
        results = CANDIDATES.slice(0, 2).map((cand) => {
          const match = decoded.find((d) => d.candidateId === cand.id);
          return {
            ...cand,
            votes: match ? match.count : 0,
          };
        });
      }

      // Sort by highest votes
      results.sort((a, b) => b.votes - a.votes);
      setTallyResults(results);

      // Trigger celebratory confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error("Decryption error:", err);
      setActionError("Decryption failed: " + err.message);
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      {/* Non-Admin Warning Banner */}
      {!isAdmin && account && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Connected Account is Not Election Admin</span>
            <p className="text-xs text-amber-200/80 mt-1">
              Your connected account ({truncateAddress(account)}) is not the contract administrator ({truncateAddress(adminAddress)}).
              Admin operations (whitelisting voters, starting/ending elections, publishing public keys) will revert if submitted from non-admin accounts.
              Please switch accounts in MetaMask to the deployer account (Hardhat Account #0).
            </p>
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {whitelistSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{whitelistSuccessMsg}</span>
        </div>
      )}

      {/* Error Notification Alert */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Grid: Election Controls & Paillier Key Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Election Lifecycle Controls */}
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Election Lifecycle Control</h3>
                <p className="text-xs text-slate-400">Smart contract state management</p>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                isElectionOpen
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 glow-badge-emerald'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isElectionOpen ? '● Election Open' : '○ Election Closed'}
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-300">
            <p className="text-xs text-slate-400 leading-relaxed">
              When an election is <span className="text-emerald-400 font-semibold">Open</span>, only whitelisted voters can cast encrypted ballots.
              When <span className="text-amber-400 font-semibold">Closed</span>, no new ballots can be accepted, allowing the admin to securely perform homomorphic tallying.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={handleStartElection}
                disabled={isElectionOpen || isStartingElection}
                className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all ${
                  !isElectionOpen && !isStartingElection
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25'
                    : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-800'
                }`}
              >
                {isStartingElection ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>Start Election</span>
              </button>

              <button
                onClick={handleEndElection}
                disabled={!isElectionOpen || isEndingElection}
                className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all ${
                  isElectionOpen && !isEndingElection
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25'
                    : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-800'
                }`}
              >
                {isEndingElection ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Square className="w-4 h-4 fill-current" />
                )}
                <span>End Election</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Paillier Key Management */}
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Paillier Cryptosystem Keys</h3>
                <p className="text-xs text-slate-400">Keypair generation & on-chain publishing</p>
              </div>
            </div>
            <div className="text-xs font-mono text-indigo-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
              {publicKey ? 'Public Key On-Chain' : 'No Key On-Chain'}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGenerateKeys}
                disabled={isGeneratingKeys}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/20"
              >
                {isGeneratingKeys ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Generate {keyBitLength}-bit Paillier Keys</span>
              </button>

              <button
                onClick={handlePublishKey}
                disabled={isPublishingKey || (!localPrivateKey && !publicKey)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 flex items-center space-x-2 disabled:opacity-50"
              >
                {isPublishingKey ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>Publish to Contract</span>
              </button>
            </div>

            {/* Key Status Indicators */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Public Modulus (n):</span>
                <span className="font-mono text-indigo-200 block truncate">
                  {publicKey ? truncateCiphertext(publicKey.n.toString(), 14) : 'Not published'}
                </span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Admin Private Key (λ, μ):</span>
                <span className="font-mono text-emerald-300 block truncate">
                  {localPrivateKey ? 'Active in Session' : 'Not Loaded'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voter Whitelisting Center */}
      <section className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Voter Whitelisting Engine</h3>
            <p className="text-xs text-slate-400">Authorize voter Ethereum addresses to cast encrypted ballots</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form 1: Single Voter Whitelisting */}
          <form onSubmit={handleAddSingleVoter} className="space-y-4">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Whitelist Single Address
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="0x..."
                value={singleVoterAddress}
                onChange={(e) => setSingleVoterAddress(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isWhitelisting || !singleVoterAddress}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isWhitelisting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>Add</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Only whitelisted addresses are permitted to submit votes via <code className="text-indigo-400">castVote()</code>.
            </p>
          </form>

          {/* Form 2: Batch Whitelisting */}
          <form onSubmit={handleBatchAddVoters} className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Batch Whitelist (Comma or Newline Separated)
              </label>
              <button
                type="button"
                onClick={() => {
                  // Pre-populate with typical hardhat default accounts #1, #2, #3
                  setBatchVoterAddresses(
                    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8\n0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC\n0x90F79bf6EB2c4f870365E785982E1f101E93b906"
                  );
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
              >
                Fill Hardhat Test Accounts
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="0x709979...&#10;0x3C44Cd...&#10;0x90F79b..."
              value={batchVoterAddresses}
              onChange={(e) => setBatchVoterAddresses(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isWhitelisting || !batchVoterAddresses}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isWhitelisting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
              <span>Batch Whitelist Addresses</span>
            </button>
          </form>
        </div>
      </section>

      {/* Encrypted Ballots Ledger & Homomorphic Tallying */}
      <section className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Homomorphic Tally & Winner Decryption</h3>
              <p className="text-xs text-slate-400">Aggregate encrypted ciphertexts off-chain without decrypting individual votes</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400">Tally Scheme:</span>
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setTallyMode('radix')}
                className={`px-2.5 py-1 rounded ${tallyMode === 'radix' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Radix Multi
              </button>
              <button
                onClick={() => setTallyMode('simple')}
                className={`px-2.5 py-1 rounded ${tallyMode === 'simple' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Linear (A=1, B=2)
              </button>
            </div>
            <button
              onClick={fetchEncryptedVotes}
              disabled={isLoadingVotes}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
              title="Refresh Ballots"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingVotes ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Ledger overview */}
        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Encrypted Ballots Cast:</span>
            <div className="text-2xl font-extrabold text-white font-mono mt-0.5">
              {encryptedVotesList.length} Ballots
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-semibold">Ready for Tally:</span>
            <div className={`text-sm font-bold ${!isElectionOpen && encryptedVotesList.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {!isElectionOpen && encryptedVotesList.length > 0
                ? 'Yes (Election Closed)'
                : isElectionOpen
                ? 'No (Close Election First)'
                : 'No Ballots Cast'}
            </div>
          </div>
        </div>

        {/* Step-by-Step Tally Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step 1 Button */}
          <button
            onClick={handleComputeHomomorphicAddition}
            disabled={encryptedVotesList.length === 0 || isAggregating}
            className={`py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
              encryptedVotesList.length > 0 && !isAggregating
                ? 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/40 shadow-md'
                : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
            }`}
          >
            {isAggregating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Cpu className="w-4 h-4" />
            )}
            <span>Step 1: Compute Homomorphic Sum (∏ cᵢ mod n²)</span>
          </button>

          {/* Step 2 Button */}
          <button
            onClick={handleDecryptAndTally}
            disabled={!homomorphicSumCiphertext || !localPrivateKey || isDecrypting}
            className={`py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
              homomorphicSumCiphertext && localPrivateKey && !isDecrypting
                ? 'bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
            }`}
          >
            {isDecrypting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
            <span>Step 2 & 3: Decrypt Tally & Reveal Winner</span>
          </button>
        </div>

        {/* Homomorphic Ciphertext Preview */}
        {homomorphicSumCiphertext && (
          <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs">
            <span className="text-slate-400 block font-semibold text-[11px] uppercase tracking-wider">
              Aggregated Ciphertext (C_total = c₁ · c₂ · ... mod n²):
            </span>
            <div className="break-all text-indigo-300 text-[11px]">
              {truncateCiphertext(homomorphicSumCiphertext, 40)}
            </div>
            {decryptedSum !== null && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Decrypted Plaintext Sum (M_total):</span>
                <span className="text-emerald-400 font-bold">{decryptedSum.toString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Tally Results & Winner Announcement */}
        {tallyResults && tallyResults.length > 0 && (
          <div className="space-y-6 pt-4 border-t border-slate-800">
            {/* Top Winner Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/60 via-slate-900 to-slate-950 p-6 border-2 border-indigo-500/60 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-600 p-0.5 flex items-center justify-center text-3xl shadow-lg">
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                      👑
                    </div>
                  </div>
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
                      Winner Declared
                    </span>
                    <h4 className="text-2xl font-black text-white">
                      {tallyResults[0].name}
                    </h4>
                    <p className="text-xs text-slate-400">{tallyResults[0].role} · {tallyResults[0].platform}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-black text-emerald-400 font-mono">
                    {tallyResults[0].votes}
                  </div>
                  <div className="text-xs text-slate-400 uppercase font-bold">Total Votes</div>
                </div>
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
                    className="glass-card rounded-xl p-4 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{candidate.avatar}</span>
                        <div>
                          <span className="font-bold text-sm text-white block">{candidate.name}</span>
                          <span className="text-[10px] text-slate-400">{candidate.role}</span>
                        </div>
                      </div>
                      <span className="font-mono text-lg font-bold text-indigo-400">
                        {candidate.votes}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0 ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Share:</span>
                      <span className="font-semibold text-slate-200">{percentage}%</span>
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
