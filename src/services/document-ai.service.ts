import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/environment';

// Lazy import to avoid requiring the package when not configured
let DocumentProcessorServiceClient: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  DocumentProcessorServiceClient = require('@google-cloud/documentai').v1.DocumentProcessorServiceClient;
} catch (e) {
  DocumentProcessorServiceClient = null;
}

export interface OCRResult {
  text: string;
  pages?: number;
  pageSummaries?: Array<{ pageNumber: number; blocks: number }>;
  entities?: Array<{ type?: string; mentionText?: string; confidence?: number }>;
}

export class DocumentAIService {
  private client: any | null = null;
  private enabled = false;

  constructor() {
    const { projectId, location, processorId, keyFile } = (config as any).docai || {};
    const keyFromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const credsPath = keyFile || keyFromEnv;

    // If a service account JSON is provided as an env var (GCP_SERVICE_ACCOUNT_KEY),
    // write it to /tmp and set GOOGLE_APPLICATION_CREDENTIALS so the client can pick it up.
    const gcpKeyJson = process.env.GCP_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (gcpKeyJson && !credsPath) {
      try {
        const tmpPath = path.join('/tmp', 'gcp-credentials.json');
        // write file synchronously at startup
        void fs.writeFile(tmpPath, gcpKeyJson, 'utf8').then(() => {
          process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
          console.log('✅ Wrote GCP service account JSON to', tmpPath);
        }).catch((err) => {
          console.warn('⚠️ Failed to write GCP credentials to /tmp:', err);
        });
      } catch (err) {
        console.warn('⚠️ Could not initialize GCP keyfile from env:', err);
      }
    }
    if (projectId && location && processorId && DocumentProcessorServiceClient) {
      const apiEndpoint = `${location}-documentai.googleapis.com`;
      const clientOptions: any = { apiEndpoint };
      if (credsPath) clientOptions.keyFilename = credsPath;
      try {
        this.client = new DocumentProcessorServiceClient(clientOptions);
        this.enabled = true;
        console.log(`✅ Document AI initialized for location ${location} at ${apiEndpoint}`);
      } catch (e) {
        console.log('ℹ️ Document AI client init failed; OCR disabled.', e);
        this.client = null;
        this.enabled = false;
      }
    } else {
      if (!DocumentProcessorServiceClient) {
        console.log('ℹ️ @google-cloud/documentai not installed; OCR disabled.');
      } else {
        console.log('ℹ️ Document AI not configured; OCR disabled.');
      }
    }
  }

  isAvailable(): boolean {
    return this.enabled && !!this.client;
  }

  async ocr(filePath: string, mimeType?: string): Promise<OCRResult> {
    if (!this.isAvailable()) {
      throw new Error('Document AI not configured');
    }

    const { projectId, location, processorId } = config.docai;
    const name = this.client.processorPath(projectId, location, processorId);

    const fileBuffer = await fs.readFile(filePath);
    const encoded = fileBuffer.toString('base64');
    const request = {
      name,
      rawDocument: {
        content: encoded,
        mimeType: mimeType || this.getMimeType(filePath),
      },
    } as any;

    try {
      const [result] = await this.client.processDocument(request);
      const doc = result.document || {};
      const text: string = (doc as any).text || '';
      const pages = Array.isArray((doc as any).pages) ? (doc as any).pages.length : undefined;
      const pageSummaries = Array.isArray((doc as any).pages)
        ? (doc as any).pages.map((p: any, idx: number) => ({ pageNumber: idx + 1, blocks: p.blocks ? p.blocks.length : 0 }))
        : undefined;
      const entities = Array.isArray((doc as any).entities)
        ? (doc as any).entities.map((e: any) => ({ type: e.type, mentionText: e.mentionText, confidence: e.confidence }))
        : undefined;

      // Console preview + save full text to file
      const previewLen = Math.min(2000, text.length);
      console.log(`📝 OCR extracted text preview (${previewLen}/${text.length} chars) from ${path.basename(filePath)}:`);
      if (previewLen > 0) {
        console.log('--- OCR TEXT START ---');
        console.log(text.slice(0, previewLen));
        if (text.length > previewLen) console.log('... [truncated]');
        console.log('--- OCR TEXT END ---');
      } else {
        console.log('[no text extracted]');
      }
      try {
        const outPath = `${filePath}.ocr.txt`;
        await fs.writeFile(outPath, text, 'utf8');
        console.log(`💾 Full OCR text saved to: ${outPath}`);
      } catch (writeErr) {
        console.warn('⚠️ Could not save OCR text to file:', writeErr);
      }

      return { text, pages, pageSummaries, entities };
    } catch (err) {
      const msg = String((err as any)?.message || err);
      if (msg.includes('Could not load the default credentials')) {
        console.warn('⚠️ Document AI credentials not found; set GOOGLE_APPLICATION_CREDENTIALS or DOCUMENT_AI_KEYFILE. Falling back to built-in parsing.');
      } else {
        console.warn('Document AI OCR failed, falling back:', err);
      }
      return { text: '', pages: undefined };
    }
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.pdf': return 'application/pdf';
      case '.png': return 'image/png';
      case '.jpg':
      case '.jpeg': return 'image/jpeg';
      case '.tif':
      case '.tiff': return 'image/tiff';
      case '.gif': return 'image/gif';
      case '.webp': return 'image/webp';
      default: return 'application/octet-stream';
    }
  }
}
