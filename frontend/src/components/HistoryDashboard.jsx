import { useState, useEffect } from 'react';
import { getHistory } from '../api';

function HistoryDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getHistory();
      setSessions(data.sessions || []);
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
    const colors = {
      supported: 'bg-green-50 text-green-800 border-green-200',
      weakly_supported: 'bg-orange-50 text-orange-800 border-orange-200',
      unsupported: 'bg-red-50 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto clean-card p-12 text-center flex flex-col items-center justify-center">
        <div className="mb-4">
            <svg className="animate-spin h-8 w-8 text-gray-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
        </div>
        <p className="font-display font-bold text-gray-600 text-lg tracking-wide">Loading history...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto clean-card p-12 text-center bg-gray-50">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-200 text-4xl shadow-sm">
           🕰️
        </div>
        <p className="text-xl font-display font-bold text-gray-900 tracking-wide">No validation history yet.</p>
        <p className="text-base font-body text-gray-500 mt-2 font-medium">Submit text for validation to start building your history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto">
      <div className="clean-card p-6 sm:p-10">
        <div className="flex items-center gap-4 mb-8">
           <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-3xl border border-gray-200">
             🕰️
           </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900 tracking-wide mb-1">Validation History</h2>
            <p className="text-base font-body font-medium text-gray-600">
              Review past validations and their detailed analysis results.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {sessions.map((session) => {
            const isSelected = selectedSession === session.session_id;
            const results = session.results || [];
            const supported = results.filter((r) => r.status === 'supported').length;
            const weak = results.filter((r) => r.status === 'weakly_supported').length;
            const unsupported = results.filter((r) => r.status === 'unsupported').length;

            return (
              <div key={session.session_id} className={`clean-card bg-white transition-colors overflow-hidden ${isSelected ? 'border-gray-400' : 'hover:border-gray-300'}`}>
                <button
                  onClick={() => setSelectedSession(isSelected ? null : session.session_id)}
                  className={`w-full p-4 sm:p-5 text-left transition-colors duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-lg font-display font-bold text-gray-900 truncate mb-1.5">
                      {session.input_text}
                    </p>
                    <div className="flex items-center gap-2">
                       <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-md text-xs font-display font-bold uppercase tracking-wider text-gray-600">
                         {new Date(session.created_at).toLocaleString()}
                       </span>
                       <span className="text-xs font-display font-bold uppercase tracking-wider text-gray-500">
                         · {results.length} claims
                       </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:ml-4 shrink-0">
                    {supported > 0 && (
                      <span className="px-3 py-1 text-sm font-display font-bold rounded-lg bg-green-50 text-green-700 flex items-center gap-1 border border-green-200">
                        <span>{supported}</span> <span className="text-green-600">✓</span>
                      </span>
                    )}
                    {weak > 0 && (
                      <span className="px-3 py-1 text-sm font-display font-bold rounded-lg bg-orange-50 text-orange-700 flex items-center gap-1 border border-orange-200">
                        <span>{weak}</span> <span className="text-orange-500">~</span>
                      </span>
                    )}
                    {unsupported > 0 && (
                      <span className="px-3 py-1 text-sm font-display font-bold rounded-lg bg-red-50 text-red-700 flex items-center gap-1 border border-red-200">
                        <span>{unsupported}</span> <span className="text-red-600">✗</span>
                      </span>
                    )}
                  </div>
                </button>

                {isSelected && results.length > 0 && (
                  <div className="p-4 sm:p-5 bg-white border-t border-gray-100 space-y-4">
                    {results.map((result, i) => (
                      <div key={i} className="clean-card p-5 bg-gray-50 flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-1">
                          <p className="text-base font-body font-medium text-gray-800 flex-1 leading-relaxed">{result.claim_text}</p>
                          <span className={`clean-tag shrink-0 ${statusBadge(result.status)}`}>
                            {result.status?.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-display font-bold uppercase tracking-wider text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-md">
                              Confidence: {Math.round((result.confidence_score || 0) * 100)}%
                            </span>
                        </div>
                        {result.explanation && (
                          <p className="text-sm font-body text-gray-600 bg-white border border-gray-200 p-3 rounded-lg italic mt-2">{result.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HistoryDashboard;
