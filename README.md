# smartbi_backend
This is SmartBi backend code

## Document AI OCR (optional)
- Set `GCP_PROJECT_ID`, `DOCUMENT_AI_LOCATION`, `DOCUMENT_AI_PROCESSOR_ID` in `.env`.
- Provide credentials via `GOOGLE_APPLICATION_CREDENTIALS` (service account JSON path).
- Install deps: npm install (includes `@google-cloud/documentai`).
- If not configured, system falls back to built-in PDF text extraction.
