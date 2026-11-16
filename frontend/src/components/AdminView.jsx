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

  // Election lifecycle
  const [isStartingElection, setIsStartingElection] = useState(false);
  const [isEndingElection, setIsEndingElection] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  // Whitelist
  const [singleVoterAddress, setSingleVoterAddress] = useState('');
  const [batchVoterAddresses, setBatchVoterAddresses] = useState('');
  const [isWhitelisting, setIsWhitelisting] = useState(false);

  // Tally
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
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Restore private key from sessionStorage
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
      notify(`Generated ${keyBitLength}-bit keypair. Ready to publish.`);
    } catch (err) {
      setActionError('Key generation failed: ' + err.message);
    } finally {
      setIsGeneratingKeys(false);
    }
  };

  // Publish public key
  const handlePublishKey = async () => {
    if (!contract) return;
    try {
      setIsPublishingKey(true);
      setActionError('');
      const pubN = localPrivateKey?.publicKey?.n?.toString() || sessionStorage.getItem('paillier_admin_pubkey_n');
      const pubG = localPrivateKey?.publicKey?.g?.toString() || sessionStorage.getItem('paillier_admin_pubkey_g');
      if (!pubN || !pubG) throw new Error('No key found. Generate keys first.');
      const tx = await contract.setPaillierPublicKey(pubN, pubG);
      await tx.wait();
      notify('Public key published to Ethereum.');
      if (onRefreshContractData) onRefreshContractData();
    } catch (err) {
      setActionError(err?.reason || err?.message || 'Failed to publish key.');
    } finally {
      setIsPublishingKey(false);
    }
  };

  // Start election
  const handleStartElection = async () => {
    if (!contract) return;
    try {
      setIsStartingElection(true);
      setActionError('');
      const tx = await contract.startElection();
      await tx.wait();
      notify('Election is now open.');
      if (onRefreshContractData) onRefreshContractData();
    } catch (err) {
      setActionError(err?.reason || err?.message || 'Failed to start election.');
    } finally {
      setIsStartingElection(false);
      setShowStartModal(false);
    }
  };

  // End election
  const handleEndElection = async () => {
    if (!contract) return;
    try {
      setIsEndingElection(true);
      setActionError('');
      const tx = await contract.endElection();
      await tx.wait();
      notify('Election closed. Tallying is now available.');
      if (onRefreshContractData) onRefreshContractData();
      fetchEncryptedVotes();
    } catch (err) {
      setActionError(err?.reason || err?.message || 'Failed to close election.');
    } finally {
      setIsEndingElection(false);
      setShowEndModal(false);
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
      notify(`${truncateAddress(singleVoterAddress.trim())} has been whitelisted.`);
      setSingleVoterAddress('');
      if (onRefreshContractData) onRefreshContractData();
    } catch (err) {
      setActionError(err?.reason || err?.message || 'Failed to whitelist voter.');
    } finally {
      setIsWhitelisting(false);
    }
  };

  // Batch whitelist
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
      if (addresses.length === 0) throw new Error('Enter at least one address.');
      const tx = await contract.batchAddVoters(addresses);
      await tx.wait();
      notify(`${addresses.length} voters whitelisted.`);
      setBatchVoterAddresses('');
      if (onRefreshContractData) onRefreshContractData();
    } catch (err) {
      setActionError(err?.reason || err?.message || 'Batch whitelist failed.');
    } finally {
      setIsWhitelisting(false);
    }
  };

  // Homomorphic aggregation
  const handleComputeHomomorphicAddition = () => {
    try {
      setIsAggregating(true);
      setActionError('');
      if (!publicKey) throw new Error('Encryption key not set on contract.');
      if (encryptedVotesList.length === 0) throw new Error('No ballots to aggregate.');
      const aggregate = homomorphicAddition(publicKey, encryptedVotesList);
      setHomomorphicSumCiphertext(aggregate.toString());
    } catch (err) {
      setActionError('Aggregation failed: ' + err.message);
    } finally {
      setIsAggregating(false);
    }
  };

  // Decrypt tally & announce winner
  const handleDecryptAndTally = () => {
    try {
      setIsDecrypting(true);
      setActionError('');
      if (!localPrivateKey) throw new Error('Private key not in session. Generate keys first.');
      if (!homomorphicSumCiphertext) throw new Error('Compute homomorphic product first.');
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
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#536A55', '#A48B70', '#A87565', '#D2D2C9'],
      });
    } catch (err) {
      setActionError('Decryption failed: ' + err.message);
    } finally {
      setIsDecrypting(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const Section = ({ title, children }) => (
    <div className="bg-[#F4F3EE] border border-[#D2D2C9] rounded-xl p-6 space-y-5">
      <h2 className="text-xs font-mono uppercase tracking-widest text-[#6F746B] border-b border-[#D2D2C9] pb-3">
        {title}
      </h2>
      {children}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      {/* Confirmation modal — Start */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 bg-[#30362F]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F8F7F2] border border-[#D2D2C9] rounded-xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-semibold text-[#30362F]">Open Voting?</h3>
            <p className="text-xs text-[#6F746B] leading-relaxed">
              Whitelisted voters will be able to submit encrypted ballots. This action is recorded on the Ethereum blockchain.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-1">
              <button
                onClick={() => setShowStartModal(false)}
                disabled={isStartingElection}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#30362F] bg-[#F4F3EE] hover:bg-[#DEDED5] border border-[#D2D2C9] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleStartElection}
                disabled={isStartingElection}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#F8F7F2] bg-[#536A55] hover:bg-[#465B48] active:scale-[0.99] transition-all shadow-sm flex items-center space-x-1.5"
              >
                {isStartingElection && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Open</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal — End */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-[#30362F]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F8F7F2] border border-[#D2D2C9] rounded-xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-semibold text-[#30362F]">Close Voting?</h3>
            <p className="text-xs text-[#6F746B] leading-relaxed">
              No further ballots will be accepted. This permanently seals the ballot pool and enables off-chain tallying.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-1">
              <button
                onClick={() => setShowEndModal(false)}
                disabled={isEndingElection}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#30362F] bg-[#F4F3EE] hover:bg-[#DEDED5] border border-[#D2D2C9] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEndElection}
                disabled={isEndingElection}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#F8F7F2] bg-[#A87565] hover:bg-[#946455] active:scale-[0.99] transition-all shadow-sm flex items-center space-x-1.5"
              >
                {isEndingElection && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#30362F] tracking-tight">Election Administration</h1>
        <p className="text-sm text-[#6F746B] mt-1">
          Manage the election lifecycle, encryption keys, voter access, and results.
        </p>
      </div>

      {/* Not-admin warning */}
      {!isAdmin && account && (
        <div className="p-4 rounded-xl bg-[#F7EFEB] border border-[#DEC2B9] text-[#30362F] flex items-start space-x-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#A87565] mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-[#A87565] block mb-0.5">Not the election administrator</span>
            <span className="text-[#6F746B]">
              Connected as {truncateAddress(account)}. Admin is {truncateAddress(adminAddress)}. Switch to the deployer account in MetaMask to administer this election.
            </span>
          </div>
        </div>
      )}

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-lg bg-[#E8F0EA] border border-[#C3D1C0] text-[#457354] text-xs flex items-center space-x-2.5">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 rounded-lg bg-[#F7ECEB] border border-[#DEC2B9] text-[#A34A42] text-xs flex items-center space-x-2.5">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* ── 1. Election Lifecycle ──────────────────────────────────────── */}
      <Section title="Election Lifecycle">
        {/* Current status */}
        <div className="flex items-center space-x-2 text-sm">
          <span className={`w-2 h-2 rounded-full ${isElectionOpen ? 'bg-[#536A55]' : 'bg-[#93958C]'}`} />
          <span className="font-medium text-[#30362F]">
            {isElectionOpen ? 'Voting is open' : 'Voting is closed'}
          </span>
          <span className="text-[#93958C] text-xs font-mono ml-auto">
            {encryptedVotesList.length} ballot{encryptedVotesList.length !== 1 ? 's' : ''} recorded
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowStartModal(true)}
            disabled={isElectionOpen || isStartingElection || !isAdmin}
            className={`min-h-[44px] rounded-lg font-medium text-xs flex items-center justify-center space-x-2 transition-all ${
              !isElectionOpen && isAdmin && !isStartingElection
                ? 'bg-[#536A55] hover:bg-[#465B48] active:scale-[0.99] text-[#F8F7F2] shadow-sm'
                : 'bg-[#DEDED5] text-[#93958C] cursor-not-allowed border border-[#D2D2C9]'
            }`}
          >
            {isStartingElection
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Open Voting</span>
          </button>

          <button
            onClick={() => setShowEndModal(true)}
            disabled={!isElectionOpen || isEndingElection || !isAdmin}
            className={`min-h-[44px] rounded-lg font-medium text-xs flex items-center justify-center space-x-2 transition-all ${
              isElectionOpen && isAdmin && !isEndingElection
                ? 'bg-[#A87565] hover:bg-[#946455] active:scale-[0.99] text-[#F8F7F2] shadow-sm'
                : 'bg-[#DEDED5] text-[#93958C] cursor-not-allowed border border-[#D2D2C9]'
            }`}
          >
            {isEndingElection
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <Square className="w-3.5 h-3.5 fill-current" />}
            <span>Close Voting</span>
          </button>
        </div>
      </Section>

      {/* ── 2. Encryption Key ─────────────────────────────────────────── */}
      <Section title="Paillier Encryption Key">
        {/* Key status line */}
        <div className="flex items-center space-x-2 text-xs font-mono text-[#6F746B]">
          <span className={`w-1.5 h-1.5 rounded-full ${publicKey ? 'bg-[#536A55]' : 'bg-[#93958C]'}`} />
          <span>{publicKey ? 'Key published on-chain' : 'No key on-chain'}</span>
          {localPrivateKey && (
            <span className="ml-auto text-[#536A55]">Private key in session</span>
          )}
        </div>

        {/* Bitlength selector */}
        <div className="flex items-center space-x-3">
          <span className="text-xs text-[#6F746B]">Key size</span>
          <div className="flex items-center space-x-1 bg-[#DEDED5] p-1 rounded-lg border border-[#D2D2C9]/60">
            {[512, 1024, 2048].map((bits) => (
              <button
                key={bits}
                onClick={() => setKeyBitLength(bits)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
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

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGenerateKeys}
            disabled={isGeneratingKeys || !isAdmin}
            className="min-h-[44px] flex-1 rounded-lg text-xs font-medium bg-[#F4F3EE] hover:bg-[#DEDED5] border border-[#D2D2C9] text-[#30362F] flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {isGeneratingKeys && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Generate {keyBitLength}-bit Keys</span>
          </button>

          <button
            onClick={handlePublishKey}
            disabled={isPublishingKey || (!localPrivateKey && !publicKey) || !isAdmin}
            className="min-h-[44px] flex-1 rounded-lg text-xs font-medium bg-[#536A55] hover:bg-[#465B48] text-[#F8F7F2] active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-50 transition-all shadow-sm"
          >
            {isPublishingKey && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Publish to Contract</span>
          </button>
        </div>
      </Section>

      {/* ── 3. Voter Whitelisting ─────────────────────────────────────── */}
      <Section title="Voter Whitelisting">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Single */}
          <form onSubmit={handleAddSingleVoter} className="space-y-2">
            <label className="text-xs text-[#6F746B] block">Single address</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="0x…"
                value={singleVoterAddress}
                onChange={(e) => setSingleVoterAddress(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-[#F8F7F2] border border-[#D2D2C9] text-[#30362F] placeholder-[#93958C] font-mono text-xs focus:outline-none focus:border-[#536A55]"
              />
              <button
                type="submit"
                disabled={isWhitelisting || !singleVoterAddress || !isAdmin}
                className="min-h-[40px] px-4 rounded-lg text-xs font-medium bg-[#536A55] hover:bg-[#465B48] active:scale-[0.99] text-[#F8F7F2] flex items-center space-x-1.5 disabled:opacity-50 transition-all shadow-sm"
              >
                {isWhitelisting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>Add</span>
              </button>
            </div>
          </form>

          {/* Batch */}
          <form onSubmit={handleBatchAddVoters} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#6F746B]">Batch addresses</label>
              <button
                type="button"
                onClick={() =>
                  setBatchVoterAddresses(
                    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8\n0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC\n0x90F79bf6EB2c4f870365E785982E1f101E93b906'
                  )
                }
                className="text-[11px] text-[#A48B70] hover:underline font-mono"
              >
                Fill test accounts
              </button>
            </div>
            <div className="flex space-x-2">
              <textarea
                rows={2}
                placeholder="One address per line"
                value={batchVoterAddresses}
                onChange={(e) => setBatchVoterAddresses(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-[#F8F7F2] border border-[#D2D2C9] text-[#30362F] placeholder-[#93958C] font-mono text-xs focus:outline-none focus:border-[#536A55] resize-none"
              />
              <button
                type="submit"
                disabled={isWhitelisting || !batchVoterAddresses || !isAdmin}
                className="min-h-[40px] px-4 self-end rounded-lg text-xs font-medium bg-[#F4F3EE] hover:bg-[#DEDED5] border border-[#D2D2C9] text-[#30362F] flex items-center space-x-1.5 disabled:opacity-50 transition-all"
              >
                {isWhitelisting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                <span>Add All</span>
              </button>
            </div>
          </form>
        </div>
      </Section>

      {/* ── 4. Homomorphic Tally ─────────────────────────────────────── */}
      <Section title="Tally & Results">
        {/* Tally mode selector */}
        <div className="flex items-center space-x-3">
          <span className="text-xs text-[#6F746B]">Encoding scheme</span>
          <div className="flex items-center space-x-1 bg-[#DEDED5] p-1 rounded-lg border border-[#D2D2C9]/60">
            <button
              onClick={() => setTallyMode('radix')}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                tallyMode === 'radix'
                  ? 'bg-[#F8F7F2] text-[#30362F] shadow-sm border border-[#D2D2C9]'
                  : 'text-[#6F746B] hover:text-[#30362F]'
              }`}
            >
              Radix
            </button>
            <button
              onClick={() => setTallyMode('simple')}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                tallyMode === 'simple'
                  ? 'bg-[#F8F7F2] text-[#30362F] shadow-sm border border-[#D2D2C9]'
                  : 'text-[#6F746B] hover:text-[#30362F]'
              }`}
            >
              Linear
            </button>
          </div>
          <button
            onClick={fetchEncryptedVotes}
            disabled={isLoadingVotes}
            className="ml-auto p-2 rounded-lg bg-[#F8F7F2] hover:bg-[#DEDED5] text-[#6F746B] border border-[#D2D2C9] transition-colors"
            title="Refresh ballots from blockchain"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVotes ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Ballot count */}
        <div className="text-xs text-[#6F746B] font-mono">
          {encryptedVotesList.length} encrypted ballot{encryptedVotesList.length !== 1 ? 's' : ''} on-chain
          {!isElectionOpen && encryptedVotesList.length > 0 && (
            <span className="text-[#536A55] ml-2">— ready to tally</span>
          )}
        </div>

        {/* Two-step tally actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleComputeHomomorphicAddition}
            disabled={encryptedVotesList.length === 0 || isAggregating || !isAdmin}
            className={`min-h-[44px] rounded-lg font-medium text-xs flex items-center justify-center space-x-2 transition-all ${
              encryptedVotesList.length > 0 && isAdmin && !isAggregating
                ? 'bg-[#F4F3EE] hover:bg-[#DEDED5] text-[#30362F] border border-[#D2D2C9]'
                : 'bg-[#DEDED5] text-[#93958C] cursor-not-allowed border border-[#D2D2C9]'
            }`}
          >
            {isAggregating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
            <span>Aggregate Ciphertexts</span>
          </button>

          <button
            onClick={handleDecryptAndTally}
            disabled={!homomorphicSumCiphertext || !localPrivateKey || isDecrypting || !isAdmin}
            className={`min-h-[44px] rounded-lg font-medium text-xs flex items-center justify-center space-x-2 transition-all ${
              homomorphicSumCiphertext && localPrivateKey && isAdmin && !isDecrypting
                ? 'bg-[#536A55] hover:bg-[#465B48] active:scale-[0.99] text-[#F8F7F2] shadow-sm'
                : 'bg-[#DEDED5] text-[#93958C] cursor-not-allowed border border-[#D2D2C9]'
            }`}
          >
            {isDecrypting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>Decrypt & Reveal Results</span>
          </button>
        </div>

        {/* Aggregate ciphertext preview */}
        {homomorphicSumCiphertext && (
          <div className="bg-[#E9E8E2] rounded-lg px-4 py-3 font-mono text-xs text-[#30362F] break-all space-y-2">
            <span className="text-[#93958C] text-[10px] uppercase tracking-wider block">Aggregate ciphertext (C_total)</span>
            <span>{truncateCiphertext(homomorphicSumCiphertext, 48)}</span>
            {decryptedSum !== null && (
              <div className="pt-2 border-t border-[#D2D2C9] flex items-center justify-between font-sans text-xs">
                <span className="text-[#6F746B]">Decrypted sum</span>
                <span className="font-mono font-bold text-[#536A55]">{decryptedSum.toString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Election results */}
        {tallyResults && tallyResults.length > 0 && (
          <div className="space-y-4 pt-2 border-t border-[#D2D2C9]">
            {/* Winner */}
            <div className="rounded-xl bg-[#F8F7F2] border-2 border-[#536A55] p-5 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#536A55] block mb-1">
                  Winner
                </span>
                <h4 className="text-lg font-semibold text-[#30362F] tracking-tight">{tallyResults[0].name}</h4>
                <p className="text-xs text-[#6F746B] mt-0.5">{tallyResults[0].platform}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-3xl font-mono font-semibold text-[#536A55]">{tallyResults[0].votes}</div>
                <div className="text-[10px] text-[#93958C] font-mono uppercase tracking-wider">votes</div>
              </div>
            </div>

            {/* All candidates */}
            <div className="space-y-3">
              {tallyResults.map((candidate, idx) => {
                const totalBallots = encryptedVotesList.length || 1;
                const pct = Math.round((candidate.votes / totalBallots) * 100);
                return (
                  <div key={candidate.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#30362F]">{candidate.name}</span>
                      <span className="font-mono text-[#30362F]">
                        {candidate.votes} <span className="text-[#93958C] font-normal">votes · {pct}%</span>
                      </span>
                    </div>
                    <div className="w-full bg-[#E9E8E2] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${idx === 0 ? 'bg-[#536A55]' : 'bg-[#A48B70]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
