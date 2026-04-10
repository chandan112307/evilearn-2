import { useState } from 'react';
import { submitFeedback, editClaim } from '../api';
import EvidenceViewer from './EvidenceViewer';

function ClaimCard({ claim, index, sessionId }) {
  const [feedback, setFeedback] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(claim.claim_text);
  const [showEvidence, setShowEvidence] = useState(false);
  const [error, setError] = useState('');

  const statusConfig = {
    supported: {
      color: 'clay-card-success',
      badge: 'clay-pill text-emerald-800 bg-white/60',
      icon: '✓',
      label: 'Supported',
    },
    weakly_supported: {
      color: 'clay-card-warning',
      badge: 'clay-pill text-amber-800 bg-white/60',
      icon: '~',
      label: 'Weakly Supported',
    },
    unsupported: {
      color: 'clay-card-error',
      badge: 'clay-pill text-red-800 bg-white/60',
      icon: '✗',
      label: 'Unsupported',
    },
  };

  const config = statusConfig[claim.status] || statusConfig.unsupported;

  const handleFeedback = async (decision) => {
    try {
      await submitFeedback(claim.claim_id, sessionId, decision);
      setFeedback(decision);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    try {
      await editClaim(claim.claim_id, sessionId, editText);
      setEditing(false);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const confidencePercent = Math.round(claim.confidence_score * 100);

  return (
    <div className={`p-6 ${config.color}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-display font-bold text-gray-400 uppercase tracking-widest">Claim {index}</span>
          <span className={config.badge}>
            <span className="text-base font-bold">{config.icon}</span> {config.label}
          </span>
        </div>
        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-2xl px-3 py-1.5 clay-card shadow-none">
          <div className="text-right">
            <div className="text-xs font-display font-semibold uppercase tracking-wider text-gray-500">Confidence</div>
            <div className="text-lg font-display font-bold text-gray-800">{confidencePercent}%</div>
          </div>
          <div className="w-12 h-12 relative flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90 absolute" viewBox="0 0 36 36">
              <path
                className="text-white drop-shadow-sm"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className={claim.status === 'supported' ? 'text-emerald-400' : claim.status === 'weakly_supported' ? 'text-amber-400' : 'text-red-400'}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${confidencePercent}, 100`}
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Claim Text */}
      {editing ? (
        <div className="mb-4">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="clay-input resize-y mb-3"
          />
          <div className="flex gap-3">
            <button onClick={handleEdit} className="clay-btn-primary py-2 px-4 text-sm">
              Re-validate
            </button>
            <button onClick={() => setEditing(false)} className="clay-btn py-2 px-4 text-sm text-gray-600">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-lg font-body font-medium text-gray-800 mb-4 bg-white/40 p-4 rounded-2xl">{claim.claim_text}</p>
      )}

      {/* Explanation */}
      {claim.explanation && (
        <div className="clay-card shadow-inner border-0 bg-white/60 p-4 mb-4">
          <p className="text-xs font-display font-bold uppercase tracking-wider text-gray-500 mb-2">Explanation</p>
          <p className="text-base font-body text-gray-700">{claim.explanation}</p>
        </div>
      )}

      {/* Evidence Toggle */}
      {claim.evidence && claim.evidence.length > 0 && (
        <button
          onClick={() => setShowEvidence(!showEvidence)}
          className="clay-pill bg-white text-blue-600 hover:text-blue-800 transition-colors mb-4 group"
        >
          {showEvidence ? 'Hide Evidence' : `View Evidence (${claim.evidence.length})`}
          <svg className={`w-4 h-4 transition-transform ${showEvidence ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {showEvidence && <EvidenceViewer evidence={claim.evidence} />}

      {/* Actions */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t-2 border-white/50">
        {feedback ? (
          <span className={`clay-pill ${feedback === 'accept' ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
            {feedback === 'accept' ? '✓ Accepted' : '✗ Rejected'}
          </span>
        ) : (
          <>
            <button
              onClick={() => handleFeedback('accept')}
              className="clay-btn py-2 px-4 text-sm text-emerald-700 hover:bg-emerald-50"
            >
              Accept
            </button>
            <button
              onClick={() => handleFeedback('reject')}
              className="clay-btn py-2 px-4 text-sm text-red-700 hover:bg-red-50"
            >
              Reject
            </button>
          </>
        )}
        <button
          onClick={() => setEditing(true)}
          className="clay-btn py-2 px-4 text-sm text-gray-700 ml-auto"
        >
          Edit
        </button>
      </div>

      {error && (
        <div className="mt-3 clay-card-error p-3 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}
    </div>
  );
}

export default ClaimCard;
