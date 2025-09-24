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
}

export class DocumentAIService {
  private client: any | null = null;
  private enabled = false;

  constructor() {
    const { projectId, location, processorId, keyFile } = (config as any).docai || {};
    const keyFromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const credsPath = keyFile || keyFromEnv;
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
    const request = {
      name,
      rawDocument: {
        content: fileBuffer,
        mimeType: mimeType || this.getMimeType(filePath),
      },
    };

    try {
      const [result] = await this.client.processDocument(request);
      const doc = result.document;
      const text: string = doc?.text || '';
      const pages = Array.isArray(doc?.pages) ? doc.pages.length : undefined;
      return { text, pages };
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
