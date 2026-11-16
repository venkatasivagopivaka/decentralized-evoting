import React from 'react';
import { Hero3D } from './Hero3D';
import { ArrowRight, Terminal, Cpu, Database } from 'lucide-react';
import contractDeployment from '../contracts/EVoting.json';

export function HeroSection({
  isElectionOpen,
  onNavigateTab,
  onConnectWallet,
  account,
  isAdmin,
}) {
  return (
    <section className="relative w-full border-b border-[#232730] overflow-hidden bg-[#08090B]">
      {/* Background Subtle Radial Lighting in Neon Lime */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#C6FF00]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-16 pt-10 sm:pt-16 pb-12 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column: Monumental Editorial Typography (Reference Images 1, 2, 4) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 z-20">
            {/* Editorial Micro-Tag with Neon Lime Dot */}
            <div className="inline-flex items-center space-x-2.5 bg-[#0F1115] px-4 py-1.5 rounded-full border border-[#232730]">
              <span className="w-2 h-2 rounded-[2px] bg-[#C6FF00] shadow-[0_0_8px_#C6FF00]" />
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-white">
                Sovereign Democratic Protocol
              </span>
              <span className="text-[#8B909D] font-mono text-[10px]">v2.6</span>
            </div>

            {/* Monumental Headline */}
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black text-white tracking-tighter uppercase leading-[0.92]">
                Your Vote.
              </h1>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter uppercase leading-[0.92] text-transparent bg-clip-text bg-gradient-to-r from-[#C6FF00] via-[#E2FF66] to-[#FFFFFF]">
                Your Power<span className="text-[#C6FF00]">.</span>
              </h1>
            </div>

            {/* Editorial Supporting Manifesto */}
            <p className="text-base sm:text-lg lg:text-xl text-[#8B909D] max-w-xl font-normal leading-relaxed">
              A mathematically verifiable voting architecture. End-to-end ballot secrecy powered by <span className="text-white font-medium">Paillier homomorphic encryption</span> and audited on the <span className="text-white font-medium">Ethereum blockchain</span>.
            </p>

            {/* Capsule Button Row in Neo-Lime Editorial Style */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigateTab('voter')}
                className="btn-pill-lime group"
              >
                <span>Cast Ballot Now</span>
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => onNavigateTab('crypto')}
                className="btn-pill-outline group"
              >
                <span>Explore Cryptography</span>
                <span className="text-[#C6FF00] ml-2 font-mono text-xs">→</span>
              </button>

              {!account && (
                <button
                  onClick={onConnectWallet}
                  className="hidden sm:inline-flex btn-pill-outline text-[#8B909D] hover:text-white"
                >
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>

            {/* Micro Pillars List */}
            <div className="pt-6 sm:pt-8 grid grid-cols-3 gap-4 border-t border-[#232730]/80 max-w-lg">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#8B909D] block">SECRECY</span>
                <span className="text-xs sm:text-sm font-bold text-white mt-0.5 block">Zero-Leakage</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-[#8B909D] block">TALLYING</span>
                <span className="text-xs sm:text-sm font-bold text-[#C6FF00] mt-0.5 block">Homomorphic</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-[#8B909D] block">SETTLEMENT</span>
                <span className="text-xs sm:text-sm font-bold text-white mt-0.5 block">Ethereum L1</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 3D WebGL Sculpture in Neon Lime */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <Hero3D />
          </div>

        </div>
      </div>

      {/* Protocol Metrics Running Ticker Bar */}
      <div className="border-t border-[#232730] bg-[#0A0C0F] py-3.5 px-4 sm:px-8 lg:px-16 overflow-x-auto">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-6 min-w-max text-[11px] font-mono">
          
          <div className="flex items-center space-x-2 text-[#8B909D]">
            <Cpu className="w-3.5 h-3.5 text-[#C6FF00]" />
            <span className="text-[#8B909D]">CRYPTOSYSTEM:</span>
            <span className="text-white font-bold">1024-BIT PAILLIER</span>
          </div>

          <div className="flex items-center space-x-2 text-[#8B909D]">
            <Database className="w-3.5 h-3.5 text-[#C6FF00]" />
            <span className="text-[#8B909D]">NETWORK:</span>
            <span className="text-white font-bold">HARDHAT LOCALHOST (31337)</span>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isElectionOpen
                  ? 'bg-[#C6FF00] shadow-[0_0_8px_#C6FF00] animate-pulse'
                  : 'bg-[#525765]'
              }`}
            />
            <span className="text-[#8B909D]">POLLS STATUS:</span>
            <span className={isElectionOpen ? 'text-[#C6FF00] font-bold' : 'text-[#8B909D]'}>
              {isElectionOpen ? 'OPEN (ACCEPTING CIPHERTEXTS)' : 'SEALED'}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[#8B909D]">
            <Terminal className="w-3.5 h-3.5 text-[#C6FF00]" />
            <span className="text-[#8B909D]">CONTRACT:</span>
            <span className="text-[#C6FF00] bg-[#0F1115] px-2 py-0.5 rounded border border-[#232730]">
              {contractDeployment.address
                ? `${contractDeployment.address.slice(0, 8)}…${contractDeployment.address.slice(-6)}`
                : '0x5FbDB2315...'}
            </span>
          </div>

        </div>
      </div>
    </section>
  );
}
export default HeroSection;
