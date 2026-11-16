import React from 'react';
import { Wallet, AlertCircle, ArrowUpRight, LogOut, Shield, Key, UserCheck, ShieldAlert, Cpu } from 'lucide-react';
import { truncateAddress } from '../utils/contract';

export function Navbar({
  account,
  isAdmin,
  isWhitelisted,
  isConnecting,
  onConnectWallet,
  onDisconnectWallet,
  onSwitchNetwork,
  isCorrectNetwork,
  isElectionOpen,
  currentView,
  setCurrentView,
  hasContract,
}) {
  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#08090B]/90 backdrop-blur-2xl border-b border-[#232730] shadow-[0_4px_30px_rgba(0,0,0,0.7)] transition-all duration-200">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-16">
        
        {/* Main Desktop & Mobile Top Bar */}
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Brand Wordmark — Always returns to Landing Screen */}
          <div 
            onClick={() => setCurrentView('landing')}
            className="flex items-center space-x-3 cursor-pointer group select-none"
            title="Return to Protocol Landing Screen"
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

          {/* Desktop Role-Based Navigation (Wallet-First Contextual Routing) */}
          <nav className="hidden md:flex items-center bg-[#0F1115]/90 p-1.5 rounded-full border border-[#232730] shadow-inner">
            
            {/* When Wallet is Disconnected: Public Navigation */}
            {!account && (
              <>
                <button
                  onClick={() => setCurrentView('landing')}
                  className={`px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                    currentView === 'landing'
                      ? 'bg-[#C6FF00] text-[#08090B] shadow-[0_0_18px_rgba(198,255,0,0.35)] scale-[1.02]'
                      : 'text-[#8B909D] hover:text-white hover:bg-white/5'
                  }`}
                >
                  Landing
                </button>
                <button
                  onClick={() => setCurrentView('crypto')}
                  className={`px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                    currentView === 'crypto'
                      ? 'bg-[#C6FF00] text-[#08090B] shadow-[0_0_18px_rgba(198,255,0,0.35)] scale-[1.02]'
                      : 'text-[#8B909D] hover:text-white hover:bg-white/5'
                  }`}
                >
                  Cryptography Lab
                </button>
              </>
            )}

            {/* When Wallet is Connected as Admin: Admin Console Only */}
            {account && isAdmin && (
              <>
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center space-x-2 ${
                    currentView === 'admin'
                      ? 'bg-[#C6FF00] text-[#08090B] shadow-[0_0_18px_rgba(198,255,0,0.35)] scale-[1.02]'
                      : 'text-[#8B909D] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Admin Console</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'admin' ? 'bg-[#08090B]' : 'bg-[#C6FF00]'}`} />
                </button>
                <button
                  onClick={() => setCurrentView('crypto')}
                  className={`px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                    currentView === 'crypto'
                      ? 'bg-[#C6FF00] text-[#08090B] shadow-[0_0_18px_rgba(198,255,0,0.35)] scale-[1.02]'
                      : 'text-[#8B909D] hover:text-white hover:bg-white/5'
                  }`}
                >
                  Cryptography
                </button>
                <button
                  onClick={() => setCurrentView('landing')}
                  className={`px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                    currentView === 'landing'
                      ? 'bg-[#C6FF00] text-[#08090B] shadow-[0_0_18px_rgba(198,255,0,0.35)] scale-[1.02]'
                      : 'text-[#8B909D] hover:text-white hover:bg-white/5'
                  }`}
                >
                  Home
                </button>
              </>
            )}

            {/* When Wallet is Connected as Registered Voter: Voter Ballot Only */}
            {account && !isAdmin && isWhitelisted && (
              <>
                <button
                  onClick={() => setCurrentView('voter')}
                  className={`px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center space-x-2 ${
                    currentView === 'voter'
                      ? 'bg-[#C6FF00] text-[#08090B] shadow-[0_0_18px_rgba(198,255,0,0.35)] scale-[1.02]'
                      : 'text-[#8B909D] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Voter Ballot</span>
                </button>
                <button
                  onClick={() => setCurrentView('crypto')}
                  className={`px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                    currentView === 'crypto'
                      ? 'bg-[#C6FF00] text-[#08090B] shadow-[0_0_18px_rgba(198,255,0,0.35)] scale-[1.02]'
                      : 'text-[#8B909D] hover:text-white hover:bg-white/5'
                  }`}
                >
                  Cryptography
                </button>
                <button
                  onClick={() => setCurrentView('landing')}
                  className={`px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                    currentView === 'landing'
                      ? 'bg-[#C6FF00] text-[#08090B] shadow-[0_0_18px_rgba(198,255,0,0.35)] scale-[1.02]'
                      : 'text-[#8B909D] hover:text-white hover:bg-white/5'
                  }`}
                >
                  Home
                </button>
              </>
            )}

            {/* When Wallet is Connected but Unregistered: Access Status Only */}
            {account && !isAdmin && !isWhitelisted && (
              <>
                <button
                  onClick={() => setCurrentView('unauthorized')}
                  className={`px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center space-x-2 ${
                    currentView === 'unauthorized'
                      ? 'bg-[#FF5C5C] text-white shadow-[0_0_18px_rgba(255,92,92,0.35)] scale-[1.02]'
                      : 'text-[#FF5C5C]/80 hover:text-[#FF5C5C] hover:bg-[#FF5C5C]/10'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Access Status</span>
                </button>
                <button
                  onClick={() => setCurrentView('crypto')}
                  className={`px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                    currentView === 'crypto'
                      ? 'bg-[#C6FF00] text-[#08090B] shadow-[0_0_18px_rgba(198,255,0,0.35)] scale-[1.02]'
                      : 'text-[#8B909D] hover:text-white hover:bg-white/5'
                  }`}
                >
                  Cryptography
                </button>
                <button
                  onClick={() => setCurrentView('landing')}
                  className={`px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                    currentView === 'landing'
                      ? 'bg-[#C6FF00] text-[#08090B] shadow-[0_0_18px_rgba(198,255,0,0.35)] scale-[1.02]'
                      : 'text-[#8B909D] hover:text-white hover:bg-white/5'
                  }`}
                >
                  Home
                </button>
              </>
            )}

          </nav>

          {/* Right Section: Network Status, Account Badge & Disconnect */}
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
                title="Switch MetaMask to Hardhat Localhost (Chain ID 31337)"
              >
                <AlertCircle className="h-3.5 w-3.5 text-[#FF5C5C]" />
                <span className="hidden sm:inline">Switch to 31337</span>
                <span className="sm:hidden">31337</span>
              </button>
            )}

            {/* Wallet Status & Actions */}
            {account ? (
              <div className="flex items-center space-x-2">
                {/* Account Pill with Dynamic Role Badge */}
                <div className="flex items-center space-x-2 bg-[#0F1115] border border-[#232730] rounded-full pl-3 pr-1.5 py-1 text-xs font-mono text-white shadow-sm">
                  <span className={`w-2 h-2 rounded-full ${isAdmin || isWhitelisted ? 'bg-[#C6FF00]' : 'bg-[#FF5C5C]'}`} />
                  <span className="font-semibold text-[11px] sm:text-xs">{truncateAddress(account)}</span>
                  {isAdmin ? (
                    <span className="text-[9px] sm:text-[10px] bg-[#C6FF00] text-[#08090B] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Admin
                    </span>
                  ) : isWhitelisted ? (
                    <span className="text-[9px] sm:text-[10px] bg-[#16191F] text-[#C6FF00] border border-[#C6FF00]/40 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Voter
                    </span>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] bg-[#FF5C5C]/15 text-[#FF5C5C] border border-[#FF5C5C]/30 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Unregistered
                    </span>
                  )}
                </div>

                {/* Disconnect Wallet Action Button */}
                <button
                  onClick={onDisconnectWallet}
                  title="Disconnect Wallet and Return to Landing Screen"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-mono text-[#8B909D] hover:text-[#FF5C5C] bg-[#0F1115] border border-[#232730] hover:border-[#FF5C5C]/40 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Disconnect</span>
                </button>
              </div>
            ) : (
              /* Disconnected State: Prominent Connect Wallet Capsule Button */
              <button
                onClick={onConnectWallet}
                disabled={isConnecting}
                className="btn-pill-lime !min-h-[40px] !py-1.5 !px-5 !text-xs"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{isConnecting ? 'Connecting…' : 'Connect Wallet'}</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
              </button>
            )}

          </div>
        </div>

        {/* Mobile Contextual Navigation */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-[#232730]/60">
          {!account ? (
            <>
              <button
                onClick={() => setCurrentView('landing')}
                className={`py-1.5 px-4 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                  currentView === 'landing'
                    ? 'bg-[#C6FF00] text-[#08090B]'
                    : 'text-[#8B909D] hover:text-white'
                }`}
              >
                Landing
              </button>
              <button
                onClick={() => setCurrentView('crypto')}
                className={`py-1.5 px-4 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                  currentView === 'crypto'
                    ? 'bg-[#C6FF00] text-[#08090B]'
                    : 'text-[#8B909D] hover:text-white'
                }`}
              >
                Cryptography
              </button>
              <button
                onClick={onConnectWallet}
                className="py-1 px-3 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#C6FF00] text-[#08090B]"
              >
                Connect
              </button>
            </>
          ) : (
            <>
              {isAdmin && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`py-1.5 px-4 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                    currentView === 'admin'
                      ? 'bg-[#C6FF00] text-[#08090B]'
                      : 'text-[#8B909D] hover:text-white'
                  }`}
                >
                  Admin
                </button>
              )}
              {!isAdmin && isWhitelisted && (
                <button
                  onClick={() => setCurrentView('voter')}
                  className={`py-1.5 px-4 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                    currentView === 'voter'
                      ? 'bg-[#C6FF00] text-[#08090B]'
                      : 'text-[#8B909D] hover:text-white'
                  }`}
                >
                  Ballot
                </button>
              )}
              {!isAdmin && !isWhitelisted && (
                <button
                  onClick={() => setCurrentView('unauthorized')}
                  className={`py-1.5 px-4 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                    currentView === 'unauthorized'
                      ? 'bg-[#FF5C5C] text-white'
                      : 'text-[#FF5C5C] hover:text-white'
                  }`}
                >
                  Status
                </button>
              )}
              <button
                onClick={() => setCurrentView('crypto')}
                className={`py-1.5 px-3 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                  currentView === 'crypto'
                    ? 'bg-[#C6FF00] text-[#08090B]'
                    : 'text-[#8B909D] hover:text-white'
                }`}
              >
                Crypto
              </button>
              <button
                onClick={() => setCurrentView('landing')}
                className={`py-1.5 px-3 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                  currentView === 'landing'
                    ? 'bg-[#C6FF00] text-[#08090B]'
                    : 'text-[#8B909D] hover:text-white'
                }`}
              >
                Home
              </button>
              <button
                onClick={onDisconnectWallet}
                className="py-1 px-2.5 rounded-full text-[10px] font-mono text-[#FF5C5C] border border-[#FF5C5C]/30"
              >
                Exit
              </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
export default Navbar;
