import React from 'react';
import { 
  Vote, 
  ShieldCheck, 
  Wallet, 
  Binary, 
  AlertCircle,
  Activity
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
    <header className="sticky top-0 z-50 bg-[#F4F3EE]/95 backdrop-blur-sm border-b border-[#D2D2C9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#536A55]" />
              <span className="font-mono text-base font-semibold tracking-wider text-[#30362F]">
                VERIFIO
              </span>
              <span className="text-[11px] font-mono tracking-widest text-[#93958C] hidden sm:inline">
                // DEMOCRATIC PROTOCOL
              </span>
            </div>
          </div>

          {/* Refined Segmented Navigation Control */}
          <nav className="hidden md:flex items-center bg-[#DEDED5] p-1 rounded-lg border border-[#D2D2C9]/60">
            <button
              onClick={() => setActiveTab('voter')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                activeTab === 'voter'
                  ? 'bg-[#F8F7F2] text-[#30362F] shadow-sm border border-[#D2D2C9]'
                  : 'text-[#6F746B] hover:text-[#30362F]'
              }`}
            >
              Voter Portal
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-150 flex items-center space-x-1.5 ${
                activeTab === 'admin'
                  ? 'bg-[#F8F7F2] text-[#30362F] shadow-sm border border-[#D2D2C9]'
                  : 'text-[#6F746B] hover:text-[#30362F]'
              }`}
            >
              <span>Operations Console</span>
              {isAdmin && (
                <span className="px-1.5 py-0.2 bg-[#E4EAE1] text-[#536A55] text-[9px] font-mono rounded">
                  Admin
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
              Cryptographic Spec
            </button>
          </nav>

          {/* Right Section: Network, Election State & Wallet */}
          <div className="flex items-center space-x-3">
            {/* Network Indicator */}
            {account && isCorrectNetwork && (
              <span className="hidden lg:inline-flex items-center space-x-1 font-mono text-[11px] text-[#6F746B] bg-[#E9E8E2] px-2.5 py-1 rounded-md border border-[#D2D2C9]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#536A55]" />
                <span>Hardhat:31337</span>
              </span>
            )}

            {/* Election Status Indicator */}
            {hasContract && (
              <div className="hidden sm:flex items-center space-x-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-[#E9E8E2] border border-[#D2D2C9] text-[#6F746B]">
                <span className={`w-1.5 h-1.5 rounded-full ${isElectionOpen ? 'bg-[#536A55]' : 'bg-[#93958C]'}`} />
                <span className="tracking-wide text-[#30362F]">
                  {isElectionOpen ? 'Voting Open' : 'Voting Closed'}
                </span>
              </div>
            )}

            {/* Network Switch Button */}
            {account && !isCorrectNetwork && (
              <button
                onClick={onSwitchNetwork}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-[#A87565] bg-[#F7EFEB] border border-[#A87565]/40 hover:bg-[#F0E3DE] transition-colors"
              >
                <AlertCircle className="h-3.5 w-3.5 text-[#A87565]" />
                <span>Switch to 31337</span>
              </button>
            )}

            {/* Wallet Address or Connect Button */}
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
                className="min-h-[40px] px-4 rounded-lg text-xs font-medium bg-[#536A55] hover:bg-[#465B48] active:scale-[0.99] text-[#F8F7F2] transition-all shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Segmented Navigation */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-[#D2D2C9] bg-[#E9E8E2]">
          <button
            onClick={() => setActiveTab('voter')}
            className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'voter'
                ? 'bg-[#F8F7F2] text-[#30362F] border border-[#D2D2C9] font-semibold'
                : 'text-[#6F746B]'
            }`}
          >
            Voter
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'admin'
                ? 'bg-[#F8F7F2] text-[#30362F] border border-[#D2D2C9] font-semibold'
                : 'text-[#6F746B]'
            }`}
          >
            Operations
          </button>
          <button
            onClick={() => setActiveTab('crypto')}
            className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'crypto'
                ? 'bg-[#F8F7F2] text-[#30362F] border border-[#D2D2C9] font-semibold'
                : 'text-[#6F746B]'
            }`}
          >
            Cryptography
          </button>
        </div>
      </div>
    </header>
  );
}
