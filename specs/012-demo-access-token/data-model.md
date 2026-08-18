# Data Model: Demo Access Token Protection

**Feature**: `specs/012-demo-access-token` | **Date**: 2026-08-18

---

## 1. Server Configuration Extension

```typescript
export interface AppConfig {
  executionMode: ExecutionMode;
  port: number;
  geminiApiKey?: string;
  parallelWebApiKey?: string;
  demoAccessToken?: string; // Loaded from process.env.DEMO_ACCESS_TOKEN or DEMO_TOKEN
}
```

---

## 2. Client Access Token Storage State

```typescript
export interface DemoAccessState {
  token: string | null;
  isConfiguredOnServer: boolean;
}
```
