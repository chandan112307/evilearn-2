import React from 'react';

function ThinkingSimulationResults({ results }) {
  if (!results) return null;

  const {
    cognitive_profiles = [],
    reasoning_graphs = [],
    strategy_distributions = [],
    structural_comparison = {},
    gap_analysis = [],
    student_graph = {},
    validation_passed = true,
    validation_notes = [],
  } = results;

  const levelColors = {
    beginner: {
      card: 'bg-white border border-gray-200',
      text: 'text-gray-900',
      badge: 'clean-tag',
      accent: 'bg-gray-400',
    },
    intermediate: {
      card: 'bg-white border border-blue-200 shadow-sm',
      text: 'text-gray-900',
      badge: 'clean-tag bg-blue-50 text-blue-800 border-blue-100',
      accent: 'bg-blue-400',
    },
    expert: {
      card: 'bg-white border border-blue-400 shadow-md',
      text: 'text-gray-900',
      badge: 'clean-tag bg-blue-100 text-blue-900 border-blue-200',
      accent: 'bg-blue-600',
    },
  };

  const levelIcons = {
    beginner: '🌱',
    intermediate: '🔧',
    expert: '🎯',
  };

  const abstractionColors = {
    LOW: { badge: 'bg-gray-50 text-gray-600 border-gray-200' },
    MEDIUM: { badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    HIGH: { badge: 'bg-blue-100 text-blue-900 border-blue-300' },
  };

  const strategyColors = {
    direct_application: 'bg-white text-gray-700 border border-gray-200',
    rule_based: 'bg-gray-50 text-gray-800 border border-gray-200',
    transformation: 'bg-blue-50 text-blue-800 border border-blue-100',
    reduction: 'bg-blue-100 text-blue-900 border border-blue-200',
    optimization: 'bg-blue-200 text-blue-900 border border-blue-300',
  };

  const severityConfig = {
    info: { card: 'bg-gray-50 border border-gray-200', text: 'text-gray-800', icon: 'ℹ️' },
    warning: { card: 'bg-orange-50 border border-orange-200', text: 'text-orange-800', icon: '⚠️' },
    critical: { card: 'bg-red-50 border border-red-200', text: 'text-red-800', icon: '🔴' },
  };

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto">
      {/* Validation Notes */}
      {!validation_passed && validation_notes.length > 0 && (
        <div className="clean-card bg-orange-50 border-orange-200 p-6 sm:p-8">
          <h4 className="text-lg font-display font-bold text-orange-900 mb-3 flex items-center gap-2">
            <span>⚠️</span> Validation Notes
          </h4>
          <div className="space-y-2">
            {validation_notes.map((note, i) => (
              <p key={i} className="text-sm font-body font-medium text-orange-800 bg-white p-3 rounded-xl border border-orange-100">{note}</p>
            ))}
          </div>
        </div>
      )}

      {/* Cognitive Profiles with Constraint Rules */}
      {cognitive_profiles.length > 0 && (
        <div className="clean-card p-6 sm:p-8">
          <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl border border-blue-100">🧠</span>
            Cognitive Profiles
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {cognitive_profiles.map((profile, i) => {
              const colors = levelColors[profile.level] || levelColors.beginner;
              const icon = levelIcons[profile.level] || '📝';
              return (
                <div key={i} className={`p-6 rounded-2xl ${colors.card}`}>
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="text-2xl mr-1">{icon}</span>
                    <span className={colors.badge}>
                      {profile.level.charAt(0).toUpperCase() + profile.level.slice(1)}
                    </span>
                    <span className={`clean-tag ${abstractionColors[profile.max_abstraction]?.badge || abstractionColors.LOW.badge}`}>
                      Max: {profile.max_abstraction}
                    </span>
                  </div>
                  <p className={`text-sm font-body font-medium mb-4 ${colors.text}`}>{profile.description}</p>
                  
                  {profile.allowed_operations && profile.allowed_operations.length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs font-display font-bold uppercase tracking-wider text-gray-500 mb-1 block">Allowed</span>
                      <div className="flex flex-wrap gap-2">
                        {profile.allowed_operations.map((op, j) => (
                          <span key={j} className="text-xs font-semibold px-2 py-1 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg">
                            {op.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.forbidden_operations && profile.forbidden_operations.length > 0 && (
                    <div>
                      <span className="text-xs font-display font-bold uppercase tracking-wider text-gray-500 mb-1 block">Forbidden</span>
                      <div className="flex flex-wrap gap-2">
                        {profile.forbidden_operations.map((op, j) => (
                          <span key={j} className="text-xs font-semibold px-2 py-1 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                            {op.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reasoning Graphs */}
      {reasoning_graphs.length > 0 && (
        <div className="clean-card p-6 sm:p-8 bg-gray-50">
          <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl border border-blue-100">🔀</span>
            Reasoning Graphs
          </h3>
          <div className="space-y-8">
            {reasoning_graphs.map((graph, i) => {
              const colors = levelColors[graph.level] || levelColors.beginner;
              const icon = levelIcons[graph.level] || '📝';
              const nodes = graph.nodes || [];
              const edges = graph.edges || [];
              const decisions = graph.decisions || [];
              const absMetrics = graph.abstraction_metrics || {};
              
              return (
                <div key={i} className={`p-6 sm:p-8 rounded-2xl ${colors.card} transition-colors hover:border-blue-300`}>
                  <div className="flex items-center gap-3 mb-6 flex-wrap bg-white p-4 rounded-xl border border-gray-100">
                    <span className="text-3xl">{icon}</span>
                    <span className={colors.badge}>
                      {graph.level.charAt(0).toUpperCase() + graph.level.slice(1)} Flow
                    </span>
                    <span className="clean-tag bg-gray-50 border-gray-200 text-gray-600">
                      {nodes.length} nodes · {edges.length} edges
                    </span>
                    {absMetrics.max_abstraction && (
                      <span className={`clean-tag ${abstractionColors[absMetrics.max_abstraction]?.badge || abstractionColors.LOW.badge}`}>
                        Max Abs: {absMetrics.max_abstraction}
                      </span>
                    )}
                  </div>

                  {/* Nodes Flow */}
                  <div className="space-y-3 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gray-200">
                    {nodes.map((node, j) => {
                      const absColor = abstractionColors[node.abstraction_level] || abstractionColors.LOW;
                      const stratColor = strategyColors[node.strategy_type] || 'bg-gray-50 text-gray-700 border border-gray-200';
                      const isDecision = decisions.some(d => d.from_step_id === node.step_id);
                      
                      return (
                        <div key={j} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white border-2 border-gray-200 shadow-sm absolute left-0 md:left-1/2 -ml-6 md:-ml-6 shrink-0 text-lg font-bold text-gray-500 transition-colors group-hover:border-blue-400 group-hover:text-blue-500">
                            {j + 1}
                          </div>
                          
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] ml-16 md:ml-0">
                            <div className={`p-5 rounded-2xl bg-white border ${isDecision ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'} shadow-sm transition-shadow hover:shadow-md`}>
                              <div className="flex flex-col gap-2">
                                <h4 className="text-lg font-display font-bold text-gray-900">
                                  {node.operation_type.replace(/_/g, ' ')}
                                </h4>
                                
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <span className={`clean-tag ${absColor.badge}`}>
                                    {node.abstraction_level}
                                  </span>
                                  <span className={`clean-tag ${stratColor}`}>
                                    {node.strategy_type.replace(/_/g, ' ')}
                                  </span>
                                  {node.concept_used && (
                                    <span className="clean-tag bg-gray-50 text-gray-600 border-gray-200">
                                      {node.concept_used}
                                    </span>
                                  )}
                                </div>
                                
                                {(node.input_value || node.output_value) && (
                                  <div className="bg-gray-50 rounded-xl p-3 text-sm border border-gray-100 space-y-1 my-1">
                                    {node.input_value && <div className="text-gray-600"><span className="font-display font-bold text-gray-400 uppercase tracking-wider text-xs mr-2">IN</span><span className="font-medium text-gray-800">{node.input_value}</span></div>}
                                    {node.output_value && <div className="text-gray-600"><span className="font-display font-bold text-gray-400 uppercase tracking-wider text-xs mr-2">OUT</span><span className="font-medium text-gray-800">{node.output_value}</span></div>}
                                  </div>
                                )}
                                
                                {node.reasoning && (
                                  <p className="text-sm font-body text-gray-600 italic leading-relaxed">{node.reasoning}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Decisions Layer */}
                  {decisions.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h5 className="text-sm font-display font-bold uppercase tracking-wider text-gray-500 mb-4 ml-2">Decision Points</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {decisions.map((d, j) => (
                          <div key={j} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
                            <span className="font-display font-bold text-gray-800 block mb-2">{d.decision_point}</span>
                            {d.alternatives_considered && d.alternatives_considered.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {d.alternatives_considered.map((alt, aidx) => (
                                  <span key={aidx} className="text-xs font-semibold bg-gray-50 text-gray-500 px-2 py-1 rounded-lg border border-gray-100">vs {alt}</span>
                                ))}
                              </div>
                            )}
                            {d.chosen_path_reason && (
                              <p className="text-sm font-body text-blue-700 font-medium bg-blue-50 border border-blue-100 p-2 rounded-lg">↳ {d.chosen_path_reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strategy Distributions */}
      {strategy_distributions.length > 0 && (
        <div className="clean-card p-6 sm:p-8">
          <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl border border-blue-100">📊</span>
            Strategy Distributions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {strategy_distributions.map((dist, i) => {
              const colors = levelColors[dist.level] || levelColors.beginner;
              const bars = [
                { label: 'Direct', pct: dist.direct_application_pct || 0, color: 'bg-gray-300' },
                { label: 'Rule-based', pct: dist.rule_based_pct || 0, color: 'bg-gray-400' },
                { label: 'Transform', pct: dist.transformation_pct || 0, color: 'bg-blue-300' },
                { label: 'Reduction', pct: dist.reduction_pct || 0, color: 'bg-blue-400' },
                { label: 'Optimize', pct: dist.optimization_pct || 0, color: 'bg-blue-500' },
              ].filter(b => b.pct > 0);
              return (
                <div key={i} className={`p-6 rounded-2xl ${colors.card}`}>
                  <span className={`text-lg font-display font-bold ${colors.text} block mb-4`}>
                    {dist.level.charAt(0).toUpperCase() + dist.level.slice(1)}
                  </span>
                  <div className="space-y-4">
                    {bars.map((bar, j) => (
                      <div key={j} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-gray-600 font-medium">{bar.label}</span>
                           <span className="font-bold text-gray-900 text-right">{bar.pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 border border-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${bar.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {dist.strategies_used && dist.strategies_used.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                      {dist.strategies_used.map((tag, j) => (
                        <span key={j} className={`clean-tag ${strategyColors[tag] || 'bg-gray-100 text-gray-700'}`}>
                          {tag.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Structural Comparison */}
      {structural_comparison && Object.keys(structural_comparison).length > 0 && (
        <div className="clean-card p-6 sm:p-8 bg-gray-50">
          <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl border border-blue-100">🔬</span>
            Structural Comparison
          </h3>

          <div className="space-y-8">
            {/* Graph Shape */}
            {structural_comparison.graph_shape && (
              <div>
                <h4 className="text-sm font-display font-bold uppercase tracking-wider text-gray-500 mb-4 ml-2">Graph Shape</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(structural_comparison.graph_shape).map(([level, data]) => {
                    const colors = levelColors[level] || levelColors.beginner;
                    return (
                      <div key={level} className={`p-5 rounded-2xl ${colors.card}`}>
                        <span className={`text-base font-display font-bold ${colors.text} block mb-3`}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-sm font-medium">
                          <div className="bg-white border border-gray-100 p-2 rounded-xl text-center">
                            <span className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Nodes</span>
                            <span className="text-lg font-bold text-gray-800">{data.node_count}</span>
                          </div>
                          <div className="bg-white border border-gray-100 p-2 rounded-xl text-center">
                            <span className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Edges</span>
                            <span className="text-lg font-bold text-gray-800">{data.edge_count}</span>
                          </div>
                          <div className="bg-white border border-gray-100 p-2 rounded-xl text-center">
                            <span className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Depth</span>
                            <span className="text-lg font-bold text-gray-800">{data.depth}</span>
                          </div>
                          <div className="bg-white border border-gray-100 p-2 rounded-xl text-center flex flex-col items-center justify-center">
                            <span className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Shape</span>
                            <span className="text-sm font-bold text-gray-800">{data.is_linear ? 'Linear' : 'Branched'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Abstraction Flow */}
            {structural_comparison.abstraction_flow && (
              <div className="pt-8 border-t border-gray-200">
                <h4 className="text-sm font-display font-bold uppercase tracking-wider text-gray-500 mb-4 ml-2">Abstraction Flow</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(structural_comparison.abstraction_flow).map(([level, data]) => {
                    const colors = levelColors[level] || levelColors.beginner;
                    const flow = data.flow || [];
                    return (
                      <div key={level} className={`p-5 rounded-2xl ${colors.card}`}>
                        <span className={`text-base font-display font-bold ${colors.text} block mb-3`}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </span>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-white border border-gray-100 px-3 py-2 rounded-xl flex items-center gap-2">
                             <span className="text-xs uppercase tracking-wider text-gray-500">Avg</span>
                             <span className="font-bold text-gray-800">{data.average_abstraction}</span>
                          </div>
                          <div className="bg-white border border-gray-100 px-3 py-2 rounded-xl flex items-center gap-2">
                             <span className="text-xs uppercase tracking-wider text-gray-500">Max</span>
                             <span className={`clean-tag ${(abstractionColors[data.max_abstraction] || abstractionColors.LOW).badge}`}>
                               {data.max_abstraction}
                             </span>
                          </div>
                        </div>
                        {flow.length > 0 && (
                          <div className="bg-white border border-gray-100 p-3 rounded-xl flex flex-col gap-1.5 font-bold text-xs uppercase tracking-wider text-gray-600">
                             Flow Sequence:
                             <div className="flex gap-1.5 flex-wrap">
                              {flow.map((lvl, k) => (
                                <span key={k} className={`clean-tag ${(abstractionColors[lvl] || abstractionColors.LOW).badge}`}>
                                  {lvl}
                                </span>
                              ))}
                             </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gap Analysis */}
      {gap_analysis.length > 0 && (
        <div className="clean-card p-6 sm:p-8 bg-gray-50">
          <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl border border-blue-100">🔍</span>
            Structural Gap Analysis
          </h3>
          <div className="space-y-4">
             {gap_analysis.map((gap, i) => {
               const config = severityConfig[gap.severity] || severityConfig.info;
               return (
                 <div key={i} className={`p-5 flex items-start gap-4 rounded-xl ${config.card}`}>
                   <span className="text-2xl mt-1 drop-shadow-sm">{config.icon}</span>
                   <div>
                     <p className={`text-base font-body font-medium ${config.text} leading-relaxed`}>{gap.insight}</p>
                     {gap.source && (
                       <span className={`inline-block mt-2 clean-tag bg-white border border-gray-200 ${config.text}`}>
                         Source: {gap.source}
                       </span>
                     )}
                   </div>
                 </div>
               );
             })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ThinkingSimulationResults;
