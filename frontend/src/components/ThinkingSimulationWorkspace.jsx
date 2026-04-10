import { useState } from 'react';
import { simulateThinking } from '../api';
import ThinkingSimulationResults from './ThinkingSimulationResults';

function ThinkingSimulationWorkspace() {
  const [problem, setProblem] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const handleSubmit = async () => {
    if (!problem.trim()) {
      setError('Please enter a problem or question to analyze.');
      return;
    }

    setProcessing(true);
    setError('');
    setResults(null);

    try {
      const result = await simulateThinking(problem, studentAnswer);
      setResults(result);
    } catch (err) {
      setError(err.message || 'Thinking simulation failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto">
      {/* Input Form */}
      <div className="clean-card p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-xl border border-blue-100">
            🧠
          </div>
          <h2 className="text-xl font-display font-bold text-gray-900 tracking-wide">Thinking Simulation Engine</h2>
        </div>
        <p className="text-base font-body font-medium text-gray-600 mb-8 max-w-3xl">
          Graph-based cognitive reasoning simulator. Generates structured reasoning graphs
          (nodes + edges + decisions) for three cognitive levels with strict constraint enforcement.
          Compares graph shape, strategy distribution, and abstraction flow — not surface-level text.
          Optionally provide a student answer to convert into the same graph structure and identify structural gaps.
        </p>

        {/* Problem (mandatory) */}
        <div className="mb-6">
          <label className="block text-sm font-display font-bold uppercase tracking-wider text-gray-700 mb-2">
            Problem / Question <span className="text-red-500">*</span>
          </label>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="Enter the problem, question, or concept to simulate reasoning for..."
            rows={3}
            className="clean-input resize-y"
            disabled={processing}
          />
        </div>

        {/* Student Answer (optional) */}
        <div className="mb-8">
          <label className="block text-sm font-display font-bold uppercase tracking-wider text-gray-700 mb-2">
            Student Answer / Reasoning <span className="text-gray-400 font-medium normal-case">(optional)</span>
          </label>
          <textarea
            value={studentAnswer}
            onChange={(e) => setStudentAnswer(e.target.value)}
            placeholder="Enter the student's reasoning to compare against simulated thinking levels..."
            rows={3}
            className="clean-input resize-y"
            disabled={processing}
          />
          <p className="text-sm font-medium text-gray-500 mt-3 inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            System will compare student's reasoning against all three cognitive levels to identify gaps.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 rounded-xl border border-red-100 p-4 text-sm font-medium text-red-800 flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmit}
            disabled={processing || !problem.trim()}
            className="clean-btn-primary"
          >
            {processing ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Simulating Thinking...
              </>
            ) : (
              <>
                <span>🧠</span> Simulate Thinking
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {results && <ThinkingSimulationResults results={results} />}
    </div>
  );
}

export default ThinkingSimulationWorkspace;
