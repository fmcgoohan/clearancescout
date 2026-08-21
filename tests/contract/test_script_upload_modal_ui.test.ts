// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { WorkspacePage } from '../../src/pages/WorkspacePage.js';
import { ScriptUploadModal } from '../../src/components/ScriptUploadModal.js';

describe('Interaction Regression: WorkspacePage Upload Screenplay Modal Trigger', () => {
  beforeEach(() => {
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
    const invalidFile = new File(['dummy content'], 'screenplay.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    // Assert visible error alert banner is rendered
    const alert = getByRole('alert');
    expect(alert).toBeDefined();
    expect(alert.textContent).toContain('[UNSUPPORTED_FORMAT]');
    expect(alert.textContent).toContain("Unsupported file format '.docx'");
  });
});
