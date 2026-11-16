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
    <header className="sticky top-0 z-50 bg-[#08090B]/90 backdrop-blur-xl border-b border-[#232730]">
      <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Wordmark (Reference Images 1, 2, 4) */}
          <div 
            onClick={() => setActiveTab('voter')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#FFD426] shadow-[0_0_12px_#FFD426] transition-transform duration-200 group-hover:scale-125" />
            <div className="flex flex-col">
              <span className="font-mono text-base font-black tracking-widest text-white uppercase leading-none">
                VERIFIO
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#8B909D] uppercase mt-1">
                DEMOCRATIC PROTOCOL
              </span>
            </div>
          </div>

          {/* Minimalist Capsule Navigation (Reference Images 1, 2, 3, 4) */}
          <nav className="hidden md:flex items-center bg-[#0F1115]/80 p-1.5 rounded-full border border-[#232730]">
            <button
              onClick={() => setActiveTab('voter')}
              className={`px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                activeTab === 'voter'
                  ? 'bg-[#FFD426] text-[#08090B] shadow-[0_0_15px_rgba(255,212,38,0.3)]'
                  : 'text-[#8B909D] hover:text-white'
              }`}
            >
              Ballot
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'admin'
                  ? 'bg-[#FFD426] text-[#08090B] shadow-[0_0_15px_rgba(255,212,38,0.3)]'
                  : 'text-[#8B909D] hover:text-white'
              }`}
            >
              <span>Admin</span>
              {isAdmin && (
                <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'admin' ? 'bg-[#08090B]' : 'bg-[#FFD426]'}`} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('crypto')}
              className={`px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                activeTab === 'crypto'
                  ? 'bg-[#FFD426] text-[#08090B] shadow-[0_0_15px_rgba(255,212,38,0.3)]'
                  : 'text-[#8B909D] hover:text-white'
              }`}
            >
              Cryptography
            </button>
          </nav>

          {/* Right Section: Status Beacon & Capsule Wallet Action */}
          <div className="flex items-center space-x-3.5">
            {/* Live Polls Indicator */}
            {hasContract && (
              <div className="hidden lg:flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#0F1115] border border-[#232730] text-[11px] font-mono">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isElectionOpen
                      ? 'bg-[#FFD426] shadow-[0_0_8px_#FFD426] animate-pulse'
                      : 'bg-[#525765]'
                  }`}
                />
                <span className={isElectionOpen ? 'text-[#FFD426] font-semibold' : 'text-[#8B909D]'}>
                  {isElectionOpen ? 'LIVE POLLS' : 'SEALED'}
                </span>
              </div>
            )}

            {/* Wrong Network Notice */}
            {account && !isCorrectNetwork && (
              <button
                onClick={onSwitchNetwork}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-mono text-[#FF5C5C] bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 hover:bg-[#FF5C5C]/20 transition-colors"
              >
                <AlertCircle className="h-3.5 w-3.5 text-[#FF5C5C]" />
                <span>Switch to 31337</span>
              </button>
            )}

            {/* Wallet Status / Connect Button (Pill Capsule) */}
            {account ? (
              <div className="flex items-center space-x-2.5 bg-[#0F1115] border border-[#232730] rounded-full pl-4 pr-2 py-1.5 text-xs font-mono text-white shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#FFD426]" />
                <span className="font-semibold">{truncateAddress(account)}</span>
                {isAdmin ? (
                  <span className="text-[10px] bg-[#FFD426] text-[#08090B] font-bold px-2.5 py-1 rounded-full uppercase">
                    Admin
                  </span>
                ) : (
                  <span className="text-[10px] bg-[#16191F] text-[#8B909D] border border-[#232730] font-medium px-2.5 py-1 rounded-full uppercase">
                    Voter
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                disabled={isConnecting}
                className="btn-pill-gold !min-h-[42px] !py-2 !px-6 !text-xs"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{isConnecting ? 'Connecting…' : 'Connect Wallet'}</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2.5 border-t border-[#232730]/60">
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
                  ? 'bg-[#FFD426] text-[#08090B]'
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
