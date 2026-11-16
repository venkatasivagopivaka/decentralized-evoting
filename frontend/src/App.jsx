import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
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
import { AlertCircle, CheckCircle2 } from 'lucide-react';

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

  // Reference to main interactive action section
  const actionSectionRef = useRef(null);

  const showToast = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Fetch contract data directly from the active smart contract
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

      // Query core election parameters from smart contract
      const [admin, openState, [pubN, pubG]] = await Promise.all([
        activeContract.admin().catch(() => contractDeployment.admin || ''),
        activeContract.isElectionOpen(),
        activeContract.getPaillierPublicKey(),
      ]);

      setAdminAddress(admin);
      setIsElectionOpen(openState);

      if (pubN && pubG && pubN.length > 0 && pubG.length > 0) {
        const pub = deserializePublicKey(pubN, pubG);
        setPaillierPublicKey(pub);
      } else {
        setPaillierPublicKey(null);
      }

      // Query voter status directly from smart contract for connected account
      if (account) {
        const [whitelisted, voted] = await activeContract.getVoterStatus(account);
        setIsWhitelisted(Boolean(whitelisted));
        setHasVoted(Boolean(voted));
      } else {
        setIsWhitelisted(false);
        setHasVoted(false);
      }
    } catch (err) {
      console.warn("Could not query contract status from blockchain:", err.message);
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
          showToast("Your address has been whitelisted on Ethereum.", 'success');
        }
        refreshContractData();
      };

      const onVoteCast = (voter) => {
        if (account && voter.toLowerCase() === account.toLowerCase()) {
          showToast("Ballot confirmed on Ethereum blockchain.", 'success');
        }
        refreshContractData();
      };

      const onElectionStarted = () => {
        showToast("Election is now officially OPEN on Ethereum.", 'info');
        refreshContractData();
      };

      const onElectionEnded = () => {
        showToast("Election is now CLOSED on Ethereum.", 'info');
        refreshContractData();
      };

      const onKeyPublished = () => {
        showToast("Paillier Public Key confirmed on smart contract.", 'info');
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

  // Smooth, predictable tab navigation without erratic scroll jumps
  const handleNavbarTabChange = (tab) => {
    setActiveTab(tab);
    
    // Only adjust scroll if user is above the action area (e.g. browsing the hero)
    if (actionSectionRef.current) {
      const rect = actionSectionRef.current.getBoundingClientRect();
      const headerOffset = window.innerWidth >= 768 ? 90 : 120;
      
      // If user is scrolled way above the action area, scroll down smoothly
      if (rect.top > headerOffset + 50) {
        window.scrollTo({
          top: window.pageYOffset + rect.top - headerOffset,
          behavior: 'smooth'
        });
      }
    }
  };

  // Intentional CTA navigation from Hero section buttons
  const handleHeroNavigateTab = (tab) => {
    setActiveTab(tab);
    if (actionSectionRef.current) {
      const rect = actionSectionRef.current.getBoundingClientRect();
      const headerOffset = window.innerWidth >= 768 ? 90 : 120;
      window.scrollTo({
        top: window.pageYOffset + rect.top - headerOffset,
        behavior: 'smooth'
      });
    }
  };

  const isAdmin = Boolean(
    account && adminAddress && account.toLowerCase() === adminAddress.toLowerCase()
  );
  const isCorrectNetwork = !chainId || chainId === HARDHAT_CHAIN_ID;

  return (
    <div className="min-h-screen flex flex-col bg-[#08090B] text-white font-sans selection:bg-[#C6FF00] selection:text-[#08090B] pt-24 md:pt-20">
      
      {/* Persistently Sticky / Fixed Luxury Header */}
      <Navbar
        account={account}
        isAdmin={isAdmin}
        isConnecting={isConnecting}
        onConnectWallet={handleConnect}
        onSwitchNetwork={handleSwitchNetwork}
        isCorrectNetwork={isCorrectNetwork}
        isElectionOpen={isElectionOpen}
        activeTab={activeTab}
        setActiveTab={handleNavbarTabChange}
        hasContract={Boolean(contract)}
      />

      {/* Floating Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center space-x-3 px-5 py-3.5 rounded-full bg-[#14171E] text-white border border-[#232730] text-xs font-mono font-medium shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#C6FF00] flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#FF5C5C] flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Monumental Hero Section */}
      <HeroSection
        isElectionOpen={isElectionOpen}
        onNavigateTab={handleHeroNavigateTab}
        onConnectWallet={handleConnect}
        account={account}
        isAdmin={isAdmin}
      />

      {/* Main Expansive Content Area in Soft Ivory */}
      <main ref={actionSectionRef} className="flex-1 w-full bg-[#F3F0E6] text-[#08090B] scroll-mt-28 transition-colors duration-300">
        {activeTab === 'voter' && (
          <VoterView
            account={account}
            contract={contract}
            isWhitelisted={isWhitelisted}
            hasVoted={hasVoted}
            isElectionOpen={isElectionOpen}
            publicKey={paillierPublicKey}
            onVoteCastSuccess={refreshContractData}
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

      {/* Luxury Architectural Footer */}
      <footer className="border-t border-[#232730] bg-[#08090B] py-8">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <span className="w-2 h-2 rounded-[2px] bg-[#C6FF00]" />
            <span className="font-mono text-xs tracking-wider text-white font-bold uppercase">
              VERIFIO
            </span>
            <span className="text-[#8B909D] font-mono text-xs">
              // ETHEREUM DEMOCRATIC PROTOCOL · PAILLIER CRYPTOSYSTEM
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="font-mono text-[11px] text-[#C6FF00] bg-[#0F1115] px-4 py-1.5 rounded-full border border-[#232730]">
              CONTRACT: {contractDeployment.address
                ? `${contractDeployment.address.slice(0, 10)}…${contractDeployment.address.slice(-8)}`
                : 'Not Deployed'}
            </span>
            <span className="font-mono text-[11px] text-[#8B909D]">
              CHAIN ID: {HARDHAT_CHAIN_ID.toString()}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
