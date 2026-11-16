import React from 'react';
import { Wallet, ShieldCheck, Cpu, Database, ArrowRight, Lock, Key, Users, CheckCircle } from 'lucide-react';
import contractDeployment from '../contracts/EVoting.json';

export function LandingGateway({
  isConnecting,
  onConnectWallet,
  onNavigateCrypto,
  isElectionOpen,
}) {
  return (
    <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-20 space-y-16">
      
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#08090B]/15 gap-6">
        <div>
          <div className="flex items-center space-x-2.5 text-[11px] font-mono tracking-widest text-[#08090B]/70 uppercase mb-2">
            <span className="w-2 h-2 rounded-[2px] bg-[#C6FF00]" />
            <span>SOVEREIGN ACCESS GATEWAY // WALLET VERIFICATION</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black text-[#08090B] tracking-tighter uppercase leading-none">
            Democratic Access<span className="text-[#C6FF00]">.</span>
          </h2>
        </div>
        <p className="text-sm sm:text-base text-[#525765] max-w-md leading-relaxed">
          Verifiable democratic governance requires cryptographic authorization. Connect your Ethereum wallet to verify your role and enter your designated dashboard.
        </p>
      </div>

      {/* Hero Authentication Card & Role Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Prominent Connect Gate */}
        <div className="lg:col-span-7 p-8 sm:p-10 rounded-3xl bg-[#08090B] border border-[#232730] text-white shadow-2xl flex flex-col justify-between space-y-8 relative overflow-hidden">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#16191F] border border-[#232730] text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-[#8B909D]" />
              <span className="text-[#8B909D]">WALLET DISCONNECTED // AUTHENTICATION REQUIRED</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                Connect to Determine Protocol Role
              </h3>
              <p className="text-sm text-[#8B909D] leading-relaxed max-w-lg">
                Upon connection, the application queries the smart contract directly. If your address is the Election Administrator, the Admin Console opens. If your address is registered on the voter whitelist, your Ballot opens.
              </p>
            </div>

            {/* Verification Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center space-x-2.5 bg-[#0F1115] p-3 rounded-xl border border-[#232730] text-xs font-mono text-[#8B909D]">
                <ShieldCheck className="w-4 h-4 text-[#C6FF00] flex-shrink-0" />
                <span>On-Chain Role Check</span>
              </div>
              <div className="flex items-center space-x-2.5 bg-[#0F1115] p-3 rounded-xl border border-[#232730] text-xs font-mono text-[#8B909D]">
                <Lock className="w-4 h-4 text-[#C6FF00] flex-shrink-0" />
                <span>Zero-Knowledge Privacy</span>
              </div>
              <div className="flex items-center space-x-2.5 bg-[#0F1115] p-3 rounded-xl border border-[#232730] text-xs font-mono text-[#8B909D]">
                <Cpu className="w-4 h-4 text-[#C6FF00] flex-shrink-0" />
                <span>Homomorphic Tallying</span>
              </div>
              <div className="flex items-center space-x-2.5 bg-[#0F1115] p-3 rounded-xl border border-[#232730] text-xs font-mono text-[#8B909D]">
                <Database className="w-4 h-4 text-[#C6FF00] flex-shrink-0" />
                <span>Chain ID 31337</span>
              </div>
            </div>
          </div>

          {/* Primary CTA Buttons */}
          <div className="pt-4 border-t border-[#232730] flex flex-wrap items-center gap-4">
            <button
              onClick={onConnectWallet}
              disabled={isConnecting}
              className="btn-pill-lime group !py-3.5 !px-8 text-sm"
            >
              <Wallet className="w-4 h-4 mr-2" />
              <span>{isConnecting ? 'Connecting MetaMask…' : 'Connect Wallet to Enter'}</span>
              <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
            </button>

            <button
              onClick={onNavigateCrypto}
              className="btn-pill-outline text-xs !py-3.5 !px-6"
            >
              <span>Explore Cryptography Lab</span>
              <span className="text-[#C6FF00] ml-2 font-mono">→</span>
            </button>
          </div>
        </div>

        {/* Right Column: Two-Role Protocol Overview */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          
          {/* Voter Role Card */}
          <div className="p-7 rounded-3xl bg-[#0F1115] border border-[#232730] text-white space-y-3 flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#C6FF00] font-bold">
                ROLE 01 // REGISTERED VOTER
              </span>
              <Users className="w-4 h-4 text-[#C6FF00]" />
            </div>
            <h4 className="text-xl font-black uppercase text-white tracking-tight">
              Voter Ballot Portal
            </h4>
            <p className="text-xs text-[#8B909D] leading-relaxed">
              Whitelisted citizens select their nominee and generate a client-side Paillier ciphertext using cryptographic random salt <code className="text-[#C6FF00] font-mono">r ∈ ℤ*ₙ</code>. Single-vote integrity is strictly enforced on-chain.
            </p>
          </div>

          {/* Administrator Role Card */}
          <div className="p-7 rounded-3xl bg-[#0F1115] border border-[#232730] text-white space-y-3 flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#C6FF00] font-bold">
                ROLE 02 // ELECTION AUTHORITY
              </span>
              <Key className="w-4 h-4 text-[#C6FF00]" />
            </div>
            <h4 className="text-xl font-black uppercase text-white tracking-tight">
              Executive Administration
            </h4>
            <p className="text-xs text-[#8B909D] leading-relaxed">
              The contract administrator deploys 1024-bit Paillier keys, governs the voter whitelist, opens/closes the voting window, aggregates ciphertexts homomorphically, and decrypts the final tally.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
export default LandingGateway;
