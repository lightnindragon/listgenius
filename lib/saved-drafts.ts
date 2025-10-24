import { logger } from './logger';

// Draft data structures
export interface ListingDraft {
  id: string;
  userId: string;
  title?: string;
  description?: string;
  tags: string[];
  keywords: string[];
  tone?: string;
  niche?: string;
  audience?: string;
  wordCount?: number;
  price?: number;
  quantity?: number;
  materials: string[];
  shopSection?: string;
  shippingProfile?: string;
  isDraft: boolean;
  isAutoSaved: boolean;
  completionPct: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DraftStats {
  totalDrafts: number;
  autoSavedDrafts: number;
  manuallySavedDrafts: number;
  averageCompletion: number;
  recentlyModified: ListingDraft[];
}

// Saved Drafts Manager
export class SavedDraftsManager {
  private drafts: Map<string, ListingDraft> = new Map();
  private autoSaveInterval: number = 30000; // 30 seconds
  private autoSaveTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    logger.info('SavedDraftsManager initialized');
  }

  // Save draft manually
  public async saveDraft(
    userId: string, 
    listingData: Partial<ListingDraft>
  ): Promise<ListingDraft> {
    try {
      const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const draft: ListingDraft = {
        id: draftId,
        userId,
        title: listingData.title || '',
        description: listingData.description || '',
        tags: listingData.tags || [],
        keywords: listingData.keywords || [],
        tone: listingData.tone || 'Professional',
        niche: listingData.niche || '',
        audience: listingData.audience || '',
        wordCount: listingData.wordCount || 300,
        price: listingData.price,
        quantity: listingData.quantity || 1,
        materials: listingData.materials || [],
        shopSection: listingData.shopSection || '',
        shippingProfile: listingData.shippingProfile || '',
        isDraft: true,
        isAutoSaved: false,
        completionPct: this.calculateCompletionPercentage(listingData),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.drafts.set(draftId, draft);
      
      logger.info('Draft saved manually', { draftId, userId, completionPct: draft.completionPct });
      
      return draft;
    } catch (error) {
      logger.error('Failed to save draft', { error, userId });
      throw new Error('Failed to save draft');
    }
  }

  // Auto-save draft
  public async autoSaveDraft(
    userId: string, 
    listingData: Partial<ListingDraft>,
    existingDraftId?: string
  ): Promise<ListingDraft> {
    try {
      let draft: ListingDraft;

      if (existingDraftId && this.drafts.has(existingDraftId)) {
        // Update existing draft
        const existingDraft = this.drafts.get(existingDraftId)!;
        draft = {
          ...existingDraft,
          title: listingData.title || existingDraft.title,
          description: listingData.description || existingDraft.description,
          tags: listingData.tags || existingDraft.tags,
          keywords: listingData.keywords || existingDraft.keywords,
          tone: listingData.tone || existingDraft.tone,
          niche: listingData.niche || existingDraft.niche,
          audience: listingData.audience || existingDraft.audience,
          wordCount: listingData.wordCount || existingDraft.wordCount,
          price: listingData.price !== undefined ? listingData.price : existingDraft.price,
          quantity: listingData.quantity !== undefined ? listingData.quantity : existingDraft.quantity,
          materials: listingData.materials || existingDraft.materials,
          shopSection: listingData.shopSection || existingDraft.shopSection,
          shippingProfile: listingData.shippingProfile || existingDraft.shippingProfile,
          isAutoSaved: true,
          completionPct: this.calculateCompletionPercentage(listingData),
          updatedAt: new Date()
        };
      } else {
        // Create new auto-saved draft
        const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        draft = {
          id: draftId,
          userId,
          title: listingData.title || '',
          description: listingData.description || '',
          tags: listingData.tags || [],
          keywords: listingData.keywords || [],
          tone: listingData.tone || 'Professional',
          niche: listingData.niche || '',
          audience: listingData.audience || '',
          wordCount: listingData.wordCount || 300,
          price: listingData.price,
          quantity: listingData.quantity || 1,
          materials: listingData.materials || [],
          shopSection: listingData.shopSection || '',
          shippingProfile: listingData.shippingProfile || '',
          isDraft: true,
          isAutoSaved: true,
          completionPct: this.calculateCompletionPercentage(listingData),
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      this.drafts.set(draft.id, draft);
      
      logger.info('Draft auto-saved', { draftId: draft.id, userId, completionPct: draft.completionPct });
      
      return draft;
    } catch (error) {
      logger.error('Failed to auto-save draft', { error, userId });
      throw new Error('Failed to auto-save draft');
    }
  }

  // Load draft
  public async loadDraft(draftId: string): Promise<ListingDraft | null> {
    try {
      const draft = this.drafts.get(draftId);
      if (draft) {
        logger.info('Draft loaded', { draftId });
        return draft;
      }
      return null;
    } catch (error) {
      logger.error('Failed to load draft', { error, draftId });
      return null;
    }
  }

  // Get user's drafts
  public async getUserDrafts(userId: string): Promise<ListingDraft[]> {
    try {
      const userDrafts = Array.from(this.drafts.values()).filter(
        draft => draft.userId === userId
      );

      return userDrafts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      logger.error('Failed to get user drafts', { error, userId });
      return [];
    }
  }

  // Delete draft
  public async deleteDraft(draftId: string, userId: string): Promise<boolean> {
    try {
      const draft = this.drafts.get(draftId);
      if (!draft) {
        throw new Error('Draft not found');
      }

      if (draft.userId !== userId) {
        throw new Error('Unauthorized to delete draft');
      }

      this.drafts.delete(draftId);
      
      // Clear auto-save timeout if exists
      const timeout = this.autoSaveTimeouts.get(draftId);
      if (timeout) {
        clearTimeout(timeout);
        this.autoSaveTimeouts.delete(draftId);
      }
      
      logger.info('Draft deleted', { draftId, userId });
      return true;
    } catch (error) {
      logger.error('Failed to delete draft', { error, draftId, userId });
      return false;
    }
  }

  // Update draft
  public async updateDraft(
    draftId: string, 
    userId: string, 
    updates: Partial<ListingDraft>
  ): Promise<ListingDraft | null> {
    try {
      const draft = this.drafts.get(draftId);
      if (!draft) {
        throw new Error('Draft not found');
      }

      if (draft.userId !== userId) {
        throw new Error('Unauthorized to update draft');
      }

      const updatedDraft = {
        ...draft,
        ...updates,
        completionPct: this.calculateCompletionPercentage({ ...draft, ...updates }),
        updatedAt: new Date()
      };

      this.drafts.set(draftId, updatedDraft);
      
      logger.info('Draft updated', { draftId, userId });
      return updatedDraft;
    } catch (error) {
      logger.error('Failed to update draft', { error, draftId, userId });
      return null;
    }
  }

  // Calculate completion percentage
  public calculateCompletionPercentage(listingData: Partial<ListingDraft>): number {
    const fields = [
      'title',
      'description',
      'tags',
      'tone',
      'niche',
      'audience',
      'price',
      'materials'
    ];

    let completedFields = 0;
    let totalFields = fields.length;

    fields.forEach(field => {
      const value = listingData[field as keyof ListingDraft];
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          if (value.length > 0) completedFields++;
        } else if (typeof value === 'string') {
          if (value.trim().length > 0) completedFields++;
        } else if (typeof value === 'number') {
          if (value > 0) completedFields++;
        }
      }
    });

    return Math.round((completedFields / totalFields) * 100);
  }

  // Get draft progress
  public getDraftProgress(draft: ListingDraft): number {
    return draft.completionPct;
  }

  // Schedule auto-save
  public scheduleAutoSave(
    userId: string, 
    listingData: Partial<ListingDraft>,
    existingDraftId?: string
  ): string {
    // Clear existing timeout
    if (existingDraftId) {
      const existingTimeout = this.autoSaveTimeouts.get(existingDraftId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
    }

    // Schedule new auto-save
    const timeoutId = setTimeout(async () => {
      try {
        await this.autoSaveDraft(userId, listingData, existingDraftId);
      } catch (error) {
        logger.error('Auto-save failed', { error, userId });
      }
    }, this.autoSaveInterval);

    // Store timeout ID
    const draftId = existingDraftId || `temp_${Date.now()}`;
    this.autoSaveTimeouts.set(draftId, timeoutId);

    return draftId;
  }

  // Cancel auto-save
  public cancelAutoSave(draftId: string): void {
    const timeout = this.autoSaveTimeouts.get(draftId);
    if (timeout) {
      clearTimeout(timeout);
      this.autoSaveTimeouts.delete(draftId);
    }
  }

  // Get draft statistics
  public async getDraftStats(userId: string): Promise<DraftStats> {
    try {
      const userDrafts = await this.getUserDrafts(userId);
      
      const autoSavedDrafts = userDrafts.filter(draft => draft.isAutoSaved).length;
      const manuallySavedDrafts = userDrafts.filter(draft => !draft.isAutoSaved).length;
      
      const averageCompletion = userDrafts.length > 0 
        ? userDrafts.reduce((sum, draft) => sum + draft.completionPct, 0) / userDrafts.length
        : 0;

      const recentlyModified = userDrafts.slice(0, 5);

      return {
        totalDrafts: userDrafts.length,
        autoSavedDrafts,
        manuallySavedDrafts,
        averageCompletion: Math.round(averageCompletion),
        recentlyModified
      };
    } catch (error) {
      logger.error('Failed to get draft stats', { error, userId });
      return {
        totalDrafts: 0,
        autoSavedDrafts: 0,
        manuallySavedDrafts: 0,
        averageCompletion: 0,
        recentlyModified: []
      };
    }
  }

  // Search drafts
  public async searchDrafts(userId: string, query: string): Promise<ListingDraft[]> {
    try {
      const userDrafts = await this.getUserDrafts(userId);
      const searchQuery = query.toLowerCase();
      
      return userDrafts.filter(draft => 
        draft.title?.toLowerCase().includes(searchQuery) ||
        draft.description?.toLowerCase().includes(searchQuery) ||
        draft.tags.some(tag => tag.toLowerCase().includes(searchQuery)) ||
        draft.niche?.toLowerCase().includes(searchQuery)
      );
    } catch (error) {
      logger.error('Failed to search drafts', { error, userId, query });
      return [];
    }
  }

  // Clean up old auto-saved drafts
  public async cleanupOldDrafts(userId: string, daysOld: number = 30): Promise<number> {
    try {
      const userDrafts = await this.getUserDrafts(userId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      let deletedCount = 0;
      
      userDrafts.forEach(draft => {
        if (draft.isAutoSaved && draft.updatedAt < cutoffDate) {
          this.drafts.delete(draft.id);
          deletedCount++;
        }
      });
      
      logger.info('Old drafts cleaned up', { userId, deletedCount, daysOld });
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old drafts', { error, userId });
      return 0;
    }
  }

  // Export draft as template
  public async exportDraftAsTemplate(
    draftId: string, 
    userId: string,
    templateName: string
  ): Promise<{
    success: boolean;
    templateId?: string;
    error?: string;
  }> {
    try {
      const draft = await this.loadDraft(draftId);
      if (!draft) {
        return { success: false, error: 'Draft not found' };
      }

      if (draft.userId !== userId) {
        return { success: false, error: 'Unauthorized to export draft' };
      }

      // Import the listing templates manager
      const { listingTemplatesManager } = await import('./listing-templates');
      
      const template = await listingTemplatesManager.saveListingAsTemplate(
        userId,
        {
          title: draft.title || 'Untitled Listing',
          description: draft.description || '',
          tags: draft.tags,
          price: draft.price,
          materials: draft.materials,
          category: 'custom'
        },
        templateName,
        'Exported from draft'
      );

      return { success: true, templateId: template.id };
    } catch (error) {
      logger.error('Failed to export draft as template', { error, draftId, userId });
      return { success: false, error: 'Failed to export draft' };
    }
  }

  // Get draft by ID for editing
  public async getDraftForEditing(draftId: string, userId: string): Promise<ListingDraft | null> {
    try {
      const draft = await this.loadDraft(draftId);
      if (!draft || draft.userId !== userId) {
        return null;
      }

      // Update last accessed time
      draft.updatedAt = new Date();
      this.drafts.set(draftId, draft);

      return draft;
    } catch (error) {
      logger.error('Failed to get draft for editing', { error, draftId, userId });
      return null;
    }
  }

  // Duplicate draft
  public async duplicateDraft(draftId: string, userId: string): Promise<ListingDraft | null> {
    try {
      const originalDraft = await this.loadDraft(draftId);
      if (!originalDraft || originalDraft.userId !== userId) {
        return null;
      }

      const duplicatedDraft = await this.saveDraft(userId, {
        title: `${originalDraft.title} (Copy)`,
        description: originalDraft.description,
        tags: originalDraft.tags,
        keywords: originalDraft.keywords,
        tone: originalDraft.tone,
        niche: originalDraft.niche,
        audience: originalDraft.audience,
        wordCount: originalDraft.wordCount,
        price: originalDraft.price,
        quantity: originalDraft.quantity,
        materials: originalDraft.materials,
        shopSection: originalDraft.shopSection,
        shippingProfile: originalDraft.shippingProfile
      });

      return duplicatedDraft;
    } catch (error) {
      logger.error('Failed to duplicate draft', { error, draftId, userId });
      return null;
    }
  }
}

// Export singleton instance
export const savedDraftsManager = new SavedDraftsManager();
