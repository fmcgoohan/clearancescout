export interface ProjectQuotaLedger {
  liveResearchQuotaAllocated: number;        // Default 25
  liveResearchQuotaConsumed: number;         // Incremented atomically per live search call
  liveResearchQuotaReserved?: number;        // Active in-flight batch reservations
  lastQuotaResetAt?: string;
  isQuotaLocked?: boolean;                   // True if balance <= 0
}

export interface QuotaReservationResult {
  success: boolean;
  allocated: number;
  consumed: number;
  remaining: number;
  requested: number;
  isExhausted: boolean;
}
