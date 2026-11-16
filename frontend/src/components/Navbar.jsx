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
    <header className="sticky top-0 z-50 bg-[#F1EFE8]/95 backdrop-blur-sm border-b border-[#CCCBC1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#425B49]" />
            <span className="font-mono text-sm font-semibold tracking-wider text-[#292E2A]">
              VERIFIO
            </span>
          </div>

          {/* Segmented Editorial Navigation */}
          <nav className="hidden md:flex items-center bg-[#E8E6DE] p-1 rounded-md border border-[#CCCBC1]/70">
            <button
              onClick={() => setActiveTab('voter')}
              className={`px-3.5 py-1.5 rounded text-xs font-medium transition-all duration-150 ${
                activeTab === 'voter'
                  ? 'bg-[#F8F7F3] text-[#292E2A] shadow-subtle border border-[#CCCBC1]'
                  : 'text-[#70736C] hover:text-[#292E2A]'
              }`}
            >
              Vote
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-1.5 rounded text-xs font-medium transition-all duration-150 flex items-center space-x-1.5 ${
                activeTab === 'admin'
                  ? 'bg-[#F8F7F3] text-[#292E2A] shadow-subtle border border-[#CCCBC1]'
                  : 'text-[#70736C] hover:text-[#292E2A]'
              }`}
            >
              <span>Admin</span>
              {isAdmin && (
                <span className="px-1.5 py-0.5 bg-[#E0E8DF] text-[#425B49] text-[9px] font-mono rounded">
                  You
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('crypto')}
              className={`px-3.5 py-1.5 rounded text-xs font-medium transition-all duration-150 ${
                activeTab === 'crypto'
                  ? 'bg-[#F8F7F3] text-[#292E2A] shadow-subtle border border-[#CCCBC1]'
                  : 'text-[#70736C] hover:text-[#292E2A]'
              }`}
            >
              Cryptography
            </button>
          </nav>

          {/* Right Section: Network & Wallet Controls */}
          <div className="flex items-center space-x-2.5">
            {/* Live Election Status Dot */}
            {hasContract && (
              <div className="hidden sm:flex items-center space-x-1.5 text-xs font-mono px-2.5 py-1 rounded bg-[#E8E6DE] border border-[#CCCBC1] text-[#70736C]">
                <span className={`w-1.5 h-1.5 rounded-full ${isElectionOpen ? 'bg-[#425B49]' : 'bg-[#9A9C96]'}`} />
                <span className="text-[#292E2A]">
                  {isElectionOpen ? 'Voting Open' : 'Voting Closed'}
                </span>
              </div>
            )}

            {/* Wrong Network Notice */}
            {account && !isCorrectNetwork && (
              <button
                onClick={onSwitchNetwork}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-mono text-[#A77D60] bg-[#F4EEE8] border border-[#A77D60]/40 hover:bg-[#EADFD5] transition-colors"
              >
                <AlertCircle className="h-3.5 w-3.5 text-[#A77D60]" />
                <span>Switch to 31337</span>
              </button>
            )}

            {/* Wallet Address or Connect Button */}
            {account ? (
              <div className="flex items-center space-x-2 bg-[#F8F7F3] border border-[#CCCBC1] rounded-md px-3 py-1.5 text-xs font-mono text-[#292E2A] shadow-subtle">
                <span>{truncateAddress(account)}</span>
                {isAdmin ? (
                  <span className="text-[10px] bg-[#E0E8DF] text-[#425B49] font-medium px-1.5 py-0.5 rounded">
                    ADMIN
                  </span>
                ) : (
                  <span className="text-[10px] bg-[#E8E6DE] text-[#70736C] font-medium px-1.5 py-0.5 rounded">
                    VOTER
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                disabled={isConnecting}
                className="min-h-[36px] px-3.5 rounded-md text-xs font-medium bg-[#425B49] hover:bg-[#354B3C] active:scale-[0.99] text-[#F1EFE8] transition-all shadow-subtle disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{isConnecting ? 'Connecting…' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-[#CCCBC1]">
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
                  ? 'bg-[#F8F7F3] text-[#292E2A] border border-[#CCCBC1] font-semibold'
                  : 'text-[#70736C]'
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
