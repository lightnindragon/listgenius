import Papa from 'papaparse';

export interface CSVRow {
  productName: string;
  niche?: string;
  audience?: string;
  keywords: string[];
  tone?: string;
  wordCount?: number;
  pinterestCaption?: boolean;
  etsyMessage?: boolean;
}

export interface ColumnMapping {
  productName: string;
  niche?: string;
  audience?: string;
  keywords: string;
  tone?: string;
  wordCount?: string;
  pinterestCaption?: string;
  etsyMessage?: string;
}

export interface ParsedCSV {
  headers: string[];
  rows: any[];
  columnMapping: ColumnMapping;
  validationErrors: ValidationError[];
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const EXPECTED_HEADERS = {
  productName: ['product name', 'productname', 'name', 'title', 'product_title'],
  niche: ['niche', 'category', 'type'],
  audience: ['audience', 'target audience', 'target_audience', 'target'],
  keywords: ['keywords', 'keyword', 'tags', 'tag'],
  tone: ['tone', 'style', 'voice'],
  wordCount: ['word count', 'wordcount', 'word_count', 'length', 'words'],
  pinterestCaption: ['pinterest caption', 'pinterest_caption', 'pinterest', 'pin caption'],
  etsyMessage: ['etsy message', 'etsy_message', 'etsy', 'thank you', 'thank_you']
};

export function parseCSV(csvContent: string): ParsedCSV {
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim().toLowerCase()
  });

  if (result.errors.length > 0) {
    throw new Error(`CSV parsing error: ${result.errors[0].message}`);
  }

  const headers = result.meta.fields || [];
  const rows = result.data;
  
  // Auto-detect column mapping
  const columnMapping = detectColumnMapping(headers);
  
  // Validate and parse rows
  const validationErrors: ValidationError[] = [];
  const parsedRows = rows.map((row: any, index: number) => {
    const errors = validateRow(row, columnMapping, index + 1);
    validationErrors.push(...errors);
    
    return parseRow(row, columnMapping);
  });

  return {
    headers,
    rows: parsedRows,
    columnMapping,
    validationErrors
  };
}

function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    productName: '',
    keywords: ''
  };

  // Find best match for each field
  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim();
    
    // Product Name (required)
    if (EXPECTED_HEADERS.productName.some(h => normalizedHeader.includes(h))) {
      mapping.productName = header;
    }
    
    // Keywords (required)
    if (EXPECTED_HEADERS.keywords.some(h => normalizedHeader.includes(h))) {
      mapping.keywords = header;
    }
    
    // Optional fields
    if (EXPECTED_HEADERS.niche.some(h => normalizedHeader.includes(h))) {
      mapping.niche = header;
    }
    
    if (EXPECTED_HEADERS.audience.some(h => normalizedHeader.includes(h))) {
      mapping.audience = header;
    }
    
    if (EXPECTED_HEADERS.tone.some(h => normalizedHeader.includes(h))) {
      mapping.tone = header;
    }
    
    if (EXPECTED_HEADERS.wordCount.some(h => normalizedHeader.includes(h))) {
      mapping.wordCount = header;
    }
    
    if (EXPECTED_HEADERS.pinterestCaption.some(h => normalizedHeader.includes(h))) {
      mapping.pinterestCaption = header;
    }
    
    if (EXPECTED_HEADERS.etsyMessage.some(h => normalizedHeader.includes(h))) {
      mapping.etsyMessage = header;
    }
  }

  return mapping;
}

function validateRow(row: any, mapping: ColumnMapping, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate required fields
  if (!mapping.productName || !row[mapping.productName]?.trim()) {
    errors.push({
      row: rowNumber,
      field: 'productName',
      message: 'Product name is required'
    });
  }

  if (!mapping.keywords || !row[mapping.keywords]?.trim()) {
    errors.push({
      row: rowNumber,
      field: 'keywords',
      message: 'Keywords are required'
    });
  }

  // Validate optional fields
  if (mapping.tone && row[mapping.tone]) {
    const validTones = ['Professional', 'Friendly', 'Casual', 'Formal', 'Enthusiastic', 'Warm', 'Creative', 'Luxury', 'Playful', 'Minimalist', 'Artistic', 'Rustic', 'Modern', 'Vintage', 'Elegant'];
    if (!validTones.includes(row[mapping.tone])) {
      errors.push({
        row: rowNumber,
        field: 'tone',
        message: `Invalid tone. Must be one of: ${validTones.join(', ')}`
      });
    }
  }

  if (mapping.wordCount && row[mapping.wordCount]) {
    const wordCount = parseInt(row[mapping.wordCount]);
    if (isNaN(wordCount) || wordCount < 200 || wordCount > 600) {
      errors.push({
        row: rowNumber,
        field: 'wordCount',
        message: 'Word count must be a number between 200 and 600'
      });
    }
  }

  if (mapping.pinterestCaption && row[mapping.pinterestCaption]) {
    const value = row[mapping.pinterestCaption].toLowerCase();
    if (!['true', 'false', '1', '0', 'yes', 'no'].includes(value)) {
      errors.push({
        row: rowNumber,
        field: 'pinterestCaption',
        message: 'Pinterest caption must be true/false, 1/0, or yes/no'
      });
    }
  }

  if (mapping.etsyMessage && row[mapping.etsyMessage]) {
    const value = row[mapping.etsyMessage].toLowerCase();
    if (!['true', 'false', '1', '0', 'yes', 'no'].includes(value)) {
      errors.push({
        row: rowNumber,
        field: 'etsyMessage',
        message: 'Etsy message must be true/false, 1/0, or yes/no'
      });
    }
  }

  return errors;
}

function parseRow(row: any, mapping: ColumnMapping): CSVRow {
  const parseKeywords = (keywordsStr: string): string[] => {
    if (!keywordsStr) return [];
    
    // Split by comma, semicolon, or pipe
    return keywordsStr
      .split(/[,;|]/)
      .map(k => k.trim())
      .filter(k => k.length > 0);
  };

  const parseBoolean = (value: string): boolean => {
    if (!value) return false;
    const normalized = value.toLowerCase().trim();
    return ['true', '1', 'yes'].includes(normalized);
  };

  return {
    productName: row[mapping.productName]?.trim() || '',
    niche: mapping.niche ? row[mapping.niche]?.trim() : undefined,
    audience: mapping.audience ? row[mapping.audience]?.trim() : undefined,
    keywords: mapping.keywords ? parseKeywords(row[mapping.keywords]) : [],
    tone: mapping.tone ? row[mapping.tone]?.trim() : 'Professional',
    wordCount: mapping.wordCount ? parseInt(row[mapping.wordCount]) || 300 : 300,
    pinterestCaption: mapping.pinterestCaption ? parseBoolean(row[mapping.pinterestCaption]) : false,
    etsyMessage: mapping.etsyMessage ? parseBoolean(row[mapping.etsyMessage]) : false
  };
}

export function validateColumnMapping(mapping: ColumnMapping): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!mapping.productName) {
    errors.push({
      row: 0,
      field: 'productName',
      message: 'Product name column is required'
    });
  }

  if (!mapping.keywords) {
    errors.push({
      row: 0,
      field: 'keywords',
      message: 'Keywords column is required'
    });
  }

  return errors;
}

export function getAvailableHeaders(headers: string[]): string[] {
  return headers.filter(header => header && header.trim().length > 0);
}
