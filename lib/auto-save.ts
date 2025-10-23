/**
 * Auto-save system for managing listing content
 * Saves every 30 seconds and provides visual feedback
 */

export interface AutoSaveState {
  isSaving: boolean;
  isSaved: boolean;
  hasUnsavedChanges: boolean;
  lastSaved?: Date;
  error?: string;
}

export interface AutoSaveConfig {
  intervalMs?: number;
  saveFunction: (data: any) => Promise<void>;
  onStateChange?: (state: AutoSaveState) => void;
}

export class AutoSaveManager {
  private intervalId: NodeJS.Timeout | null = null;
  private state: AutoSaveState = {
    isSaving: false,
    isSaved: false,
    hasUnsavedChanges: false,
  };
  private config: AutoSaveConfig;
  private currentData: any = null;
  private lastSavedData: any = null;

  constructor(config: AutoSaveConfig) {
    this.config = {
      intervalMs: 30000, // 30 seconds default
      ...config,
    };
  }

  /**
   * Start auto-save with the given data
   */
  start(data: any): void {
    this.currentData = data;
    this.lastSavedData = data;
    this.updateState({ hasUnsavedChanges: false, isSaved: true });

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.save();
    }, this.config.intervalMs);
  }

  /**
   * Stop auto-save
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Update data and mark as having unsaved changes
   */
  updateData(data: any): void {
    this.currentData = data;
    
    // Check if data has actually changed
    const hasChanged = JSON.stringify(data) !== JSON.stringify(this.lastSavedData);
    this.updateState({ hasUnsavedChanges: hasChanged });
  }

  /**
   * Force save immediately
   */
  async saveNow(): Promise<void> {
    await this.save();
  }

  /**
   * Get current state
   */
  getState(): AutoSaveState {
    return { ...this.state };
  }

  /**
   * Private save method
   */
  private async save(): Promise<void> {
    if (!this.currentData || this.state.isSaving) {
      return;
    }

    // Check if there are actual changes
    if (JSON.stringify(this.currentData) === JSON.stringify(this.lastSavedData)) {
      return;
    }

    this.updateState({ isSaving: true, error: undefined });

    try {
      await this.config.saveFunction(this.currentData);
      this.lastSavedData = JSON.parse(JSON.stringify(this.currentData));
      this.updateState({ 
        isSaving: false, 
        isSaved: true, 
        hasUnsavedChanges: false,
        lastSaved: new Date(),
        error: undefined
      });
    } catch (error) {
      this.updateState({ 
        isSaving: false, 
        error: error instanceof Error ? error.message : 'Save failed'
      });
    }
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<AutoSaveState>): void {
    this.state = { ...this.state, ...updates };
    this.config.onStateChange?.(this.state);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
  }
}

/**
 * React hook for auto-save functionality
 */
export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  options?: { intervalMs?: number; enabled?: boolean }
) {
  const [state, setState] = React.useState<AutoSaveState>({
    isSaving: false,
    isSaved: false,
    hasUnsavedChanges: false,
  });

  const managerRef = React.useRef<AutoSaveManager | null>(null);

  React.useEffect(() => {
    if (!options?.enabled) return;

    const manager = new AutoSaveManager({
      saveFunction,
      intervalMs: options?.intervalMs || 30000,
      onStateChange: setState,
    });

    managerRef.current = manager;
    manager.start(data);

    return () => {
      manager.destroy();
      managerRef.current = null;
    };
  }, [data, saveFunction, options?.enabled, options?.intervalMs]);

  React.useEffect(() => {
    if (managerRef.current && options?.enabled) {
      managerRef.current.updateData(data);
    }
  }, [data, options?.enabled]);

  const saveNow = React.useCallback(async () => {
    if (managerRef.current) {
      await managerRef.current.saveNow();
    }
  }, []);

  return {
    ...state,
    saveNow,
  };
}

// For React usage, we need to import React
import React from 'react';
