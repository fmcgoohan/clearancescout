export type SystemHealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export interface CredentialStatus {
  geminiConfigured: boolean;
  parallelWebConfigured: boolean;
}

export interface HealthStatusResponse {
  status: SystemHealthStatus;
  executionMode: 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE';
  uptimeSeconds: number;
  timestamp: string;
  version: string;
  revision?: string;
  service?: string;
  credentials: CredentialStatus;
  geminiBackend?: 'vertex' | 'apikey';
  geminiProject?: string;
  firestoreConnected?: boolean;
  missingCredentials?: string[];
  error?: string;
}
