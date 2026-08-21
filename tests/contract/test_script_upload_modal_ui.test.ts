// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import { WorkspacePage } from '../../src/pages/WorkspacePage.js';
import { ScriptUploadModal, UPLOAD_TIMEOUT_MS } from '../../src/components/ScriptUploadModal.js';

describe('Interaction Regression: WorkspacePage Upload Screenplay Modal Trigger', () => {
  beforeEach(() => {
    vi.useRealTimers();
    // Mock global fetch for WorkspacePage bootstrap fetches
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/projects/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [],
          text: async () => '',
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
        text: async () => '',
      });
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders WorkspacePage, clicks Upload Screenplay button, and opens the visibly styled ScriptUploadModal', async () => {
    const { getByRole, queryByRole, getByLabelText, getByText } = render(
      React.createElement(WorkspacePage, {
        projectId: 'proj-cyberfall-2026',
        onEvaluateClearance: () => {},
        onGenerateReplacement: () => {},
        onOpenCounselReview: () => {},
        isEvaluating: false,
        refreshTrigger: 0,
        executionMode: 'DEMO_MODE',
      })
    );

    // 1. Initially, no upload dialog is rendered in the document
    expect(queryByRole('dialog')).toBeNull();

    // 2. Locate the actual Upload Screenplay trigger button
    const uploadButton = getByLabelText('Upload Screenplay File (.fountain, .txt, .pdf)');
    expect(uploadButton).toBeDefined();
    expect(uploadButton.textContent).toContain('Upload Screenplay');

    // 3. User clicks the "Upload Screenplay" button
    fireEvent.click(uploadButton);

    // 4. Assert the dialog is now mounted and renderably available in the DOM
    const dialog = getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('upload-modal-title');

    // 5. Verify modal styling: fixed positioning overlay and elevated z-index (1400)
    expect(dialog.style.position).toBe('fixed');
    expect(dialog.style.zIndex).toBe('1400');
    expect(['0', '0px', '0 0 0 0']).toContain(dialog.style.inset);

    // 6. Verify dialog header and glass-panel container
    const heading = getByText('Upload Screenplay Draft');
    expect(heading).toBeDefined();
    expect(heading.id).toBe('upload-modal-title');

    const modalBox = dialog.querySelector('.glass-panel');
    expect(modalBox).not.toBeNull();
    expect(modalBox?.className).toContain('modal-responsive');

    // 7. Verify file picker drag zone and accepted formats
    expect(dialog.textContent).toContain('Drag & drop screenplay file here');
    const fileInput = dialog.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    expect(fileInput.getAttribute('accept')).toBe('.fountain,.txt,.text,.pdf');

    // 8. Verify tab switching to "Paste Screenplay Text"
    const pasteTab = getByText(/Paste Screenplay Text/i);
    fireEvent.click(pasteTab);
    expect(getByText(/Screenplay Format/i)).toBeDefined();
    expect(dialog.querySelector('textarea')).not.toBeNull();

    // 9. Close modal via Cancel button and verify it unmounts from DOM
    const cancelButton = getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(queryByRole('dialog')).toBeNull();
  });

  it('ScriptUploadModal validates file formats and renders visible error alerts without Tailwind classes', () => {
    const { getByRole } = render(
      React.createElement(ScriptUploadModal, {
        projectId: 'proj-cyberfall-2026',
        isOpen: true,
        onClose: () => {},
        onUploadSuccess: () => {},
      })
    );

    const dialog = getByRole('dialog');
    const fileInput = dialog.querySelector('input[type="file"]') as HTMLInputElement;

    // Simulate selecting an unsupported .docx file
    const invalidFile = new File(['dummy content'], 'screenplay.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    // Assert visible error alert banner is rendered
    const alert = getByRole('alert');
    expect(alert).toBeDefined();
    expect(alert.textContent).toContain('[UNSUPPORTED_FORMAT]');
    expect(alert.textContent).toContain("Unsupported file format 'screenplay.docx'");
  });

  it('accepts Big-Fish.fountain.txt as a valid Fountain screenplay file', () => {
    const { getByRole, queryByRole } = render(
      React.createElement(ScriptUploadModal, {
        projectId: 'proj-cyberfall-2026',
        isOpen: true,
        onClose: () => {},
        onUploadSuccess: () => {},
      })
    );

    const dialog = getByRole('dialog');
    const fileInput = dialog.querySelector('input[type="file"]') as HTMLInputElement;

    // Simulate selecting Big-Fish.fountain.txt (142.8 KB)
    const validFile = new File(['INT. RIVER - NIGHT\nEdward swims.'], 'Big-Fish.fountain.txt', {
      type: 'text/plain',
    });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    // Assert no error is shown and file name is accepted
    expect(queryByRole('alert')).toBeNull();
    expect(dialog.textContent).toContain('Big-Fish.fountain.txt');
  });

  it('surfaces visible PARSING_FAILED error alert immediately when server returns HTTP 502 error', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/projects/proj-error-123/script/upload')) {
        return Promise.resolve({
          ok: false,
          status: 502,
          json: async () => ({
            code: 'PARSING_FAILED',
            error: 'Live AI screenplay parsing failed during scene extraction chunk 5: Model rate limit',
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      });
    });

    const { getByRole, getByText } = render(
      React.createElement(ScriptUploadModal, {
        projectId: 'proj-error-123',
        isOpen: true,
        onClose: () => {},
        onUploadSuccess: () => {},
      })
    );

    const dialog = getByRole('dialog');
    const fileInput = dialog.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(['INT. HOUSE - DAY'], 'script.fountain', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    const uploadSubmitButton = getByText(/Upload & Ingest Draft/i);
    fireEvent.click(uploadSubmitButton);

    await waitFor(() => {
      const alert = getByRole('alert');
      expect(alert).toBeDefined();
      expect(alert.textContent).toContain('[PARSING_FAILED]');
      expect(alert.textContent).toContain('Live AI screenplay parsing failed');
    });
  });

  it('provides a working Cancel Upload button that cancels the active request with CANCELLED code', async () => {
    // Return a hanging promise for the upload request
    let abortListener: (() => void) | null = null;
    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/api/projects/proj-cancel-123/script/upload')) {
        return new Promise((_, reject) => {
          if (init?.signal) {
            init.signal.addEventListener('abort', () => {
              const abortErr = new Error('The operation was aborted');
              abortErr.name = 'AbortError';
              reject(abortErr);
            });
          }
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    const { getByRole, getByText } = render(
      React.createElement(ScriptUploadModal, {
        projectId: 'proj-cancel-123',
        isOpen: true,
        onClose: () => {},
        onUploadSuccess: () => {},
      })
    );

    const dialog = getByRole('dialog');
    const fileInput = dialog.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(['INT. CABIN - DAY'], 'script.fountain', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    const uploadSubmitButton = getByText(/Upload & Ingest Draft/i);
    fireEvent.click(uploadSubmitButton);

    // Active upload shows cancel button
    await waitFor(() => {
      expect(getByText(/Cancel Upload/i)).toBeDefined();
    });

    const cancelUploadButton = getByText(/Cancel Upload/i);
    fireEvent.click(cancelUploadButton);

    // Assert visible cancellation banner
    await waitFor(() => {
      const alert = getByRole('alert');
      expect(alert).toBeDefined();
      expect(alert.textContent).toContain('Upload cancelled by user');
    });
  });

  it('guarantees client timeout constant UPLOAD_TIMEOUT_MS is at least 270000ms (aligned with Cloud Run 300s)', () => {
    expect(UPLOAD_TIMEOUT_MS).toBeGreaterThanOrEqual(270000);
  });

  it('accepts both .fountain and .fountain.txt files without rejecting or triggering format errors', () => {
    const { getByRole, queryByRole } = render(
      React.createElement(ScriptUploadModal, {
        projectId: 'proj-fountain-test',
        isOpen: true,
        onClose: () => {},
        onUploadSuccess: () => {},
      })
    );

    const dialog = getByRole('dialog');
    const fileInput = dialog.querySelector('input[type="file"]') as HTMLInputElement;

    // 1. .fountain format
    const fountainFile = new File(['INT. CASTLE - DAY\nKING enters.'], 'Draft.fountain', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [fountainFile] } });
    expect(queryByRole('alert')).toBeNull();
    expect(dialog.textContent).toContain('Draft.fountain');

    // 2. .fountain.txt format
    const compoundFountainFile = new File(['INT. CASTLE - NIGHT\nKING sleeps.'], 'Draft.fountain.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [compoundFountainFile] } });
    expect(queryByRole('alert')).toBeNull();
    expect(dialog.textContent).toContain('Draft.fountain.txt');
  });
});
