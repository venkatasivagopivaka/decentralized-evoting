import React from 'react';
import { 
  Vote, 
  ShieldCheck, 
  Wallet, 
  Binary, 
  AlertCircle, 
  Radio,
  Layers,
  Sparkles,
  Lock
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E8E8E2] shadow-[0_1px_2px_rgba(32,43,42,0.02)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="relative group cursor-pointer">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald to-emerald-dark flex items-center justify-center text-white shadow-sm ring-2 ring-emerald/20 transition-transform group-hover:scale-105">
                <Vote className="h-5 w-5 stroke-[2.2]" />
              </div>
              <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-violet border-2 border-white flex items-center justify-center" title="Paillier Encryption Active">
                <Lock className="w-2 h-2 text-white stroke-[2.5]" />
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-ink tracking-tight font-sans">
                  VERIFIO
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-pale-mint text-emerald-dark border border-emerald-border/60">
                  Paillier Homomorphic
                </span>
              </div>
              <p className="text-[11px] text-ink-secondary">
                Decentralized E-Voting Protocol on Ethereum
              </p>
            </div>
          </div>

          {/* Navigation with Distinct Color Active States */}
          <nav className="hidden md:flex items-center p-1 bg-[#F7F6F1] rounded-xl border border-[#E8E8E2] space-x-1 shadow-inner">
            {/* Voter Portal (Emerald accent + Pale Mint active state) */}
            <button
              onClick={() => setActiveTab('voter')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs transition-all duration-150 ${
                activeTab === 'voter'
                  ? 'bg-white text-emerald-dark shadow-card font-semibold border border-[#E8E8E2]'
                  : 'text-ink-secondary hover:text-ink hover:bg-white/60 font-medium'
              }`}
            >
              <Vote className={`h-4 w-4 ${activeTab === 'voter' ? 'text-emerald' : 'text-ink-muted'}`} />
              <span>Voter Portal</span>
            </button>

            {/* Admin Dashboard (Royal Indigo accent + Pale Lavender active state) */}
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs transition-all duration-150 ${
                activeTab === 'admin'
                  ? 'bg-white text-indigo-dark shadow-card font-semibold border border-[#E8E8E2]'
                  : 'text-ink-secondary hover:text-ink hover:bg-white/60 font-medium'
              }`}
            >
              <ShieldCheck className={`h-4 w-4 ${activeTab === 'admin' ? 'text-indigo' : 'text-ink-muted'}`} />
              <span>Admin Dashboard</span>
              {isAdmin && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-pale-lavender text-indigo-dark border border-indigo-border/70">
                  ADMIN
                </span>
              )}
            </button>

            {/* Crypto Inspector (Violet accent + Pale Violet active state) */}
            <button
              onClick={() => setActiveTab('crypto')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs transition-all duration-150 ${
                activeTab === 'crypto'
                  ? 'bg-white text-violet-dark shadow-card font-semibold border border-[#E8E8E2]'
                  : 'text-ink-secondary hover:text-ink hover:bg-white/60 font-medium'
              }`}
            >
              <Binary className={`h-4 w-4 ${activeTab === 'crypto' ? 'text-violet' : 'text-ink-muted'}`} />
              <span>Crypto Inspector</span>
            </button>
          </nav>

          {/* Right Section: Blockchain Network, Election State & Wallet */}
          <div className="flex items-center space-x-2.5">
            {/* Blockchain Network Badge (Ocean Blue Identity) */}
            {account && isCorrectNetwork && (
              <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pale-blue text-ocean-dark border border-ocean-border/80 shadow-subtle">
                <Radio className="w-3.5 h-3.5 text-ocean animate-pulse" />
                <span className="font-mono text-[11px] font-semibold">Hardhat:31337</span>
              </div>
            )}

            {/* Election Status Badge (Pale Mint / Pale Amber) */}
            {hasContract && (
              <div
                className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-subtle ${
                  isElectionOpen
                    ? 'bg-pale-mint text-emerald-dark border-emerald-border/80'
                    : 'bg-pale-amber text-amber-dark border-amber-border/80'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isElectionOpen ? 'bg-emerald animate-ping' : 'bg-amber'
                  }`}
                />
                <span className="font-medium">
                  {isElectionOpen ? 'Voting Open' : 'Voting Closed'}
                </span>
              </div>
            )}

            {/* Network Warning (Coral Identity) */}
            {account && !isCorrectNetwork && (
              <button
                onClick={onSwitchNetwork}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-pale-coral text-coral-dark border border-coral-border hover:bg-coral/15 transition-colors shadow-subtle"
              >
                <AlertCircle className="h-3.5 w-3.5 text-coral" />
                <span>Switch to 31337</span>
              </button>
            )}

            {/* Wallet Chip or Connect Button */}
            {account ? (
              <div className="flex items-center space-x-2.5 bg-white border border-[#E8E8E2] rounded-xl p-1.5 pl-3 shadow-card">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald ring-2 ring-emerald/20" />
                  <span className="font-mono text-xs text-ink font-semibold tracking-tight">
                    {truncateAddress(account)}
                  </span>
                </div>
                {isAdmin ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-pale-lavender text-indigo-dark border border-indigo-border/60">
                    Admin
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#F7F6F1] text-ink-secondary border border-[#E8E8E2]">
                    Voter
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                disabled={isConnecting}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald hover:bg-emerald-hover text-white shadow-card hover:shadow-cardHover transition-all disabled:opacity-50"
              >
                <Wallet className="h-3.5 w-3.5" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-[#E8E8E2] bg-[#F7F6F1]">
          <button
            onClick={() => setActiveTab('voter')}
            className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'voter' ? 'bg-white text-emerald-dark font-bold shadow-subtle border border-[#E8E8E2]' : 'text-ink-secondary'
            }`}
          >
            <Vote className="h-3.5 w-3.5 text-emerald" />
            <span>Voter</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'admin' ? 'bg-white text-indigo-dark font-bold shadow-subtle border border-[#E8E8E2]' : 'text-ink-secondary'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-indigo" />
            <span>Admin</span>
          </button>
          <button
            onClick={() => setActiveTab('crypto')}
            className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'crypto' ? 'bg-white text-violet-dark font-bold shadow-subtle border border-[#E8E8E2]' : 'text-ink-secondary'
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
