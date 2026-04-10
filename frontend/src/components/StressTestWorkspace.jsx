import { useState } from 'react';
import { evaluateReasoning } from '../api';
import StressTestResults from './StressTestResults';

function StressTestWorkspace() {
  const [problem, setProblem] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [confidence, setConfidence] = useState(50);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const handleSubmit = async () => {
    if (!studentAnswer.trim()) {
      setError('Please enter a student answer to stress-test.');
      return;
    }

    setProcessing(true);
    setError('');
    setResults(null);

    try {
      const result = await evaluateReasoning(studentAnswer, problem, confidence);
      setResults(result);
    } catch (err) {
      setError(err.message || 'Stress test failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto">
      {/* Input Form */}
      <div className="clean-card p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-xl border border-orange-100">
             🔬
           </div>
          <h2 className="text-xl font-display font-bold text-gray-900 tracking-wide">Knowledge Stress-Test Engine</h2>
        </div>
        <p className="text-base font-body font-medium text-gray-600 mb-8 max-w-3xl">
          Submit a student answer to stress-test. The system will actively try to break the reasoning
          by generating adversarial scenarios, detecting failure points, and producing targeted challenge questions.
          This is NOT a tutoring tool — it is a reasoning stress-testing system.
        </p>

        {/* Problem (optional) */}
        <div className="mb-6">
          <label className="block text-sm font-display font-bold uppercase tracking-wider text-gray-700 mb-2">
            Problem Statement <span className="text-gray-400 font-medium normal-case">(optional)</span>
          </label>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="Enter the problem or question the student was answering..."
            rows={3}
            className="clean-input focus:border-orange-400 focus:ring-orange-400/20"
            disabled={processing}
          />
        </div>

        {/* Student Answer (mandatory) */}
        <div className="mb-6">
          <label className="block text-sm font-display font-bold uppercase tracking-wider text-gray-700 mb-2">
            Student Answer <span className="text-red-500">*</span>
          </label>
          <textarea
            value={studentAnswer}
            onChange={(e) => setStudentAnswer(e.target.value)}
            placeholder="Enter the student's answer, reasoning, or explanation to stress-test..."
            rows={6}
            className="clean-input focus:border-orange-400 focus:ring-orange-400/20"
            disabled={processing}
          />
        </div>

        {/* Confidence Slider */}
        <div className="mb-8">
          <label className="block text-sm font-display font-bold uppercase tracking-wider text-gray-700 mb-4 text-center">
            Student Confidence: <span className="text-orange-600 text-lg font-bold">{confidence}%</span>
          </label>
          
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center">
              <input
                type="range"
                min="0"
                max="100"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-orange-400/50"
                style={{ 
                    background: `linear-gradient(to right, #fb923c ${confidence}%, #e5e7eb ${confidence}%)`
                }}
                disabled={processing}
              />
              <div className="flex justify-between w-full text-xs font-display font-bold uppercase tracking-wider text-gray-500 mt-4">
                <span>Not confident</span>
                <span>Very confident</span>
              </div>
          </div>
        </div>

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
            disabled={processing || !studentAnswer.trim()}
            className="clean-btn-primary w-full"
          >
            {processing ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running Stress Test...
              </>
            ) : (
              <>
                <span>⚡</span> Run Stress Test
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {results && <StressTestResults results={results} />}
    </div>
  );
}

export default StressTestWorkspace;
