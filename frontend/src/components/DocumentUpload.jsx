import { useState, useEffect } from 'react';
import { uploadDocument, getDocuments } from '../api';

function DocumentUpload() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const data = await getDocuments();
      setDocuments(data.documents || []);
    } catch {
      // Silently handle - documents may not be available yet
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const result = await uploadDocument(file);
      setSuccess(result.message || 'Document uploaded successfully.');
      fetchDocuments();
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'ready': return 'bg-green-50 text-green-800 border-green-200';
      case 'processing': return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'failed': return 'bg-red-50 text-red-800 border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto">
      <div className="clean-card p-6 sm:p-10">
        <div className="flex items-center gap-4 mb-4">
           <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-3xl border border-gray-200">
             📄
           </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900 tracking-wide mb-1">Upload Documents</h2>
            <p className="text-base font-body font-medium text-gray-600">
              Upload PDF or text files to build your knowledge base for validation.
            </p>
          </div>
        </div>

        <label className="block mt-8">
          <div className={`clean-card p-12 text-center cursor-pointer transition-colors group border-2 border-dashed ${
            uploading ? 'bg-gray-50 border-gray-300' : 'bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400'
          }`}>
            {uploading ? (
              <div className="text-gray-600 flex flex-col items-center">
                <div className="mb-4">
                   <svg className="animate-spin h-8 w-8 text-gray-500" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                   </svg>
                </div>
                <span className="text-lg font-display font-bold tracking-wide">Processing document...</span>
              </div>
            ) : (
              <div className="text-gray-500 group-hover:text-gray-700 transition-colors flex flex-col items-center">
                 <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 mb-4 transition-colors group-hover:bg-white group-hover:border-gray-300">
                    <svg className="h-8 w-8 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                 </div>
                <span className="text-lg font-display font-bold tracking-wide text-gray-800">Drop file here or click to browse</span>
                <span className="text-sm font-body font-medium text-gray-500 mt-2 lowercase">Supports PDF and TXT</span>
              </div>
            )}
          </div>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {error && (
          <div className="mt-6 bg-red-50 rounded-xl border border-red-200 p-4 text-sm font-medium text-red-800 flex items-center gap-3">
             <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="font-display font-bold">{error}</p>
          </div>
        )}
        {success && (
          <div className="mt-6 bg-green-50 rounded-xl border border-green-200 p-4 text-sm font-medium text-green-800 flex items-center gap-3">
             <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <p className="font-display font-bold">{success}</p>
          </div>
        )}
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="clean-card p-6 sm:p-8 bg-gray-50">
          <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center text-xl border border-gray-300">📚</span>
            Uploaded Documents
          </h3>
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.document_id} className="clean-card bg-white p-3 pr-4 flex justify-between items-center transition-colors hover:border-gray-300">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-200">
                    <span className="text-lg">📁</span>
                  </div>
                  <div>
                    <p className="text-sm font-display font-bold text-gray-900">{doc.file_name}</p>
                    <p className="text-xs font-body font-medium text-gray-500 mt-0.5">{doc.page_count || 0} pages</p>
                  </div>
                </div>
                <span className={`clean-tag ${statusColor(doc.status)}`}>
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentUpload;
