import React from 'react';
import { 
  Vote, 
  ShieldCheck, 
  Wallet, 
  Binary, 
  AlertCircle, 
  Radio
} from 'lucide-react';
import { truncateAddress } from '../utils/contract';

export function Navbar({
  account,
  isAdmin,
  isConnecting,
  onConnectWallet,
  onSwitchNetwork,
  isCorrectNetwork,
  isElectionOpen,
  activeTab,
  setActiveTab,
  hasContract,
}) {
  return (
    <header className="sticky top-0 z-50 bg-surface-card/95 backdrop-blur-sm border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Section: Election Overview (Emerald & Mint) */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-emerald flex items-center justify-center text-white shadow-subtle">
              <Vote className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-base text-ink tracking-tight">
                  Decentralized E-Voting
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-mint text-emerald-dark border border-mint-border">
                  Paillier Homomorphic
                </span>
              </div>
              <p className="text-xs text-ink-muted">Zero-Knowledge Ballot Secrecy on Ethereum</p>
            </div>
          </div>

          {/* Navigation with Distinct Color Identities */}
          <nav className="hidden md:flex items-center p-1 bg-surface-inset rounded-lg border border-surface-border">
            {/* Voter Portal (Emerald identity) */}
            <button
              onClick={() => setActiveTab('voter')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'voter'
                  ? 'bg-surface-card text-emerald-dark shadow-subtle font-semibold border border-surface-border/80'
                  : 'text-ink-secondary hover:text-ink hover:bg-surface-card/60'
              }`}
            >
              <Vote className="h-3.5 w-3.5 text-emerald" />
              <span>Voter Portal</span>
            </button>

            {/* Admin Dashboard (Indigo identity) */}
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-surface-card text-indigo-dark shadow-subtle font-semibold border border-surface-border/80'
                  : 'text-ink-secondary hover:text-ink hover:bg-surface-card/60'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-indigo" />
              <span>Admin Dashboard</span>
              {isAdmin && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo" />
              )}
            </button>

            {/* Crypto Inspector (Violet identity) */}
            <button
              onClick={() => setActiveTab('crypto')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'crypto'
                  ? 'bg-surface-card text-violet-dark shadow-subtle font-semibold border border-surface-border/80'
                  : 'text-ink-secondary hover:text-ink hover:bg-surface-card/60'
              }`}
            >
              <Binary className="h-3.5 w-3.5 text-violet" />
              <span>Crypto Inspector</span>
            </button>
          </nav>

          {/* Right Section: Blockchain Network (Ocean Blue), Election State (Emerald / Amber), & Wallet */}
          <div className="flex items-center space-x-3">
            {/* Blockchain Network Badge (Ocean Blue Identity) */}
            {account && isCorrectNetwork && (
              <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-ocean-light text-ocean-dark border border-ocean-border">
                <Radio className="w-3 h-3 text-ocean" />
                <span className="font-mono text-[11px]">Hardhat:31337</span>
              </div>
            )}

            {/* Election Status Badge (Emerald when Open / Amber when Closed) */}
            {hasContract && (
              <div
                className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                  isElectionOpen
                    ? 'bg-mint text-emerald-dark border-mint-border'
                    : 'bg-amber-light text-amber-dark border-amber-border'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isElectionOpen ? 'bg-emerald animate-pulse' : 'bg-amber'
                  }`}
                />
                <span className="font-medium">{isElectionOpen ? 'Election Open' : 'Election Closed'}</span>
              </div>
            )}

            {/* Wrong Network Warning (Coral Identity) */}
            {account && !isCorrectNetwork && (
              <button
                onClick={onSwitchNetwork}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-coral-light text-coral-dark border border-coral-border hover:bg-coral/10 transition-colors"
              >
                <AlertCircle className="h-3.5 w-3.5 text-coral" />
                <span>Switch to Hardhat (31337)</span>
              </button>
            )}

            {/* Wallet Address or Connect Button */}
            {account ? (
              <div className="flex items-center space-x-2 bg-surface-subtle border border-surface-border rounded-lg p-1.5 pl-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald" />
                  <span className="font-mono text-xs text-ink font-medium">
                    {truncateAddress(account)}
                  </span>
                </div>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-indigo-light text-indigo border border-indigo-border">
                    Admin
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                disabled={isConnecting}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald hover:bg-emerald-hover text-white shadow-subtle transition-all disabled:opacity-50"
              >
                <Wallet className="h-3.5 w-3.5" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-surface-border">
          <button
            onClick={() => setActiveTab('voter')}
            className={`flex items-center space-x-1.5 py-1 px-3 rounded-md text-xs font-medium ${
              activeTab === 'voter' ? 'bg-mint text-emerald-dark font-semibold' : 'text-ink-secondary'
            }`}
          >
            <Vote className="h-3.5 w-3.5 text-emerald" />
            <span>Voter</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center space-x-1.5 py-1 px-3 rounded-md text-xs font-medium ${
              activeTab === 'admin' ? 'bg-indigo-light text-indigo font-semibold' : 'text-ink-secondary'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-indigo" />
            <span>Admin</span>
          </button>
          <button
            onClick={() => setActiveTab('crypto')}
            className={`flex items-center space-x-1.5 py-1 px-3 rounded-md text-xs font-medium ${
              activeTab === 'crypto' ? 'bg-violet-light text-violet font-semibold' : 'text-ink-secondary'
            }`}
          >
            <Binary className="h-3.5 w-3.5 text-violet" />
            <span>Crypto</span>
          </button>
        </div>
      </div>
    </header>
  );
}
