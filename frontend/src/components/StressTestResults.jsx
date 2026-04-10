import React from 'react';

function StressTestResults({ results }) {
  if (!results) return null;

  const {
    stress_test_results = [],
    weakness_summary = [],
    robustness_summary = {},
    adversarial_questions = [],
  } = results;

  const levelConfig = {
    high: { color: 'bg-green-50 text-green-900 border-green-200', label: 'High', bar: 'bg-green-500' },
    medium: { color: 'bg-orange-50 text-orange-900 border-orange-200', label: 'Medium', bar: 'bg-orange-500' },
    low: { color: 'bg-red-50 text-red-900 border-red-200', label: 'Low', bar: 'bg-red-500' },
    unknown: { color: 'bg-gray-50 text-gray-800 border-gray-200', label: 'Unknown', bar: 'bg-gray-400' },
  };

  const robustnessLevel = levelConfig[robustness_summary.level] || levelConfig.unknown;
  const scorePercent = Math.round((robustness_summary.robustness_score || 0) * 100);

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto mt-8">
      {/* Robustness Summary */}
      <div className={`clean-card p-6 sm:p-8 transition-colors hover:border-orange-300 ${robustnessLevel.color}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl border border-gray-200 shadow-sm">
               🛡️
             </div>
            <h3 className="text-2xl font-display font-bold">Robustness Score</h3>
          </div>
          <div className="flex items-center gap-4 bg-white/60 px-4 py-2 rounded-xl w-full sm:w-auto justify-between sm:justify-end border border-white">
            <span className={`clean-tag bg-white shadow-sm`}>
              {robustnessLevel.label}
            </span>
            <div className="text-3xl font-display font-black min-w-[4rem] text-right">{scorePercent}%</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-white rounded-full h-4 mb-4 border border-gray-200 overflow-hidden shadow-sm">
          <div
            className={`h-full rounded-full ${robustnessLevel.bar}`}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
        <p className="text-base font-body font-medium leading-relaxed bg-white/60 p-4 rounded-xl border border-white">{robustness_summary.summary}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Stress Test Results */}
          {stress_test_results.length > 0 && (
            <div className="clean-card p-6 sm:p-8 bg-gray-50">
              <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl border border-orange-100">⚡</span>
                Stress Test Rules
              </h3>
              <div className="space-y-3">
                {stress_test_results.map((result, i) => {
                  const isFail = result.startsWith('FAILS');
                  return (
                    <div
                      key={i}
                      className={`clean-card p-4 flex items-center gap-3 transition-colors ${
                        isFail
                          ? 'bg-red-50 text-red-900 border-red-200 hover:border-red-300'
                          : 'bg-green-50 text-green-900 border-green-200 hover:border-green-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${isFail ? 'bg-red-100 border-red-200 text-red-700' : 'bg-green-100 border-green-200 text-green-700'}`}>
                         <span className="font-bold text-lg leading-none">{isFail ? '✗' : '✓'}</span>
                      </div>
                      <span className="text-sm font-medium leading-snug">{result}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weakness Summary */}
          {weakness_summary.length > 0 && (
            <div className="clean-card p-6 sm:p-8 bg-gray-50">
              <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl border border-orange-100">⚠</span>
                Identified Weaknesses
              </h3>
              <div className="space-y-4">
                {weakness_summary.map((weakness, i) => (
                  <div key={i} className="clean-card p-5 bg-white flex flex-col gap-3 transition-colors hover:border-orange-200">
                    <span className="self-start clean-tag bg-orange-50 text-orange-800 border-orange-200">
                      {weakness.type.replace('_', ' ')}
                    </span>
                    <p className="text-sm font-body font-medium text-gray-700 leading-relaxed">{weakness.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Adversarial Questions */}
      {adversarial_questions.length > 0 && (
        <div className="clean-card p-6 sm:p-8">
          <h3 className="text-xl font-display font-bold text-gray-900 mb-2 flex items-center gap-3">
            <span className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl border border-orange-100">❓</span>
            Challenge Questions
          </h3>
          <p className="text-sm font-body font-medium text-gray-500 mb-6 ml-2">
            These questions target identified weaknesses in your reasoning. No answers provided — think carefully.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adversarial_questions.map((question, i) => (
              <div
                key={i}
                className="clean-card p-5 bg-white flex items-start gap-4 transition-colors hover:border-orange-200"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-700 border border-orange-100 font-display font-bold flex items-center justify-center shrink-0">
                   {i + 1}
                </div>
                <span className="text-base font-body font-medium text-gray-800 leading-relaxed pt-0.5">{question}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StressTestResults;
