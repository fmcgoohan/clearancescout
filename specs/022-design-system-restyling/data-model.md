# Design System Tokens & Data Model: Restyle ClearanceScout UI to Constitution v1.1.0

## 1. CSS Custom Properties Schema (`src/index.css`)

```css
:root {
  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Courier Prime', SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Typographic Scale */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 2.25rem;   /* 36px - Hero Metric */
  --font-size-4xl: 3rem;      /* 48px - Shooting Readiness Metric */

  /* Sacred Semantic Colors (Article 1) */
  --color-status-green: hsl(142, 71%, 40%);
  --bg-status-green: hsl(142, 71%, 95%);
  --border-status-green: hsl(142, 71%, 80%);

  --color-status-amber: hsl(38, 92%, 45%);
  --bg-status-amber: hsl(38, 92%, 95%);
  --border-status-amber: hsl(38, 92%, 80%);

  --color-status-red: hsl(354, 70%, 50%);
  --bg-status-red: hsl(354, 70%, 95%);
  --border-status-red: hsl(354, 70%, 80%);

  /* Single Brand Accent (Article 1) */
  --color-brand-primary: hsl(215, 28%, 17%);    /* Slate surface */
  --color-brand-interactive: hsl(217, 91%, 60%);/* Cyan focus/action */
  --color-brand-border: hsl(215, 20%, 88%);
  --color-brand-muted: hsl(215, 16%, 47%);

  /* Motion Timing (Article 5) */
  --motion-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --motion-duration-fast: 150ms;
  --motion-duration-hero: 400ms;
}
```

## 2. Icon Registry Component Model (`src/components/icons/`)

All icons implement a unified interface:

```typescript
export interface IconProps {
  className?: string;
  size?: number | string;
  ariaHidden?: boolean;
  role?: string;
}
```

Available SVG icons:
- `CheckCircleIcon`: Cleared / Success status
- `AlertTriangleIcon`: Review Recommended / Warning
- `XCircleIcon`: Blocks Shooting / Action Required
- `HelpCircleIcon`: Insufficient Evidence / Research Required
- `FilmIcon`: Screenplay / Scenes / Projects
- `FileTextIcon`: Clearance Binder Export
- `DownloadIcon`: Export actions
- `SearchIcon`: Entity search / table filtering
- `LayersIcon`: Operations Dashboard
- `ClockIcon`: Timeline & Audit history
- `RefreshCwIcon`: Retry / Ingestion progress
- `ChevronRightIcon`: Navigation / Expand row
- `XIcon`: Modal close

## 3. Modal Scroll Locking State Model (`src/hooks/useBodyScrollLock.ts`)

```typescript
// Shared global counter for active open modals
let activeModalCount = 0;

export function useBodyScrollLock(isOpen: boolean): void {
  useEffect(() => {
    if (!isOpen) return;

    activeModalCount++;
    if (activeModalCount === 1) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      activeModalCount = Math.max(0, activeModalCount - 1);
      if (activeModalCount === 0) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen]);
}
```
