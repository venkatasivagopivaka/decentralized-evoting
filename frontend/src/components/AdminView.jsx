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
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

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
      setShowStartModal(false);
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
      setShowEndModal(false);
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
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#536A55', '#A48B70', '#A87565', '#D2D2C9'],
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
      {/* Consequential Action Confirmation: Start Election */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 bg-[#30362F]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F8F7F2] border border-[#D2D2C9] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#E4EAE1] text-[#536A55] flex items-center justify-center border border-[#C3D1C0]">
                <Play className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#30362F]">Confirm Election Opening</h3>
                <p className="text-xs text-[#6F746B]">Initiate on-chain voting window</p>
              </div>
            </div>
            <p className="text-xs text-[#6F746B] leading-relaxed">
              Opening the election enables all whitelisted voter addresses to submit encrypted Paillier ballots directly to the Ethereum smart contract.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowStartModal(false)}
                disabled={isStartingElection}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#30362F] bg-[#F4F3EE] hover:bg-[#DEDED5] border border-[#D2D2C9] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartElection}
                disabled={isStartingElection}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#F8F7F2] bg-[#536A55] hover:bg-[#465B48] active:scale-[0.99] transition-all shadow-sm flex items-center space-x-1.5"
              >
                {isStartingElection && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Open Voting</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consequential Action Confirmation: End Election */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-[#30362F]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F8F7F2] border border-[#D2D2C9] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#F7EFEB] text-[#A87565] flex items-center justify-center border border-[#DEC2B9]">
                <Square className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#30362F]">Confirm Election Closure</h3>
                <p className="text-xs text-[#6F746B]">Permanent sealing of ballot submission</p>
              </div>
            </div>
            <p className="text-xs text-[#6F746B] leading-relaxed">
              Closing the election permanently prevents further ballot submissions by voters on-chain. This action seals the encrypted ballot pool and unlocks off-chain homomorphic aggregation.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                disabled={isEndingElection}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#30362F] bg-[#F4F3EE] hover:bg-[#DEDED5] border border-[#D2D2C9] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEndElection}
                disabled={isEndingElection}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#F8F7F2] bg-[#A87565] hover:bg-[#946455] active:scale-[0.99] transition-all shadow-sm flex items-center space-x-1.5"
              >
                {isEndingElection && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Seal Election</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Four Calm Operational Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Election State */}
        <div className="rounded-xl p-5 bg-[#F4F3EE] border border-[#D2D2C9] flex items-center space-x-4 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-[#F8F7F2] text-[#536A55] flex items-center justify-center border border-[#D2D2C9]">
            <Cpu className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono font-medium text-[#93958C] tracking-wider">Election State</div>
            <div className="text-sm font-semibold text-[#30362F] flex items-center space-x-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isElectionOpen ? 'bg-[#536A55]' : 'bg-[#93958C]'}`} />
              <span>{isElectionOpen ? 'Voting Active' : 'Voting Closed'}</span>
            </div>
            <div className="text-[11px] text-[#6F746B]">On-chain state machine</div>
          </div>
        </div>

        {/* Stat 2: Paillier Public Key */}
        <div className="rounded-xl p-5 bg-[#F4F3EE] border border-[#D2D2C9] flex items-center space-x-4 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-[#F8F7F2] text-[#A48B70] flex items-center justify-center border border-[#D2D2C9]">
            <Key className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono font-medium text-[#93958C] tracking-wider">Paillier Key</div>
            <div className="text-sm font-semibold text-[#30362F] mt-0.5">
              {publicKey ? `${keyBitLength}-bit Synced` : 'Not Published'}
            </div>
            <div className="text-[11px] text-[#6F746B]">
              {publicKey ? 'Published on contract' : 'Requires publishing'}
            </div>
          </div>
        </div>

        {/* Stat 3: Encrypted Ballots On-Chain */}
        <div className="rounded-xl p-5 bg-[#F4F3EE] border border-[#D2D2C9] flex items-center space-x-4 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-[#F8F7F2] text-[#536A55] flex items-center justify-center border border-[#D2D2C9]">
            <Radio className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono font-medium text-[#93958C] tracking-wider">Ballots In Storage</div>
            <div className="text-sm font-semibold text-[#30362F] font-mono mt-0.5">
              {encryptedVotesList.length} <span className="font-sans text-xs text-[#6F746B] font-normal">ballots</span>
            </div>
            <div className="text-[11px] text-[#6F746B]">Immutable ciphertext ledger</div>
          </div>
        </div>

        {/* Stat 4: Admin Status */}
        <div className="rounded-xl p-5 bg-[#F4F3EE] border border-[#D2D2C9] flex items-center space-x-4 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-[#F8F7F2] text-[#A48B70] flex items-center justify-center border border-[#D2D2C9]">
            <ShieldCheck className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono font-medium text-[#93958C] tracking-wider">Authority Status</div>
            <div className="text-sm font-semibold text-[#30362F] mt-0.5">
              {isAdmin ? 'Contract Owner' : 'Non-Admin'}
            </div>
            <div className="text-[11px] text-[#6F746B] font-mono">
              {adminAddress ? truncateAddress(adminAddress) : 'Fetching...'}
            </div>
          </div>
        </div>
      </div>

      {/* Non-Admin Warning Banner */}
      {!isAdmin && account && (
        <div className="p-4 rounded-xl bg-[#F7EFEB] border border-[#DEC2B9] text-[#30362F] flex items-start space-x-3.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-[#A87565] mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-[#A87565] text-sm block mb-0.5">
              Connected Wallet is Not Election Administrator
            </span>
            <p className="text-[#6F746B] leading-relaxed">
              Your connected wallet address ({truncateAddress(account)}) does not match the contract deployer address ({truncateAddress(adminAddress)}).
              Admin operations (whitelisting voters, starting/ending elections, setting Paillier keys) are protected by Solidity's <code className="text-[#30362F] font-mono font-semibold bg-[#E9E8E2] px-1 py-0.5 rounded border border-[#D2D2C9]">onlyAdmin</code> modifier.
              Please switch to Account #0 in MetaMask to administer the election.
            </p>
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {whitelistSuccessMsg && (
        <div className="p-4 rounded-xl bg-[#E8F0EA] border border-[#C3D1C0] text-[#457354] text-xs flex items-center space-x-2.5 font-medium shadow-sm">
          <CheckCircle className="w-4 h-4 text-[#457354] flex-shrink-0" />
          <span>{whitelistSuccessMsg}</span>
        </div>
      )}

      {/* Error Notification Alert */}
      {actionError && (
        <div className="p-4 rounded-xl bg-[#F7ECEB] border border-[#DEC2B9] text-[#A34A42] text-xs flex items-center space-x-2.5 font-medium shadow-sm">
          <ShieldAlert className="w-4 h-4 text-[#A34A42] flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Grid: Election Lifecycle & Paillier Keys */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Election Lifecycle Controls */}
        <div className="bg-[#F4F3EE] border border-[#D2D2C9] rounded-xl p-6 sm:p-7 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#D2D2C9] pb-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#F8F7F2] text-[#536A55] flex items-center justify-center border border-[#D2D2C9]">
                <Cpu className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-[#30362F]">Election State Machine</h3>
                  <span className="text-[10px] uppercase font-mono font-medium px-2 py-0.5 rounded bg-[#E4EAE1] text-[#536A55] border border-[#C3D1C0]">
                    Lifecycle
                  </span>
                </div>
                <p className="text-xs text-[#6F746B] mt-0.5">Control on-chain ballot acceptance phases</p>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-[#F8F7F2] border border-[#D2D2C9] text-[#30362F] flex items-center space-x-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isElectionOpen ? 'bg-[#536A55]' : 'bg-[#93958C]'}`} />
              <span>{isElectionOpen ? 'OPEN' : 'CLOSED'}</span>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="grid grid-cols-3 gap-2 py-1 text-center text-xs">
            <div className={`p-2.5 rounded-lg border ${publicKey ? 'bg-[#F8F7F2] text-[#30362F] border-[#536A55] font-semibold' : 'bg-[#E9E8E2] text-[#93958C] border-[#D2D2C9]'}`}>
              <span className="block text-[10px] uppercase font-mono tracking-wider mb-0.5 text-[#93958C]">Phase 1</span>
              <span>Keys Synced</span>
            </div>
            <div className={`p-2.5 rounded-lg border ${isElectionOpen ? 'bg-[#F8F7F2] text-[#30362F] border-[#536A55] font-semibold' : 'bg-[#E9E8E2] text-[#93958C] border-[#D2D2C9]'}`}>
              <span className="block text-[10px] uppercase font-mono tracking-wider mb-0.5 text-[#93958C]">Phase 2</span>
              <span>Ballots Open</span>
            </div>
            <div className={`p-2.5 rounded-lg border ${!isElectionOpen && encryptedVotesList.length > 0 ? 'bg-[#F8F7F2] text-[#30362F] border-[#536A55] font-semibold' : 'bg-[#E9E8E2] text-[#93958C] border-[#D2D2C9]'}`}>
              <span className="block text-[10px] uppercase font-mono tracking-wider mb-0.5 text-[#93958C]">Phase 3</span>
              <span>Tally Ready</span>
            </div>
          </div>

          <p className="text-xs text-[#6F746B] leading-relaxed">
            When <strong className="text-[#30362F] font-semibold">Open</strong>, authorized voter accounts can submit encrypted Paillier ballots.
            When <strong className="text-[#30362F] font-semibold">Closed</strong>, ballot recording is sealed, enabling deterministic homomorphic tallying.
          </p>

          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <button
              onClick={() => setShowStartModal(true)}
              disabled={isElectionOpen || isStartingElection}
              className={`min-h-[44px] px-4 rounded-lg font-medium text-xs flex items-center justify-center space-x-2 transition-all ${
                !isElectionOpen && !isStartingElection
                  ? 'bg-[#536A55] hover:bg-[#465B48] active:scale-[0.99] text-[#F8F7F2] shadow-sm'
                  : 'bg-[#DEDED5] text-[#93958C] cursor-not-allowed border border-[#D2D2C9]'
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
              onClick={() => setShowEndModal(true)}
              disabled={!isElectionOpen || isEndingElection}
              className={`min-h-[44px] px-4 rounded-lg font-medium text-xs flex items-center justify-center space-x-2 transition-all ${
                isElectionOpen && !isEndingElection
                  ? 'bg-[#A87565] hover:bg-[#946455] active:scale-[0.99] text-[#F8F7F2] shadow-sm'
                  : 'bg-[#DEDED5] text-[#93958C] cursor-not-allowed border border-[#D2D2C9]'
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
        <div className="bg-[#F4F3EE] border border-[#D2D2C9] rounded-xl p-6 sm:p-7 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#D2D2C9] pb-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#F8F7F2] text-[#A48B70] flex items-center justify-center border border-[#D2D2C9]">
                <Key className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-[#30362F]">Paillier Key Management</h3>
                  <span className="text-[10px] uppercase font-mono font-medium px-2 py-0.5 rounded bg-[#F2EDE7] text-[#A48B70] border border-[#D8CABE]">
                    Security Layer
                  </span>
                </div>
                <p className="text-xs text-[#6F746B] mt-0.5">Asymmetric homomorphic cryptographic keypair</p>
              </div>
            </div>
            <div className="text-xs font-mono font-medium text-[#6F746B] bg-[#F8F7F2] px-2.5 py-1 rounded-md border border-[#D2D2C9]">
              {publicKey ? 'Key Published' : 'No Key On-Chain'}
            </div>
          </div>

          {/* Key Length Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono font-medium text-[#93958C] uppercase tracking-wider">Bitlength:</span>
            <div className="flex items-center space-x-1 bg-[#DEDED5] p-1 rounded-lg border border-[#D2D2C9]/60">
              {[512, 1024, 2048].map((bits) => (
                <button
                  key={bits}
                  type="button"
                  onClick={() => setKeyBitLength(bits)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                    keyBitLength === bits
                      ? 'bg-[#F8F7F2] text-[#30362F] shadow-sm border border-[#D2D2C9]'
                      : 'text-[#6F746B] hover:text-[#30362F]'
                  }`}
                >
                  {bits}-bit
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleGenerateKeys}
              disabled={isGeneratingKeys}
              className="min-h-[44px] w-full sm:flex-1 px-4 rounded-lg text-xs font-medium bg-[#F4F3EE] hover:bg-[#DEDED5] border border-[#D2D2C9] text-[#30362F] flex items-center justify-center space-x-2 transition-all"
            >
              {isGeneratingKeys ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-[#A48B70]" />
              )}
              <span>Generate {keyBitLength}-bit Keys</span>
            </button>

            <button
              onClick={handlePublishKey}
              disabled={isPublishingKey || (!localPrivateKey && !publicKey)}
              className="min-h-[44px] w-full sm:w-auto px-5 rounded-lg text-xs font-medium bg-[#536A55] hover:bg-[#465B48] text-[#F8F7F2] active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-50 transition-all shadow-sm"
            >
              {isPublishingKey ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-[#F8F7F2]" />
              )}
              <span>Publish On-Chain</span>
            </button>
          </div>

          {/* Key Status Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#F8F7F2] p-3 rounded-lg border border-[#D2D2C9]">
              <span className="text-[10px] text-[#93958C] font-mono uppercase font-medium block mb-1">Public Modulus (n)</span>
              <span className="font-mono text-[#30362F] text-[11px] block truncate font-medium">
                {publicKey ? truncateCiphertext(publicKey.n.toString(), 16) : 'Not published'}
              </span>
            </div>
            <div className="bg-[#F8F7F2] p-3 rounded-lg border border-[#D2D2C9]">
              <span className="text-[10px] text-[#93958C] font-mono uppercase font-medium block mb-1">Private Key (λ, μ)</span>
              <span className="font-mono text-[#536A55] text-[11px] font-semibold block truncate">
                {localPrivateKey ? 'Active in Session Storage' : 'Not Loaded'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Voter Whitelisting Engine */}
      <section className="bg-[#F4F3EE] border border-[#D2D2C9] rounded-xl p-6 sm:p-7 space-y-6 shadow-sm">
        <div className="flex items-center space-x-3.5 border-b border-[#D2D2C9] pb-4">
          <div className="w-9 h-9 rounded-lg bg-[#F8F7F2] text-[#536A55] flex items-center justify-center border border-[#D2D2C9]">
            <Users className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-[#30362F]">Voter Access Whitelisting Engine</h3>
              <span className="text-[10px] uppercase font-mono font-medium px-2 py-0.5 rounded bg-[#E4EAE1] text-[#536A55] border border-[#C3D1C0]">
                Access Control
              </span>
            </div>
            <p className="text-xs text-[#6F746B] mt-0.5">Authorize Ethereum addresses to participate in encrypted voting</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Single Voter Whitelist */}
          <form onSubmit={handleAddSingleVoter} className="space-y-3 bg-[#F8F7F2] p-5 rounded-xl border border-[#D2D2C9]">
            <label className="text-[10px] font-mono font-medium text-[#93958C] uppercase tracking-wider block">
              Whitelist Individual Address
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="0x..."
                value={singleVoterAddress}
                onChange={(e) => setSingleVoterAddress(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-lg bg-[#F4F3EE] border border-[#D2D2C9] text-[#30362F] placeholder-[#93958C] font-mono text-xs focus:outline-none focus:border-[#536A55]"
              />
              <button
                type="submit"
                disabled={isWhitelisting || !singleVoterAddress}
                className="min-h-[40px] px-4 py-2 rounded-lg text-xs font-medium bg-[#536A55] hover:bg-[#465B48] active:scale-[0.99] text-[#F8F7F2] flex items-center space-x-1.5 disabled:opacity-50 transition-all shadow-sm"
              >
                {isWhitelisting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>Add</span>
              </button>
            </div>
            <p className="text-[11px] text-[#6F746B]">
              Calls smart contract method <code className="text-[#30362F] font-mono font-semibold">addVoter(address)</code> on-chain.
            </p>
          </form>

          {/* Batch Voter Whitelist */}
          <form onSubmit={handleBatchAddVoters} className="space-y-3 bg-[#F8F7F2] p-5 rounded-xl border border-[#D2D2C9]">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono font-medium text-[#93958C] uppercase tracking-wider block">
                Batch Whitelist (Multiple Addresses)
              </label>
              <button
                type="button"
                onClick={() => {
                  setBatchVoterAddresses(
                    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8\n0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC\n0x90F79bf6EB2c4f870365E785982E1f101E93b906"
                  );
                }}
                className="text-[11px] text-[#A48B70] hover:underline font-mono font-medium"
              >
                Auto-fill Test Accounts
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="0x709979...&#10;0x3C44Cd...&#10;0x90F79b..."
              value={batchVoterAddresses}
              onChange={(e) => setBatchVoterAddresses(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#F4F3EE] border border-[#D2D2C9] text-[#30362F] placeholder-[#93958C] font-mono text-xs focus:outline-none focus:border-[#536A55]"
            />
            <button
              type="submit"
              disabled={isWhitelisting || !batchVoterAddresses}
              className="min-h-[40px] w-full py-2 px-4 rounded-lg text-xs font-medium bg-[#F4F3EE] hover:bg-[#DEDED5] text-[#30362F] border border-[#D2D2C9] flex items-center justify-center space-x-1.5 disabled:opacity-50 transition-all"
            >
              {isWhitelisting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5 text-[#536A55]" />}
              <span>Batch Whitelist Addresses</span>
            </button>
          </form>
        </div>
      </section>

      {/* 4. Homomorphic Tally & Results Dashboard */}
      <section className="bg-[#F4F3EE] border border-[#D2D2C9] rounded-xl p-6 sm:p-7 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D2D2C9] pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#F8F7F2] text-[#A48B70] flex items-center justify-center border border-[#D2D2C9]">
              <Trophy className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-[#30362F]">Homomorphic Tally & Results Dashboard</h3>
                <span className="text-[10px] uppercase font-mono font-medium px-2 py-0.5 rounded bg-[#F2EDE7] text-[#A48B70] border border-[#D8CABE]">
                  Results Ledger
                </span>
              </div>
              <p className="text-xs text-[#6F746B] mt-0.5">Aggregate encrypted ballots directly in ciphertext space off-chain</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-[#6F746B] font-mono">Scheme:</span>
            <div className="flex items-center space-x-1 bg-[#DEDED5] p-1 rounded-lg border border-[#D2D2C9]/60 text-xs">
              <button
                onClick={() => setTallyMode('radix')}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                  tallyMode === 'radix'
                    ? 'bg-[#F8F7F2] text-[#30362F] shadow-sm border border-[#D2D2C9]'
                    : 'text-[#6F746B] hover:text-[#30362F]'
                }`}
              >
                Radix Multi
              </button>
              <button
                onClick={() => setTallyMode('simple')}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                  tallyMode === 'simple'
                    ? 'bg-[#F8F7F2] text-[#30362F] shadow-sm border border-[#D2D2C9]'
                    : 'text-[#6F746B] hover:text-[#30362F]'
                }`}
              >
                Linear (A=1, B=2)
              </button>
            </div>
            <button
              onClick={fetchEncryptedVotes}
              disabled={isLoadingVotes}
              className="p-2 rounded-lg bg-[#F8F7F2] hover:bg-[#DEDED5] text-[#6F746B] hover:text-[#30362F] border border-[#D2D2C9] transition-colors"
              title="Refresh Ballots from Blockchain"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVotes ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Ledger Overview Summary Box */}
        <div className="bg-[#F8F7F2] rounded-xl p-5 border border-[#D2D2C9] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#93958C] font-mono uppercase font-medium tracking-wider">Total Encrypted Ballots</span>
            <div className="text-2xl font-semibold text-[#30362F] font-mono mt-0.5">
              {encryptedVotesList.length} <span className="text-xs text-[#6F746B] font-sans font-normal">ballots cast</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#93958C] font-mono uppercase font-medium tracking-wider">Tally Readiness</span>
            <div className={`text-xs font-mono font-semibold mt-0.5 ${
              !isElectionOpen && encryptedVotesList.length > 0 ? 'text-[#536A55]' : 'text-[#6F746B]'
            }`}>
              {!isElectionOpen && encryptedVotesList.length > 0
                ? 'Ready (Election Concluded)'
                : isElectionOpen
                ? 'Voting in Progress'
                : 'No Ballots Recorded'}
            </div>
          </div>
        </div>

        {/* 2-Step Homomorphic Tally Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <button
            onClick={handleComputeHomomorphicAddition}
            disabled={encryptedVotesList.length === 0 || isAggregating}
            className={`min-h-[44px] py-3 px-4 rounded-lg font-medium text-xs flex items-center justify-center space-x-2 transition-all ${
              encryptedVotesList.length > 0 && !isAggregating
                ? 'bg-[#F4F3EE] hover:bg-[#DEDED5] text-[#30362F] border border-[#D2D2C9]'
                : 'bg-[#DEDED5] text-[#93958C] cursor-not-allowed border border-[#D2D2C9]'
            }`}
          >
            {isAggregating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#30362F]" />
            ) : (
              <Cpu className="w-3.5 h-3.5 text-[#536A55]" />
            )}
            <span>Step 1: Compute Homomorphic Product (∏ cᵢ mod n²)</span>
          </button>

          <button
            onClick={handleDecryptAndTally}
            disabled={!homomorphicSumCiphertext || !localPrivateKey || isDecrypting}
            className={`min-h-[44px] py-3 px-4 rounded-lg font-medium text-xs flex items-center justify-center space-x-2 transition-all ${
              homomorphicSumCiphertext && localPrivateKey && !isDecrypting
                ? 'bg-[#536A55] hover:bg-[#465B48] active:scale-[0.99] text-[#F8F7F2] shadow-sm'
                : 'bg-[#DEDED5] text-[#93958C] cursor-not-allowed border border-[#D2D2C9]'
            }`}
          >
            {isDecrypting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
            <span>Step 2: Decrypt Tally & Certify Winner</span>
          </button>
        </div>

        {/* Aggregated Ciphertext Box */}
        {homomorphicSumCiphertext && (
          <div className="space-y-2.5 bg-[#E9E8E2] p-5 rounded-xl border border-[#D2D2C9] font-mono text-xs">
            <span className="text-[#6F746B] block font-medium text-[10px] uppercase tracking-wider">
              Aggregated Ciphertext (C_total = c₁ · c₂ · ... mod n²):
            </span>
            <div className="break-all text-[#30362F] text-[11px] leading-relaxed">
              {truncateCiphertext(homomorphicSumCiphertext, 44)}
            </div>
            {decryptedSum !== null && (
              <div className="pt-2.5 border-t border-[#D2D2C9] flex items-center justify-between text-xs font-sans">
                <span className="text-[#6F746B]">Decrypted Plaintext Sum (M_total):</span>
                <span className="text-[#536A55] font-mono font-bold text-base">{decryptedSum.toString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Election Results & Winner Presentation */}
        {tallyResults && tallyResults.length > 0 && (
          <div className="space-y-5 pt-4 border-t border-[#D2D2C9]">
            {/* Winner Spotlight Card */}
            <div className="rounded-xl bg-[#F8F7F2] p-6 sm:p-7 border-2 border-[#536A55] flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-[#F4F3EE] border border-[#D2D2C9] flex items-center justify-center text-2xl">
                  👑
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-mono font-medium tracking-wider text-[#536A55] block">
                      Certified Election Winner
                    </span>
                    <span className="text-[10px] uppercase font-mono font-medium px-2 py-0.5 rounded bg-[#E4EAE1] text-[#536A55] border border-[#C3D1C0]">
                      Verified
                    </span>
                  </div>
                  <h4 className="text-xl font-semibold text-[#30362F] tracking-tight mt-0.5">
                    {tallyResults[0].name}
                  </h4>
                  <p className="text-xs text-[#6F746B] mt-0.5">{tallyResults[0].role} · {tallyResults[0].platform}</p>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-[#D2D2C9] sm:pl-7">
                <div className="text-3xl font-mono font-semibold text-[#536A55]">
                  {tallyResults[0].votes}
                </div>
                <div className="text-[10px] text-[#93958C] font-mono uppercase font-medium tracking-wider">Certified Votes</div>
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
                    className="bg-[#F8F7F2] rounded-xl p-5 border border-[#D2D2C9] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-xs font-mono font-semibold text-[#A48B70]">{candidate.number || `0${idx+1}`}</span>
                        <div>
                          <span className="font-semibold text-xs text-[#30362F] block">{candidate.name}</span>
                          <span className="text-[10px] text-[#6F746B]">{candidate.role}</span>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-semibold text-[#30362F]">
                        {candidate.votes} <span className="text-[10px] text-[#93958C] font-normal font-sans">votes</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#E9E8E2] rounded-full h-1.5 overflow-hidden border border-[#D2D2C9]">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${idx === 0 ? 'bg-[#536A55]' : 'bg-[#A48B70]'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#6F746B] font-mono">
                      <span>Vote Share:</span>
                      <span className="font-medium text-[#30362F]">{percentage}%</span>
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
