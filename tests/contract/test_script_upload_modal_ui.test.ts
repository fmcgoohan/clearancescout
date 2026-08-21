import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { ScriptUploadModal } from '../../src/components/ScriptUploadModal.js';

describe('Regression: ScriptUploadModal UI & Workspace Trigger Interaction', () => {
  const modalPath = path.resolve(__dirname, '../../src/components/ScriptUploadModal.tsx');
  const workspacePath = path.resolve(__dirname, '../../src/pages/WorkspacePage.tsx');

  it('renders ScriptUploadModal visibly with fixed overlay, zIndex 1400, and glass-panel when isOpen is true', () => {
    const html = renderToString(
      React.createElement(ScriptUploadModal, {
        projectId: 'test-proj-123',
        isOpen: true,
        onClose: () => {},
        onUploadSuccess: () => {},
      })
    );

    // Verify dialog semantics and accessibility
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="upload-modal-title"');
    expect(html).toContain('Upload Screenplay Draft');

    // Verify modal overlay styling and z-index positioning (>= 1400, above 100 header)
    expect(html).toContain('position:fixed');
    expect(html).toContain('z-index:1400');
    expect(html).toContain('glass-panel');

    // Verify file tab and paste tab options
    expect(html).toContain('Upload File (.fountain, .txt, .pdf)');
    expect(html).toContain('Paste Screenplay Text');

    // Verify file input
    expect(html).toContain('type="file"');
    expect(html).toContain('.fountain,.txt,.text,.pdf');

    // Verify submit and cancel buttons
    expect(html).toContain('Upload &amp; Ingest Draft');
    expect(html).toContain('Cancel');
  });

  it('renders nothing when isOpen is false', () => {
    const html = renderToString(
      React.createElement(ScriptUploadModal, {
        projectId: 'test-proj-123',
        isOpen: false,
        onClose: () => {},
        onUploadSuccess: () => {},
      })
    );

    expect(html).toBe('');
  });

  it('guarantees ScriptUploadModal and WorkspacePage do not rely on missing Tailwind CSS classes', () => {
    const modalCode = fs.readFileSync(modalPath, 'utf-8');
    const workspaceCode = fs.readFileSync(workspacePath, 'utf-8');

    const forbiddenTailwindPatterns = [
      'bg-slate-',
      'text-slate-',
      'border-slate-',
      'bg-indigo-',
      'text-indigo-',
      'border-indigo-',
      'max-w-xl',
      'space-x-',
      'space-y-',
      'z-50',
    ];

    for (const pattern of forbiddenTailwindPatterns) {
      expect(modalCode).not.toContain(pattern);
      expect(workspaceCode).not.toContain(pattern);
    }
  });

  it('verifies WorkspacePage provides the Upload Screenplay control wired to open ScriptUploadModal', () => {
    const workspaceCode = fs.readFileSync(workspacePath, 'utf-8');

    expect(workspaceCode).toContain('setIsUploadModalOpen(true)');
    expect(workspaceCode).toContain('Upload Screenplay');
    expect(workspaceCode).toContain('<ScriptUploadModal');
    expect(workspaceCode).toContain('isOpen={isUploadModalOpen}');
    expect(workspaceCode).toContain('projectId={projectId}');
  });
});
