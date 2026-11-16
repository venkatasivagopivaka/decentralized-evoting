import React from 'react';
import { 
  Vote, 
  ShieldCheck, 
  Wallet, 
  Binary, 
  AlertCircle
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
    <header className="sticky top-0 z-50 bg-[#111111]/95 backdrop-blur-md border-b border-[#353535]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-base font-bold tracking-widest text-[#F5F5F5]">
                VERIFIO
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D9225C]" />
              <span className="text-xs font-mono tracking-wider text-[#777477]">
                E-VOTING
              </span>
            </div>
          </div>

          {/* Clean Navigation Links with Hot Pink Active State */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => setActiveTab('voter')}
              className={`text-xs uppercase tracking-wider font-medium py-5 border-b-2 transition-colors ${
                activeTab === 'voter'
                  ? 'border-[#D9225C] text-[#F5F5F5] font-semibold'
                  : 'border-transparent text-[#A6A3A5] hover:text-[#F5F5F5]'
              }`}
            >
              Voter Portal
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`text-xs uppercase tracking-wider font-medium py-5 border-b-2 transition-colors flex items-center space-x-1.5 ${
                activeTab === 'admin'
                  ? 'border-[#D9225C] text-[#F5F5F5] font-semibold'
                  : 'border-transparent text-[#A6A3A5] hover:text-[#F5F5F5]'
              }`}
            >
              <span>Admin Dashboard</span>
              {isAdmin && (
                <span className="w-1 h-1 rounded-full bg-[#D9225C]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('crypto')}
              className={`text-xs uppercase tracking-wider font-medium py-5 border-b-2 transition-colors ${
                activeTab === 'crypto'
                  ? 'border-[#D9225C] text-[#F5F5F5] font-semibold'
                  : 'border-transparent text-[#A6A3A5] hover:text-[#F5F5F5]'
              }`}
            >
              Crypto Inspector
            </button>
          </nav>

          {/* Right Section: Network, Election State & Wallet */}
          <div className="flex items-center space-x-3">
            {/* Network Indicator */}
            {account && isCorrectNetwork && (
              <span className="hidden lg:inline-block font-mono text-[11px] text-[#777477]">
                [31337]
              </span>
            )}

            {/* Election Status Indicator */}
            {hasContract && (
              <div className="hidden sm:flex items-center space-x-1.5 text-xs font-mono text-[#A6A3A5]">
                <span className={`w-1.5 h-1.5 rounded-full ${isElectionOpen ? 'bg-[#D9225C]' : 'bg-[#555555]'}`} />
                <span className="tracking-wide">{isElectionOpen ? 'OPEN' : 'CLOSED'}</span>
              </div>
            )}

            {/* Network Switch Button */}
            {account && !isCorrectNetwork && (
              <button
                onClick={onSwitchNetwork}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono text-[#D9225C] border border-[#D9225C]/50 hover:bg-[#D9225C]/10 transition-colors"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Switch Network</span>
              </button>
            )}

            {/* Wallet Address or Connect Button */}
            {account ? (
              <div className="flex items-center space-x-2 bg-[#181818] border border-[#353535] rounded px-3 py-1.5 text-xs font-mono">
                <span className="text-[#F5F5F5]">{truncateAddress(account)}</span>
                {isAdmin && (
                  <span className="text-[10px] text-[#D9225C] font-bold tracking-wider">
                    ADMIN
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                disabled={isConnecting}
                className="px-4 py-2 rounded text-xs font-semibold bg-[#D9225C] hover:bg-[#BA1B4E] text-white transition-colors disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-[#353535] bg-[#181818]">
          <button
            onClick={() => setActiveTab('voter')}
            className={`py-1 px-3 text-xs uppercase tracking-wider ${
              activeTab === 'voter' ? 'text-[#D9225C] font-bold' : 'text-[#A6A3A5]'
            }`}
          >
            Voter
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-1 px-3 text-xs uppercase tracking-wider ${
              activeTab === 'admin' ? 'text-[#D9225C] font-bold' : 'text-[#A6A3A5]'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => setActiveTab('crypto')}
            className={`py-1 px-3 text-xs uppercase tracking-wider ${
              activeTab === 'crypto' ? 'text-[#D9225C] font-bold' : 'text-[#A6A3A5]'
            }`}
          >
            Crypto
          </button>
        </div>
      </div>
    </header>
  );
}
