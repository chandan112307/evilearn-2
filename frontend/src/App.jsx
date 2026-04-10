import { useState } from 'react';
import DocumentUpload from './components/DocumentUpload';
import ValidationWorkspace from './components/ValidationWorkspace';
import ResultsDisplay from './components/ResultsDisplay';
import HistoryDashboard from './components/HistoryDashboard';
import StressTestWorkspace from './components/StressTestWorkspace';
import ThinkingSimulationWorkspace from './components/ThinkingSimulationWorkspace';
import CognitiveLoadWorkspace from './components/CognitiveLoadWorkspace';

function App() {
  const [activeTab, setActiveTab] = useState('workspace');
  const [results, setResults] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  const handleResults = (data) => {
    setResults(data);
    setSessionId(data.session_id);
  };

  const tabs = [
    { id: 'workspace', label: 'Validation Workspace' },
    { id: 'thinking-sim', label: 'Thinking Simulator' },
    { id: 'cognitive-load', label: 'Cognitive Load' },
    { id: 'stress-test', label: 'Stress Test' },
    { id: 'documents', label: 'Documents' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg)] p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      {/* Floating Header Navbar */}
      <header className="w-full max-w-5xl mb-8">
        <div className="bg-white rounded-2xl p-4 sm:px-8 border border-gray-200 shadow-sm transition-all duration-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center border border-green-200">
                <span className="text-2xl font-display font-bold text-green-600">E</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-display font-bold text-gray-900 leading-none">EviLearn</h1>
                <p className="text-sm font-body text-gray-500 font-medium tracking-wide">Knowledge Validation</p>
              </div>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={isActive 
                      ? 'bg-gray-100 text-gray-900 rounded-lg px-4 py-2 font-display font-semibold text-sm transition-colors border border-gray-200' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg px-4 py-2 font-display font-medium text-sm transition-colors'}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content App Shell */}
      <main className="w-full max-w-7xl min-h-[70vh]">
        {activeTab === 'documents' && <DocumentUpload />}

        {activeTab === 'workspace' && (
          <div className="space-y-8">
            <ValidationWorkspace onResults={handleResults} />
            {results && (
              <ResultsDisplay results={results} sessionId={sessionId} />
            )}
          </div>
        )}

        {activeTab === 'thinking-sim' && <ThinkingSimulationWorkspace />}

        {activeTab === 'cognitive-load' && <CognitiveLoadWorkspace />}

        {activeTab === 'stress-test' && <StressTestWorkspace />}

        {activeTab === 'history' && <HistoryDashboard />}
      </main>
    </div>
  );
}

export default App;
