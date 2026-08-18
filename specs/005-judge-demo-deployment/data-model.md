# Data Model: 005 Judge-Ready Demo, Documentation, and Production Deployment

**Feature**: `specs/005-judge-demo-deployment`  
**Status**: Completed  

---

## 1. Health & Readiness Models

```typescript
export type SystemHealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export interface CredentialStatus {
  geminiConfigured: boolean;
  parallelWebConfigured: boolean;
}

export interface HealthStatusResponse {
  status: SystemHealthStatus;
  executionMode: 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE';
  uptimeSeconds: number;
  timestamp: string;               // ISO 8601 string
  version: string;                 // e.g. "1.0.0"
  credentials: CredentialStatus;
  missingCredentials?: string[];    // Present only when credentials are missing in CLOUD_MODE
  error?: string;                   // Present when status is DEGRADED or UNHEALTHY
}
```

---

## 2. Demo Screenplay Fixture Model

```typescript
export interface DemoEntitySeed {
  name: string;
  category: 'BRAND' | 'ART_MUSIC' | 'PUBLIC_FIGURE' | 'PROPRIETARY_LOCATION' | 'GRAPHIC_PROP';
  baselineStatus: 'NO_ISSUE_SURFACED' | 'REVIEW_RECOMMENDED' | 'ACTION_REQUIRED' | 'INSUFFICIENT_EVIDENCE';
  description: string;
}

export interface DemoScreenplayFixture {
  id: string;                      // e.g. "fixture-neon-horizon"
  title: string;                   // "The Neon Horizon"
  author: string;                  // "Entrant Team"
  format: 'PLAINTEXT' | 'FOUNTAIN';
  rawScriptText: string;
  expectedEntities: DemoEntitySeed[];
}
```

---

## 3. Container & Deployment Configuration Model

```typescript
export interface CloudRunDeploymentConfig {
  serviceName: string;             // "clearancescout"
  region: string;                  // e.g. "us-central1"
  port: number;                    // process.env.PORT || 3000
  executionMode: 'DEMO_MODE' | 'CLOUD_MODE';
  environmentVariables: {
    NODE_ENV: 'production' | 'development';
    PORT: string;
    EXECUTION_MODE: 'DEMO_MODE' | 'CLOUD_MODE' | 'TEST_MODE';
    GEMINI_API_KEY?: string;       // Injected from Cloud Secret Manager
    PARALLEL_WEB_API_KEY?: string; // Injected from Cloud Secret Manager
  };
}
```
