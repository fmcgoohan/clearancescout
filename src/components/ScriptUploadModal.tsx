import React, { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../utils/apiClient.js';

interface ScriptUploadModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (snapshot?: any) => void;
}

export type UploadPhase = 'IDLE' | 'UPLOADING' | 'PARSING' | 'EXTRACTING' | 'RECONCILING' | 'COMPLETE' | 'FAILED';

export const UPLOAD_TIMEOUT_MS = 270000;

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
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('IDLE');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanupTimers = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupTimers();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
    const origLower = file.name.toLowerCase();
    const isFountain = origLower.endsWith('.fountain') || origLower.includes('.fountain.') || origLower.endsWith('.fountain.txt');
    const isTxt = origLower.endsWith('.txt') || origLower.endsWith('.text');
    const isPdf = origLower.endsWith('.pdf');

    if (!isFountain && !isTxt && !isPdf) {
      setErrorMessage(`Unsupported file format '${file.name}'. Supported formats: .fountain, .txt, .pdf`);
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

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    cleanupTimers();
    setIsUploading(false);
    setUploadPhase('IDLE');
    setErrorMessage('Upload cancelled by user.');
    setErrorCode('CANCELLED');
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setErrorCode(null);
    setIsUploading(true);
    setUploadPhase('UPLOADING');
    setElapsedSeconds(0);
    setUploadProgress(15);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Start live elapsed timer
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Steady, honest progress interpolation (advances steadily up to 75% without fake 90% stalls)
    progressIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev < 30) return prev + 5;
        if (prev < 55) return prev + 2;
        if (prev < 75) return prev + 1;
        return prev;
      });
    }, 1500);

    // Sequential phase simulation during request
    setTimeout(() => {
      setUploadPhase((current) => (current === 'UPLOADING' ? 'PARSING' : current));
    }, 1200);

    setTimeout(() => {
      setUploadPhase((current) => (current === 'PARSING' ? 'EXTRACTING' : current));
    }, 3000);

    // Enforce 270-second client-side timeout aligned with Cloud Run 300s
    timeoutIdRef.current = setTimeout(() => {
      if (abortControllerRef.current === controller) {
        controller.abort();
        cleanupTimers();
        setIsUploading(false);
        setUploadPhase('FAILED');
        setErrorCode('TIMEOUT_ERROR');
        setErrorMessage(
          'Screenplay upload and parsing timed out after 4.5 minutes. The script may be unusually large or the AI parsing model is experiencing high demand. Please try again.'
        );
      }
    }, UPLOAD_TIMEOUT_MS);

    try {
      let res: Response;

      if (activeTab === 'FILE') {
        if (!selectedFile) {
          cleanupTimers();
          setErrorMessage('Please select a screenplay file to upload.');
          setIsUploading(false);
          setUploadPhase('IDLE');
          return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        res = await apiFetch(`/api/projects/${projectId}/script/upload`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
      } else {
        if (!pastedText.trim()) {
          cleanupTimers();
          setErrorMessage('Please enter or paste screenplay text.');
          setErrorCode('EMPTY_FILE');
          setIsUploading(false);
          setUploadPhase('IDLE');
          return;
        }

        res = await apiFetch(`/api/projects/${projectId}/script/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scriptText: pastedText,
            format: pastedFormat,
            filename: `pasted_screenplay.${pastedFormat === 'FOUNTAIN' ? 'fountain' : 'txt'}`,
          }),
          signal: controller.signal,
        });
      }

      cleanupTimers();

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Server returned HTTP ${res.status}: ${res.statusText}` };
      }

      if (!res.ok) {
        const code = data.code || (res.status === 401 ? 'UNAUTHORIZED' : res.status === 413 ? 'FILE_TOO_LARGE' : 'PARSING_FAILED');
        setErrorMessage(data.error || `Upload failed (HTTP ${res.status}).`);
        setErrorCode(code);
        setIsUploading(false);
        setUploadPhase('FAILED');
        return;
      }

      setUploadPhase('COMPLETE');
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadPhase('IDLE');
        onUploadSuccess(data.snapshot || data);
        onClose();
      }, 400);
    } catch (err: any) {
      cleanupTimers();
      if (err.name === 'AbortError') {
        if (!errorCode) {
          setErrorCode('TIMEOUT_ERROR');
          setErrorMessage('Upload timed out or was cancelled.');
        }
      } else {
        console.error('Screenplay upload error:', err);
        setErrorMessage(err.message || 'Network error during upload.');
        setErrorCode('NETWORK_ERROR');
      }
      setIsUploading(false);
      setUploadPhase('FAILED');
    }
  };

  const getPhaseDescription = () => {
    switch (uploadPhase) {
      case 'UPLOADING':
        return `📤 Receiving screenplay payload (${elapsedSeconds}s)...`;
      case 'PARSING':
        return `📄 Segmenting scenes and sluglines (${elapsedSeconds}s)...`;
      case 'EXTRACTING':
        return `🔍 Identifying candidate clearance entities (${elapsedSeconds}s)...`;
      case 'RECONCILING':
        return `💾 Persisting canonical registry snapshot (${elapsedSeconds}s)...`;
      case 'COMPLETE':
        return `✓ Screenplay ingestion complete (${elapsedSeconds}s)!`;
      case 'FAILED':
        return `⚠️ Ingestion failed`;
      default:
        return 'Ready to ingest screenplay';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1400,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) onClose();
      }}
    >
      <div
        className="glass-panel modal-responsive"
        style={{
          width: '640px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
              }}
            >
              📄
            </div>
            <div>
              <h3 id="upload-modal-title" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Upload Screenplay Draft
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Ingest real .fountain, .txt, or text-based .pdf scripts (up to 25MB)
              </p>
            </div>
          </div>
          <button
            onClick={isUploading ? handleCancelUpload : onClose}
            aria-label="Close upload dialog"
            className="btn-secondary touch-target"
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(0, 0, 0, 0.15)',
            padding: '0 24px',
            gap: '24px',
          }}
        >
          <button
            type="button"
            disabled={isUploading}
            onClick={() => { setActiveTab('FILE'); setErrorMessage(null); }}
            style={{
              padding: '12px 4px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'FILE' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              color: activeTab === 'FILE' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            📁 Upload File (.fountain, .txt, .pdf)
          </button>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => { setActiveTab('PASTE'); setErrorMessage(null); }}
            style={{
              padding: '12px 4px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'PASTE' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              color: activeTab === 'PASTE' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            ✍️ Paste Screenplay Text
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              style={{
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>⚠️</span>
                <div>
                  <strong style={{ display: 'inline-block', marginRight: '4px' }}>
                    {errorCode ? `[${errorCode}] ` : ''}
                  </strong>
                  {errorMessage}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: '24px' }}>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn-secondary touch-target"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.5)', color: '#fff' }}
                >
                  ↻ Retry Ingestion
                </button>
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
                onClick={() => !isUploading && fileInputRef.current?.click()}
                style={{
                  border: isDragging
                    ? '2px dashed var(--accent-cyan)'
                    : selectedFile
                    ? '2px solid rgba(52, 211, 153, 0.6)'
                    : '2px dashed var(--border-color)',
                  backgroundColor: isDragging
                    ? 'rgba(6, 182, 212, 0.1)'
                    : selectedFile
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '12px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isUploading ? 0.7 : 1,
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".fountain,.txt,.text,.pdf"
                  disabled={isUploading}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {selectedFile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'rgba(52, 211, 153, 0.2)',
                        border: '1px solid rgba(52, 211, 153, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem',
                        color: 'var(--status-no-issue)',
                      }}
                    >
                      ✓
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB • {isUploading ? 'Ingesting...' : 'Click or drop another file to change'}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem',
                      }}
                    >
                      📁
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)' }}>
                      Drag & drop screenplay file here, or <span style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>browse</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Supports .fountain, .txt, and text-based .pdf up to 25MB
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Screenplay Format
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['FOUNTAIN', 'PLAINTEXT'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      disabled={isUploading}
                      onClick={() => setPastedFormat(fmt)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: pastedFormat === fmt ? 'var(--accent-cyan)' : 'var(--border-color)',
                        background: pastedFormat === fmt ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        color: pastedFormat === fmt ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={pastedText}
                disabled={isUploading}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste screenplay text with standard scene headings (INT. / EXT.)..."
                style={{
                  width: '100%',
                  height: '200px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  color: 'var(--text-main)',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  opacity: isUploading ? 0.7 : 1,
                }}
              />
            </div>
          )}

          {/* Upload & Parsing Progress Bar */}
          {isUploading && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {getPhaseDescription()}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{uploadProgress}%</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${uploadProgress}%`,
                    background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              {elapsedSeconds >= 30 && (
                <div
                  style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                  }}
                >
                  ⏱️ Processing screenplay draft ({elapsedSeconds}s elapsed). AI scene extraction is executing in parallel batches. You can continue waiting or cancel at any time.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            background: 'rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            {isUploading && (
              <button
                type="button"
                onClick={handleCancelUpload}
                className="btn-secondary touch-target"
                style={{ fontSize: '0.8rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
              >
                ⏹ Cancel Upload
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="btn-secondary touch-target"
              style={{ fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUploading || (activeTab === 'FILE' && !selectedFile) || (activeTab === 'PASTE' && !pastedText.trim())}
              className="btn-primary touch-target"
              style={{
                fontSize: '0.85rem',
                opacity: isUploading || (activeTab === 'FILE' && !selectedFile) || (activeTab === 'PASTE' && !pastedText.trim()) ? 0.5 : 1,
                cursor: isUploading || (activeTab === 'FILE' && !selectedFile) || (activeTab === 'PASTE' && !pastedText.trim()) ? 'not-allowed' : 'pointer',
              }}
            >
              {isUploading ? (
                <span>⏳ Processing Screenplay ({elapsedSeconds}s)...</span>
              ) : (
                <span>📤 Upload & Ingest Draft</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
