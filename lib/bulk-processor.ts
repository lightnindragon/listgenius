import { NextRequest } from 'next/server';
import { generateListing, buildPrompt, parseOpenAIResponse } from '@/lib/openai';
import { checkAndIncrementGeneration } from '@/lib/generation-quota';
import { sanitizeInput, sanitizeTag, extractFocusKeywords } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { CSVRow } from './csv-parser';

export interface BulkProgress {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  currentRow?: number;
  errors: Array<{
    rowNumber: number;
    error: string;
    data?: any;
  }>;
  startedAt?: Date;
  completedAt?: Date;
}

// In-memory storage for progress tracking (in production, use Redis or database)
const progressStore = new Map<string, BulkProgress>();

export async function processBulkGeneration(
  userId: string,
  rows: CSVRow[],
  bulkImportId: string
): Promise<BulkProgress> {
  const jobId = randomUUID();
  const bulkImportDate = new Date();

  // Initialize progress tracking
  const progress: BulkProgress = {
    jobId,
    status: 'pending',
    totalRows: rows.length,
    processedRows: 0,
    successfulRows: 0,
    failedRows: 0,
    errors: [],
    startedAt: new Date()
  };

  progressStore.set(jobId, progress);

  try {
    // Load platform rules and prompts
    const platformRulesPath = path.join(process.cwd(), 'config/platforms/etsy.json');
    const promptTemplatePath = path.join(process.cwd(), 'config/prompts/etsy-digital.json');
    
    const [platformRules, promptTemplate] = await Promise.all([
      fs.readFile(platformRulesPath, 'utf-8').then(JSON.parse),
      fs.readFile(promptTemplatePath, 'utf-8').then(JSON.parse)
    ]);

    progress.status = 'processing';

    // Process each row sequentially
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      progress.currentRow = i + 1;
      progressStore.set(jobId, progress);

      try {
        // Check quota before each generation
        const quota = await checkAndIncrementGeneration(userId);
        if (!quota.ok) {
          progress.errors.push({
            rowNumber: i + 1,
            error: quota.error || 'Quota exceeded',
            data: row
          });
          progress.failedRows++;
          continue;
        }

        // Generate listing for this row
        const result = await generateSingleRow(userId, row, bulkImportId, bulkImportDate, platformRules, promptTemplate);
        
        if (result.success) {
          progress.successfulRows++;
        } else {
          progress.errors.push({
            rowNumber: i + 1,
            error: result.error || 'Generation failed',
            data: row
          });
          progress.failedRows++;
        }

      } catch (error) {
        progress.errors.push({
          rowNumber: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: row
        });
        progress.failedRows++;
      }

      progress.processedRows++;
      progressStore.set(jobId, progress);
    }

    progress.status = 'completed';
    progress.completedAt = new Date();
    progressStore.set(jobId, progress);

    return progress;

  } catch (error) {
    progress.status = 'failed';
    progress.completedAt = new Date();
    progress.errors.push({
      rowNumber: 0,
      error: error instanceof Error ? error.message : 'Bulk processing failed'
    });
    progressStore.set(jobId, progress);
    return progress;
  }
}

async function generateSingleRow(
  userId: string,
  rowData: CSVRow,
  bulkImportId: string,
  bulkImportDate: Date,
  platformRules: any,
  promptTemplate: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Sanitize inputs
    const sanitizedData = {
      productName: sanitizeInput(rowData.productName),
      niche: rowData.niche ? sanitizeInput(rowData.niche) : undefined,
      audience: rowData.audience ? sanitizeInput(rowData.audience) : undefined,
      keywords: rowData.keywords.map(sanitizeInput),
      tone: rowData.tone || 'Professional',
      wordCount: rowData.wordCount || 300,
      extras: {
        pinterestCaption: rowData.pinterestCaption || false,
        etsyMessage: rowData.etsyMessage || false
      }
    };

    // Extract focus keywords
    const focusKeywords = extractFocusKeywords(sanitizedData.keywords);
    
    // Modify prompt template to include extras if requested
    let modifiedPromptTemplate = promptTemplate.userPromptTemplate;
    let extrasInstructions = '';
    
    if (sanitizedData.extras.pinterestCaption) {
      extrasInstructions += '\n**Pinterest Caption:** Generate a compelling Pinterest caption (max 500 characters) that includes relevant hashtags and encourages clicks.';
    }
    
    if (sanitizedData.extras.etsyMessage) {
      extrasInstructions += '\n**Etsy Thank You Message:** Generate a warm, personalized thank you message for buyers that includes care instructions and encourages reviews.';
    }
    
    if (extrasInstructions) {
      modifiedPromptTemplate += extrasInstructions;
    }
    
    // Build prompt
    const prompt = buildPrompt(modifiedPromptTemplate, {
      productName: sanitizedData.productName,
      niche: sanitizedData.niche || 'Digital Products',
      audience: sanitizedData.audience || 'Etsy shoppers',
      keywords: focusKeywords.join(', '),
      tone: sanitizedData.tone,
      wordCount: sanitizedData.wordCount,
      platformRules: JSON.stringify(platformRules, null, 2)
    });

    // Get model (use GPT-4o for bulk processing)
    const model = process.env.OPENAI_MODEL_GENERATE || 'gpt-4o';

    // Generate listing
    const { content } = await generateListing(prompt, model);
    
    // Parse response
    const parsedOutput = parseOpenAIResponse(content);

    // Validate and sanitize output
    const sanitizedDescription = sanitizeInput(parsedOutput.description || '');
    const sanitizedTitle = sanitizeInput(parsedOutput.title || '');
    
    const validatedOutput = {
      title: sanitizedTitle.substring(0, 200),
      description: sanitizedDescription,
      tags: (parsedOutput.tags || []).slice(0, 13).map(sanitizeTag).filter(Boolean),
      materials: (parsedOutput.materials || []).slice(0, 13).map(sanitizeInput).filter(Boolean),
      pinterestCaption: sanitizedData.extras.pinterestCaption ? sanitizeInput(parsedOutput.pinterestCaption || 'No Pinterest caption generated') : undefined,
      etsyMessage: sanitizedData.extras.etsyMessage ? sanitizeInput(parsedOutput.etsyMessage || 'No Etsy message generated') : undefined,
    };

    // Ensure exactly 13 tags and materials
    while (validatedOutput.tags.length < 13) {
      validatedOutput.tags.push(`tag${validatedOutput.tags.length + 1}`);
    }
    while (validatedOutput.materials.length < 13) {
      validatedOutput.materials.push(`material${validatedOutput.materials.length + 1}`);
    }

    // Save to database
    await prisma.$queryRaw`
      INSERT INTO "SavedGeneration" (id, "userId", title, description, tags, materials, tone, "wordCount", "bulkImportId", "bulkImportDate", source)
      VALUES (${randomUUID()}, ${userId}, ${validatedOutput.title}, ${validatedOutput.description}, ${JSON.stringify(validatedOutput.tags)}::jsonb, ${JSON.stringify(validatedOutput.materials)}::jsonb, ${sanitizedData.tone}, ${sanitizedData.wordCount}, ${bulkImportId}, ${bulkImportDate}, 'bulk')
    `;

    return { success: true };

  } catch (error) {
    console.error('Error generating single row:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export function trackBulkProgress(jobId: string, progress: BulkProgress): void {
  progressStore.set(jobId, progress);
}

export function getBulkProgress(jobId: string): BulkProgress | null {
  return progressStore.get(jobId) || null;
}

export function cleanupProgress(jobId: string): void {
  progressStore.delete(jobId);
}

// Cleanup old progress entries (run periodically)
export function cleanupOldProgress(): void {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  for (const [jobId, progress] of progressStore.entries()) {
    if (progress.completedAt && progress.completedAt < oneHourAgo) {
      progressStore.delete(jobId);
    }
  }
}
