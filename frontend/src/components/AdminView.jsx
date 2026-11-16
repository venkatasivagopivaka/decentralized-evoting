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
  Radio
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

  // Handle Paillier Key Generation (Encryption & Security Identity: Violet)
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

  // Whitelist single voter (Voter Management Identity: Indigo)
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

  // Step 1: Compute Homomorphic Addition off-chain (Ocean Blue / Emerald)
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

  // Step 2 & 3: Decrypt Aggregate Ciphertext & Reveal Winner (Results Identity: Coral & Emerald)
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
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: [
          '#087F6A', // Emerald
          '#4959C8', // Indigo
          '#D99A35', // Amber
          '#E77D68', // Coral
          '#9367C7', // Violet
          '#3998B5', // Ocean
          '#8BAA63', // Sage
          '#E8B9C8', // Dusty rose
        ],
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
      {/* 1. Four Rich Colourful Statistic Cards for Dashboard Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Election State (Warm Amber & Pale Amber) */}
        <div className="rounded-2xl p-5 bg-pale-amber border border-amber-border/70 flex items-center space-x-4 shadow-subtle">
          <div className="w-12 h-12 rounded-xl bg-amber text-white flex items-center justify-center shadow-subtle">
            <Cpu className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-dark/80 tracking-wider">Election State</div>
            <div className="text-base font-extrabold text-amber-dark flex items-center space-x-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isElectionOpen ? 'bg-emerald animate-pulse' : 'bg-amber'}`} />
              <span>{isElectionOpen ? 'Voting Active' : 'Voting Closed'}</span>
            </div>
            <div className="text-[11px] text-ink-muted">On-chain state machine</div>
          </div>
        </div>

        {/* Stat 2: Paillier Public Key (Violet & Pale Lavender) */}
        <div className="rounded-2xl p-5 bg-[#F3ECFA] border border-violet-border/70 flex items-center space-x-4 shadow-subtle">
          <div className="w-12 h-12 rounded-xl bg-violet text-white flex items-center justify-center shadow-subtle">
            <Key className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-violet-dark/80 tracking-wider">Paillier Key</div>
            <div className="text-base font-extrabold text-violet-dark mt-0.5">
              {publicKey ? `${keyBitLength}-bit Synced` : 'Not Synced'}
            </div>
            <div className="text-[11px] text-ink-muted">
              {publicKey ? 'Published on contract' : 'Requires publishing'}
            </div>
          </div>
        </div>

        {/* Stat 3: Encrypted Ballots On-Chain (Ocean Blue & Pale Blue) */}
        <div className="rounded-2xl p-5 bg-pale-blue border border-ocean-border/70 flex items-center space-x-4 shadow-subtle">
          <div className="w-12 h-12 rounded-xl bg-ocean text-white flex items-center justify-center shadow-subtle">
            <Radio className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-ocean-dark/80 tracking-wider">Ballots Recorded</div>
            <div className="text-base font-extrabold text-ocean-dark font-mono mt-0.5">
              {encryptedVotesList.length} <span className="font-sans text-xs font-semibold">Ballots</span>
            </div>
            <div className="text-[11px] text-ink-muted">In immutable storage</div>
          </div>
        </div>

        {/* Stat 4: Admin Authority (Emerald & Pale Mint) */}
        <div className="rounded-2xl p-5 bg-pale-mint border border-emerald-border/70 flex items-center space-x-4 shadow-subtle">
          <div className="w-12 h-12 rounded-xl bg-emerald text-white flex items-center justify-center shadow-subtle">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-dark/80 tracking-wider">Admin Status</div>
            <div className="text-base font-extrabold text-emerald-dark mt-0.5">
              {isAdmin ? 'Contract Owner' : 'Non-Admin'}
            </div>
            <div className="text-[11px] text-ink-muted font-mono">
              {adminAddress ? truncateAddress(adminAddress) : 'Fetching...'}
            </div>
          </div>
        </div>
      </div>

      {/* Non-Admin Warning Banner (Pale Amber) */}
      {!isAdmin && account && (
        <div className="p-5 rounded-2xl bg-pale-amber border border-amber-border text-ink flex items-start space-x-3.5 shadow-subtle">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-dark mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-dark text-sm block mb-0.5">
              Connected Account is Not Election Administrator
            </span>
            <p className="text-ink-secondary leading-relaxed">
              Your connected wallet address ({truncateAddress(account)}) does not match the contract deployer administrator address ({truncateAddress(adminAddress)}).
              Admin operations (whitelisting voters, starting/ending elections, setting Paillier keys) are protected by Solidity's <code className="text-ink font-mono font-bold">onlyAdmin</code> modifier.
              Please switch accounts in MetaMask to Account #0 to administer the election.
            </p>
          </div>
        </div>
      )}

      {/* Success Notification Alert (Pale Mint) */}
      {whitelistSuccessMsg && (
        <div className="p-4 rounded-xl bg-pale-mint border border-emerald-border text-emerald-dark text-xs flex items-center space-x-2.5 font-bold shadow-subtle">
          <CheckCircle className="w-4 h-4 text-emerald flex-shrink-0" />
          <span>{whitelistSuccessMsg}</span>
        </div>
      )}

      {/* Error Notification Alert (Pale Coral) */}
      {actionError && (
        <div className="p-4 rounded-xl bg-pale-coral border border-coral-border text-coral-dark text-xs flex items-center space-x-2.5 font-bold shadow-subtle">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Grid: Election Lifecycle (Amber) & Paillier Keys (Violet) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Election Lifecycle Controls (Warm Amber & Pale Amber) */}
        <div className="panel-card p-6 sm:p-7 space-y-6 border-t-4 border-t-amber">
          <div className="flex items-center justify-between border-b border-[#E8E8E2] pb-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-pale-amber text-amber-dark flex items-center justify-center border border-amber-border/60 shadow-subtle">
                <Cpu className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-ink">Election State Machine</h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-pale-amber text-amber-dark border border-amber-border/70">
                    Lifecycle
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">Control on-chain ballot acceptance phases</p>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold border shadow-subtle ${
                isElectionOpen
                  ? 'bg-pale-mint text-emerald-dark border-emerald-border'
                  : 'bg-pale-amber text-amber-dark border-amber-border'
              }`}
            >
              {isElectionOpen ? '● Voting Active' : '○ Voting Closed'}
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="grid grid-cols-3 gap-2 py-1 text-center text-xs">
            <div className={`p-2.5 rounded-xl border ${publicKey ? 'bg-pale-mint text-emerald-dark border-emerald-border/60 font-bold' : 'bg-[#FAF9F5] text-ink-muted border-[#E8E8E2]'}`}>
              <span className="block text-[10px] uppercase tracking-wider mb-0.5">Phase 1</span>
              <span>Keys Synced</span>
            </div>
            <div className={`p-2.5 rounded-xl border ${isElectionOpen ? 'bg-pale-amber text-amber-dark border-amber-border/60 font-bold' : 'bg-[#FAF9F5] text-ink-muted border-[#E8E8E2]'}`}>
              <span className="block text-[10px] uppercase tracking-wider mb-0.5">Phase 2</span>
              <span>Ballots Open</span>
            </div>
            <div className={`p-2.5 rounded-xl border ${!isElectionOpen && encryptedVotesList.length > 0 ? 'bg-pale-coral text-coral-dark border-coral-border/60 font-bold' : 'bg-[#FAF9F5] text-ink-muted border-[#E8E8E2]'}`}>
              <span className="block text-[10px] uppercase tracking-wider mb-0.5">Phase 3</span>
              <span>Tally Ready</span>
            </div>
          </div>

          <p className="text-xs text-ink-secondary leading-relaxed">
            When <span className="font-bold text-emerald">Open</span>, authorized voter accounts can submit encrypted Paillier ballots.
            When <span className="font-bold text-amber-dark">Closed</span>, ballot recording is sealed, enabling the administrator to perform deterministic homomorphic tallying.
          </p>

          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <button
              onClick={handleStartElection}
              disabled={isElectionOpen || isStartingElection}
              className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all duration-150 ${
                !isElectionOpen && !isStartingElection
                  ? 'bg-emerald hover:bg-emerald-hover text-white shadow-card hover:shadow-cardHover'
                  : 'bg-[#F1EFE8] text-ink-muted cursor-not-allowed border border-[#E8E8E2]'
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
              className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all duration-150 ${
                isElectionOpen && !isEndingElection
                  ? 'bg-white hover:bg-pale-coral text-coral-dark border border-coral-border shadow-card hover:shadow-cardHover'
                  : 'bg-[#F1EFE8] text-ink-muted cursor-not-allowed border border-[#E8E8E2]'
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

        {/* Card 2: Paillier Key Management (Elegant Violet & Pale Lavender) */}
        <div className="panel-card p-6 sm:p-7 space-y-6 border-t-4 border-t-violet">
          <div className="flex items-center justify-between border-b border-[#E8E8E2] pb-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-pale-lavender text-violet flex items-center justify-center border border-violet-border/60 shadow-subtle">
                <Key className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-ink">Paillier Key Management</h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-pale-lavender text-violet-dark border border-violet-border/70">
                    Security Layer
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">Asymmetric homomorphic cryptographic keypair</p>
              </div>
            </div>
            <div className="text-xs font-mono font-semibold text-ink-secondary bg-[#FAF9F5] px-2.5 py-1 rounded-lg border border-[#E8E8E2]">
              {publicKey ? 'Key Published' : 'No Key On-Chain'}
            </div>
          </div>

          {/* Key Length Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Bitlength:</span>
            {[512, 1024, 2048].map((bits) => (
              <button
                key={bits}
                type="button"
                onClick={() => setKeyBitLength(bits)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  keyBitLength === bits
                    ? 'bg-pale-lavender text-violet-dark border border-violet-border shadow-subtle'
                    : 'bg-[#FAF9F5] text-ink-muted hover:text-ink border border-[#E8E8E2]'
                }`}
              >
                {bits}-bit
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleGenerateKeys}
              disabled={isGeneratingKeys}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-violet hover:bg-violet-hover text-white flex items-center justify-center space-x-2 shadow-card hover:shadow-cardHover transition-all"
            >
              {isGeneratingKeys ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Generate {keyBitLength}-bit Keypair</span>
            </button>

            <button
              onClick={handlePublishKey}
              disabled={isPublishingKey || (!localPrivateKey && !publicKey)}
              className="w-full sm:w-auto py-3 px-4 rounded-xl text-xs font-bold bg-white hover:bg-pale-mint text-emerald-dark border border-emerald-border flex items-center justify-center space-x-2 disabled:opacity-50 shadow-card hover:shadow-cardHover transition-all"
            >
              {isPublishingKey ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-emerald" />
              )}
              <span>Publish On-Chain</span>
            </button>
          </div>

          {/* Key Status Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E8E8E2]">
              <span className="text-[10px] text-ink-muted uppercase font-bold block mb-1">Public Modulus (n)</span>
              <span className="font-mono text-ink text-[11px] block truncate font-semibold">
                {publicKey ? truncateCiphertext(publicKey.n.toString(), 16) : 'Not published'}
              </span>
            </div>
            <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E8E8E2]">
              <span className="text-[10px] text-ink-muted uppercase font-bold block mb-1">Private Key (λ, μ)</span>
              <span className="font-mono text-violet-dark text-[11px] font-bold block truncate">
                {localPrivateKey ? 'Active in Session Storage' : 'Not Loaded'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Voter Whitelisting Engine (Royal Indigo & Pale Lavender) */}
      <section className="panel-card p-6 sm:p-7 space-y-6 border-t-4 border-t-indigo">
        <div className="flex items-center space-x-3.5 border-b border-[#E8E8E2] pb-4">
          <div className="w-10 h-10 rounded-xl bg-pale-lavender text-indigo flex items-center justify-center border border-indigo-border/60 shadow-subtle">
            <Users className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-ink">Voter Access Whitelisting Engine</h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-pale-lavender text-indigo-dark border border-indigo-border/70">
                Access Control
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">Authorize Ethereum addresses to participate in encrypted voting</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Single Voter Whitelist */}
          <form onSubmit={handleAddSingleVoter} className="space-y-3 bg-[#FAF9F5] p-5 rounded-2xl border border-[#E8E8E2]">
            <label className="text-[11px] font-bold text-indigo-dark uppercase tracking-wider block">
              Whitelist Individual Address
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="0x..."
                value={singleVoterAddress}
                onChange={(e) => setSingleVoterAddress(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E8E2] text-ink placeholder-ink-muted font-mono text-xs focus:outline-none focus:border-indigo shadow-subtle"
              />
              <button
                type="submit"
                disabled={isWhitelisting || !singleVoterAddress}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo hover:bg-indigo-hover text-white flex items-center space-x-1.5 disabled:opacity-50 shadow-card transition-all"
              >
                {isWhitelisting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>Add</span>
              </button>
            </div>
            <p className="text-[11px] text-ink-muted">
              Calls contract method <code className="text-ink font-mono font-bold">addVoter(address)</code> on-chain.
            </p>
          </form>

          {/* Batch Voter Whitelist */}
          <form onSubmit={handleBatchAddVoters} className="space-y-3 bg-[#FAF9F5] p-5 rounded-2xl border border-[#E8E8E2]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-indigo-dark uppercase tracking-wider block">
                Batch Whitelist (Multiple Addresses)
              </label>
              <button
                type="button"
                onClick={() => {
                  setBatchVoterAddresses(
                    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8\n0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC\n0x90F79bf6EB2c4f870365E785982E1f101E93b906"
                  );
                }}
                className="text-[11px] text-indigo hover:text-indigo-hover underline font-bold"
              >
                Auto-fill Test Accounts
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="0x709979...&#10;0x3C44Cd...&#10;0x90F79b..."
              value={batchVoterAddresses}
              onChange={(e) => setBatchVoterAddresses(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E8E2] text-ink placeholder-ink-muted font-mono text-xs focus:outline-none focus:border-indigo shadow-subtle"
            />
            <button
              type="submit"
              disabled={isWhitelisting || !batchVoterAddresses}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-white hover:bg-pale-lavender text-indigo-dark border border-indigo-border flex items-center justify-center space-x-1.5 disabled:opacity-50 shadow-card transition-all"
            >
              {isWhitelisting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5 text-indigo" />}
              <span>Batch Whitelist Addresses</span>
            </button>
          </form>
        </div>
      </section>

      {/* 4. Homomorphic Tally & Results Dashboard (Coral & Emerald & Sage) */}
      <section className="panel-card p-6 sm:p-7 space-y-6 border-t-4 border-t-coral">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E8E2] pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-pale-coral text-coral flex items-center justify-center border border-coral-border/60 shadow-subtle">
              <Trophy className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-ink">Homomorphic Tally & Results Dashboard</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-pale-coral text-coral-dark border border-coral-border/70">
                  Results Ledger
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">Aggregate encrypted ballots directly in ciphertext space off-chain</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-ink-muted font-medium">Scheme:</span>
            <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-[#E8E8E2] text-xs shadow-subtle">
              <button
                onClick={() => setTallyMode('radix')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  tallyMode === 'radix'
                    ? 'bg-pale-coral text-coral-dark border border-coral-border/60 shadow-subtle'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Radix Multi
              </button>
              <button
                onClick={() => setTallyMode('simple')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  tallyMode === 'simple'
                    ? 'bg-pale-lavender text-indigo-dark border border-indigo-border/60 shadow-subtle'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Linear (A=1, B=2)
              </button>
            </div>
            <button
              onClick={fetchEncryptedVotes}
              disabled={isLoadingVotes}
              className="p-2 rounded-xl bg-white hover:bg-[#F7F6F1] text-ink-secondary border border-[#E8E8E2] shadow-subtle transition-colors"
              title="Refresh Ballots from Blockchain"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVotes ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Ledger Overview Summary Box */}
        <div className="bg-[#FAF9F5] rounded-2xl p-5 border border-[#E8E8E2] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-ink-muted uppercase font-bold tracking-wider">Total Encrypted Ballots</span>
            <div className="text-2xl font-black text-ink font-mono mt-0.5">
              {encryptedVotesList.length} <span className="text-xs text-ink-secondary font-sans font-normal">ballots cast</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-ink-muted uppercase font-bold tracking-wider">Ready for Decryption</span>
            <div className={`text-xs font-bold mt-0.5 ${
              !isElectionOpen && encryptedVotesList.length > 0 ? 'text-emerald' : 'text-amber-dark'
            }`}>
              {!isElectionOpen && encryptedVotesList.length > 0
                ? 'Yes (Election Concluded)'
                : isElectionOpen
                ? 'No (Close Voting First)'
                : 'No Ballots Recorded'}
            </div>
          </div>
        </div>

        {/* 2-Step Homomorphic Tally Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <button
            onClick={handleComputeHomomorphicAddition}
            disabled={encryptedVotesList.length === 0 || isAggregating}
            className={`py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all duration-150 ${
              encryptedVotesList.length > 0 && !isAggregating
                ? 'bg-pale-blue hover:bg-ocean/20 text-ocean-dark border border-ocean-border shadow-card hover:shadow-cardHover'
                : 'bg-[#F1EFE8] text-ink-muted cursor-not-allowed border border-[#E8E8E2]'
            }`}
          >
            {isAggregating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-ocean" />
            ) : (
              <Cpu className="w-3.5 h-3.5 text-ocean" />
            )}
            <span>Step 1: Compute Homomorphic Product (∏ cᵢ mod n²)</span>
          </button>

          <button
            onClick={handleDecryptAndTally}
            disabled={!homomorphicSumCiphertext || !localPrivateKey || isDecrypting}
            className={`py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all duration-150 ${
              homomorphicSumCiphertext && localPrivateKey && !isDecrypting
                ? 'bg-coral hover:bg-coral-hover text-white shadow-card hover:shadow-cardHover'
                : 'bg-[#F1EFE8] text-ink-muted cursor-not-allowed border border-[#E8E8E2]'
            }`}
          >
            {isDecrypting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
            <span>Step 2: Decrypt Tally & Reveal Winner</span>
          </button>
        </div>

        {/* Aggregated Ciphertext Box */}
        {homomorphicSumCiphertext && (
          <div className="space-y-2.5 bg-[#FAF9F5] p-5 rounded-2xl border border-[#E8E8E2] font-mono text-xs shadow-inner">
            <span className="text-ink-muted block font-bold text-[10px] uppercase tracking-wider">
              Aggregated Ciphertext (C_total = c₁ · c₂ · ... mod n²):
            </span>
            <div className="break-all text-ink text-[11px] leading-relaxed">
              {truncateCiphertext(homomorphicSumCiphertext, 44)}
            </div>
            {decryptedSum !== null && (
              <div className="pt-2.5 border-t border-[#E8E8E2] flex items-center justify-between text-xs font-sans">
                <span className="text-ink-muted font-medium">Decrypted Plaintext Sum (M_total):</span>
                <span className="text-emerald font-extrabold text-base font-mono">{decryptedSum.toString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Election Results & Winner Presentation */}
        {tallyResults && tallyResults.length > 0 && (
          <div className="space-y-5 pt-4 border-t border-[#E8E8E2]">
            {/* Winner Spotlight Card (Pale Amber & Coral Ribbon) */}
            <div className="rounded-2xl bg-pale-amber p-6 sm:p-7 border-2 border-coral-border flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-card">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-white border border-coral-border/80 flex items-center justify-center text-3xl shadow-card">
                  👑
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] uppercase font-black tracking-wider text-coral-dark block">
                      Election Winner Declared
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-pale-rose text-rose-dark border border-rose-border">
                      Verified
                    </span>
                  </div>
                  <h4 className="text-2xl font-black text-ink tracking-tight">
                    {tallyResults[0].name}
                  </h4>
                  <p className="text-xs text-ink-secondary mt-0.5">{tallyResults[0].role} · {tallyResults[0].platform}</p>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-coral-border/60 sm:pl-7">
                <div className="text-4xl font-black text-emerald font-mono">
                  {tallyResults[0].votes}
                </div>
                <div className="text-[10px] text-ink-muted uppercase font-bold tracking-wider">Total Verified Votes</div>
              </div>
            </div>

            {/* Candidate Breakdown Grid (Multi-color cards & progress bars) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tallyResults.map((candidate, idx) => {
                const totalBallots = encryptedVotesList.length || 1;
                const percentage = Math.round((candidate.votes / totalBallots) * 100);

                return (
                  <div
                    key={candidate.id}
                    className="bg-white rounded-2xl p-5 border border-[#E8E8E2] space-y-3 shadow-subtle hover:shadow-cardHover transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-xl">{candidate.avatar}</span>
                        <div>
                          <span className="font-bold text-xs text-ink block">{candidate.name}</span>
                          <span className="text-[10px] text-ink-muted">{candidate.role}</span>
                        </div>
                      </div>
                      <span className="font-mono text-base font-extrabold text-ink">
                        {candidate.votes} <span className="text-[10px] text-ink-muted font-normal">votes</span>
                      </span>
                    </div>

                    {/* Progress Bar with Candidate's Signature Color */}
                    <div className="w-full bg-[#FAF9F5] rounded-full h-2 overflow-hidden border border-[#E8E8E2]">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${candidate.barColor || (idx === 0 ? 'bg-amber' : 'bg-indigo')}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-ink-muted">
                      <span>Vote Share:</span>
                      <span className="font-bold text-ink">{percentage}%</span>
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
