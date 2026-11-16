import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Navbar } from './components/Navbar';
import { VoterView } from './components/VoterView';
import { AdminView } from './components/AdminView';
import { CryptoInspector } from './components/CryptoInspector';
import { 
  hasEthereum, 
  connectWallet, 
  switchNetwork, 
  getEVotingContract, 
  getProvider 
} from './utils/contract';
import { deserializePublicKey } from './utils/crypto';
import { HARDHAT_CHAIN_ID } from './utils/constants';
import contractDeployment from './contracts/EVoting.json';
import { AlertCircle, CheckCircle2, ShieldCheck, Vote } from 'lucide-react';

export function App() {
  // Wallet & Network State
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Contract State
  const [contract, setContract] = useState(null);
  const [adminAddress, setAdminAddress] = useState('');
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isElectionOpen, setIsElectionOpen] = useState(false);
  const [paillierPublicKey, setPaillierPublicKey] = useState(null);

  // App UI State
  const [activeTab, setActiveTab] = useState('voter'); // 'voter' | 'admin' | 'crypto'
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Fetch contract data for the current account
  const refreshContractData = useCallback(async () => {
    try {
      const activeProvider = provider || getProvider();
      let activeContract;

      if (signer) {
        activeContract = getEVotingContract(signer);
      } else {
        activeContract = getEVotingContract(activeProvider);
      }

      setContract(activeContract);

      const [admin, openState, [pubN, pubG]] = await Promise.all([
        activeContract.admin().catch(() => contractDeployment.admin || ''),
        activeContract.isElectionOpen().catch(() => false),
        activeContract.getPaillierPublicKey().catch(() => ['', '']),
      ]);

      setAdminAddress(admin);
      setIsElectionOpen(openState);

      if (pubN && pubG && pubN.length > 0 && pubG.length > 0) {
        const pub = deserializePublicKey(pubN, pubG);
        setPaillierPublicKey(pub);
      } else {
        setPaillierPublicKey(null);
      }

      if (account) {
        const [whitelisted, voted] = await activeContract.getVoterStatus(account).catch(() => [false, false]);
        setIsWhitelisted(whitelisted);
        setHasVoted(voted);
      } else {
        setIsWhitelisted(false);
        setHasVoted(false);
      }
    } catch (err) {
      console.warn("Could not query contract status:", err.message);
    }
  }, [account, provider, signer]);

  // Connect Wallet Handler
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const res = await connectWallet();
      setProvider(res.provider);
      setSigner(res.signer);
      setAccount(res.address);
      setChainId(res.chainId);
      showToast(`Connected: ${res.address.slice(0, 6)}...${res.address.slice(-4)}`, 'success');
    } catch (err) {
      console.error("Connect wallet error:", err);
      showToast(err.message, 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch Network Handler
  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork();
      showToast("Switched to Hardhat Localhost (31337)", 'success');
    } catch (err) {
      console.error("Switch network error:", err);
      showToast("Failed to switch network: " + err.message, 'error');
    }
  };

  // Check if wallet is already connected on mount
  useEffect(() => {
    if (!hasEthereum()) return;

    const checkExistingConnection = async () => {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send('eth_accounts', []);
        if (accounts && accounts.length > 0) {
          const signerObj = await browserProvider.getSigner();
          const net = await browserProvider.getNetwork();
          setProvider(browserProvider);
          setSigner(signerObj);
          setAccount(accounts[0]);
          setChainId(net.chainId);
        }
      } catch (err) {
        console.warn("Could not auto-connect wallet:", err);
      }
    };

    checkExistingConnection();

    // MetaMask Event Listeners with dynamic Signer refresh
    const handleAccountsChanged = async (accs) => {
      if (accs.length === 0) {
        setAccount('');
        setSigner(null);
      } else {
        setAccount(accs[0]);
        if (window.ethereum) {
          try {
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            const signerObj = await browserProvider.getSigner();
            setProvider(browserProvider);
            setSigner(signerObj);
          } catch (err) {
            console.warn("Signer update on account change:", err);
          }
        }
      }
    };

    const handleChainChanged = (newChainId) => {
      setChainId(BigInt(newChainId));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // Update contract data when account, provider, or signer changes
  useEffect(() => {
    refreshContractData();
  }, [account, provider, signer, refreshContractData]);

  // Set up smart contract event listeners
  useEffect(() => {
    if (!contract) return;

    try {
      const onVoterAdded = (voter) => {
        if (account && voter.toLowerCase() === account.toLowerCase()) {
          setIsWhitelisted(true);
          showToast("Your address has been whitelisted by the Admin.", 'success');
        }
      };

      const onVoteCast = (voter) => {
        if (account && voter.toLowerCase() === account.toLowerCase()) {
          setHasVoted(true);
          showToast("Ballot successfully recorded on Ethereum.", 'success');
        }
        refreshContractData();
      };

      const onElectionStarted = () => {
        setIsElectionOpen(true);
        showToast("Election is now officially OPEN.", 'info');
      };

      const onElectionEnded = () => {
        setIsElectionOpen(false);
        showToast("Election is now CLOSED. Tallying enabled.", 'info');
      };

      const onKeyPublished = () => {
        showToast("Paillier Public Key updated on smart contract.", 'info');
        refreshContractData();
      };

      contract.on("VoterAdded", onVoterAdded);
      contract.on("VoteCast", onVoteCast);
      contract.on("ElectionStarted", onElectionStarted);
      contract.on("ElectionEnded", onElectionEnded);
      contract.on("PaillierPublicKeySet", onKeyPublished);

      return () => {
        contract.removeAllListeners();
      };
    } catch (err) {
      console.warn("Could not attach contract event listeners:", err);
    }
  }, [contract, account, refreshContractData]);

  const isAdmin = Boolean(
    account && adminAddress && account.toLowerCase() === adminAddress.toLowerCase()
  );
  const isCorrectNetwork = !chainId || chainId === HARDHAT_CHAIN_ID;

  return (
    <div className="min-h-screen flex flex-col bg-[#111111] text-[#F5F5F5] selection:bg-[#D9225C] selection:text-white">
      {/* Navbar */}
      <Navbar
        account={account}
        isAdmin={isAdmin}
        isConnecting={isConnecting}
        onConnectWallet={handleConnect}
        onSwitchNetwork={handleSwitchNetwork}
        isCorrectNetwork={isCorrectNetwork}
        isElectionOpen={isElectionOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasContract={Boolean(contract)}
      />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-[#202020] text-[#F5F5F5] border border-[#353535] text-xs font-mono font-medium shadow-2xl">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#D9225C] flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#D9225C] flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'voter' && (
          <VoterView
            account={account}
            contract={contract}
            isWhitelisted={isWhitelisted}
            hasVoted={hasVoted}
            isElectionOpen={isElectionOpen}
            publicKey={paillierPublicKey}
            onVoteCastSuccess={() => {
              setHasVoted(true);
              refreshContractData();
            }}
          />
        )}

        {activeTab === 'admin' && (
          <AdminView
            account={account}
            contract={contract}
            adminAddress={adminAddress}
            isAdmin={isAdmin}
            isElectionOpen={isElectionOpen}
            publicKey={paillierPublicKey}
            onRefreshContractData={refreshContractData}
          />
        )}

        {activeTab === 'crypto' && (
          <CryptoInspector publicKey={paillierPublicKey} />
        )}
      </main>

      {/* Editorial Monochrome Footer */}
      <footer className="border-t border-[#353535] bg-[#111111] py-6 text-xs text-[#777477]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9225C]"></span>
            <p className="font-mono text-[#A6A3A5] text-[11px]">
              VERIFIO // E-VOTING PROTOCOL · ETHEREUM & PAILLIER HOMOMORPHIC CRYPTOSYSTEM
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="font-mono text-[11px] text-[#A6A3A5] bg-[#181818] px-2.5 py-1 rounded-md border border-[#353535]">
              CONTRACT: {contractDeployment.address ? `${contractDeployment.address.slice(0, 10)}...${contractDeployment.address.slice(-6)}` : 'NOT DEPLOYED'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
