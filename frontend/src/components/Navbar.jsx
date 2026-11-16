import React from 'react';
import { Wallet, AlertCircle, ArrowUpRight } from 'lucide-react';
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
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#08090B]/90 backdrop-blur-2xl border-b border-[#232730] shadow-[0_4px_30px_rgba(0,0,0,0.7)] transition-all duration-200">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-16">
        
        {/* Main Desktop & Mobile Top Bar */}
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Brand Wordmark (Reference Images 1, 2, 4) */}
          <div 
            onClick={() => setActiveTab('voter')}
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#C6FF00] shadow-[0_0_12px_#C6FF00] transition-transform duration-200 group-hover:scale-125" />
            <div className="flex flex-col">
              <span className="font-mono text-sm md:text-base font-black tracking-wider text-white uppercase leading-none">
                Decentralized E-Voting System
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#8B909D] uppercase mt-1">
                DEMOCRATIC PROTOCOL
              </span>
            </div>
          </div>

          {/* Desktop Minimalist Capsule Navigation with Neon Lime Active Pill */}
          <nav className="hidden md:flex items-center bg-[#0F1115]/90 p-1.5 rounded-full border border-[#232730] shadow-inner">
            <button
              onClick={() => setActiveTab('voter')}
              className={`px-7 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                activeTab === 'voter'
                  ? 'bg-[#C6FF00] text-[#08090B] shadow-[0_0_18px_rgba(198,255,0,0.35)] scale-[1.02]'
                  : 'text-[#8B909D] hover:text-white hover:bg-white/5'
              }`}
            >
              Ballot
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-7 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'admin'
                  ? 'bg-[#C6FF00] text-[#08090B] shadow-[0_0_18px_rgba(198,255,0,0.35)] scale-[1.02]'
                  : 'text-[#8B909D] hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Admin</span>
              {isAdmin && (
                <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'admin' ? 'bg-[#08090B]' : 'bg-[#C6FF00]'}`} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('crypto')}
              className={`px-7 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                activeTab === 'crypto'
                  ? 'bg-[#C6FF00] text-[#08090B] shadow-[0_0_18px_rgba(198,255,0,0.35)] scale-[1.02]'
                  : 'text-[#8B909D] hover:text-white hover:bg-white/5'
              }`}
            >
              Cryptography
            </button>
          </nav>

          {/* Right Section: Status Beacon & Capsule Wallet Action */}
          <div className="flex items-center space-x-3">
            {/* Live Polls Indicator */}
            {hasContract && (
              <div className="hidden lg:flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#0F1115] border border-[#232730] text-[11px] font-mono">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isElectionOpen
                      ? 'bg-[#C6FF00] shadow-[0_0_8px_#C6FF00] animate-pulse'
                      : 'bg-[#525765]'
                  }`}
                />
                <span className={isElectionOpen ? 'text-[#C6FF00] font-semibold' : 'text-[#8B909D]'}>
                  {isElectionOpen ? 'LIVE POLLS' : 'SEALED'}
                </span>
              </div>
            )}

            {/* Wrong Network Notice */}
            {account && !isCorrectNetwork && (
              <button
                onClick={onSwitchNetwork}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono text-[#FF5C5C] bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 hover:bg-[#FF5C5C]/20 transition-colors"
              >
                <AlertCircle className="h-3.5 w-3.5 text-[#FF5C5C]" />
                <span className="hidden sm:inline">Switch to 31337</span>
                <span className="sm:hidden">31337</span>
              </button>
            )}

            {/* Wallet Status / Connect Button (Neon Lime Pill Capsule) */}
            {account ? (
              <div className="flex items-center space-x-2 bg-[#0F1115] border border-[#232730] rounded-full pl-3.5 pr-1.5 py-1 text-xs font-mono text-white shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#C6FF00]" />
                <span className="font-semibold text-[11px] sm:text-xs">{truncateAddress(account)}</span>
                {isAdmin ? (
                  <span className="text-[9px] sm:text-[10px] bg-[#C6FF00] text-[#08090B] font-bold px-2 py-0.5 rounded-full uppercase">
                    Admin
                  </span>
                ) : (
                  <span className="text-[9px] sm:text-[10px] bg-[#16191F] text-[#8B909D] border border-[#232730] font-medium px-2 py-0.5 rounded-full uppercase">
                    Voter
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                disabled={isConnecting}
                className="btn-pill-lime !min-h-[40px] !py-1.5 !px-5 !text-xs"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{isConnecting ? 'Connecting…' : 'Connect'}</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar (Always persistently accessible inside fixed header) */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-[#232730]/60">
          {[
            { key: 'voter', label: 'Ballot' },
            { key: 'admin', label: 'Admin' },
            { key: 'crypto', label: 'Cryptography' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`py-1.5 px-4 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                activeTab === key
                  ? 'bg-[#C6FF00] text-[#08090B] shadow-[0_0_12px_rgba(198,255,0,0.3)]'
                  : 'text-[#8B909D] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

      </div>
    </header>
  );
}
export default Navbar;
