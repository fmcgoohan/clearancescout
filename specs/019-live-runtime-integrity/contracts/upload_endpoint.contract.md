# API Contract: Screenplay Multipart Upload Endpoint

**Endpoint**: `POST /api/projects/:projectId/script/upload`  
**Content-Type**: `multipart/form-data`  
**Authentication**: Bearer Token required on protected deployments

---

## 1. Request Specification

### Headers
- `Authorization`: `Bearer <token>` (optional in local `TEST_MODE`, required in public `CLOUD_MODE`)
- `Content-Type`: `multipart/form-data; boundary=----WebKitFormBoundary...`

### Form Fields
- `file`: Binary file buffer (required, `.fountain`, `.txt`, or `.pdf`, max 25MB).
- `draftName`: String (optional, e.g. "Draft 2 Production White").
- `replaceExisting`: Boolean (optional, default `true`).

---

## 2. Response Specification

### 2.1 Success Response (200 OK)

```json
{
  "success": true,
  "projectId": "proj-12345678",
  "filename": "neon_horizon_revised.fountain",
  "format": "FOUNTAIN",
  "draftVersion": 2,
  "characterCount": 48250,
  "scenesIngested": 12,
  "entitiesDetected": 18,
  "occurrencesCreated": 26,
  "chunkCount": 2,
  "uploadedAt": "2026-08-21T01:25:00.000Z",
  "checksumSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

---

### 2.2 Error Responses

#### Empty File (400 Bad Request)
```json
{
  "success": false,
  "errorCode": "EMPTY_FILE",
  "message": "Uploaded screenplay file is empty (0 bytes). Please select a valid script file."
}
```

#### File Too Large (400 Bad Request)
```json
{
  "success": false,
  "errorCode": "FILE_TOO_LARGE",
  "message": "Screenplay file exceeds maximum allowable size (25MB).",
  "maxSizeBytes": 26214400,
  "receivedSizeBytes": 31457280
}
```

#### Unsupported File Format (400 Bad Request)
```json
{
  "success": false,
  "errorCode": "UNSUPPORTED_FORMAT",
  "message": "Unsupported file format. ClearanceScout accepts .fountain, .txt, and .pdf screenplays.",
  "receivedMimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}
```

#### PDF Text Extraction Failed (400 Bad Request)
```json
{
  "success": false,
  "errorCode": "PDF_EXTRACTION_FAILED",
  "message": "Unable to extract text from PDF screenplay. The file appears to be scanned image-only or password protected.",
  "guidance": "Please convert your screenplay to text or Fountain format, or apply OCR before uploading."
}
```

#### Parsing Failed (500 Internal Server Error / 502 Bad Gateway)
```json
{
  "success": false,
  "errorCode": "PARSING_FAILED",
  "message": "Live AI screenplay parsing failed during scene extraction. Please verify model credentials or retry.",
  "diagnostics": "Gemini 3.6 Flash parsing error: Rate limit or network timeout during scene chunk 2."
}
```
