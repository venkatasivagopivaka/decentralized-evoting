import React from 'react';
import { 
  Vote, 
  ShieldCheck, 
  Wallet, 
  KeyRound, 
  Binary, 
  AlertCircle, 
  CheckCircle2, 
  Layers
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
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Vote className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  Decentralized E-Voting
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Paillier Homomorphic
                </span>
              </div>
              <p className="text-xs text-slate-400">Zero-Knowledge Ballot Secrecy on Ethereum</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('voter')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'voter'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Vote className="h-4 w-4" />
              <span>Voter Portal</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Dashboard</span>
              {isAdmin && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('crypto')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'crypto'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Binary className="h-4 w-4" />
              <span>Crypto Inspector</span>
            </button>
          </nav>

          {/* Status & Wallet Connect */}
          <div className="flex items-center space-x-3">
            {/* Election Status Indicator */}
            {hasContract && (
              <div
                className={`hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                  isElectionOpen
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 glow-badge-emerald'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isElectionOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>{isElectionOpen ? 'Election Open' : 'Election Closed'}</span>
              </div>
            )}

            {/* Wrong Network Warning */}
            {account && !isCorrectNetwork && (
              <button
                onClick={onSwitchNetwork}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-colors"
              >
                <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                <span>Switch to Hardhat Localhost</span>
              </button>
            )}

            {/* Wallet Connect / Account Badge */}
            {account ? (
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5 pl-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="font-mono text-xs text-slate-200 font-medium">
                    {truncateAddress(account)}
                  </span>
                </div>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Admin
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                disabled={isConnecting}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
              >
                <Wallet className="h-4 w-4" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('voter')}
            className={`flex items-center space-x-1.5 py-1 px-3 rounded-lg text-xs font-medium ${
              activeTab === 'voter' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <Vote className="h-3.5 w-3.5" />
            <span>Voter</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center space-x-1.5 py-1 px-3 rounded-lg text-xs font-medium ${
              activeTab === 'admin' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin</span>
          </button>
          <button
            onClick={() => setActiveTab('crypto')}
            className={`flex items-center space-x-1.5 py-1 px-3 rounded-lg text-xs font-medium ${
              activeTab === 'crypto' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <Binary className="h-3.5 w-3.5" />
            <span>Crypto</span>
          </button>
        </div>
      </div>
    </header>
  );
}
