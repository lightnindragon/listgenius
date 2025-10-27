import Papa from 'papaparse';

export interface SavedGenerationExport {
  id: string;
  title: string;
  description: string;
  tags: string[];
  materials: string[];
  tone?: string;
  wordCount?: number;
  bulkImportId?: string;
  bulkImportDate?: string;
  source?: string;
  createdAt: string;
}

export function generateCSVFromGenerations(generations: SavedGenerationExport[]): string {
  // Convert generations to CSV format
  const csvData = generations.map(gen => ({
    'ID': gen.id,
    'Title': gen.title,
    'Description': gen.description,
    'Tags': Array.isArray(gen.tags) ? gen.tags.join(', ') : gen.tags,
    'Materials': Array.isArray(gen.materials) ? gen.materials.join(', ') : gen.materials,
    'Tone': gen.tone || '',
    'Word Count': gen.wordCount || '',
    'Bulk Import ID': gen.bulkImportId || '',
    'Bulk Import Date': gen.bulkImportDate || '',
    'Source': gen.source || 'manual',
    'Created At': gen.createdAt
  }));

  // Generate CSV with BOM for Excel compatibility
  const csv = Papa.unparse(csvData, {
    header: true,
    delimiter: ',',
    quotes: true,
    quoteChar: '"',
    escapeChar: '"'
  });

  // Add BOM for Excel compatibility
  return '\uFEFF' + csv;
}

export function generateTemplateCSV(): string {
  const templateData = [
    {
      'Product Name': 'Sample Wedding Planner Template',
      'Niche': 'Wedding Planning',
      'Target Audience': 'Brides-to-be',
      'Keywords': 'wedding planner, digital download, printable',
      'Tone': 'Professional',
      'Word Count': '300',
      'Pinterest Caption': 'true',
      'Etsy Message': 'false'
    },
    {
      'Product Name': 'Custom Logo Design',
      'Niche': 'Graphic Design',
      'Target Audience': 'Small business owners',
      'Keywords': 'logo design, branding, custom',
      'Tone': 'Creative',
      'Word Count': '400',
      'Pinterest Caption': 'false',
      'Etsy Message': 'true'
    }
  ];

  const csv = Papa.unparse(templateData, {
    header: true,
    delimiter: ',',
    quotes: true,
    quoteChar: '"',
    escapeChar: '"'
  });

  // Add BOM for Excel compatibility
  return '\uFEFF' + csv;
}

export function generateFailedRowsCSV(failedRows: Array<{
  rowNumber: number;
  data: any;
  error: string;
}>): string {
  const csvData = failedRows.map(row => ({
    'Row Number': row.rowNumber,
    'Product Name': row.data.productName || '',
    'Niche': row.data.niche || '',
    'Target Audience': row.data.audience || '',
    'Keywords': Array.isArray(row.data.keywords) ? row.data.keywords.join(', ') : row.data.keywords || '',
    'Tone': row.data.tone || '',
    'Word Count': row.data.wordCount || '',
    'Pinterest Caption': row.data.pinterestCaption || '',
    'Etsy Message': row.data.etsyMessage || '',
    'Error': row.error
  }));

  const csv = Papa.unparse(csvData, {
    header: true,
    delimiter: ',',
    quotes: true,
    quoteChar: '"',
    escapeChar: '"'
  });

  // Add BOM for Excel compatibility
  return '\uFEFF' + csv;
}

export function parseCSVToGenerations(csvContent: string): SavedGenerationExport[] {
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true
  });

  if (result.errors.length > 0) {
    throw new Error(`CSV parsing error: ${result.errors[0].message}`);
  }

  return result.data.map((row: any) => ({
    id: row['ID'] || '',
    title: row['Title'] || '',
    description: row['Description'] || '',
    tags: typeof row['Tags'] === 'string' ? row['Tags'].split(',').map((t: string) => t.trim()) : [],
    materials: typeof row['Materials'] === 'string' ? row['Materials'].split(',').map((m: string) => m.trim()) : [],
    tone: row['Tone'] || undefined,
    wordCount: row['Word Count'] ? parseInt(row['Word Count']) : undefined,
    bulkImportId: row['Bulk Import ID'] || undefined,
    bulkImportDate: row['Bulk Import Date'] || undefined,
    source: row['Source'] || 'manual',
    createdAt: row['Created At'] || new Date().toISOString()
  }));
}
