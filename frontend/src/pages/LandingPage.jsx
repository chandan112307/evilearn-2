import React from 'react';
import ClayButton from '../components/clay/ClayButton';
import { Sparkles, Brain, ShieldCheck } from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  return (
    <div className="flex flex-col items-center pb-24 w-full">
      {/* Hero Section */}
      <section className="w-full max-w-6xl px-6 pt-32 pb-24 flex flex-col items-center text-center relative">
        <div className="absolute top-10 right-[10%] w-32 h-32 bg-[var(--color-brand-secondary)]/20 rounded-full blur-[40px]"></div>
        <div className="absolute top-40 left-[10%] w-48 h-48 bg-[var(--color-brand-cta)]/20 rounded-full blur-[60px]"></div>
        
        <div className="inline-flex items-center gap-2 px-6 py-3 clay-card bg-[var(--color-brand-bg)] border-[var(--color-brand-border)] mb-10 text-[var(--color-brand-primary)] font-bold text-lg">
          <Sparkles size={20} fill="currentColor" />
          <span>EviLearn 2.0 has arrived!</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black text-[var(--color-brand-primary)] leading-[1.1] mb-8 drop-shadow-sm">
          Learning made <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-cta)]">
             playful.
          </span>
        </h1>
        
        <p className="text-2xl text-[var(--color-brand-text)]/80 max-w-3xl mb-12 font-medium font-comic leading-relaxed">
          The first truly tactile cognitive dashboard. Throw your questions in, watch the reasoning bounce out. Fully transparent AI learning.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6">
          <ClayButton variant="primary" onClick={() => onNavigate('workspace')} className="text-2xl px-12 py-5 flex items-center gap-4">
            Jump In <Sparkles fill="currentColor" size={24} />
          </ClayButton>
          <ClayButton variant="default" onClick={() => onNavigate('dashboard')} className="text-2xl text-[var(--color-brand-primary)] px-12 py-5">
            See Progress
          </ClayButton>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="w-full max-w-6xl px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="clay-card p-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-[var(--color-brand-bg)] flex items-center justify-center mb-8 shadow-inner">
            <Brain size={48} className="text-[var(--color-brand-primary)]" />
          </div>
          <h3 className="text-3xl font-bold text-[var(--color-brand-primary)] mb-4">Deep Logic</h3>
          <p className="text-xl text-[var(--color-brand-text)]/70 font-comic">
            Watch the AI break down complex topics step-by-step into bite-sized, squishy logic blocks.
          </p>
        </div>

        <div className="clay-card p-10 flex flex-col items-center text-center translate-y-0 md:-translate-y-8">
          <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mb-8 shadow-inner">
            <ShieldCheck size={48} className="text-[var(--color-brand-cta)]" />
          </div>
          <h3 className="text-3xl font-bold text-[var(--color-brand-cta)] mb-4">Ironclad Proofs</h3>
          <p className="text-xl text-[var(--color-brand-text)]/70 font-comic">
            Every claim is backed by sourced evidence. Tap a block to verify its foundation instantly.
          </p>
        </div>

        <div className="clay-card p-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mb-8 shadow-inner">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-brand-secondary)]">
              <path d="M12 20v-6M6 20V10M18 20V4"></path>
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-[var(--color-brand-secondary)] mb-4">Grow Daily</h3>
          <p className="text-xl text-[var(--color-brand-text)]/70 font-comic">
            Earn rounded badges and track your cognitive load in our highly tactile progress dashboard.
          </p>
        </div>
      </section>

      {/* Mini Demo preview */}
      <section className="w-full max-w-5xl px-6 py-24">
        <div className="clay-card p-4 md:p-8 bg-[var(--color-brand-bg)] border-[var(--color-brand-border)]">
          <div className="bg-white rounded-2xl p-8 shadow-[inset_4px_4px_8px_rgba(79,70,229,0.1),_inset_-4px_-4px_8px_rgba(255,255,255,1)]">
             <div className="flex gap-4 items-center mb-6">
                <div className="w-4 h-4 rounded-full bg-red-400"></div>
                <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                <div className="w-4 h-4 rounded-full bg-green-400"></div>
             </div>
             <p className="text-2xl font-baloo font-bold text-[var(--color-brand-text)] mb-4">You: Explain quantum entanglement like I'm five.</p>
             <div className="clay-card bg-white p-6 border-2 border-[var(--color-brand-primary)]/20 animate-pulse">
                <p className="text-xl font-comic text-[var(--color-brand-primary)]">EviLearn AI is squishing the data...</p>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
