import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { VoterView } from './components/VoterView';
import { AdminView } from './components/AdminView';
import { CryptoInspector } from './components/CryptoInspector';
import { UnauthorizedView } from './components/UnauthorizedView';
import { LandingGateway } from './components/LandingGateway';
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

  // App Navigation View: 'landing' | 'voter' | 'admin' | 'unauthorized' | 'crypto'
  const [currentView, setCurrentView] = useState('landing');
  const [notification, setNotification] = useState(null);

  // Reference to main interactive action section
  const actionSectionRef = useRef(null);

  const showToast = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Authoritative Role Calculation
  const isAdmin = Boolean(
    account && adminAddress && account.toLowerCase() === adminAddress.toLowerCase()
  );
  const isAuthorizedVoter = Boolean(account && !isAdmin && isWhitelisted);
  const isUnauthorized = Boolean(account && !isAdmin && !isWhitelisted);
  const isCorrectNetwork = !chainId || chainId === HARDHAT_CHAIN_ID;

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

  // Dynamic role re-evaluation on MetaMask accountsChanged event
  const handleAccountsChanged = useCallback(async (accs) => {
    if (!accs || accs.length === 0) {
      // User disconnected in MetaMask extension
      setAccount('');
      setSigner(null);
      setIsWhitelisted(false);
      setHasVoted(false);
      setCurrentView('landing');
      showToast("Wallet disconnected in MetaMask.", 'info');
      return;
    }

    const newAcc = accs[0];
    setAccount(newAcc);

    if (window.ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        let signerObj = null;
        try {
          signerObj = await browserProvider.getSigner();
          setSigner(signerObj);
        } catch {
          // Ignored if detached or pending
        }
        setProvider(browserProvider);

        const queryContract = signerObj 
          ? getEVotingContract(signerObj) 
          : getEVotingContract(browserProvider);
        setContract(queryContract);

        const [admin, [whitelisted, voted]] = await Promise.all([
          queryContract.admin().catch(() => contractDeployment.admin || ''),
          queryContract.getVoterStatus(newAcc),
        ]);

        setAdminAddress(admin);
        const isUserWhitelisted = Boolean(whitelisted);
        setIsWhitelisted(isUserWhitelisted);
        setHasVoted(Boolean(voted));

        // CRITICAL: Immediately re-evaluate role. Never leave an admin dashboard visible.
        if (admin && newAcc.toLowerCase() === admin.toLowerCase()) {
          setCurrentView('admin');
          showToast(`Switched to Administrator Account (${newAcc.slice(0, 6)}...${newAcc.slice(-4)})`, 'info');
        } else if (isUserWhitelisted) {
          setCurrentView('voter');
          showToast(`Switched to Whitelisted Voter Account (${newAcc.slice(0, 6)}...${newAcc.slice(-4)})`, 'info');
        } else {
          setCurrentView('unauthorized');
          showToast(`Switched to Unregistered Account: Access Restricted (${newAcc.slice(0, 6)}...${newAcc.slice(-4)})`, 'error');
        }
      } catch (err) {
        console.warn("Signer update on account change:", err);
        setCurrentView('unauthorized');
      }
    }
  }, [showToast]);

  const handleChainChanged = useCallback((newChainId) => {
    const parsedId = BigInt(newChainId);
    setChainId(parsedId);
    if (parsedId !== HARDHAT_CHAIN_ID) {
      showToast("Notice: Switched away from Hardhat Localhost (31337).", 'error');
    }
  }, [showToast]);

  const listenersAttachedRef = useRef(false);

  const setupEthereumListeners = useCallback(() => {
    if (!hasEthereum() || listenersAttachedRef.current) return;
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    listenersAttachedRef.current = true;
  }, [handleAccountsChanged, handleChainChanged]);

  // Connect Wallet Handler with Immediate Role Routing
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      sessionStorage.removeItem('evoting_manual_disconnect');
      const res = await connectWallet();
      setProvider(res.provider);
      setSigner(res.signer);
      setAccount(res.address);
      setChainId(res.chainId);

      // Attach event listeners immediately upon wallet connection
      setupEthereumListeners();

      // Actively query smart contract for authoritative role detection
      const activeContract = getEVotingContract(res.signer);
      setContract(activeContract);

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
      }

      const [whitelisted, voted] = await activeContract.getVoterStatus(res.address);
      const isUserWhitelisted = Boolean(whitelisted);
      setIsWhitelisted(isUserWhitelisted);
      setHasVoted(Boolean(voted));

      // Automatic Role Routing
      if (admin && res.address.toLowerCase() === admin.toLowerCase()) {
        setCurrentView('admin');
        showToast(`Authenticated as Election Administrator (${res.address.slice(0, 6)}...${res.address.slice(-4)})`, 'success');
      } else if (isUserWhitelisted) {
        setCurrentView('voter');
        showToast(`Authenticated as Registered Voter (${res.address.slice(0, 6)}...${res.address.slice(-4)})`, 'success');
      } else {
        setCurrentView('unauthorized');
        showToast(`Connected: ${res.address.slice(0, 6)}...${res.address.slice(-4)} (Not Whitelisted)`, 'error');
      }
    } catch (err) {
      console.error("Connect wallet error:", err);
      showToast(err.message, 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Wallet Handler
  const handleDisconnect = () => {
    sessionStorage.setItem('evoting_manual_disconnect', 'true');
    setAccount('');
    setSigner(null);
    setIsWhitelisted(false);
    setHasVoted(false);
    setCurrentView('landing');
    showToast("Wallet disconnected.", 'info');
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

  // Auto-connect check strictly on initial mount
  useEffect(() => {
    if (!hasEthereum()) return;

    const checkExistingConnection = async () => {
      // Respect explicit manual disconnects across refreshes
      if (sessionStorage.getItem('evoting_manual_disconnect') === 'true') {
        return;
      }

      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send('eth_accounts', []);
        if (sessionStorage.getItem('evoting_manual_disconnect') === 'true') return;

        if (accounts && accounts.length > 0) {
          const signerObj = await browserProvider.getSigner();
          const net = await browserProvider.getNetwork();
          if (sessionStorage.getItem('evoting_manual_disconnect') === 'true') return;

          setProvider(browserProvider);
          setSigner(signerObj);
          setAccount(accounts[0]);
          setChainId(net.chainId);

          const activeContract = getEVotingContract(signerObj);
          setContract(activeContract);

          const [admin, openState, [pubN, pubG]] = await Promise.all([
            activeContract.admin().catch(() => contractDeployment.admin || ''),
            activeContract.isElectionOpen(),
            activeContract.getPaillierPublicKey(),
          ]);

          if (sessionStorage.getItem('evoting_manual_disconnect') === 'true') return;

          setAdminAddress(admin);
          setIsElectionOpen(openState);

          if (pubN && pubG && pubN.length > 0 && pubG.length > 0) {
            setPaillierPublicKey(deserializePublicKey(pubN, pubG));
          }

          const [whitelisted, voted] = await activeContract.getVoterStatus(accounts[0]);
          if (sessionStorage.getItem('evoting_manual_disconnect') === 'true') return;

          const isUserWhitelisted = Boolean(whitelisted);
          setIsWhitelisted(isUserWhitelisted);
          setHasVoted(Boolean(voted));

          // Auto-route on mount if connected
          if (admin && accounts[0].toLowerCase() === admin.toLowerCase()) {
            setCurrentView('admin');
          } else if (isUserWhitelisted) {
            setCurrentView('voter');
          } else {
            setCurrentView('unauthorized');
          }
        }
      } catch (err) {
        console.warn("Could not auto-connect wallet on mount:", err);
      }
    };

    checkExistingConnection();
  }, []);

  // MetaMask Event Listeners
  useEffect(() => {
    if (!hasEthereum() || !window.ethereum) return;

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [handleAccountsChanged, handleChainChanged]);

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
          setIsWhitelisted(true);
          if (currentView === 'unauthorized') {
            setCurrentView('voter');
          }
        }
        refreshContractData();
      };

      const onVoteCast = (voter) => {
        if (account && voter.toLowerCase() === account.toLowerCase()) {
          showToast("Ballot confirmed on Ethereum blockchain.", 'success');
          setHasVoted(true);
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
  }, [contract, account, currentView, refreshContractData]);

  // Controlled Navigation Handler with Access Guards
  const handleNavigateView = (view) => {
    // Security Guard: Prevent unauthorized access to Admin View
    if (view === 'admin' && !isAdmin) {
      setCurrentView('unauthorized');
      showToast("Access Denied: Administrator credentials required.", 'error');
      return;
    }

    // Security Guard: Prevent non-whitelisted access to Voter View
    if (view === 'voter' && !isAuthorizedVoter) {
      if (!account) {
        setCurrentView('landing');
        showToast("Please connect your wallet first to vote.", 'info');
      } else {
        setCurrentView('unauthorized');
        showToast("Access Denied: Wallet is not registered to vote.", 'error');
      }
      return;
    }

    setCurrentView(view);

    // Smooth scroll positioning
    if (view === 'landing') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (actionSectionRef.current) {
      const rect = actionSectionRef.current.getBoundingClientRect();
      const headerOffset = window.innerWidth >= 768 ? 90 : 120;
      if (rect.top > headerOffset + 50) {
        window.scrollTo({
          top: window.pageYOffset + rect.top - headerOffset,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#08090B] text-white font-sans selection:bg-[#C6FF00] selection:text-[#08090B] pt-24 md:pt-20">
      
      {/* Persistently Sticky Luxury Navigation with Role-First Tabs */}
      <Navbar
        account={account}
        isAdmin={isAdmin}
        isWhitelisted={isWhitelisted}
        isConnecting={isConnecting}
        onConnectWallet={handleConnect}
        onDisconnectWallet={handleDisconnect}
        onSwitchNetwork={handleSwitchNetwork}
        isCorrectNetwork={isCorrectNetwork}
        isElectionOpen={isElectionOpen}
        currentView={currentView}
        setCurrentView={handleNavigateView}
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

      {/* VIEW ROUTING ARCHITECTURE */}

      {/* 1. LANDING VIEW: Monumental Hero + Soft Ivory Gateway */}
      {currentView === 'landing' && (
        <>
          <HeroSection
            isElectionOpen={isElectionOpen}
            onNavigateTab={handleNavigateView}
            onConnectWallet={handleConnect}
            account={account}
            isAdmin={isAdmin}
            isWhitelisted={isWhitelisted}
          />
          <main ref={actionSectionRef} className="flex-1 w-full bg-[#F3F0E6] text-[#08090B] scroll-mt-28 transition-colors duration-300">
            <LandingGateway
              isConnecting={isConnecting}
              onConnectWallet={handleConnect}
              onNavigateCrypto={() => handleNavigateView('crypto')}
              isElectionOpen={isElectionOpen}
            />
          </main>
        </>
      )}

      {/* 2. CRYPTOGRAPHY LAB VIEW: Independent Math Specification & Sandbox */}
      {currentView === 'crypto' && (
        <main ref={actionSectionRef} className="flex-1 w-full bg-[#F3F0E6] text-[#08090B] scroll-mt-28 transition-colors duration-300 pt-8 sm:pt-12">
          {/* Breadcrumb Return Action */}
          <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-12 lg:px-16 pb-4">
            <button
              onClick={() => {
                if (!account) handleNavigateView('landing');
                else if (isAdmin) handleNavigateView('admin');
                else if (isWhitelisted) handleNavigateView('voter');
                else handleNavigateView('unauthorized');
              }}
              className="inline-flex items-center space-x-2 text-xs font-mono font-bold tracking-wider uppercase text-[#08090B] bg-[#08090B]/5 hover:bg-[#08090B]/10 px-4 py-2 rounded-full border border-[#08090B]/15 transition-all"
            >
              <span>←</span>
              <span>
                {!account
                  ? 'Return to Landing Screen'
                  : isAdmin
                  ? 'Return to Admin Console'
                  : isWhitelisted
                  ? 'Return to Voter Ballot'
                  : 'Return to Access Status'}
              </span>
            </button>
          </div>

          <CryptoInspector publicKey={paillierPublicKey} />
        </main>
      )}

      {/* 3. VOTER BALLOT VIEW: Authorized Voters Only */}
      {currentView === 'voter' && (
        <main ref={actionSectionRef} className="flex-1 w-full bg-[#F3F0E6] text-[#08090B] scroll-mt-28 transition-colors duration-300 pt-8 sm:pt-12">
          {isAuthorizedVoter ? (
            <VoterView
              account={account}
              contract={contract}
              isWhitelisted={isWhitelisted}
              hasVoted={hasVoted}
              isElectionOpen={isElectionOpen}
              publicKey={paillierPublicKey}
              onVoteCastSuccess={refreshContractData}
            />
          ) : (
            <UnauthorizedView
              account={account}
              contractAddress={contractDeployment.address}
              onDisconnectWallet={handleDisconnect}
              onNavigateCrypto={() => handleNavigateView('crypto')}
              onNavigateLanding={() => handleNavigateView('landing')}
            />
          )}
        </main>
      )}

      {/* 4. ADMIN CONSOLE VIEW: Election Authority Only */}
      {currentView === 'admin' && (
        <main ref={actionSectionRef} className="flex-1 w-full bg-[#F3F0E6] text-[#08090B] scroll-mt-28 transition-colors duration-300 pt-8 sm:pt-12">
          {isAdmin ? (
            <AdminView
              account={account}
              contract={contract}
              adminAddress={adminAddress}
              isAdmin={isAdmin}
              isElectionOpen={isElectionOpen}
              publicKey={paillierPublicKey}
              onRefreshContractData={refreshContractData}
            />
          ) : (
            <UnauthorizedView
              account={account}
              contractAddress={contractDeployment.address}
              onDisconnectWallet={handleDisconnect}
              onNavigateCrypto={() => handleNavigateView('crypto')}
              onNavigateLanding={() => handleNavigateView('landing')}
            />
          )}
        </main>
      )}

      {/* 5. UNAUTHORIZED VIEW: Connected but Unregistered Wallet */}
      {currentView === 'unauthorized' && (
        <main ref={actionSectionRef} className="flex-1 w-full bg-[#F3F0E6] text-[#08090B] scroll-mt-28 transition-colors duration-300 pt-8 sm:pt-12">
          <UnauthorizedView
            account={account}
            contractAddress={contractDeployment.address}
            onDisconnectWallet={handleDisconnect}
            onNavigateCrypto={() => handleNavigateView('crypto')}
            onNavigateLanding={() => handleNavigateView('landing')}
          />
        </main>
      )}

      {/* Luxury Architectural Footer */}
      <footer className="border-t border-[#232730] bg-[#08090B] py-8">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <span className="w-2 h-2 rounded-[2px] bg-[#C6FF00]" />
            <span className="font-mono text-xs tracking-wider text-white font-bold uppercase">
              Decentralized E-Voting System
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
