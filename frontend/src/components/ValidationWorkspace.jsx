import { useState } from 'react';
import { processInput } from '../api';

function ValidationWorkspace({ onResults }) {
  const [inputText, setInputText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!inputText.trim()) {
      setError('Please enter text to validate.');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const result = await processInput(inputText);
      onResults(result);
    } catch (err) {
      setError(err.message || 'Validation failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="clean-card p-6 sm:p-8 w-full">
      <h2 className="text-xl font-display font-bold text-[var(--color-brand-text)] mb-2">Validation Workspace</h2>
      <p className="text-sm font-body text-[var(--color-brand-text-muted)] mb-6 font-medium">
        Enter an answer, summary, or explanation to validate against your uploaded documents.
      </p>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter your answer, summary, or concept explanation here..."
        rows={6}
        className="clean-input resize-y"
        disabled={processing}
      />

      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100 text-sm font-medium text-red-800 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={processing || !inputText.trim()}
          className="clean-btn-primary"
        >
          {processing ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Validating...
            </>
          ) : (
            'Validate'
          )}
        </button>
      </div>
    </div>
  );
}

export default ValidationWorkspace;
