import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import pdfParse from 'pdf-parse';
import { parseString } from 'xml2js';
import { FileType } from '../types/file-analysis';

export interface ParsedData {
  headers: string[];
  rows: any[][];
  metadata: {
    fileSize: number;
    rowCount: number;
    columnCount: number;
    dataTypes: Record<string, string>;
    structure: string;
    summary: string;
  };
  content?: string; // For text/PDF files
}

export class FileParserService {
  
  /**
   * Parse file based on its type and extract structured data
   */
  async parseFile(filePath: string, fileType: FileType, originalName: string): Promise<ParsedData> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    switch (fileType) {
      case FileType.CSV:
        return this.parseCSV(filePath);
      case FileType.EXCEL:
        return this.parseExcel(filePath);
      case FileType.JSON:
        return this.parseJSON(filePath);
      case FileType.PDF:
        return this.parsePDF(filePath);
      case FileType.SQL:
        return this.parseSQL(filePath);
      case FileType.TXT:
        return this.parseText(filePath);
      case FileType.XML:
        return this.parseXML(filePath);
      case FileType.OTHER:
        return this.parseOther(filePath);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Parse CSV files
   */
  private async parseCSV(filePath: string): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
      const rows: any[][] = [];
      let headers: string[] = [];
      let isFirstRow = true;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          if (isFirstRow) {
            headers = Object.keys(data);
            isFirstRow = false;
          }
          rows.push(Object.values(data));
        })
        .on('end', () => {
          const dataTypes = this.inferDataTypes(headers, rows);
          const fileStats = fs.statSync(filePath);
          
          resolve({
            headers,
            rows,
            metadata: {
              fileSize: fileStats.size,
              rowCount: rows.length,
              columnCount: headers.length,
              dataTypes,
              structure: 'tabular',
              summary: `CSV file with ${rows.length} rows and ${headers.length} columns`
            }
          });
        })
        .on('error', reject);
    });
  }

  /**
   * Parse JSON files
   */
  private async parseJSON(filePath: string): Promise<ParsedData> {
    const content = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(content);
    const fileStats = fs.statSync(filePath);
    
    let headers: string[] = [];
    let rows: any[][] = [];
    let structure = 'object';

    if (Array.isArray(jsonData)) {
      structure = 'array';
      if (jsonData.length > 0 && typeof jsonData[0] === 'object') {
        headers = Object.keys(jsonData[0]);
        rows = jsonData.map(item => headers.map(header => item[header]));
      }
    } else if (typeof jsonData === 'object') {
      headers = Object.keys(jsonData);
      rows = [Object.values(jsonData)];
    }

    const dataTypes = this.inferDataTypes(headers, rows);

    return {
      headers,
      rows,
      content,
      metadata: {
        fileSize: fileStats.size,
        rowCount: rows.length,
        columnCount: headers.length,
        dataTypes,
        structure,
        summary: `JSON file with ${structure} structure containing ${rows.length} records`
      }
    };
  }

  /**
   * Parse PDF files
   */
  private async parsePDF(filePath: string): Promise<ParsedData> {
    // Try Google Document AI OCR if available, else fallback to pdf-parse
    let text = '';
    let pages: number | undefined = undefined;
    try {
      const { DocumentAIService } = await import('./document-ai.service');
      const docService = new DocumentAIService();
      if (docService.isAvailable()) {
        const result = await docService.ocr(filePath, 'application/pdf');
        if (result.text) {
          let augmented = result.text;
          if (Array.isArray(result.entities) && result.entities.length) {
            const preview = result.entities
              .slice(0, 10)
              .map(e => `${e.type || 'ENTITY'}:${(e.mentionText || '').toString().slice(0, 50)}`)
              .join('; ');
            augmented += `\n\n[OCR Entities]: ${preview}`;
          }
          text = augmented;
          pages = result.pages;
        }
      }
    } catch (e) {
      // Ignore OCR errors and fallback
    }

    if (!text) {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
      pages = pdfData.numpages;
    }
    const fileStats = fs.statSync(filePath);
    
    // Split text into lines for basic row structure
    const lines = text.split('\n').filter(line => line.trim());
    const rows = lines.map(line => [line.trim()]);

    return {
      headers: ['Content'],
      rows,
      content: text,
      metadata: {
        fileSize: fileStats.size,
        rowCount: lines.length,
        columnCount: 1,
        dataTypes: { Content: 'text' },
        structure: 'document',
        summary: `PDF document with ${pages ?? 'unknown'} pages and ${lines.length} lines of text`
      }
    };
  }

  /**
   * Parse SQL files
   */
  private async parseSQL(filePath: string): Promise<ParsedData> {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileStats = fs.statSync(filePath);
    
    // Split SQL by semicolons to get individual statements
    const statements = content.split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    const rows = statements.map(stmt => [stmt]);

    return {
      headers: ['SQL_Statement'],
      rows,
      content,
      metadata: {
        fileSize: fileStats.size,
        rowCount: statements.length,
        columnCount: 1,
        dataTypes: { SQL_Statement: 'text' },
        structure: 'script',
        summary: `SQL file containing ${statements.length} statements`
      }
    };
  }

  /**
   * Infer data types from the data
   */
  private inferDataTypes(headers: string[], rows: any[][]): Record<string, string> {
    const dataTypes: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      const columnData = rows.map(row => row[index]).filter(val => val != null && val !== '');
      
      if (columnData.length === 0) {
        dataTypes[header] = 'unknown';
        return;
      }

      const sample = columnData.slice(0, 10); // Sample first 10 values
      let numberCount = 0;
      let dateCount = 0;
      let booleanCount = 0;

      sample.forEach(value => {
        const strValue = String(value);
        
        if (!isNaN(Number(strValue)) && strValue.trim() !== '') {
          numberCount++;
        } else if (Date.parse(strValue)) {
          dateCount++;
        } else if (strValue.toLowerCase() === 'true' || strValue.toLowerCase() === 'false') {
          booleanCount++;
        }
      });

      if (numberCount > sample.length * 0.7) {
        dataTypes[header] = 'number';
      } else if (dateCount > sample.length * 0.5) {
        dataTypes[header] = 'date';
      } else if (booleanCount > sample.length * 0.7) {
        dataTypes[header] = 'boolean';
      } else {
        dataTypes[header] = 'text';
      }
    });

    return dataTypes;
  }

  /**
   * Parse Excel files
   */
  private async parseExcel(filePath: string): Promise<ParsedData> {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON format
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const fileStats = fs.statSync(filePath);
    
    if (jsonData.length === 0) {
      return {
        headers: [],
        rows: [],
        metadata: {
          fileSize: fileStats.size,
          rowCount: 0,
          columnCount: 0,
          dataTypes: {},
          structure: 'spreadsheet',
          summary: 'Empty Excel file'
        }
      };
    }
    
    const headers = (jsonData[0] as any[]).map(h => String(h || ''));
    const rows = jsonData.slice(1) as any[][];
    const dataTypes = this.inferDataTypes(headers, rows);
    
    return {
      headers,
      rows,
      metadata: {
        fileSize: fileStats.size,
        rowCount: rows.length,
        columnCount: headers.length,
        dataTypes,
        structure: 'spreadsheet',
        summary: `Excel file with ${rows.length} rows and ${headers.length} columns`
      }
    };
  }

  /**
   * Parse text files
   */
  private async parseText(filePath: string): Promise<ParsedData> {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const fileStats = fs.statSync(filePath);
    const rows = lines.map(line => [line]);
    
    return {
      headers: ['Content'],
      rows,
      content,
      metadata: {
        fileSize: fileStats.size,
        rowCount: lines.length,
        columnCount: 1,
        dataTypes: { Content: 'text' },
        structure: 'text',
        summary: `Text file with ${lines.length} lines`
      }
    };
  }

  /**
   * Parse XML files
   */
  private async parseXML(filePath: string): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileStats = fs.statSync(filePath);
      
      parseString(content, (err, result) => {
        if (err) {
          reject(new Error(`XML parsing failed: ${err.message}`));
          return;
        }
        
        // Flatten XML structure for tabular representation
        const flattenedData = this.flattenXMLObject(result);
        const headers = Object.keys(flattenedData);
        const rows = [Object.values(flattenedData)];
        
        resolve({
          headers,
          rows,
          content,
          metadata: {
            fileSize: fileStats.size,
            rowCount: 1,
            columnCount: headers.length,
            dataTypes: this.inferDataTypes(headers, rows),
            structure: 'xml',
            summary: `XML file with ${headers.length} elements`
          }
        });
      });
    });
  }

  /**
   * Parse other/unknown file types
   */
  private async parseOther(filePath: string): Promise<ParsedData> {
    // If it's an image, try OCR via Document AI
    const ext = path.extname(filePath).toLowerCase();
    const isImage = ['.png', '.jpg', '.jpeg', '.tif', '.tiff', '.gif', '.webp'].includes(ext);
    const fileStats = fs.statSync(filePath);

    if (isImage) {
      try {
        const { DocumentAIService } = await import('./document-ai.service');
        const docService = new DocumentAIService();
        if (docService.isAvailable()) {
          const result = await docService.ocr(filePath);
          let text = result.text || '';
          if (Array.isArray(result.entities) && result.entities.length) {
            const preview = result.entities
              .slice(0, 10)
              .map(e => `${e.type || 'ENTITY'}:${(e.mentionText || '').toString().slice(0, 50)}`)
              .join('; ');
            text += `\n\n[OCR Entities]: ${preview}`;
          }
          const lines = text.split('\n').filter(l => l.trim());
          const rows = lines.map(l => [l.trim()]);
          return {
            headers: ['Content'],
            rows,
            content: text,
            metadata: {
              fileSize: fileStats.size,
              rowCount: lines.length,
              columnCount: 1,
              dataTypes: { Content: 'text' },
              structure: 'image_document',
              summary: `Image document OCR extracted ${lines.length} lines of text`
            }
          };
        }
      } catch (e) {
        // fall through to generic handling
      }
    }

    // Generic text attempt (may fail for binary files)
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').slice(0, 100); // Limit to first 100 lines
    const rows = lines.map(line => [line]);
    return {
      headers: ['Content'],
      rows,
      content,
      metadata: {
        fileSize: fileStats.size,
        rowCount: lines.length,
        columnCount: 1,
        dataTypes: { Content: 'text' },
        structure: 'unknown',
        summary: `Unknown file type with ${lines.length} lines analyzed`
      }
    };
  }

  /**
   * Flatten XML object for tabular representation
   */
  private flattenXMLObject(obj: any, prefix: string = ''): Record<string, any> {
    const flattened: Record<string, any> = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (Array.isArray(obj[key])) {
            flattened[newKey] = JSON.stringify(obj[key]);
          } else {
            Object.assign(flattened, this.flattenXMLObject(obj[key], newKey));
          }
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }
    
    return flattened;
  }
  static determineFileType(filename: string, mimetype?: string): FileType {
    const extension = path.extname(filename).toLowerCase();
    
    // Check by file extension first
    switch (extension) {
      case '.csv':
        return FileType.CSV;
      case '.xlsx':
      case '.xls':
        return FileType.EXCEL;
      case '.json':
        return FileType.JSON;
      case '.pdf':
        return FileType.PDF;
      case '.sql':
        return FileType.SQL;
      case '.txt':
        return FileType.TXT;
      case '.xml':
        return FileType.XML;
      default:
        // Fallback to mimetype if available
        if (mimetype) {
          if (mimetype.includes('csv')) return FileType.CSV;
          if (mimetype.includes('spreadsheet') || mimetype.includes('excel')) return FileType.EXCEL;
          if (mimetype.includes('json')) return FileType.JSON;
          if (mimetype.includes('pdf')) return FileType.PDF;
          if (mimetype.includes('sql')) return FileType.SQL;
          if (mimetype.includes('xml')) return FileType.XML;
          if (mimetype.includes('text')) return FileType.TXT;
        }
        
        return FileType.OTHER;
    }
  }
}