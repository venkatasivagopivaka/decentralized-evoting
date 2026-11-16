import React from 'react';
import { ShieldAlert, ArrowRight, LogOut, Terminal, BookOpen, UserCheck } from 'lucide-react';
import contractDeployment from '../contracts/EVoting.json';

export function UnauthorizedView({
  account,
  contractAddress,
  onDisconnectWallet,
  onNavigateCrypto,
  onNavigateLanding,
}) {
  const handleRequestSwitchAccount = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
      } catch (err) {
        console.warn('Account switch request dismissed:', err);
      }
    }
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-20 space-y-12">
      
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#08090B]/15 gap-6">
        <div>
          <div className="flex items-center space-x-2.5 text-[11px] font-mono tracking-widest text-[#FF5C5C] uppercase mb-2">
            <span className="w-2 h-2 rounded-[2px] bg-[#FF5C5C] shadow-[0_0_8px_#FF5C5C]" />
            <span>ACCESS CONTROL // AUTHORIZATION DENIED</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black text-[#08090B] tracking-tighter uppercase leading-none">
            Wallet Not Whitelisted<span className="text-[#FF5C5C]">.</span>
          </h2>
        </div>
        <p className="text-sm sm:text-base text-[#525765] max-w-md leading-relaxed">
          The connected Ethereum account has not been registered in the smart contract voter whitelist and cannot cast an encrypted ballot.
        </p>
      </div>

      {/* Main High-Contrast Security Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Security Alert Details */}
        <div className="lg:col-span-8 p-8 sm:p-10 rounded-3xl bg-[#08090B] border border-[#232730] text-white shadow-2xl space-y-8">
          
          <div className="flex items-start space-x-4">
            <div className="p-3.5 rounded-2xl bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 text-[#FF5C5C] flex-shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#FF5C5C] font-bold">
                CIVIC ACCESS POLICY VIOLATION
              </span>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                Voter Credentials Not Found On-Chain
              </h3>
              <p className="text-sm text-[#8B909D] leading-relaxed">
                Under the cryptographic protocol, only addresses registered in the <code className="text-white font-mono">voterRegistry</code> by the Election Authority can submit Paillier ciphertexts to prevent phantom ballot injection.
              </p>
            </div>
          </div>

          {/* Connected Address Details */}
          <div className="bg-[#0F1115] border border-[#232730] rounded-2xl p-6 space-y-4 font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232730] gap-2">
              <span className="text-[#8B909D] uppercase">Connected Account:</span>
              <span className="text-white font-bold break-all bg-[#08090B] px-3 py-1 rounded border border-[#232730]">
                {account || 'None'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232730] gap-2">
              <span className="text-[#8B909D] uppercase">Smart Contract:</span>
              <span className="text-[#C6FF00] font-bold break-all">
                {contractAddress || contractDeployment.address}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[#8B909D] uppercase">Whitelist Status:</span>
              <span className="inline-flex items-center space-x-2 text-[#FF5C5C] bg-[#FF5C5C]/10 px-3 py-1 rounded-full border border-[#FF5C5C]/30 font-bold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C5C]" />
                <span>NOT REGISTERED (UNAUTHORIZED)</span>
              </span>
            </div>
          </div>

          {/* Action Pathways */}
          <div className="space-y-4 pt-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#8B909D] block">
              Authorized Remediation Options:
            </span>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleRequestSwitchAccount}
                className="btn-pill-lime group"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                <span>Switch MetaMask Account</span>
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                onClick={onDisconnectWallet}
                className="btn-pill-outline text-[#FF5C5C] border-[#FF5C5C]/30 hover:border-[#FF5C5C] hover:bg-[#FF5C5C]/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Disconnect Wallet</span>
              </button>

              <button
                onClick={onNavigateCrypto}
                className="btn-pill-outline"
              >
                <BookOpen className="w-4 h-4 mr-2 text-[#C6FF00]" />
                <span>Explore Cryptography Lab</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right: Informational Guidance Card */}
        <div className="lg:col-span-4 p-8 rounded-3xl bg-[#0F1115] border border-[#232730] text-white space-y-6">
          <div className="flex items-center space-x-2 text-[#C6FF00] text-xs font-mono font-bold uppercase tracking-wider">
            <Terminal className="w-4 h-4" />
            <span>Local Evaluation Guide</span>
          </div>

          <div className="space-y-4 text-xs text-[#8B909D] leading-relaxed">
            <p>
              If you are demonstrating this project in an academic review:
            </p>
            <div className="bg-[#08090B] p-4 rounded-xl border border-[#232730] space-y-2 font-mono text-[11px]">
              <div>
                <span className="text-white font-bold">1. Admin Account:</span>
                <span className="block text-[#C6FF00] break-all mt-0.5">
                  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
                </span>
                <span className="text-[#8B909D] text-[10px]">Switching to Account #0 opens the Admin Console.</span>
              </div>
              <div className="pt-2 border-t border-[#232730]">
                <span className="text-white font-bold">2. Whitelisted Voter:</span>
                <span className="block text-white break-all mt-0.5">
                  0x70997970C51812dc3A010C7d01b50e0d17dc79C8
                </span>
                <span className="text-[#8B909D] text-[10px]">Account #1 is the primary registered test voter.</span>
              </div>
            </div>
            <p>
              To register the currently connected address, switch to the Admin Account, open the Admin Console, and register this address in Section 03 (Voter Whitelisting).
            </p>
          </div>

          <div className="pt-4 border-t border-[#232730]">
            <button
              onClick={onNavigateLanding}
              className="text-xs font-mono text-[#8B909D] hover:text-white flex items-center space-x-2 transition-colors"
            >
              <span>← Return to Landing Page</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
export default UnauthorizedView;
