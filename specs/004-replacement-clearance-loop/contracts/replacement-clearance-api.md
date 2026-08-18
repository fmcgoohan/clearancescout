# API Contract: Replacement Self-Clearance Loop

**Feature**: `specs/004-replacement-clearance-loop`  
**Endpoint Base**: `/api/projects/:id/replacements`  

---

## 1. Generate Cleared Replacement Brand Card

### Request
```http
POST /api/projects/:id/replacements/generate
Content-Type: application/json

{
  "canonicalEntityId": "ent-3b4e-9f12",
  "eraAesthetic": "1950s Americana"
}
```

### Response: Cleared on Attempt 1 (200 OK)
```json
{
  "id": "rep-7b9a-4c2d",
  "projectId": "proj-9c2b",
  "canonicalEntityId": "ent-3b4e-9f12",
  "targetEntityName": "Coca-Cola",
  "proposedName": "Rocket Sparkle Fizz",
  "tagline": "The Refreshing Atomic Flavor!",
  "eraAesthetic": "1950s Americana",
  "visualPrompt": "Vintage glass soda bottle with embossed atomic rocket emblem, retro red and cream script label, chrome cap, 1950s diner background",
  "fictionalBackstory": "Established in 1948 by aviation mechanics in Dayton, Ohio, celebrating the jet age with effervescent carbonation.",
  "clearanceStatus": "NO_ISSUE_SURFACED",
  "selfClearanceResult": "ACCEPTED",
  "totalAttempts": 1,
  "attemptHistory": [
    {
      "attemptNumber": 1,
      "candidateName": "Rocket Sparkle Fizz",
      "tagline": "The Refreshing Atomic Flavor!",
      "eraAesthetic": "1950s Americana",
      "visualPrompt": "Vintage glass soda bottle...",
      "fictionalBackstory": "Established in 1948...",
      "clearanceStatus": "NO_ISSUE_SURFACED",
      "citations": [
        {
          "id": "cit-8a1f",
          "registrationStatus": "UNREGISTERED_CLEAN",
          "retrievedAt": "2026-08-18T15:00:00.000Z",
          "corporateOwner": "None Found",
          "excerptSnippet": "No matching commercial trademarks or registered goods found in USPTO or common law food & beverage registries for 'Rocket Sparkle Fizz'.",
          "sourceUrl": "https://tmsearch.uspto.gov/bin/gate.exe?f=searchstr&state=4801:clean",
          "provenance": "DEMO_FIXTURE"
        }
      ],
      "provenance": "DEMO_FIXTURE",
      "timestamp": "2026-08-18T15:00:00.000Z"
    }
  ],
  "citations": [
    {
      "id": "cit-8a1f",
      "registrationStatus": "UNREGISTERED_CLEAN",
      "retrievedAt": "2026-08-18T15:00:00.000Z",
      "corporateOwner": "None Found",
      "excerptSnippet": "No matching commercial trademarks or registered goods found in USPTO or common law food & beverage registries for 'Rocket Sparkle Fizz'.",
      "sourceUrl": "https://tmsearch.uspto.gov/bin/gate.exe?f=searchstr&state=4801:clean",
      "provenance": "DEMO_FIXTURE"
    }
  ],
  "provenance": "DEMO_FIXTURE",
  "createdAt": "2026-08-18T15:00:00.000Z",
  "updatedAt": "2026-08-18T15:00:00.000Z"
}
```

### Response: Multi-Attempt Rejection & Final Escalation (200 OK)
```json
{
  "id": "rep-7b9a-4c2d",
  "projectId": "proj-9c2b",
  "canonicalEntityId": "ent-3b4e-9f12",
  "targetEntityName": "Coca-Cola",
  "proposedName": "Atomic Cola",
  "tagline": "Feel the Blast!",
  "eraAesthetic": "1950s Americana",
  "visualPrompt": "Atomic blast graphic on vintage soda bottle...",
  "fictionalBackstory": "Produced in New Mexico...",
  "clearanceStatus": "ACTION_REQUIRED",
  "selfClearanceResult": "ESCALATED_TO_COUNSEL",
  "totalAttempts": 3,
  "attemptHistory": [
    {
      "attemptNumber": 1,
      "candidateName": "Nuka-Cola",
      "tagline": "Zap that Thirst!",
      "eraAesthetic": "1950s Americana",
      "visualPrompt": "...",
      "fictionalBackstory": "...",
      "clearanceStatus": "ACTION_REQUIRED",
      "collisionRationale": "Conflict detected: 'Nuka-Cola' is an active registered trademark of Bethesda Softworks / ZeniMax Media in Class 32/28.",
      "citations": [...],
      "provenance": "DEMO_FIXTURE",
      "timestamp": "2026-08-18T15:00:00.000Z"
    },
    {
      "attemptNumber": 2,
      "candidateName": "Radiant Pop",
      "tagline": "Glow with energy!",
      "eraAesthetic": "1950s Americana",
      "visualPrompt": "...",
      "fictionalBackstory": "...",
      "clearanceStatus": "REVIEW_RECOMMENDED",
      "collisionRationale": "Conflict detected: 'Radiant Beverage Co.' holds active trademark registration in regional beverage distribution.",
      "citations": [...],
      "provenance": "DEMO_FIXTURE",
      "timestamp": "2026-08-18T15:00:01.000Z"
    },
    {
      "attemptNumber": 3,
      "candidateName": "Atomic Cola",
      "tagline": "Feel the Blast!",
      "eraAesthetic": "1950s Americana",
      "visualPrompt": "...",
      "fictionalBackstory": "...",
      "clearanceStatus": "ACTION_REQUIRED",
      "collisionRationale": "Conflict detected: 'Atomic Cola' registered by Atomic Candy LLC.",
      "citations": [...],
      "provenance": "DEMO_FIXTURE",
      "timestamp": "2026-08-18T15:00:02.000Z"
    }
  ],
  "citations": [...],
  "provenance": "DEMO_FIXTURE",
  "createdAt": "2026-08-18T15:00:02.000Z",
  "updatedAt": "2026-08-18T15:00:02.000Z"
}
```

---

## 2. Server-Sent Events (SSE) Timeline Stream

### Events Contract
The stream at `GET /api/projects/:id/timeline/stream` emits the following structured events during replacement generation:

```json
event: message
data: {
  "id": "evt-1a",
  "projectId": "proj-9c2b",
  "eventType": "REPLACEMENT_ATTEMPT",
  "summary": "Generating Candidate 1 (1950s Americana): Rocket Sparkle Fizz",
  "details": {
    "canonicalEntityId": "ent-3b4e-9f12",
    "candidateName": "Rocket Sparkle Fizz",
    "eraAesthetic": "1950s Americana",
    "attemptNumber": 1
  },
  "timestamp": "2026-08-18T15:00:00.100Z"
}

event: message
data: {
  "id": "evt-1b",
  "projectId": "proj-9c2b",
  "eventType": "REPLACEMENT_RESEARCH_STARTED",
  "summary": "Researching Trademark & Web Clearance for candidate 'Rocket Sparkle Fizz'",
  "details": {
    "canonicalEntityId": "ent-3b4e-9f12",
    "candidateName": "Rocket Sparkle Fizz",
    "attemptNumber": 1
  },
  "timestamp": "2026-08-18T15:00:00.250Z"
}

event: message
data: {
  "id": "evt-1c",
  "projectId": "proj-9c2b",
  "eventType": "REPLACEMENT_ACCEPTED",
  "summary": "Self-Clearance Accepted: 'Rocket Sparkle Fizz' (NO_ISSUE_SURFACED)",
  "details": {
    "canonicalEntityId": "ent-3b4e-9f12",
    "acceptedName": "Rocket Sparkle Fizz",
    "attemptNumber": 1,
    "totalAttempts": 1,
    "clearanceStatus": "NO_ISSUE_SURFACED"
  },
  "timestamp": "2026-08-18T15:00:00.500Z"
}
```
