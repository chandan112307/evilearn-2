import React, { useState } from 'react';
import ClayButton from '../components/clay/ClayButton';
import { Send, Target, Search, CheckCircle, Lightbulb } from 'lucide-react';

export default function WorkspacePage() {
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState(0);

  const simulateAnalysis = () => {
    if (!query) return;
    setIsAnalyzing(true);
    setStep(1);
    
    setTimeout(() => setStep(2), 2000);
    setTimeout(() => setStep(3), 4000);
    setTimeout(() => setStep(4), 6000);
    setTimeout(() => {
      setStep(5);
      setIsAnalyzing(false);
    }, 8000);
  };

  return (
    <div className="flex flex-col items-center pb-32 w-full pt-8 px-4">
      
      {/* Query Space */}
      <section className="w-full max-w-4xl pt-8 pb-12 flex flex-col items-center relative z-20">
        <div className="clay-card p-4 md:p-6 w-full flex flex-col sm:flex-row gap-4 items-center bg-[var(--color-brand-bg)] border-[var(--color-brand-border)]">
          <input 
            type="text" 
            placeholder="Ask me to explain any complex topic..."
            className="clay-input flex-grow w-full font-baloo text-xl"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isAnalyzing}
          />
          <ClayButton variant="primary" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8" onClick={simulateAnalysis} disabled={isAnalyzing}>
            <Send size={20} /> <span className="font-baloo tracking-wide">Analyze</span>
          </ClayButton>
        </div>
      </section>

      {/* The Vertical Pipeline */}
      {step > 0 && (
        <section className="w-full max-w-2xl flex flex-col gap-8 relative">
          
          {/* Tracking Line */}
          <div className="absolute left-8 sm:left-12 top-0 bottom-0 w-2 bg-[var(--color-brand-border)] opacity-30 rounded-full z-0"></div>

          {/* Step 1: Breakdown Claims */}
          <div className={`relative z-10 flex gap-6 transition-all duration-700 ease-out ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full flex-shrink-0 flex items-center justify-center ${step >= 1 ? 'bg-[var(--color-brand-primary)]' : 'bg-gray-300'} text-white shadow-lg transition-colors duration-500`}>
              <Target size={32} />
            </div>
            <div className="clay-card p-6 flex-grow">
              <h3 className="text-2xl font-bold text-[var(--color-brand-primary)] mb-2">1. Extracting Claims</h3>
              {step === 1 ? (
                 <div className="h-6 w-32 bg-[var(--color-brand-border)] rounded-full animate-pulse"></div>
              ) : (
                <ul className="space-y-3 font-comic text-lg text-[var(--color-brand-text)]/80 font-medium">
                  <li className="bg-green-50 p-3 rounded-xl border-l-4 border-[var(--color-brand-cta)]">
                    Identified structural arguments in your query.
                  </li>
                  <li className="bg-indigo-50 p-3 rounded-xl border-l-4 border-[var(--color-brand-primary)]">
                    Isolated core factual assumptions.
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* Step 2: Evidence Sourcing */}
          <div className={`relative z-10 flex gap-6 transition-all duration-700 ease-out delay-100 ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full flex-shrink-0 flex items-center justify-center ${step >= 2 ? 'bg-[var(--color-brand-secondary)]' : 'bg-gray-300'} text-white shadow-lg transition-colors duration-500`}>
              <Search size={32} />
            </div>
            <div className="clay-card p-6 flex-grow">
              <h3 className="text-2xl font-bold text-[var(--color-brand-secondary)] mb-2">2. Sourcing Evidence</h3>
              {step === 2 ? (
                 <div className="h-6 w-48 bg-[var(--color-brand-border)] rounded-full animate-pulse"></div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white border-2 border-[var(--color-brand-secondary)] text-[var(--color-brand-secondary)] px-4 py-2 rounded-full font-bold shadow-sm">Academic Paper A</span>
                  <span className="bg-white border-2 border-[var(--color-brand-secondary)] text-[var(--color-brand-secondary)] px-4 py-2 rounded-full font-bold shadow-sm">News Report B</span>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Verification */}
          <div className={`relative z-10 flex gap-6 transition-all duration-700 ease-out delay-200 ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full flex-shrink-0 flex items-center justify-center ${step >= 3 ? 'bg-[var(--color-brand-cta)]' : 'bg-gray-300'} text-white shadow-lg transition-colors duration-500`}>
              <CheckCircle size={32} />
            </div>
            <div className="clay-card p-6 flex-grow">
              <h3 className="text-2xl font-bold text-[var(--color-brand-cta)] mb-2">3. Verifying Integrity</h3>
               {step === 3 ? (
                 <div className="h-6 w-40 bg-[var(--color-brand-border)] rounded-full animate-pulse"></div>
              ) : (
                <div className="text-xl font-comic font-bold text-[var(--color-brand-cta)]">
                  All claims cross-referenced successfully! 100% Validated.
                </div>
              )}
            </div>
          </div>

          {/* Step 4: Explanation */}
          <div className={`relative z-10 flex gap-6 transition-all duration-700 ease-out delay-300 ${step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full flex-shrink-0 flex items-center justify-center ${step >= 4 ? 'bg-orange-400' : 'bg-gray-300'} text-white shadow-lg transition-colors duration-500`}>
              <Lightbulb size={32} fill="currentColor" />
            </div>
            <div className="clay-card p-6 flex-grow border-4 border-orange-100">
              <h3 className="text-2xl font-bold text-orange-500 mb-4">4. Final Explanation</h3>
              {step === 4 ? (
                 <div className="space-y-4">
                   <div className="h-4 w-full bg-[var(--color-brand-border)] rounded-full animate-pulse"></div>
                   <div className="h-4 w-5/6 bg-[var(--color-brand-border)] rounded-full animate-pulse"></div>
                 </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-lg font-comic text-[var(--color-brand-text)]/80 leading-relaxed font-medium">
                    Here is the crystal clear breakdown of your query. By breaking it into components, we can see exactly how the mechanics work together.
                  </p>
                  
                  <div className="flex gap-4">
                    <ClayButton variant="default" className="text-sm px-6 py-2 text-[var(--color-brand-primary)]">Accept & Save</ClayButton>
                    <ClayButton variant="default" className="text-sm px-6 py-2 text-gray-400">Reject Logic</ClayButton>
                  </div>
                </div>
              )}
            </div>
          </div>

        </section>
      )}
    </div>
  );
}
