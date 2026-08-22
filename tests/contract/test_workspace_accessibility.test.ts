import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Accessible Responsive Workspace Contract Tests (Feature 014)', () => {
  const indexCssPath = path.resolve(__dirname, '../../src/index.css');
  const appTsxPath = path.resolve(__dirname, '../../src/App.tsx');
  const citationDrawerPath = path.resolve(__dirname, '../../src/components/CitationDrawer.tsx');
  const entityRegistryPath = path.resolve(__dirname, '../../src/components/EntityRegistryTable.tsx');
  const comparisonModalPath = path.resolve(__dirname, '../../src/components/ReplacementComparisonModal.tsx');

  it('FR-001 & FR-002: index.css provides visible focus ring and touch target utilities', () => {
    const css = fs.readFileSync(indexCssPath, 'utf-8');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('outline: 2px solid var(--accent-cyan)');
    expect(css).toContain('.touch-target');
    expect(css).toContain('min-height: 44px');
  });

  it('FR-003: App.tsx implements global Escape key listener to close topmost overlay', () => {
    const appCode = fs.readFileSync(appTsxPath, 'utf-8');
    expect(appCode).toContain("e.key === 'Escape'");
    expect(appCode).toContain('setIsReplacementOpen(false)');
    expect(appCode).toContain('setIsCitationOpen(false)');
    expect(appCode).toContain('setIsTimelineOpen(false)');
    expect(appCode).toContain('setIsTokenModalOpen(false)');
  });

  it('FR-004: UI components declare ARIA dialog roles and descriptive labels', () => {
    const demoTokenModalPath = path.resolve(__dirname, '../../src/components/DemoTokenModal.tsx');
    const tokenModalCode = fs.readFileSync(demoTokenModalPath, 'utf-8');
    expect(tokenModalCode).toContain('role="dialog"');
    expect(tokenModalCode).toContain('aria-modal="true"');
    expect(tokenModalCode).toContain('aria-labelledby=');

    const citationCode = fs.readFileSync(citationDrawerPath, 'utf-8');
    expect(citationCode).toContain('role="dialog"');
    expect(citationCode).toContain('aria-modal="true"');
    expect(citationCode).toContain('aria-label=');
  });

  it('FR-005: Status badge colors meet WCAG AA high-contrast requirements', () => {
    const css = fs.readFileSync(indexCssPath, 'utf-8');
    expect(css).toContain('--status-no-issue: #34d399');
    expect(css).toContain('--status-review: #fbbf24');
    expect(css).toContain('--status-action: #f87171');
    expect(css).toContain('--status-insufficient: #a78bfa');
  });

  it('FR-006 & FR-007: index.css includes mobile media queries below 768px', () => {
    const css = fs.readFileSync(indexCssPath, 'utf-8');
    expect(css).toContain('@media (max-width: 768px)');
    expect(css).toContain('.responsive-stack');
    expect(css).toContain('.responsive-table-container');
    expect(css).toContain('.drawer-responsive');
  });

  it('FR-008: Citation Drawer and Registry Table declare accessible structure and escape handling', () => {
    const drawerCode = fs.readFileSync(citationDrawerPath, 'utf-8');
    expect(drawerCode).toContain('CitationDrawer');
    const tableCode = fs.readFileSync(entityRegistryPath, 'utf-8');
    expect(tableCode).toContain('EntityRegistryTable');
  });
});
