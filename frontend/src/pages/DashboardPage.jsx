import React from 'react';
import { Target, Zap, Activity, Award } from 'lucide-react';
import ClayButton from '../components/clay/ClayButton';

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center pb-32 w-full pt-8 px-4">
      <div className="w-full max-w-5xl flex justify-between items-end mb-12">
        <div>
          <h1 className="text-5xl font-black text-[var(--color-brand-primary)] mb-2 drop-shadow-sm">Your Progress</h1>
          <p className="text-xl text-[var(--color-brand-text)]/70 font-comic font-medium">Keep breaking down concepts!</p>
        </div>
        <div className="hidden sm:flex bg-green-100 rounded-2xl px-6 py-2 items-center gap-3 clay-card border-none">
          <Zap size={24} className="text-yellow-500 fill-yellow-500" />
          <span className="font-baloo font-bold text-2xl text-green-700">7 Day Streak!</span>
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Main Stats */}
        <div className="md:col-span-8 flex flex-col gap-8">
          {/* Big Chart Card */}
          <div className="clay-card p-8 bg-[var(--color-brand-bg)] border-none">
            <h3 className="text-2xl font-bold text-[var(--color-brand-primary)] mb-6 flex items-center gap-3">
              <Activity size={28} /> Activity Flow
            </h3>
            <div className="w-full h-64 bg-white rounded-2xl p-4 shadow-inner flex items-end justify-between px-6 gap-2">
              <div className="w-12 bg-indigo-200 rounded-t-xl h-1/3 hover:bg-[var(--color-brand-primary)] transition-colors cursor-pointer"></div>
              <div className="w-12 bg-indigo-200 rounded-t-xl h-2/3 hover:bg-[var(--color-brand-primary)] transition-colors cursor-pointer"></div>
              <div className="w-12 bg-indigo-200 rounded-t-xl h-1/2 hover:bg-[var(--color-brand-primary)] transition-colors cursor-pointer"></div>
              <div className="w-12 bg-indigo-200 rounded-t-xl h-full hover:bg-[var(--color-brand-primary)] transition-colors cursor-pointer relative group">
                <div className="absolute -top-12 -left-4 bg-white shadow-lg rounded-xl px-4 py-1 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-[var(--color-brand-primary)] whitespace-nowrap">
                  Today: 15 Analyses
                </div>
              </div>
              <div className="w-12 bg-indigo-200 rounded-t-xl h-3/4 hover:bg-[var(--color-brand-primary)] transition-colors cursor-pointer"></div>
              <div className="w-12 bg-indigo-200 rounded-t-xl h-1/4 hover:bg-[var(--color-brand-primary)] transition-colors cursor-pointer"></div>
              <div className="w-12 bg-[var(--color-brand-primary)] rounded-t-xl h-5/6 cursor-pointer relative group">
                 <div className="absolute -top-12 -left-4 bg-white shadow-lg rounded-xl px-4 py-1 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-[var(--color-brand-primary)] whitespace-nowrap">
                  Peak Logic!
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="clay-card p-6 border-b-8 border-b-green-400">
               <h3 className="text-lg font-bold text-gray-500 mb-1">Total Concepts Mastered</h3>
               <div className="text-6xl font-black text-green-500">142</div>
            </div>
            <div className="clay-card p-6 border-b-8 border-b-indigo-400">
               <h3 className="text-lg font-bold text-gray-500 mb-1">Logic Precision Score</h3>
               <div className="text-6xl font-black text-indigo-500">98%</div>
            </div>
          </div>
        </div>

        {/* Badges and Side Panel */}
        <div className="md:col-span-4 flex flex-col gap-8">
          <div className="clay-card p-8 h-full bg-yellow-50/50 border-none">
             <h3 className="text-2xl font-bold text-yellow-600 mb-6 flex items-center gap-3">
              <Award size={28} /> Latest Badges
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm group hover:-translate-y-1 transition-transform cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-black text-xl group-hover:scale-110 transition-transform">
                  10
                </div>
                <div>
                  <h4 className="font-bold text-gray-700">Decade Thinker</h4>
                  <p className="text-sm text-gray-500 font-comic font-medium">10 consecutive analyses.</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm group hover:-translate-y-1 transition-transform cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 font-black text-xl group-hover:scale-110 transition-transform">
                   <Target />
                </div>
                <div>
                  <h4 className="font-bold text-gray-700">Fact Checker</h4>
                  <p className="text-sm text-gray-500 font-comic font-medium">Verified 50 claims.</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm opacity-50 grayscale group hover:grayscale-0 transition-all cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-black text-xl text-gray-400">
                   ?
                </div>
                <div>
                  <h4 className="font-bold text-gray-500">Deep Diver</h4>
                  <p className="text-sm text-gray-400 font-comic font-medium">Locked.</p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
