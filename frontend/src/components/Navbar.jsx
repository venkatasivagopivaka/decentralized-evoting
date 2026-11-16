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
    <header className="sticky top-0 z-50 bg-[#F4F3EE]/95 backdrop-blur-sm border-b border-[#D2D2C9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#536A55]" />
            <span className="font-mono text-sm font-semibold tracking-wider text-[#30362F]">
              VERIFIO
            </span>
          </div>

          {/* Segmented Navigation */}
          <nav className="hidden md:flex items-center bg-[#DEDED5] p-1 rounded-lg border border-[#D2D2C9]/60">
            <button
              onClick={() => setActiveTab('voter')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                activeTab === 'voter'
                  ? 'bg-[#F8F7F2] text-[#30362F] shadow-sm border border-[#D2D2C9]'
                  : 'text-[#6F746B] hover:text-[#30362F]'
              }`}
            >
              Vote
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-150 flex items-center space-x-1.5 ${
                activeTab === 'admin'
                  ? 'bg-[#F8F7F2] text-[#30362F] shadow-sm border border-[#D2D2C9]'
                  : 'text-[#6F746B] hover:text-[#30362F]'
              }`}
            >
              <span>Admin</span>
              {isAdmin && (
                <span className="px-1.5 py-0.5 bg-[#E4EAE1] text-[#536A55] text-[9px] font-mono rounded">
                  You
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('crypto')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                activeTab === 'crypto'
                  ? 'bg-[#F8F7F2] text-[#30362F] shadow-sm border border-[#D2D2C9]'
                  : 'text-[#6F746B] hover:text-[#30362F]'
              }`}
            >
              Cryptography
            </button>
          </nav>

          {/* Right: Status + Wallet */}
          <div className="flex items-center space-x-2.5">
            {/* Election status dot — only when connected */}
            {hasContract && (
              <div className="hidden sm:flex items-center space-x-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-[#E9E8E2] border border-[#D2D2C9] text-[#6F746B]">
                <span className={`w-1.5 h-1.5 rounded-full ${isElectionOpen ? 'bg-[#536A55]' : 'bg-[#93958C]'}`} />
                <span className="text-[#30362F] tracking-wide">
                  {isElectionOpen ? 'Open' : 'Closed'}
                </span>
              </div>
            )}

            {/* Wrong network */}
            {account && !isCorrectNetwork && (
              <button
                onClick={onSwitchNetwork}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-[#A87565] bg-[#F7EFEB] border border-[#A87565]/40 hover:bg-[#F0E3DE] transition-colors"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Switch to 31337</span>
              </button>
            )}

            {/* Wallet */}
            {account ? (
              <div className="flex items-center space-x-2 bg-[#F8F7F2] border border-[#D2D2C9] rounded-lg px-3 py-1.5 text-xs font-mono text-[#30362F] shadow-sm">
                <span>{truncateAddress(account)}</span>
                {isAdmin ? (
                  <span className="text-[10px] bg-[#E4EAE1] text-[#536A55] font-semibold px-1.5 py-0.5 rounded">
                    ADMIN
                  </span>
                ) : (
                  <span className="text-[10px] bg-[#DEDED5] text-[#6F746B] font-medium px-1.5 py-0.5 rounded">
                    VOTER
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                disabled={isConnecting}
                className="min-h-[36px] px-4 rounded-lg text-xs font-medium bg-[#536A55] hover:bg-[#465B48] active:scale-[0.99] text-[#F8F7F2] transition-all shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{isConnecting ? 'Connecting…' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-[#D2D2C9]">
          {[
            { key: 'voter', label: 'Vote' },
            { key: 'admin', label: 'Admin' },
            { key: 'crypto', label: 'Cryptography' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
                activeTab === key
                  ? 'bg-[#F8F7F2] text-[#30362F] border border-[#D2D2C9] font-semibold'
                  : 'text-[#6F746B]'
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
