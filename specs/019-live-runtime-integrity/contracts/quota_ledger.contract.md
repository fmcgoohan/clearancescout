# API Contract: Live Research Quota Accounting & Rate Limiting

**Scope**: Atomic reservation and deduction rules for live research quota.

---

## 1. Atomic Consumption Contract

### 1.1 Endpoint
`POST /api/projects/:projectId/quota/consume` (Internal Workflow Contract)

### 1.2 Input Payload
```json
{
  "requestedAmount": 1,
  "caller": "ClearanceEvaluator.evaluateEntityClearance",
  "entityId": "ent-12345678"
}
```

### 1.3 Success Response (200 OK)
```json
{
  "success": true,
  "allocated": 25,
  "consumed": 14,
  "remaining": 11,
  "requested": 1,
  "isExhausted": false
}
```

### 1.4 Quota Exhausted Response (429 Too Many Requests)
```json
{
  "success": false,
  "errorCode": "QUOTA_EXHAUSTED",
  "message": "Project live research quota limit (25 calls) has been exhausted.",
  "allocated": 25,
  "consumed": 25,
  "remaining": 0,
  "requested": 1,
  "guidance": "Please switch to DEMO_MODE or contact studio production supervisor to increase project quota allocation."
}
```

---

## 2. Invariant Rules

1. **Strict 25 Means 25**: Under no circumstances may `liveResearchQuotaConsumed` exceed `liveResearchQuotaAllocated`.
2. **Transaction Isolation**: In Firestore, all quota increments MUST execute inside `db.runTransaction()`.
3. **Fail-Closed on Depletion**: When `remaining === 0`, external API invocations to Parallel Search MUST NOT be dispatched, and the evaluation step returns `INSUFFICIENT_EVIDENCE` with error code `QUOTA_EXHAUSTED`.
