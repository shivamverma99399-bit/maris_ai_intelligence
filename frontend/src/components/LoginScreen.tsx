"use client";
import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

interface LoginScreenProps {
  onSignIn: (email: string) => void;
  onDemoAccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSignIn, onDemoAccess }) => {
  const [email, setEmail] = useState('operator@maris.gov.in');
  const [password, setPassword] = useState('••••••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignIn(email);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040306] maris-app-bg font-mono select-none">
      {/* Ambient background glow fields */}
      <div className="absolute inset-0 bg-radar-grid opacity-25 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(157,0,255,0.15)_0%,transparent_70%)] pointer-events-none -top-32 -left-32" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(0,240,255,0.08)_0%,transparent_70%)] pointer-events-none -bottom-32 -right-32" />

      <div className="w-full max-w-md maris-glass-primary rounded-2xl border border-[rgba(157,0,255,0.35)] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8A00E8] to-[#B026FF] shadow-[0_0_25px_rgba(157,0,255,0.6)] mb-2">
            <ShieldCheck className="w-7 h-7 text-white stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-[#F2EDF7]">
            MARIS
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#D9B8FF] font-bold">
            MARITIME AI INTELLIGENCE
          </p>
          <p className="text-[11px] text-[#81758F] pt-1">
            Official Maritime Surveillance & Oil Spill Incident Command System
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-[#B9ADBF] font-semibold block">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@maris.gov.in"
                className="w-full bg-[rgba(10,8,15,0.85)] border border-[rgba(255,255,255,0.12)] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#F2EDF7] focus:outline-none focus:border-[#B026FF] focus:ring-1 focus:ring-[#B026FF]"
              />
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#81758F]" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[#B9ADBF] font-semibold block">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-[rgba(10,8,15,0.85)] border border-[rgba(255,255,255,0.12)] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#F2EDF7] focus:outline-none focus:border-[#B026FF] focus:ring-1 focus:ring-[#B026FF]"
              />
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#81758F]" />
            </div>
          </div>

          {/* SIGN IN BUTTON */}
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl maris-btn-investigate text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(157,0,255,0.4)] mt-2"
          >
            <span>SIGN IN</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[rgba(255,255,255,0.08)]" />
          </div>
          <span className="relative px-3 bg-[#0A0910] text-[10px] text-[#81758F] uppercase">
            OR EXPLORE PROTOTYPE
          </span>
        </div>

        {/* DEMO ACCESS BUTTON (Required) */}
        <button
          type="button"
          onClick={onDemoAccess}
          className="w-full py-2.5 px-4 rounded-xl bg-[rgba(157,0,255,0.18)] hover:bg-[rgba(157,0,255,0.3)] border border-[rgba(176,38,255,0.5)] text-xs font-bold text-[#E9D5FF] flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(157,0,255,0.2)]"
        >
          <Sparkles className="w-4 h-4 text-[#C14CFF]" />
          <span>DEMO ACCESS</span>
        </button>

        <p className="text-[10px] text-center text-[#81758F] mt-5">
          DEMO / SIMULATED ENVIRONMENT • NO PRODUCTION CREDENTIALS REQUIRED
        </p>
      </div>
    </div>
  );
};
