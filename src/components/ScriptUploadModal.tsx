import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '../utils/apiClient.js';
import { useModalFocus } from '../hooks/useModalFocus.js';
import {
  FileTextIcon,
  UploadIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XIcon,
} from './icons/Icons';

interface ScriptUploadModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (snapshot?: any, meta?: { reingestMode: 'REPLACE' | 'MERGE'; scenesCount: number; entitiesCount: number; openActionsCount: number }) => void | Promise<void>;
  hasExistingScenes?: boolean;
  initialMode?: 'FILE' | 'PASTE' | 'DEMO';
  executionMode?: 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE';
}

export type UploadPhase = 'IDLE' | 'UPLOADING' | 'PARSING' | 'EXTRACTING' | 'RECONCILING' | 'SYNCING' | 'COMPLETE' | 'FAILED';

export const UPLOAD_TIMEOUT_MS = 270000;

export const ScriptUploadModal: React.FC<ScriptUploadModalProps> = ({
  projectId,
  isOpen,
  onClose,
  onUploadSuccess,
  hasExistingScenes = false,
  initialMode = 'FILE',
  executionMode = 'DEMO_MODE',
}) => {
  const [activeTab, setActiveTab] = useState<'FILE' | 'PASTE' | 'DEMO'>(initialMode);
  const [reingestMode, setReingestMode] = useState<'REPLACE' | 'MERGE'>('REPLACE');
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

  const [completionCounts, setCompletionCounts] = useState<{ scenesCount: number; entitiesCount: number; openActionsCount: number }>({ scenesCount: 3, entitiesCount: 7, openActionsCount: 7 });

  // Extraction Preview State
  const [previewData, setPreviewData] = useState<{
    filename: string;
    format: string;
    characterCount: number;
    wordCount: number;
    estimatedPageCount: number;
    scenesDetected: number;
    sampleHeadings: string[];
    warnings: string[];
    isValid: boolean;
    previewTextExcerpt: string;
  } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const { containerRef } = useModalFocus<HTMLDivElement>({
    isOpen,
    onClose,
    canCloseOnEscape: !isUploading,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const retryButtonRef = useRef<HTMLButtonElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-fetch preview on file or text change
  useEffect(() => {
    let active = true;
    const fetchPreview = async () => {
      if (activeTab === 'DEMO') {
        setPreviewData({
          filename: 'the_neon_horizon_sample.txt',
          format: 'FOUNTAIN',
          characterCount: 6540,
          wordCount: 1120,
          estimatedPageCount: 3,
          scenesDetected: 3,
          sampleHeadings: [
            'Scene 1: INT. AERO TECH PRISM LAB - NIGHT',
            'Scene 2: EXT. MIDTOWN SPIRE TOWER - DAY',
            'Scene 3: INT. TITAN CARGO BAY - NIGHT',
          ],
          warnings: [],
          isValid: true,
          previewTextExcerpt: 'INT. AERO TECH PRISM LAB - NIGHT\nNeon reflections gleam...',
        });
        return;
      }

      if (activeTab === 'FILE' && selectedFile) {
        setIsPreviewLoading(true);
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          const res = await apiFetch(`/api/projects/${projectId}/script/preview`, {
            method: 'POST',
            body: formData,
          });
          if (res.ok && active) {
            const data = await res.json();
            setPreviewData(data);
          }
        } catch (e) {
          console.error('Error fetching preview:', e);
        } finally {
          if (active) setIsPreviewLoading(false);
        }
      } else if (activeTab === 'PASTE' && pastedText.trim()) {
        setIsPreviewLoading(true);
        try {
          const res = await apiFetch(`/api/projects/${projectId}/script/preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scriptText: pastedText,
              format: pastedFormat,
              filename: 'pasted_screenplay.txt',
            }),
          });
          if (res.ok && active) {
            const data = await res.json();
            setPreviewData(data);
          }
        } catch (e) {
          console.error('Error fetching text preview:', e);
        } finally {
          if (active) setIsPreviewLoading(false);
        }
      } else {
        setPreviewData(null);
      }
    };

    fetchPreview();
    return () => {
      active = false;
    };
  }, [selectedFile, pastedText, pastedFormat, activeTab, projectId]);

  // Focus management during state transitions (e.g. processing or failure)
  useEffect(() => {
    if (isUploading) {
      requestAnimationFrame(() => {
        cancelButtonRef.current?.focus();
      });
    } else if (uploadPhase === 'FAILED') {
      requestAnimationFrame(() => {
        retryButtonRef.current?.focus();
      });
    }
  }, [isUploading, uploadPhase]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setErrorMessage(null);
      setErrorCode(null);
      setPreviewData(null);
    }
  }, [isOpen, initialMode]);

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
      setPreviewData(null);
      return;
    }
    if (file.size === 0) {
      setErrorMessage('The selected file is empty (0 bytes).');
      setErrorCode('EMPTY_FILE');
      setSelectedFile(null);
      setPreviewData(null);
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('The selected file exceeds the 25MB maximum limit.');
      setErrorCode('FILE_TOO_LARGE');
      setSelectedFile(null);
      setPreviewData(null);
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

    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    progressIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev < 35) return prev + 5;
        if (prev < 65) return prev + 3;
        if (prev < 85) return prev + 1;
        return prev;
      });
    }, 1200);

    setTimeout(() => {
      setUploadPhase((current) => (current === 'UPLOADING' ? 'PARSING' : current));
    }, 1000);

    setTimeout(() => {
      setUploadPhase((current) => (current === 'PARSING' ? 'EXTRACTING' : current));
    }, 2500);

    setTimeout(() => {
      setUploadPhase((current) => (current === 'EXTRACTING' ? 'RECONCILING' : current));
    }, 4500);

    timeoutIdRef.current = setTimeout(() => {
      if (abortControllerRef.current === controller) {
        controller.abort();
        cleanupTimers();
        setIsUploading(false);
        setUploadPhase('FAILED');
        setErrorCode('TIMEOUT_ERROR');
        setErrorMessage(
          'Screenplay ingestion timed out after 4.5 minutes. Please try again.'
        );
      }
    }, UPLOAD_TIMEOUT_MS);

    try {
      let res: Response;

      if (activeTab === 'DEMO') {
        res = await apiFetch(`/api/projects/${projectId}/script/demo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reingestMode,
            autoEvaluate: executionMode !== 'CLOUD_MODE',
            includeSampleRights: executionMode !== 'CLOUD_MODE',
            includeSamplePlaceholders: executionMode !== 'CLOUD_MODE',
          }),
          signal: controller.signal,
        });
      } else if (activeTab === 'FILE') {
        if (!selectedFile) {
          cleanupTimers();
          setErrorMessage('Please select a screenplay file to upload.');
          setIsUploading(false);
          setUploadPhase('IDLE');
          return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('reingestMode', reingestMode);

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
            reingestMode,
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
        const code = data.code || (res.status === 401 ? 'UNAUTHORIZED' : res.status === 413 ? 'FILE_TOO_LARGE' : res.status === 429 ? 'RATE_LIMITED' : 'PARSING_FAILED');
        const errMessage = typeof data.error === 'string' ? data.error : (data.error?.message || data.message || `Upload failed (HTTP ${res.status}).`);
        setErrorMessage(errMessage);
        setErrorCode(code);
        setIsUploading(false);
        setUploadPhase('FAILED');
        return;
      }

      setUploadPhase('SYNCING');
      setUploadProgress(95);

      const snapshot = data.snapshot || data;
      if (snapshot && (!snapshot.entities || snapshot.entities.length === 0) && Array.isArray(data.entities) && data.entities.length > 0) {
        snapshot.entities = data.entities;
      }
      if (snapshot && (!snapshot.scenes || snapshot.scenes.length === 0) && Array.isArray(data.scenes) && data.scenes.length > 0) {
        snapshot.scenes = data.scenes;
      }
      const scenesCount = Array.isArray(snapshot?.scenes) ? snapshot.scenes.length : (data.scenesCount || 0);
      const entitiesCount = Array.isArray(snapshot?.entities) ? snapshot.entities.length : (data.entitiesCount || 0);
      const openActionsCount = snapshot?.actionsSummary?.openActions !== undefined ? snapshot.actionsSummary.openActions : (data.openActionsCount || 0);

      setCompletionCounts({ scenesCount, entitiesCount, openActionsCount });

      try {
        await Promise.resolve(onUploadSuccess(snapshot, { reingestMode, scenesCount, entitiesCount, openActionsCount }));
        // Ensure SYNCING state renders to DOM/a11y before declaring COMPLETE
        await new Promise((r) => setTimeout(r, 200));
        setUploadPhase('COMPLETE');
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadPhase('IDLE');
          onClose();
        }, 350);
      } catch (syncErr: any) {
        console.error('Workspace sync notification error:', syncErr);
        setErrorMessage(syncErr?.message || 'Failed to synchronize workspace state from committed snapshot.');
        setErrorCode('SYNC_FAILED');
        setIsUploading(false);
        setUploadPhase('FAILED');
      }
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
        return `Receiving screenplay payload (${elapsedSeconds}s)...`;
      case 'PARSING':
        return `Segmenting scenes and sluglines (${elapsedSeconds}s)...`;
      case 'EXTRACTING':
        return `Identifying candidate clearance entities (${elapsedSeconds}s)...`;
      case 'RECONCILING':
        return `Persisting active canonical registry snapshot (${elapsedSeconds}s)...`;
      case 'SYNCING':
        return `Syncing project workspace from active snapshot (${elapsedSeconds}s)...`;
      case 'COMPLETE':
        return `Screenplay ingestion complete (${elapsedSeconds}s)!`;
      case 'FAILED':
        return `Ingestion failed`;
      default:
        return 'Ready to ingest screenplay';
    }
  };

  const getNamedStageAnnouncement = (phase: UploadPhase) => {
    switch (phase) {
      case 'UPLOADING':
        return 'Uploading screenplay';
      case 'PARSING':
        return 'Segmenting scenes and sluglines';
      case 'EXTRACTING':
        return 'Identifying candidate clearance entities';
      case 'RECONCILING':
        return 'Persisting active canonical registry snapshot';
      case 'SYNCING':
        return 'Syncing project workspace from active snapshot';
      case 'COMPLETE':
        return `Screenplay replaced successfully. ${completionCounts.scenesCount} scenes processed. ${completionCounts.entitiesCount} entities registered. ${completionCounts.openActionsCount} department tasks created.`;
      case 'FAILED':
        return 'Screenplay ingestion failed.';
      default:
        return '';
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={containerRef}
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
          outline: 'none',
        }}
      >
        {/* Screen reader live stage announcements (announced once per stage transition, not every timer tick) */}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {getNamedStageAnnouncement(uploadPhase)}
        </div>
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
                color: 'var(--accent-cyan)',
              }}
            >
              <FileTextIcon size={18} />
            </div>
            <div>
              <h3 id="upload-modal-title" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                {activeTab === 'DEMO' ? 'Load Bundled Fictional Demo' : 'Upload Screenplay Draft'}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {activeTab === 'DEMO'
                  ? '3 scenes with fully fictional assets for clearance workflow demonstration'
                  : 'Ingest real .fountain, .txt, or text-based .pdf scripts (up to 25MB)'}
              </p>
            </div>
          </div>
          <button
            onClick={isUploading ? handleCancelUpload : onClose}
            aria-label="Close upload dialog"
            className="btn-secondary touch-target"
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            <XIcon size={16} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(0, 0, 0, 0.15)',
            padding: '0 24px',
            gap: '16px',
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
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <UploadIcon size={14} />
            <span>Upload File (.fountain, .txt, .pdf)</span>
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
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileTextIcon size={14} />
            <span>Paste Screenplay Text</span>
          </button>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => { setActiveTab('DEMO'); setErrorMessage(null); }}
            style={{
              padding: '12px 4px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'DEMO' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              color: activeTab === 'DEMO' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Bundled Demo Screenplay
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Re-Ingest Strategy Selector if project has existing scenes */}
          {hasExistingScenes && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                Screenplay Re-Ingest Strategy
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="reingestMode"
                    value="REPLACE"
                    checked={reingestMode === 'REPLACE'}
                    onChange={() => setReingestMode('REPLACE')}
                    disabled={isUploading}
                  />
                  <span><strong>Replace Current Screenplay</strong> (Recommended — updates active draft scope)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="reingestMode"
                    value="MERGE"
                    checked={reingestMode === 'MERGE'}
                    onChange={() => setReingestMode('MERGE')}
                    disabled={isUploading}
                  />
                  <span><strong>Merge as New Version</strong></span>
                </label>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
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
                <div>
                  <strong style={{ display: 'inline-block', marginRight: '4px' }}>
                    {errorCode ? `[${errorCode}] ` : ''}
                  </strong>
                  {errorMessage}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: '24px' }}>
                <button
                  ref={retryButtonRef}
                  type="button"
                  onClick={handleSubmit}
                  className="btn-secondary touch-target"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.5)', color: '#fff' }}
                >
                  Retry Ingestion
                </button>
              </div>
            </div>
          )}

          {activeTab === 'DEMO' ? (
            <div
              style={{
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>The Neon Horizon (Demo Screenplay)</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
                A 3-scene sci-fi feature excerpt featuring 7 fully fictional clearance entities across Brand, Art & Music, Public Figure, Proprietary Location, and Graphic Prop categories:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>AeroTech Prism Laptop</span>
                  <span style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 600, background: 'rgba(56,189,248,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Brand</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Summit Cola</span>
                  <span style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 600, background: 'rgba(56,189,248,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Brand</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Elena Vance</span>
                  <span style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 600, background: 'rgba(251,191,36,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Public Figure</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Nocturne of the Wild</span>
                  <span style={{ fontSize: '0.65rem', color: '#c084fc', fontWeight: 600, background: 'rgba(192,132,252,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Art & Music</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Veloce GT</span>
                  <span style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 600, background: 'rgba(56,189,248,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Brand</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Midtown Spire Tower</span>
                  <span style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 600, background: 'rgba(52,211,153,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Proprietary Location</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Titan Industrial Hazard Placard</span>
                  <span style={{ fontSize: '0.65rem', color: '#f87171', fontWeight: 600, background: 'rgba(248,113,113,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Graphic Prop</span>
                </div>
              </div>
            </div>
          ) : activeTab === 'FILE' ? (
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
                      }}
                    >
                      ✓
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#34d399' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB — Click to choose a different file
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      Drag & drop screenplay file here, or browse
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Supports .fountain, .txt, and text-based .pdf up to 25MB
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Screenplay Format
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Format:</span>
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

          {/* Extraction Preview Section */}
          {isPreviewLoading && (
            <div
              style={{
                padding: '16px',
                background: 'rgba(6, 182, 212, 0.05)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--accent-cyan)',
                fontSize: '0.85rem',
              }}
            >
              <span>⏳ Analyzing screenplay extraction structure...</span>
            </div>
          )}

          {previewData && !isPreviewLoading && (
            <div
              data-testid="extraction-preview-card"
              style={{
                padding: '16px',
                background: previewData.scenesDetected > 0 ? 'rgba(52, 211, 153, 0.08)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${previewData.scenesDetected > 0 ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.4)'}`,
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: previewData.scenesDetected > 0 ? '#34d399' : '#f87171' }}>
                  {previewData.scenesDetected > 0 ? '✓ Extraction Preview (Valid)' : '⚠️ Extraction Preview (Invalid / 0 Scenes)'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {previewData.filename} ({previewData.format})
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Scenes Detected: </span>
                  <strong style={{ color: previewData.scenesDetected > 0 ? '#34d399' : '#f87171' }}>
                    {previewData.scenesDetected}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Est. Pages: </span>
                  <strong>{previewData.estimatedPageCount}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Characters: </span>
                  <strong>{previewData.characterCount}</strong>
                </div>
              </div>

              {previewData.sampleHeadings && previewData.sampleHeadings.length > 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    Sample Headings Detected:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {previewData.sampleHeadings.map((hd, idx) => (
                      <div key={idx} style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#cbd5e1' }}>
                        {hd}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings List */}
              {previewData.warnings && previewData.warnings.length > 0 && (
                <div
                  data-testid="extraction-preview-warnings"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    color: '#f87171',
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Extraction Warnings:</strong>
                  <ul style={{ margin: 0, paddingLeft: '16px' }}>
                    {previewData.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
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
                ref={cancelButtonRef}
                type="button"
                onClick={handleCancelUpload}
                aria-label="Cancel upload in progress"
                className="btn-secondary touch-target"
                style={{ fontSize: '0.8rem', color: 'var(--status-action)', borderColor: 'var(--status-action-border)' }}
              >
                Cancel Upload
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
              data-testid="btn-confirm-ingestion"
              onClick={handleSubmit}
              disabled={
                Boolean(
                  isUploading ||
                  isPreviewLoading ||
                  (activeTab === 'FILE' && (!selectedFile || (previewData && previewData.scenesDetected === 0))) ||
                  (activeTab === 'PASTE' && (!pastedText.trim() || (previewData && previewData.scenesDetected === 0)))
                )
              }
              className="btn-primary touch-target"
              style={{
                fontSize: '0.85rem',
                opacity:
                  isUploading ||
                  isPreviewLoading ||
                  (activeTab === 'FILE' && (!selectedFile || (previewData && previewData.scenesDetected === 0))) ||
                  (activeTab === 'PASTE' && (!pastedText.trim() || (previewData && previewData.scenesDetected === 0)))
                    ? 0.5
                    : 1,
                cursor:
                  isUploading ||
                  isPreviewLoading ||
                  (activeTab === 'FILE' && (!selectedFile || (previewData && previewData.scenesDetected === 0))) ||
                  (activeTab === 'PASTE' && (!pastedText.trim() || (previewData && previewData.scenesDetected === 0)))
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {isUploading ? (
                <span>Ingesting Screenplay ({elapsedSeconds}s)...</span>
              ) : previewData && previewData.scenesDetected === 0 ? (
                <span>Cannot Ingest (0 Scenes Detected)</span>
              ) : activeTab === 'DEMO' ? (
                <span>Load Bundled Demo Screenplay</span>
              ) : (
                <span>Confirm Ingestion & Review</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
