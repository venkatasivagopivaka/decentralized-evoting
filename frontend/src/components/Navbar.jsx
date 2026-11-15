import React from 'react';
import { 
  Vote, 
  ShieldCheck, 
  Wallet, 
  Binary, 
  AlertCircle, 
  CheckCircle2,
  ExternalLink
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
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-jade flex items-center justify-center text-white shadow-subtle">
              <Vote className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-base text-ink tracking-tight">
                  Decentralized E-Voting
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-surface-inset text-ink-secondary border border-surface-border">
                  Paillier Homomorphic
                </span>
              </div>
              <p className="text-xs text-ink-muted">Zero-Knowledge Ballot Secrecy on Ethereum</p>
            </div>
          </div>

          {/* Linear-Style Centered Navigation Tabs */}
          <nav className="hidden md:flex items-center p-1 bg-surface-inset rounded-lg border border-surface-border">
            <button
              onClick={() => setActiveTab('voter')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'voter'
                  ? 'bg-surface-card text-ink shadow-subtle font-semibold border border-surface-border/80'
                  : 'text-ink-secondary hover:text-ink hover:bg-surface-card/60'
              }`}
            >
              <Vote className="h-3.5 w-3.5 text-jade" />
              <span>Voter Portal</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-surface-card text-ink shadow-subtle font-semibold border border-surface-border/80'
                  : 'text-ink-secondary hover:text-ink hover:bg-surface-card/60'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-indigo" />
              <span>Admin Dashboard</span>
              {isAdmin && (
                <span className="w-1.5 h-1.5 rounded-full bg-jade" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('crypto')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'crypto'
                  ? 'bg-surface-card text-ink shadow-subtle font-semibold border border-surface-border/80'
                  : 'text-ink-secondary hover:text-ink hover:bg-surface-card/60'
              }`}
            >
              <Binary className="h-3.5 w-3.5 text-saffron" />
              <span>Crypto Inspector</span>
            </button>
          </nav>

          {/* Right Status Badges & Wallet Connect */}
          <div className="flex items-center space-x-3">
            {/* Election Status Badge */}
            {hasContract && (
              <div
                className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                  isElectionOpen
                    ? 'bg-jade-light text-jade-dark border-jade-border'
                    : 'bg-surface-subtle text-ink-muted border-surface-border'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isElectionOpen ? 'bg-jade animate-pulse' : 'bg-ink-muted'
                  }`}
                />
                <span className="font-medium">{isElectionOpen ? 'Election Open' : 'Election Closed'}</span>
              </div>
            )}

            {/* Network Warning Button */}
            {account && !isCorrectNetwork && (
              <button
                onClick={onSwitchNetwork}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-saffron-light text-saffron-dark border border-saffron-border hover:bg-saffron/10 transition-colors"
              >
                <AlertCircle className="h-3.5 w-3.5 text-saffron" />
                <span>Switch to Hardhat (31337)</span>
              </button>
            )}

            {/* Wallet Address or Connect Button */}
            {account ? (
              <div className="flex items-center space-x-2 bg-surface-subtle border border-surface-border rounded-lg p-1.5 pl-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-jade" />
                  <span className="font-mono text-xs text-ink font-medium">
                    {truncateAddress(account)}
                  </span>
                </div>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-jade-light text-jade-dark border border-jade-border">
                    Admin
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                disabled={isConnecting}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold bg-jade hover:bg-jade-hover text-white shadow-subtle transition-all disabled:opacity-50"
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
              activeTab === 'voter' ? 'bg-surface-inset text-ink font-semibold' : 'text-ink-secondary'
            }`}
          >
            <Vote className="h-3.5 w-3.5 text-jade" />
            <span>Voter</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center space-x-1.5 py-1 px-3 rounded-md text-xs font-medium ${
              activeTab === 'admin' ? 'bg-surface-inset text-ink font-semibold' : 'text-ink-secondary'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-indigo" />
            <span>Admin</span>
          </button>
          <button
            onClick={() => setActiveTab('crypto')}
            className={`flex items-center space-x-1.5 py-1 px-3 rounded-md text-xs font-medium ${
              activeTab === 'crypto' ? 'bg-surface-inset text-ink font-semibold' : 'text-ink-secondary'
            }`}
          >
            <Binary className="h-3.5 w-3.5 text-saffron" />
            <span>Crypto</span>
          </button>
        </div>
      </div>
    </header>
  );
}
