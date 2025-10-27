import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { parseCSV, validateColumnMapping, getAvailableHeaders } from '@/lib/csv-parser';
import { PLAN_CONFIG } from '@/lib/entitlements';
import { getUserPlanSimple } from '@/lib/entitlements';
import { createClerkClient } from '@clerk/nextjs/server';

let clerkClient: any;
try {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY not found in environment variables');
  }
  clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
} catch (error) {
  console.error('Failed to initialize Clerk client:', error);
  throw error;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user plan
    const user = await clerkClient.users.getUser(userId);
    const plan = await getUserPlanSimple(user);
    
    if (plan === 'free') {
      return NextResponse.json({ 
        error: 'CSV bulk upload is only available for Pro and Business plans. Please upgrade to use this feature.' 
      }, { status: 402 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV file' }, { status: 400 });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Read file content
    const csvContent = await file.text();
    
    if (!csvContent.trim()) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Parse CSV
    const parsedCSV = parseCSV(csvContent);
    
    // Validate column mapping
    const mappingErrors = validateColumnMapping(parsedCSV.columnMapping);
    if (mappingErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Required columns not found',
        details: mappingErrors,
        needsMapping: true,
        headers: getAvailableHeaders(parsedCSV.headers)
      }, { status: 400 });
    }

    // Return parsed data for preview
    return NextResponse.json({
      success: true,
      data: {
        headers: parsedCSV.headers,
        rows: parsedCSV.rows.slice(0, 5), // Preview first 5 rows
        totalRows: parsedCSV.rows.length,
        columnMapping: parsedCSV.columnMapping,
        validationErrors: parsedCSV.validationErrors
      }
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    
    if (error instanceof Error && error.message.includes('CSV parsing error')) {
      return NextResponse.json({ 
        error: 'Invalid CSV format',
        details: error.message 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Failed to process CSV file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
