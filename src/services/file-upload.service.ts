import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import * as XLSX from 'xlsx';
import csv from 'csv-parser';
import pdf from 'pdf-parse';
import { 
  FileUpload, 
  FileType, 
  ProcessedFileData, 
  ParsedTable, 
  FileMetadata,
  AnalysisConfig 
} from '../types/file-analysis';

export class FileUploadService {
  private uploadDir: string;
  private config: AnalysisConfig;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.config = {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '50000000'), // 50MB
      allowedTypes: [
        FileType.CSV,
        FileType.EXCEL,
        FileType.PDF,
        FileType.SQL,
        FileType.JSON,
        FileType.TXT,
        FileType.XML,
      ],
      aiModel: 'gemini-1.5-pro',
      timeout: 300000, // 5 minutes
      enableCache: true,
      cacheExpiry: 24, // 24 hours
      outputFormat: 'detailed',
    };

    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: any, description?: string, tags?: string[]): Promise<FileUpload> {
    // Handle both graphql-upload format and multer format
    let filename: string;
    let mimetype: string;
    let buffer: Buffer;
    let size: number;
    
    if (file.buffer) {
      // Multer format (from our middleware)
      filename = file.filename;
      mimetype = file.mimetype;
      buffer = file.buffer;
      size = file.size;
    } else if (file.createReadStream) {
      // GraphQL Upload format (fallback)
      const { createReadStream, filename: gqlFilename, mimetype: gqlMimetype } = await file;
      filename = gqlFilename;
      mimetype = gqlMimetype;
      
      // Convert stream to buffer
      const stream = createReadStream();
      const chunks: Uint8Array[] = [];
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      buffer = Buffer.concat(chunks);
      size = buffer.length;
    } else {
      throw new Error('Invalid file format');
    }
    
    // Generate unique filename
    const fileId = uuidv4();
    const ext = path.extname(filename);
    const newFilename = `${fileId}${ext}`;
    const filePath = path.join(this.uploadDir, newFilename);

    // Validate file
    await this.validateFile(filename, mimetype);

    // Save file from buffer
    await fs.writeFile(filePath, buffer);
    
    // Determine file type
    const fileType = this.determineFileType(filename, mimetype);
    
    // Extract basic metadata
    const metadata = await this.extractBasicMetadata(filePath, fileType, size);

    const fileUpload: FileUpload = {
      id: fileId,
      filename: newFilename,
      originalName: filename,
      mimetype,
      encoding: 'buffer',
      size,
      path: filePath,
      fileType,
      uploadedAt: new Date(),
      metadata: {
        ...metadata,
        description,
        tags: tags || [],
      },
    };

    return fileUpload;
  }

  async processFile(fileUpload: FileUpload): Promise<ProcessedFileData> {
    const { path: filePath, fileType } = fileUpload;

    switch (fileType) {
      case FileType.CSV:
        return this.processCSV(filePath);
      case FileType.EXCEL:
        return this.processExcel(filePath);
      case FileType.PDF:
        return this.processPDF(filePath);
      case FileType.SQL:
        return this.processSQL(filePath);
      case FileType.JSON:
        return this.processJSON(filePath);
      case FileType.TXT:
        return this.processText(filePath);
      case FileType.XML:
        return this.processXML(filePath);
      default:
        return this.processGeneric(filePath);
    }
  }

  private async validateFile(filename: string, mimetype: string): Promise<void> {
    const fileType = this.determineFileType(filename, mimetype);
    
    if (!this.config.allowedTypes.includes(fileType)) {
      throw new Error(`File type ${fileType} is not allowed`);
    }
  }

  private determineFileType(filename: string, mimetype: string): FileType {
    const ext = path.extname(filename).toLowerCase();
    
    // Check by extension first
    switch (ext) {
      case '.csv':
        return FileType.CSV;
      case '.xlsx':
      case '.xls':
        return FileType.EXCEL;
      case '.pdf':
        return FileType.PDF;
      case '.sql':
        return FileType.SQL;
      case '.json':
        return FileType.JSON;
      case '.txt':
        return FileType.TXT;
      case '.xml':
        return FileType.XML;
    }

    // Check by mimetype
    if (mimetype.includes('csv')) return FileType.CSV;
    if (mimetype.includes('spreadsheet') || mimetype.includes('excel')) return FileType.EXCEL;
    if (mimetype.includes('pdf')) return FileType.PDF;
    if (mimetype.includes('json')) return FileType.JSON;
    if (mimetype.includes('xml')) return FileType.XML;
    if (mimetype.includes('text')) return FileType.TXT;

    return FileType.OTHER;
  }

  private async extractBasicMetadata(filePath: string, fileType: FileType, size: number): Promise<FileMetadata> {
    const metadata: FileMetadata = {
      size,
      type: fileType,
    };

    try {
      switch (fileType) {
        case FileType.CSV:
          const csvSample = await this.readFileChunk(filePath, 1024);
          metadata.delimiter = this.detectCSVDelimiter(csvSample);
          metadata.hasHeaders = this.detectCSVHeaders(csvSample);
          metadata.estimatedRows = await this.estimateCSVRows(filePath);
          break;

        case FileType.EXCEL:
          const workbook = XLSX.readFile(filePath);
          metadata.sheets = workbook.SheetNames;
          metadata.estimatedRows = this.estimateExcelRows(workbook);
          break;

        case FileType.PDF:
          const buffer = await fs.readFile(filePath);
          const pdfData = await pdf(buffer);
          metadata.pages = pdfData.numpages;
          metadata.estimatedRows = pdfData.text.split('\n').length;
          break;
      }
    } catch (error) {
      console.warn('Failed to extract metadata:', error);
    }

    return metadata;
  }

  private async processCSV(filePath: string): Promise<ProcessedFileData> {
    return new Promise((resolve, reject) => {
      const rows: any[][] = [];
      let headers: string[] = [];
      let isFirstRow = true;

      createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headerList: string[]) => {
          headers = headerList;
        })
        .on('data', (data: any) => {
          if (isFirstRow) {
            isFirstRow = false;
            if (!headers.length) {
              headers = Object.keys(data);
            }
          }
          rows.push(Object.values(data));
        })
        .on('end', () => {
          const table: ParsedTable = {
            headers,
            rows,
            rowCount: rows.length,
            columnCount: headers.length,
          };

          resolve({
            content: this.generateCSVSummary(table),
            structured: { table },
            tables: [table],
            metadata: {
              size: 0,
              type: FileType.CSV,
              hasHeaders: true,
              estimatedRows: rows.length,
              delimiter: ',',
            },
          });
        })
        .on('error', reject);
    });
  }

  private async processExcel(filePath: string): Promise<ProcessedFileData> {
    const workbook = XLSX.readFile(filePath);
    const tables: ParsedTable[] = [];
    let content = '';

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length > 0) {
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        const table: ParsedTable = {
          name: sheetName,
          headers,
          rows,
          rowCount: rows.length,
          columnCount: headers.length,
        };
        
        tables.push(table);
        content += this.generateExcelSheetSummary(sheetName, table);
      }
    }

    return {
      content,
      structured: { workbook: workbook.SheetNames, tables },
      tables,
      metadata: {
        size: 0,
        type: FileType.EXCEL,
        sheets: workbook.SheetNames,
        estimatedRows: tables.reduce((sum, t) => sum + t.rowCount, 0),
      },
    };
  }

  private async processPDF(filePath: string): Promise<ProcessedFileData> {
    const buffer = await fs.readFile(filePath);
    const data = await pdf(buffer);

    // Try to extract tables from text
    const tables = this.extractTablesFromText(data.text);

    return {
      content: data.text,
      structured: { 
        pages: data.numpages,
        info: data.info,
        text: data.text,
      },
      tables,
      metadata: {
        size: buffer.length,
        type: FileType.PDF,
        pages: data.numpages,
        estimatedRows: data.text.split('\n').length,
      },
    };
  }

  private async processSQL(filePath: string): Promise<ProcessedFileData> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Extract SQL statements and table structures
    const statements = this.parseSQLStatements(content);
    const tables = this.extractSQLTables(content);

    return {
      content,
      structured: { 
        statements,
        tableDefinitions: tables,
      },
      tables: tables.map(t => ({
        name: t.name,
        headers: t.columns,
        rows: [],
        rowCount: 0,
        columnCount: t.columns.length,
      })),
      metadata: {
        size: Buffer.byteLength(content, 'utf-8'),
        type: FileType.SQL,
        estimatedRows: statements.length,
      },
    };
  }

  private async processJSON(filePath: string): Promise<ProcessedFileData> {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Convert JSON to tabular format if possible
    const tables = this.jsonToTables(data);

    return {
      content: JSON.stringify(data, null, 2),
      structured: data,
      tables,
      metadata: {
        size: Buffer.byteLength(content, 'utf-8'),
        type: FileType.JSON,
        estimatedRows: Array.isArray(data) ? data.length : Object.keys(data).length,
      },
    };
  }

  private async processText(filePath: string): Promise<ProcessedFileData> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Try to extract structured data from text
    const tables = this.extractTablesFromText(content);

    return {
      content,
      structured: { 
        lines: content.split('\n'),
        wordCount: content.split(/\s+/).length,
      },
      tables,
      metadata: {
        size: Buffer.byteLength(content, 'utf-8'),
        type: FileType.TXT,
        estimatedRows: content.split('\n').length,
      },
    };
  }

  private async processXML(filePath: string): Promise<ProcessedFileData> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Basic XML processing - could be enhanced with proper XML parser
    const tables = this.extractXMLTables(content);

    return {
      content,
      structured: { xml: content },
      tables,
      metadata: {
        size: Buffer.byteLength(content, 'utf-8'),
        type: FileType.XML,
        estimatedRows: (content.match(/<[^\/][^>]*>/g) || []).length,
      },
    };
  }

  private async processGeneric(filePath: string): Promise<ProcessedFileData> {
    const content = await fs.readFile(filePath, 'utf-8');

    return {
      content,
      structured: {},
      tables: [],
      metadata: {
        size: Buffer.byteLength(content, 'utf-8'),
        type: FileType.OTHER,
        estimatedRows: content.split('\n').length,
      },
    };
  }

  // Helper methods
  private async readFileChunk(filePath: string, bytes: number): Promise<string> {
    const buffer = Buffer.alloc(bytes);
    const fd = await fs.open(filePath, 'r');
    await fd.read(buffer, 0, bytes, 0);
    await fd.close();
    return buffer.toString('utf-8');
  }

  private detectCSVDelimiter(sample: string): string {
    const delimiters = [',', ';', '\t', '|'];
    let maxCount = 0;
    let bestDelimiter = ',';

    for (const delimiter of delimiters) {
      const count = (sample.match(new RegExp(delimiter, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    }

    return bestDelimiter;
  }

  private detectCSVHeaders(sample: string): boolean {
    const lines = sample.split('\n');
    if (lines.length < 2) return false;

    const firstLine = lines[0].split(',');
    const secondLine = lines[1].split(',');

    // Simple heuristic: if first line has non-numeric values and second line has numeric values
    const firstLineHasText = firstLine.some(cell => isNaN(Number(cell.trim())));
    const secondLineHasNumbers = secondLine.some(cell => !isNaN(Number(cell.trim())));

    return firstLineHasText && secondLineHasNumbers;
  }

  private async estimateCSVRows(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    const sample = await this.readFileChunk(filePath, Math.min(stats.size, 8192));
    const lines = sample.split('\n').length;
    const ratio = stats.size / sample.length;
    return Math.floor(lines * ratio);
  }

  private estimateExcelRows(workbook: XLSX.WorkBook): number {
    return workbook.SheetNames.reduce((total, sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
      return total + (range.e.r - range.s.r + 1);
    }, 0);
  }

  private generateCSVSummary(table: ParsedTable): string {
    return `CSV File Analysis:
- Rows: ${table.rowCount}
- Columns: ${table.columnCount}
- Headers: ${table.headers.join(', ')}
- Sample data: ${JSON.stringify(table.rows.slice(0, 3))}`;
  }

  private generateExcelSheetSummary(sheetName: string, table: ParsedTable): string {
    return `Sheet "${sheetName}":
- Rows: ${table.rowCount}
- Columns: ${table.columnCount}
- Headers: ${table.headers.join(', ')}

`;
  }

  private extractTablesFromText(text: string): ParsedTable[] {
    // Simple table detection - looks for patterns like:
    // Column1 | Column2 | Column3
    // Value1  | Value2  | Value3
    const tables: ParsedTable[] = [];
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i];
      if (line.includes('|') && lines[i + 1].includes('|')) {
        const headers = line.split('|').map(h => h.trim());
        const rows: any[][] = [];
        
        for (let j = i + 1; j < lines.length && lines[j].includes('|'); j++) {
          const row = lines[j].split('|').map(c => c.trim());
          if (row.length === headers.length) {
            rows.push(row);
          } else {
            break;
          }
        }
        
        if (rows.length > 0) {
          tables.push({
            headers,
            rows,
            rowCount: rows.length,
            columnCount: headers.length,
          });
        }
      }
    }
    
    return tables;
  }

  private parseSQLStatements(content: string): string[] {
    return content
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
  }

  private extractSQLTables(content: string): Array<{ name: string; columns: string[] }> {
    const tables: Array<{ name: string; columns: string[] }> = [];
    const createTableRegex = /CREATE\s+TABLE\s+(\w+)\s*\((.*?)\)/gis;
    
    let match;
    while ((match = createTableRegex.exec(content)) !== null) {
      const tableName = match[1];
      const columnsText = match[2];
      const columns = columnsText
        .split(',')
        .map(col => col.trim().split(/\s+/)[0])
        .filter(col => col.length > 0);
      
      tables.push({ name: tableName, columns });
    }
    
    return tables;
  }

  private jsonToTables(data: any): ParsedTable[] {
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      const headers = Object.keys(data[0]);
      const rows = data.map(item => headers.map(header => item[header]));
      
      return [{
        headers,
        rows,
        rowCount: rows.length,
        columnCount: headers.length,
      }];
    }
    
    return [];
  }

  private extractXMLTables(content: string): ParsedTable[] {
    // Basic XML table extraction - could be enhanced with proper XML parsing
    const tables: ParsedTable[] = [];
    // This is a simplified implementation
    // In a real scenario, you'd use a proper XML parser like xml2js
    return tables;
  }

  async deleteFile(fileUpload: FileUpload): Promise<void> {
    try {
      await fs.unlink(fileUpload.path);
    } catch (error) {
      console.warn(`Failed to delete file ${fileUpload.path}:`, error);
    }
  }

  getConfig(): AnalysisConfig {
    return this.config;
  }

  updateConfig(updates: Partial<AnalysisConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}