import React from 'react';
import { History, Search, ArrowRight, BrainCircuit } from 'lucide-react';
import ClayButton from '../components/clay/ClayButton';

export default function HistoryPage({ onNavigate }) {
  const pastQueries = [
    {
      id: 1,
      title: 'Analyze the mechanics of Quantum Entanglement',
      date: 'Today, 2:30 PM',
      color: 'bg-indigo-50',
      iconColor: 'text-[var(--color-brand-primary)]'
    },
    {
      id: 2,
      title: 'Did the Romans invent concrete?',
      date: 'Yesterday, 9:15 AM',
      color: 'bg-green-50',
      iconColor: 'text-[var(--color-brand-cta)]'
    },
    {
      id: 3,
      title: 'Deconstruct the arguments in The Federalist Papers',
      date: 'Mon, Oct 12',
      color: 'bg-blue-50',
      iconColor: 'text-blue-500'
    }
  ];

  return (
    <div className="flex flex-col items-center pb-32 w-full pt-8 px-4">
      <div className="w-full max-w-4xl flex justify-between items-end mb-12">
        <div>
          <h1 className="text-5xl font-black text-[var(--color-brand-primary)] mb-2 drop-shadow-sm flex items-center gap-4">
             <History size={48} /> History
          </h1>
          <p className="text-xl text-[var(--color-brand-text)]/70 font-comic font-medium">Revisit your past logic strings.</p>
        </div>
      </div>

      <div className="w-full max-w-4xl">
        <div className="clay-card p-4 sm:p-6 mb-8 flex gap-4 bg-[var(--color-brand-bg)] border-[var(--color-brand-border)]">
          <Search className="text-[var(--color-brand-primary)]" />
          <input 
            type="text" 
            placeholder="Search past analyses..." 
            className="w-full bg-transparent outline-none font-comic text-lg text-[var(--color-brand-text)] placeholder-[var(--color-brand-text)]/50"
          />
        </div>

        <div className="space-y-6">
          {pastQueries.map((query) => (
            <div 
              key={query.id}
              className="clay-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group cursor-pointer hover:bg-indigo-50 transition-colors"
              onClick={() => onNavigate('workspace')}
            >
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl ${query.color} ${query.iconColor} flex items-center justify-center font-black text-xl flex-shrink-0 group-hover:scale-110 transition-transform shadow-inner`}>
                   <BrainCircuit />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[var(--color-brand-primary)] mb-1 leading-tight group-hover:text-[var(--color-brand-cta)] transition-colors">{query.title}</h3>
                  <p className="font-comic font-medium text-[var(--color-brand-text)]/60">{query.date}</p>
                </div>
              </div>
              <div className="hidden sm:flex text-[var(--color-brand-primary)] opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                 <ArrowRight size={28} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
           <ClayButton variant="default" className="text-gray-500">Load Older Analyses</ClayButton>
        </div>
      </div>
    </div>
  );
}
