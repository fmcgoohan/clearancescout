import React, { useState, useRef } from 'react';
import { apiFetch } from '../utils/apiClient.js';

interface ScriptUploadModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const ScriptUploadModal: React.FC<ScriptUploadModalProps> = ({
  projectId,
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'FILE' | 'PASTE'>('FILE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [pastedFormat, setPastedFormat] = useState<'FOUNTAIN' | 'PLAINTEXT'>('FOUNTAIN');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setErrorCode(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['fountain', 'txt', 'text', 'pdf'];
    if (!ext || !validExtensions.includes(ext)) {
      setErrorMessage(`Unsupported file format '.${ext}'. Supported formats: .fountain, .txt, .pdf`);
      setErrorCode('UNSUPPORTED_FORMAT');
      setSelectedFile(null);
      return;
    }
    if (file.size === 0) {
      setErrorMessage('The selected file is empty (0 bytes).');
      setErrorCode('EMPTY_FILE');
      setSelectedFile(null);
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('The selected file exceeds the 25MB maximum limit.');
      setErrorCode('FILE_TOO_LARGE');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setErrorMessage(null);
    setErrorCode(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setErrorCode(null);
    setIsUploading(true);
    setUploadProgress(25);

    try {
      let res: Response;

      if (activeTab === 'FILE') {
        if (!selectedFile) {
          setErrorMessage('Please select a screenplay file to upload.');
          setIsUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        setUploadProgress(50);
        res = await apiFetch(`/api/projects/${projectId}/script/upload`, {
          method: 'POST',
          body: formData,
        });
      } else {
        if (!pastedText.trim()) {
          setErrorMessage('Please enter or paste screenplay text.');
          setErrorCode('EMPTY_FILE');
          setIsUploading(false);
          return;
        }

        setUploadProgress(50);
        res = await apiFetch(`/api/projects/${projectId}/script/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scriptText: pastedText,
            format: pastedFormat,
            filename: `pasted_screenplay.${pastedFormat === 'FOUNTAIN' ? 'fountain' : 'txt'}`,
          }),
        });
      }

      setUploadProgress(85);
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to upload and parse screenplay.');
        setErrorCode(data.code || 'UPLOAD_FAILED');
        setIsUploading(false);
        return;
      }

      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        onUploadSuccess();
        onClose();
      }, 400);
    } catch (err: any) {
      console.error('Screenplay upload error:', err);
      setErrorMessage(err.message || 'Network error during upload.');
      setErrorCode('NETWORK_ERROR');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Upload Screenplay Draft</h3>
              <p className="text-xs text-slate-400">Ingest real .fountain, .txt, or text-based .pdf scripts (up to 25MB)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-3 space-x-6">
          <button
            onClick={() => { setActiveTab('FILE'); setErrorMessage(null); }}
            className={`pb-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'FILE'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Upload File (.fountain, .txt, .pdf)
          </button>
          <button
            onClick={() => { setActiveTab('PASTE'); setErrorMessage(null); }}
            className={`pb-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'PASTE'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Paste Screenplay Text
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg flex items-start space-x-3 text-red-200 text-xs">
              <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span className="font-semibold">{errorCode ? `[${errorCode}] ` : ''}</span>
                {errorMessage}
              </div>
            </div>
          )}

          {activeTab === 'FILE' ? (
            <div>
              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-950/20'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".fountain,.txt,.text,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-slate-100">{selectedFile.name}</div>
                    <div className="text-xs text-slate-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Click to change file
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-slate-200">
                      Drag and drop screenplay file here, or <span className="text-indigo-400 underline">browse</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Supports .fountain, .txt, and text-based .pdf up to 25MB
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">Format</label>
                <div className="flex space-x-2">
                  {(['FOUNTAIN', 'PLAINTEXT'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setPastedFormat(fmt)}
                      className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                        pastedFormat === fmt
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste screenplay text with standard scene headings (INT. / EXT.)..."
                className="w-full h-48 bg-slate-950/80 border border-slate-700 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Upload & Parsing Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Parsing Scenes & Extracting Clearance IP...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isUploading || (activeTab === 'FILE' && !selectedFile) || (activeTab === 'PASTE' && !pastedText.trim())}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors flex items-center space-x-2"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing Screenplay...</span>
              </>
            ) : (
              <span>Upload & Ingest Draft</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
