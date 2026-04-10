function EvidenceViewer({ evidence }) {
  if (!evidence || evidence.length === 0) {
    return (
      <div className="clay-card p-4 text-center text-sm font-medium text-gray-500 mb-4 bg-gray-50">No evidence available.</div>
    );
  }

  return (
    <div className="space-y-3 mb-4">
      {evidence.map((item, i) => (
        <div key={i} className="clay-card shadow-inner border-0 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-display font-bold uppercase tracking-wider text-blue-700">
              Page {item.page_number}
            </span>
          </div>
          <p className="text-sm font-body text-gray-700 leading-relaxed">{item.snippet}</p>
        </div>
      ))}
    </div>
  );
}

export default EvidenceViewer;
