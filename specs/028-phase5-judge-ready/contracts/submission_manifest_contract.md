# Contract: Hackathon Submission Manifest & Documentation Integrity

**Contract Type**: Submission Package Compliance Contract
**Deadline**: September 7, 2026

---

## 1. Required Deliverables & Verification Checklist

| Artifact | Required Content / Assertion | Verification Method |
|:---|:---|:---|
| `README.md` | Contains live service URL `https://clearancescout-n3tcx4jcbq-uc.a.run.app` and demo token instructions `judge-pass-2026` | Regex / string search |
| `PROVENANCE.md` | Documents Google ADK, `@google/genai` (`gemini-3.6-flash`), and `parallel-web` SDK usage; confirms 0 prohibited frameworks | Static audit |
| `DEMO_SCRIPT.md` | Structured 3-minute video presentation guide covering Intake, Grounding, Delegation, and Portfolio | Static audit |
| `LICENSE` | Standard open-source MIT License text present in repository root | File inspection |

---

## 2. Model & Framework Compliance Rules

```json
{
  "primaryAgentModel": "gemini-3.6-flash",
  "artworkModel": "Google Imagen 3 / Gemini Image Generation",
  "groundingSdk": "parallel-web",
  "prohibitedFrameworks": [
    "langchain",
    "crewai",
    "autogen",
    "llamaindex",
    "openai",
    "anthropic"
  ],
  "prohibitedFrameworksCount": 0
}
```
