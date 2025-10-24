// Vercel API integration for environment variable management
import { logger } from './logger';

interface VercelEnvVar {
  key: string;
  value: string;
  type: 'encrypted' | 'plain' | 'system';
  target: ('production' | 'preview' | 'development')[];
}

interface VercelProject {
  id: string;
  name: string;
  accountId: string;
}

export class VercelAPI {
  private apiToken: string;
  private projectId: string;
  private teamId?: string;

  constructor() {
    this.apiToken = process.env.VERCEL_API_TOKEN || '';
    this.projectId = process.env.VERCEL_PROJECT_ID || '';
    this.teamId = process.env.VERCEL_TEAM_ID;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  private getBaseUrl() {
    const teamParam = this.teamId ? `?teamId=${this.teamId}` : '';
    return `https://api.vercel.com/v9/projects/${this.projectId}${teamParam}`;
  }

  async getEnvironmentVariables(): Promise<VercelEnvVar[]> {
    if (!this.apiToken || !this.projectId) {
      throw new Error('Vercel API credentials not configured');
    }

    try {
      const response = await fetch(`${this.getBaseUrl()}/env`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Vercel API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.envs || [];
    } catch (error) {
      logger.error('Error fetching Vercel environment variables:', error);
      throw error;
    }
  }

  async updateEnvironmentVariable(
    key: string,
    value: string,
    target: ('production' | 'preview' | 'development')[] = ['production']
  ): Promise<VercelEnvVar> {
    if (!this.apiToken || !this.projectId) {
      throw new Error('Vercel API credentials not configured');
    }

    try {
      const response = await fetch(`${this.getBaseUrl()}/env`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          key,
          value,
          type: 'plain',
          target,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Vercel API error: ${response.status} ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error updating Vercel environment variable:', error);
      throw error;
    }
  }

  async deleteEnvironmentVariable(key: string): Promise<void> {
    if (!this.apiToken || !this.projectId) {
      throw new Error('Vercel API credentials not configured');
    }

    try {
      // First, get the environment variable ID
      const envVars = await this.getEnvironmentVariables();
      const envVar = envVars.find(env => env.key === key);

      if (!envVar) {
        throw new Error(`Environment variable ${key} not found`);
      }

      const response = await fetch(`${this.getBaseUrl()}/env/${envVar.key}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Vercel API error: ${response.status} ${errorData.error?.message || response.statusText}`);
      }
    } catch (error) {
      logger.error('Error deleting Vercel environment variable:', error);
      throw error;
    }
  }

  async getProject(): Promise<VercelProject> {
    if (!this.apiToken || !this.projectId) {
      throw new Error('Vercel API credentials not configured');
    }

    try {
      const response = await fetch(`${this.getBaseUrl()}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Vercel API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error fetching Vercel project:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!(this.apiToken && this.projectId);
  }
}

export const vercelAPI = new VercelAPI();
