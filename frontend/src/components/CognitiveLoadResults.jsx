import React from 'react';

function CognitiveLoadResults({ results }) {
  if (!results) return null;

  const {
    adapted_explanation = [],
    load_state = 'optimal',
    control_actions = [],
    user_state = {},
    load_metrics = {},
    reasoning_mode = 'medium',
  } = results;

  const loadStateColors = {
    overload: 'bg-red-50 text-red-900 border-red-200',
    optimal: 'bg-green-50 text-green-900 border-green-200',
    underload: 'bg-orange-50 text-orange-900 border-orange-200',
  };

  const modeColors = {
    'fine-grained': 'bg-gray-50 text-gray-800 border-gray-200',
    medium: 'bg-white text-gray-800 border-gray-200',
    coarse: 'bg-gray-100 text-gray-900 border-gray-300',
  };

  const loadStateIcons = {
    overload: '🔴',
    optimal: '🟢',
    underload: '🟡',
  };

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto mt-8">
      {/* Status Badges */}
      <div className="flex flex-wrap gap-4">
        <span className={`clean-card px-5 py-3 flex items-center gap-2 ${loadStateColors[load_state] || loadStateColors.optimal}`}>
          <span className="text-xl">{loadStateIcons[load_state] || '🟢'}</span> 
          <span className="font-bold tracking-wide">Load: {load_state}</span>
        </span>
        <span className={`clean-card px-5 py-3 flex items-center gap-2 ${modeColors[reasoning_mode] || modeColors.medium}`}>
          <span className="text-xl">🎛️</span> 
          <span className="font-bold tracking-wide">Mode: {reasoning_mode}</span>
        </span>
      </div>

      {/* Cognitive Load Metrics */}
      <div className="clean-card p-6 sm:p-8 bg-gray-50">
        <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-xl border border-purple-100">📊</span>
          Cognitive Load Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="clean-card p-4 text-center bg-white hover:border-purple-200 transition-colors shadow-sm cursor-default">
            <p className="text-3xl font-display font-bold text-purple-900 mb-1">{load_metrics.step_density?.toFixed(2) ?? '0.00'}</p>
            <p className="text-xs font-display font-bold uppercase tracking-wider text-purple-600">Step Density</p>
          </div>
          <div className="clean-card p-4 text-center bg-white hover:border-purple-200 transition-colors shadow-sm cursor-default">
            <p className="text-3xl font-display font-bold text-purple-900 mb-1">{load_metrics.concept_gap?.toFixed(2) ?? '0.00'}</p>
            <p className="text-xs font-display font-bold uppercase tracking-wider text-purple-600">Concept Gap</p>
          </div>
          <div className="clean-card p-4 text-center bg-white hover:border-purple-200 transition-colors shadow-sm cursor-default">
            <p className="text-3xl font-display font-bold text-purple-900 mb-1">{load_metrics.memory_demand?.toFixed(2) ?? '0.00'}</p>
            <p className="text-xs font-display font-bold uppercase tracking-wider text-purple-600">Memory Demand</p>
          </div>
          <div className="clean-card p-4 text-center bg-white hover:border-purple-200 transition-colors shadow-sm cursor-default">
            <p className="text-3xl font-display font-bold text-purple-900 mb-1">{load_metrics.total_load?.toFixed(2) ?? '0.00'}</p>
            <p className="text-xs font-display font-bold uppercase tracking-wider text-purple-600">Total Load</p>
          </div>
        </div>
      </div>

      {/* Control Actions */}
      {control_actions.length > 0 && (
        <div className="clean-card p-6 sm:p-8">
          <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-xl border border-purple-100">⚙️</span>
            Adaptation Actions
          </h3>
          <div className="space-y-3">
            {control_actions.map((action, idx) => (
              <div
                key={idx}
                className="clean-card flex items-start gap-3 p-4 bg-white hover:border-purple-200 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-purple-600 font-bold text-xs">→</span>
                </div>
                <div>
                  <span className="text-base font-display font-bold text-purple-900 block">{action.action}</span>
                  <p className="text-sm font-body font-medium text-purple-700 mt-1">{action.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adapted Explanation */}
      <div className="clean-card p-6 sm:p-8 bg-gray-50">
        <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-xl border border-purple-100">📝</span>
          Adapted Explanation
        </h3>
        {adapted_explanation.length === 0 ? (
          <div className="clean-card p-6 text-center bg-gray-50 text-gray-500 shadow-none border-gray-200">
             <p className="text-base font-body font-medium text-gray-500">No steps generated.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-4 relative before:absolute before:inset-0 before:ml-6 md:before:mx-auto before:w-px before:bg-gray-200 before:h-full">
            {adapted_explanation.map((step, idx) => {
              const isCheckpoint = step.step_id?.startsWith('checkpoint');
              
              let cardStyle = "bg-white border-gray-200";
              let badgeStyle = "bg-gray-100 text-gray-700";
              
              if (isCheckpoint) {
                 cardStyle = "bg-purple-50 border-purple-200";
                 badgeStyle = "bg-purple-100 text-purple-700 border-purple-200";
              } else if (step.abstraction_level === 'abstract') {
                 cardStyle = "bg-white border-gray-200";
                 badgeStyle = "bg-gray-100 text-gray-700";
              } else if (step.abstraction_level === 'semi-abstract') {
                 cardStyle = "bg-white border-gray-200";
                 badgeStyle = "bg-gray-50 text-gray-600";
              }

              return (
                <div
                  key={idx}
                  className={`clean-card p-5 relative z-10 transition-colors hover:border-purple-300 ${cardStyle}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-display font-bold uppercase tracking-wider text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg">
                        {step.step_id}
                      </span>
                      {isCheckpoint && (
                        <span className="text-xs font-display font-bold uppercase tracking-wider text-purple-700 bg-purple-100 border border-purple-200 px-2 py-1 rounded-lg flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                          Checkpoint
                        </span>
                      )}
                    </div>
                    <span className={`clean-tag ${badgeStyle}`}>
                      {step.abstraction_level}
                    </span>
                  </div>
                  <p className="text-base font-body font-medium text-gray-800 leading-relaxed mb-3">
                    {step.content}
                  </p>
                  {step.concepts?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {step.concepts.map((c, i) => (
                        <span key={i} className="clean-tag bg-gray-50 text-gray-600 border-gray-200">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Cognitive State */}
      <div className="clean-card p-6 sm:p-8">
        <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-xl border border-purple-100">👤</span>
          User Cognitive State
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div className="clean-card p-4 bg-white shadow-sm border-gray-200 cursor-default hover:border-purple-200 transition-colors">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-display font-bold uppercase tracking-wider text-gray-500">Understanding</span>
              <span className="text-xl font-display font-bold text-gray-900">{((user_state.understanding_level ?? 0.5) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 border border-gray-200 overflow-hidden">
              <div className="bg-gray-400 h-full rounded-full" style={{ width: `${(user_state.understanding_level ?? 0.5) * 100}%` }} />
            </div>
          </div>
          <div className="clean-card p-4 bg-white shadow-sm border-gray-200 cursor-default hover:border-purple-200 transition-colors">
             <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-display font-bold uppercase tracking-wider text-gray-500">Stability</span>
              <span className="text-xl font-display font-bold text-gray-900">{((user_state.reasoning_stability ?? 0.5) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 border border-gray-200 overflow-hidden">
              <div className="bg-gray-400 h-full rounded-full" style={{ width: `${(user_state.reasoning_stability ?? 0.5) * 100}%` }} />
            </div>
          </div>
          <div className="clean-card p-4 bg-white shadow-sm border-gray-200 cursor-default hover:border-purple-200 transition-colors">
             <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-display font-bold uppercase tracking-wider text-purple-700">Learning Speed</span>
              <span className="text-xl font-display font-bold text-purple-900">{((user_state.learning_speed ?? 0.5) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 border border-gray-200 overflow-hidden">
              <div className="bg-purple-400 h-full rounded-full" style={{ width: `${(user_state.learning_speed ?? 0.5) * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200">
          <span className="clean-tag bg-white shadow-sm text-gray-600 gap-3 py-2 px-3">
             <span>Interactions</span>
             <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-800 flex items-center justify-center font-bold text-sm border border-gray-200">{user_state.interaction_count ?? 0}</span>
          </span>
          <span className="clean-tag bg-white shadow-sm text-gray-600 gap-3 py-2 px-3">
             <span>Overload Signals</span>
             <span className="w-6 h-6 rounded-full bg-red-50 text-red-800 flex items-center justify-center font-bold text-sm border border-red-200">{user_state.overload_signals ?? 0}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default CognitiveLoadResults;
