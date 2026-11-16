import React from 'react';
import { Wallet, AlertCircle } from 'lucide-react';
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
    <header className="sticky top-0 z-50 bg-[#08090B]/95 backdrop-blur-md border-b border-[#232730]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Wordmark with Signature Electric Gold Geometric Dot */}
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-[2px] bg-[#FFD426] shadow-[0_0_10px_#FFD426] flex-shrink-0" />
            <div className="flex flex-col">
              <span className="font-mono text-sm font-bold tracking-widest text-white">
                VERIFIO
              </span>
              <span className="text-[9px] font-mono tracking-wider text-[#8B909D] uppercase -mt-0.5">
                Protocol
              </span>
            </div>
          </div>

          {/* Segmented Architecture Navigation */}
          <nav className="hidden md:flex items-center bg-[#0F1115] p-1 rounded-md border border-[#232730]">
            <button
              onClick={() => setActiveTab('voter')}
              className={`px-4 py-1.5 rounded text-xs font-medium tracking-wide transition-all duration-180 ${
                activeTab === 'voter'
                  ? 'bg-[#16191F] text-white shadow-sm border border-[#232730] border-b-2 border-b-[#FFD426]'
                  : 'text-[#8B909D] hover:text-white'
              }`}
            >
              Vote
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-1.5 rounded text-xs font-medium tracking-wide transition-all duration-180 flex items-center space-x-1.5 ${
                activeTab === 'admin'
                  ? 'bg-[#16191F] text-white shadow-sm border border-[#232730] border-b-2 border-b-[#FFD426]'
                  : 'text-[#8B909D] hover:text-white'
              }`}
            >
              <span>Admin</span>
              {isAdmin && (
                <span className="px-1.5 py-0.5 bg-[#FFD426]/10 text-[#FFD426] border border-[#FFD426]/30 text-[9px] font-mono rounded">
                  Auth
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('crypto')}
              className={`px-4 py-1.5 rounded text-xs font-medium tracking-wide transition-all duration-180 ${
                activeTab === 'crypto'
                  ? 'bg-[#16191F] text-white shadow-sm border border-[#232730] border-b-2 border-b-[#FFD426]'
                  : 'text-[#8B909D] hover:text-white'
              }`}
            >
              Cryptography
            </button>
          </nav>

          {/* Right Section: Status Beacon & Wallet */}
          <div className="flex items-center space-x-3">
            {/* Live Election Status Beacon */}
            {hasContract && (
              <div className="hidden sm:flex items-center space-x-2 text-xs font-mono px-3 py-1.5 rounded bg-[#0F1115] border border-[#232730]">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isElectionOpen
                      ? 'bg-[#FFD426] shadow-[0_0_8px_#FFD426] animate-pulse'
                      : 'bg-[#525765]'
                  }`}
                />
                <span className={isElectionOpen ? 'text-[#FFD426] font-semibold' : 'text-[#8B909D]'}>
                  {isElectionOpen ? 'LIVE POLLS' : 'POLLS SEALED'}
                </span>
              </div>
            )}

            {/* Wrong Network Notice */}
            {account && !isCorrectNetwork && (
              <button
                onClick={onSwitchNetwork}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-mono text-[#FF5C5C] bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 hover:bg-[#FF5C5C]/20 transition-colors"
              >
                <AlertCircle className="h-3.5 w-3.5 text-[#FF5C5C]" />
                <span>Switch to 31337</span>
              </button>
            )}

            {/* Wallet Status / Connect Button */}
            {account ? (
              <div className="flex items-center space-x-2.5 bg-[#0F1115] border border-[#232730] rounded-md px-3.5 py-1.5 text-xs font-mono text-white shadow-sm">
                <span>{truncateAddress(account)}</span>
                {isAdmin ? (
                  <span className="text-[10px] bg-[#FFD426] text-[#08090B] font-bold px-1.5 py-0.5 rounded">
                    ADMIN
                  </span>
                ) : (
                  <span className="text-[10px] bg-[#16191F] text-[#8B909D] border border-[#232730] font-medium px-1.5 py-0.5 rounded">
                    VOTER
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                disabled={isConnecting}
                className="btn-primary-gold min-h-[38px] px-4 py-1.5 text-xs"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{isConnecting ? 'Connecting…' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-[#232730]">
          {[
            { key: 'voter', label: 'Vote' },
            { key: 'admin', label: 'Admin' },
            { key: 'crypto', label: 'Cryptography' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`py-1 px-3 rounded text-xs font-medium transition-colors ${
                activeTab === key
                  ? 'bg-[#16191F] text-white border border-[#232730] border-b-2 border-b-[#FFD426]'
                  : 'text-[#8B909D]'
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
