import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST GENERATION API CALLED ===');
    
    // Test authentication
    const { userId } = await auth();
    console.log('User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required',
        step: 'auth'
      }, { status: 401 });
    }
    
    // Test environment variables
    const envCheck = {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
      NODE_ENV: process.env.NODE_ENV
    };
    console.log('Environment check:', envCheck);
    
    // Test file system access
    const platformRulesPath = path.join(process.cwd(), 'config/platforms/etsy.json');
    const promptTemplatePath = path.join(process.cwd(), 'config/prompts/etsy-digital.json');
    
    console.log('Testing file access...');
    console.log('Platform rules path:', platformRulesPath);
    console.log('Prompt template path:', promptTemplatePath);
    console.log('Current working directory:', process.cwd());
    
    let fileAccess = { platformRules: false, promptTemplate: false };
    
    try {
      await fs.access(platformRulesPath);
      fileAccess.platformRules = true;
      console.log('Platform rules file accessible');
    } catch (error) {
      console.error('Platform rules file not accessible:', error);
    }
    
    try {
      await fs.access(promptTemplatePath);
      fileAccess.promptTemplate = true;
      console.log('Prompt template file accessible');
    } catch (error) {
      console.error('Prompt template file not accessible:', error);
    }
    
    // Test reading files
    let fileRead = { platformRules: false, promptTemplate: false };
    
    try {
      const platformRulesContent = await fs.readFile(platformRulesPath, 'utf-8');
      JSON.parse(platformRulesContent);
      fileRead.platformRules = true;
      console.log('Platform rules file read and parsed successfully');
    } catch (error) {
      console.error('Platform rules file read/parse error:', error);
    }
    
    try {
      const promptTemplateContent = await fs.readFile(promptTemplatePath, 'utf-8');
      JSON.parse(promptTemplateContent);
      fileRead.promptTemplate = true;
      console.log('Prompt template file read and parsed successfully');
    } catch (error) {
      console.error('Prompt template file read/parse error:', error);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        userId,
        environment: envCheck,
        fileAccess,
        fileRead,
        cwd: process.cwd(),
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Test generation error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack,
      step: 'general'
    }, { status: 500 });
  }
}
