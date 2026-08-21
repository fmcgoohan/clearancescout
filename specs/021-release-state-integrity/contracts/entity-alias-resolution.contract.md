# Contract: Generic Entity Alias & Acronym Normalization

## Algorithm Specification

The `EntityResolutionEngine` processes input mentions through 5 sequential resolution tiers:

### 1. Punctuation & Case Normalization
- Strip all punctuation characters `[.,-_'"`()[]{}/\\!@#$%^&*+=:;?<>~]`.
- Convert string to lowercase and collapse consecutive whitespace to single space.

### 2. Parenthetical & Delimiter Token Splitting
- Detect parenthetical sub-expressions: `"A.P. (Associated Press)"` → Tokens: `["A.P.", "Associated Press"]`.
- Detect delimiter tokens (`/`, `|`, `aka`, `fka`): `"Associated Press / A.P."` → Tokens: `["Associated Press", "A.P."]`.

### 3. Acronym & Initialism Extraction
- Generate initials from multi-word canonical entity names:
  - `"Associated Press"` → Initials: `["AP", "A.P.", "A. P."]`
  - `"Federal Bureau of Investigation"` → Initials: `["FBI", "F.B.I."]`
- Strip internal periods from mention: `"A.P."` → `"AP"`.

### 4. Canonical Match Verification Test Matrix

| Input Mention | Existing Canonical Entity | Match Result | Rule | Aliases Registered |
|---|---|---|---|---|
| `Associated Press` | *(None)* | **Creates Canonical: "Associated Press"** | `NEW_CANONICAL` | `["Associated Press"]` |
| `A.P.` | `Associated Press` | **Matches "Associated Press"** | `ACRONYM_EQUIVALENCE` | `["A.P.", "AP"]` |
| `AP` | `Associated Press` | **Matches "Associated Press"** | `ACRONYM_EQUIVALENCE` | `["AP"]` |
| `A.P. (Associated Press)` | `Associated Press` | **Matches "Associated Press"** | `PARENTHETICAL_EXPANSION` | `["A.P. (Associated Press)"]` |
| `Associated Press / A.P.` | `Associated Press` | **Matches "Associated Press"** | `DELIMITER_EXPANSION` | `["Associated Press / A.P."]` |
| `Coca-Cola` | *(None)* | **Creates Canonical: "Coca-Cola"** | `NEW_CANONICAL` | `["Coca-Cola"]` |
| `Coke` | `Coca-Cola` | *(Requires alias mapping or user merge)* | `NONE` | - |
| `Midtown Spire Tower` | *(None)* | **Creates Canonical: "Midtown Spire Tower"** | `NEW_CANONICAL` | `["Midtown Spire Tower"]` |
| `Midtown Spire` | `Midtown Spire Tower` | **Matches "Midtown Spire Tower"** | `HIERARCHY_PARENT_MATCH` | `["Midtown Spire"]` |
