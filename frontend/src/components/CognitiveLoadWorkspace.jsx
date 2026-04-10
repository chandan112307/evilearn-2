import { useState } from 'react';
import { optimizeCognitiveLoad } from '../api';
import CognitiveLoadResults from './CognitiveLoadResults';

function CognitiveLoadWorkspace() {
  const [explanation, setExplanation] = useState('');
  const [userId, setUserId] = useState('default');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const handleSubmit = async () => {
    if (!explanation.trim()) {
      setError('Please enter an explanation to optimize.');
      return;
    }

    setProcessing(true);
    setError('');
    setResults(null);

    try {
      const result = await optimizeCognitiveLoad(explanation, userId);
      setResults(result);
    } catch (err) {
      setError(err.message || 'Cognitive load optimization failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto">
      {/* Input Form */}
      <div className="clean-card p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-4">
           <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-xl border border-purple-100">
             ⚡
           </div>
          <h2 className="text-xl font-display font-bold text-gray-900 tracking-wide">Cognitive Load Optimizer</h2>
        </div>
        <p className="text-base font-body font-medium text-gray-600 mb-8 max-w-3xl">
          Submit an explanation to optimize its cognitive load. The system analyzes step density,
          concept gaps, and memory demand, then adapts the explanation structure to match user capacity.
          It does NOT change content — only how reasoning is presented.
        </p>

        {/* Explanation Input */}
        <div className="mb-6">
          <label className="block text-sm font-display font-bold uppercase tracking-wider text-gray-700 mb-2">
            Explanation <span className="text-red-500">*</span>
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Enter the explanation to optimize for cognitive load..."
            rows={6}
            className="clean-input focus:border-purple-400 focus:ring-purple-400/20"
          />
        </div>

        {/* User ID */}
        <div className="mb-8">
          <label className="block text-sm font-display font-bold uppercase tracking-wider text-gray-700 mb-2">
            User ID <span className="text-gray-400 font-medium normal-case">(for state tracking)</span>
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="default"
            className="clean-input focus:border-purple-400 focus:ring-purple-400/20"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 rounded-xl border border-red-100 p-4 text-sm font-medium text-red-800 flex items-center gap-3">
             <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmit}
            disabled={processing || !explanation.trim()}
            className="clean-btn-primary w-full"
          >
            {processing ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Optimizing Cognitive Load...
              </>
            ) : (
              <>
                <span>⚡</span> Optimize Cognitive Load
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {results && <CognitiveLoadResults results={results} />}
    </div>
  );
}

export default CognitiveLoadWorkspace;
