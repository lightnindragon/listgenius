import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai';

export interface Expense {
  id: string;
  userId: string;
  date: Date;
  amount: number;
  currency: string;
  description: string;
  category: ExpenseCategory;
  subcategory?: string;
  vendor: string;
  paymentMethod: PaymentMethod;
  receiptUrl?: string;
  tags: string[];
  isBusiness: boolean;
  isReimbursable: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  parentCategory?: string;
  taxDeductible: boolean;
  defaultPaymentMethod?: PaymentMethod;
  budget?: number;
  color: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'paypal' | 'other';
  account?: string;
  isActive: boolean;
}

export interface ExpenseReport {
  id: string;
  userId: string;
  name: string;
  period: {
    start: Date;
    end: Date;
  };
  expenses: Expense[];
  totalAmount: number;
  totalReimbursable: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  approvedAt?: Date;
  createdAt: Date;
}

export interface ExpenseAnalytics {
  totalExpenses: number;
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    trend: number;
  }>;
  topVendors: Array<{
    vendor: string;
    amount: number;
    count: number;
  }>;
  taxDeductible: {
    total: number;
    percentage: number;
  };
  budgetStatus: Array<{
    category: string;
    spent: number;
    budget: number;
    remaining: number;
    percentage: number;
  }>;
}

export interface ReceiptOCRResult {
  vendor: string;
  date: Date;
  amount: number;
  currency: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
  confidence: number;
}

export class ExpenseTracking {
  constructor() {
    logger.info('ExpenseTracking initialized');
  }

  /**
   * Create a new expense
   */
  async createExpense(
    userId: string,
    expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<Expense> {
    try {
      // Auto-categorize expense if not provided
      if (!expenseData.category) {
        expenseData.category = await this.autoCategorizeExpense(expenseData.description, expenseData.vendor);
      }

      // Validate expense data
      await this.validateExpense(expenseData);

      const expense = await prisma.expense.create({
        data: {
          userId,
          description: expenseData.description,
          amount: expenseData.amount,
          currency: expenseData.currency,
          date: expenseData.date,
          status: expenseData.status,
          receiptUrl: expenseData.receiptUrl,
          isBusiness: expenseData.isBusiness,
          vendor: expenseData.vendor || 'Unknown',
          categoryId: typeof expenseData.category === 'string' ? expenseData.category : expenseData.category.id,
          paymentMethodId: typeof expenseData.paymentMethod === 'string' ? expenseData.paymentMethod : expenseData.paymentMethod.id,
          tags: expenseData.tags || []
        }
      });

      logger.info(`Expense created: ${expense.id} - ${expense.description}`);
      return expense as unknown as Expense;
    } catch (error) {
      logger.error('Failed to create expense:', error);
      throw error;
    }
  }

  /**
   * Upload and process receipt
   */
  async processReceipt(
    userId: string,
    receiptImage: Buffer,
    filename: string
  ): Promise<{
    expense: Expense;
    ocrResult: ReceiptOCRResult;
  }> {
    try {
      // Process receipt with OCR
      const ocrResult = await this.extractReceiptData(receiptImage);
      
      // Create expense from OCR data
      const expenseData = {
        date: ocrResult.date,
        amount: ocrResult.amount,
        currency: ocrResult.currency,
        description: ocrResult.items.map(item => item.description).join(', '),
        vendor: ocrResult.vendor,
        category: { id: 'default', name: 'General', description: 'General expenses', taxDeductible: true, color: '#3B82F6' },
        paymentMethod: { id: 'default', name: 'Credit Card', type: 'credit_card' as const, isActive: true },
        tags: [],
        isBusiness: true,
        isReimbursable: true,
        status: 'pending' as const
      };

      const expense = await this.createExpense(userId, expenseData);

      // Store receipt URL
      const receiptUrl = await this.storeReceipt(receiptImage, filename, expense.id);
      await prisma.expense.update({
        where: { id: expense.id },
        data: { receiptUrl }
      });

      logger.info(`Receipt processed and expense created: ${expense.id}`);
      return { expense, ocrResult };
    } catch (error) {
      logger.error('Failed to process receipt:', error);
      throw error;
    }
  }

  /**
   * Get expense analytics
   */
  async getExpenseAnalytics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ExpenseAnalytics> {
    try {
      const expenses = await prisma.expense.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          category: true
        }
      });

      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Monthly trend
      const monthlyTrend = this.calculateMonthlyTrend(expenses, startDate, endDate);

      // Category breakdown
      const categoryBreakdown = this.calculateCategoryBreakdown(expenses);

      // Top vendors
      const topVendors = this.calculateTopVendors(expenses);

      // Tax deductible
      const taxDeductible = this.calculateTaxDeductible(expenses);

      // Budget status
      const budgetStatus = await this.calculateBudgetStatus(userId, expenses, startDate, endDate);

      return {
        totalExpenses,
        monthlyTrend,
        categoryBreakdown,
        topVendors,
        taxDeductible,
        budgetStatus
      };
    } catch (error) {
      logger.error('Failed to get expense analytics:', error);
      throw error;
    }
  }

  /**
   * Create expense report
   */
  async createExpenseReport(
    userId: string,
    name: string,
    startDate: Date,
    endDate: Date,
    expenseIds?: string[]
  ): Promise<ExpenseReport> {
    try {
      const whereClause: any = {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      };

      if (expenseIds && expenseIds.length > 0) {
        whereClause.id = { in: expenseIds };
      }

      const expenses = await prisma.expense.findMany({
        where: whereClause,
        include: {
          category: true,
          paymentMethod: true
        }
      });

      const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalReimbursable = expenses
        .filter(expense => expense.isReimbursable)
        .reduce((sum, expense) => sum + expense.amount, 0);

      const report = await prisma.expenseReport.create({
        data: {
          userId,
          name,
          periodStart: startDate,
          periodEnd: endDate,
          totalAmount,
          totalReimbursable,
          status: 'draft',
          expenses: expenses.map(expense => expense.id)
        }
      });

      logger.info(`Expense report created: ${report.id} - ${name}`);
      return report as unknown as ExpenseReport;
    } catch (error) {
      logger.error('Failed to create expense report:', error);
      throw error;
    }
  }

  /**
   * Submit expense report for approval
   */
  async submitExpenseReport(reportId: string): Promise<ExpenseReport> {
    try {
      const report = await prisma.expenseReport.update({
        where: { id: reportId },
        data: {
          status: 'submitted',
          submittedAt: new Date()
        }
      });

      // Send notification to approver
      await this.notifyApprover(report as unknown as ExpenseReport);

      logger.info(`Expense report submitted: ${reportId}`);
      return report as unknown as ExpenseReport;
    } catch (error) {
      logger.error('Failed to submit expense report:', error);
      throw error;
    }
  }

  /**
   * Get expense categories
   */
  async getExpenseCategories(userId: string): Promise<ExpenseCategory[]> {
    try {
      // Get default categories
      const defaultCategories = await this.getDefaultCategories();
      
      // Get user's custom categories
      const customCategories = await prisma.expenseCategory.findMany({
        where: { userId }
      });

      return [...defaultCategories, ...customCategories] as unknown as ExpenseCategory[];
    } catch (error) {
      logger.error('Failed to get expense categories:', error);
      throw error;
    }
  }

  /**
   * Create custom expense category
   */
  async createExpenseCategory(
    userId: string,
    categoryData: Omit<ExpenseCategory, 'id'>
  ): Promise<ExpenseCategory> {
    try {
      const category = await prisma.expenseCategory.create({
        data: {
          userId,
          name: categoryData.name,
          description: categoryData.description,
          color: categoryData.color,
          parentCategory: categoryData.parentCategory,
          taxDeductible: categoryData.taxDeductible,
          defaultPaymentMethod: categoryData.defaultPaymentMethod?.id || null,
          budget: categoryData.budget
        }
      });

      logger.info(`Expense category created: ${category.id} - ${category.name}`);
      return category as unknown as ExpenseCategory;
    } catch (error) {
      logger.error('Failed to create expense category:', error);
      throw error;
    }
  }

  /**
   * Set up expense budgets
   */
  async setExpenseBudget(
    userId: string,
    categoryId: string,
    budget: number,
    period: 'monthly' | 'quarterly' | 'yearly'
  ): Promise<void> {
    try {
      await prisma.expenseBudget.upsert({
        where: {
          userId_categoryId_period: {
            userId,
            categoryId,
            period
          }
        },
        update: { budget },
        create: {
          userId,
          categoryId,
          budget,
          period
        }
      });

      logger.info(`Expense budget set: ${categoryId} - $${budget} ${period}`);
    } catch (error) {
      logger.error('Failed to set expense budget:', error);
      throw error;
    }
  }

  // Helper methods
  private async autoCategorizeExpense(description: string, vendor: string): Promise<ExpenseCategory> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expense categorization expert. Analyze the expense description and vendor to determine the most appropriate category from: Office Supplies, Travel, Meals, Marketing, Software, Equipment, Utilities, Professional Services, Insurance, Other.'
          },
          {
            role: 'user',
            content: `Description: ${description}\nVendor: ${vendor}\n\nCategorize this expense.`
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      });

      const category = response.choices[0].message.content?.trim() || 'Other';
      
      // Return default category
      return {
        id: `cat_${category.toLowerCase().replace(' ', '_')}`,
        name: category,
        description: `Auto-categorized: ${category}`,
        taxDeductible: true,
        color: '#3B82F6'
      };
    } catch (error) {
      logger.error('Failed to auto-categorize expense:', error);
      return {
        id: 'cat_other',
        name: 'Other',
        description: 'Uncategorized expense',
        taxDeductible: false,
        color: '#6B7280'
      };
    }
  }

  private async validateExpense(expenseData: any): Promise<void> {
    if (expenseData.amount <= 0) {
      throw new Error('Expense amount must be greater than 0');
    }

    if (!expenseData.description || expenseData.description.trim().length === 0) {
      throw new Error('Expense description is required');
    }

    if (!expenseData.date) {
      throw new Error('Expense date is required');
    }

    if (expenseData.date > new Date()) {
      throw new Error('Expense date cannot be in the future');
    }
  }

  private async extractReceiptData(receiptImage: Buffer): Promise<ReceiptOCRResult> {
    try {
      // Convert buffer to base64
      const base64Image = receiptImage.toString('base64');

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an OCR expert. Extract receipt information from the image. Return the data in JSON format with: vendor, date (YYYY-MM-DD), amount (number), currency (string), items (array of {description, amount}), confidence (0-100).'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract receipt data from this image.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        vendor: result.vendor || 'Unknown Vendor',
        date: new Date(result.date || new Date()),
        amount: parseFloat(result.amount) || 0,
        currency: result.currency || 'USD',
        items: result.items || [],
        confidence: result.confidence || 50
      };
    } catch (error) {
      logger.error('Failed to extract receipt data:', error);
      throw new Error('Failed to process receipt image');
    }
  }

  private async storeReceipt(receiptImage: Buffer, filename: string, expenseId: string): Promise<string> {
    // Mock receipt storage - would integrate with cloud storage
    return `receipts/${expenseId}/${filename}`;
  }

  private calculateMonthlyTrend(expenses: any[], startDate: Date, endDate: Date): Array<{ month: string; amount: number }> {
    const monthlyData: Record<string, number> = {};
    
    expenses.forEach(expense => {
      const month = expense.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[month] = (monthlyData[month] || 0) + expense.amount;
    });

    return Object.entries(monthlyData).map(([month, amount]) => ({ month, amount }));
  }

  private calculateCategoryBreakdown(expenses: any[]): Array<{
    category: string;
    amount: number;
    percentage: number;
    trend: number;
  }> {
    const categoryData: Record<string, number> = {};
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    expenses.forEach(expense => {
      const category = expense.category?.name || 'Other';
      categoryData[category] = (categoryData[category] || 0) + expense.amount;
    });

    return Object.entries(categoryData).map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / total) * 100,
      trend: 0 // Mock trend value
    }));
  }

  private calculateTopVendors(expenses: any[]): Array<{
    vendor: string;
    amount: number;
    count: number;
  }> {
    const vendorData: Record<string, { amount: number; count: number }> = {};

    expenses.forEach(expense => {
      if (!vendorData[expense.vendor]) {
        vendorData[expense.vendor] = { amount: 0, count: 0 };
      }
      vendorData[expense.vendor].amount += expense.amount;
      vendorData[expense.vendor].count += 1;
    });

    return Object.entries(vendorData)
      .map(([vendor, data]) => ({ vendor, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }

  private calculateTaxDeductible(expenses: any[]): { total: number; percentage: number } {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const deductible = expenses
      .filter(expense => expense.category?.taxDeductible)
      .reduce((sum, expense) => sum + expense.amount, 0);

    return {
      total: deductible,
      percentage: total > 0 ? (deductible / total) * 100 : 0
    };
  }

  private async calculateBudgetStatus(
    userId: string,
    expenses: any[],
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    category: string;
    spent: number;
    budget: number;
    remaining: number;
    percentage: number;
  }>> {
    // Mock budget status calculation
    return expenses.map(expense => ({
      category: expense.category?.name || 'Other',
      spent: expense.amount,
      budget: 1000, // Mock budget
      remaining: 1000 - expense.amount,
      percentage: (expense.amount / 1000) * 100
    }));
  }

  private async getDefaultCategories(): Promise<ExpenseCategory[]> {
    return [
      {
        id: 'cat_office_supplies',
        name: 'Office Supplies',
        description: 'Office supplies and stationery',
        taxDeductible: true,
        color: '#10B981'
      },
      {
        id: 'cat_travel',
        name: 'Travel',
        description: 'Business travel expenses',
        taxDeductible: true,
        color: '#3B82F6'
      },
      {
        id: 'cat_meals',
        name: 'Meals',
        description: 'Business meals and entertainment',
        taxDeductible: true,
        color: '#F59E0B'
      },
      {
        id: 'cat_marketing',
        name: 'Marketing',
        description: 'Marketing and advertising expenses',
        taxDeductible: true,
        color: '#EF4444'
      },
      {
        id: 'cat_software',
        name: 'Software',
        description: 'Software and subscriptions',
        taxDeductible: true,
        color: '#8B5CF6'
      },
      {
        id: 'cat_equipment',
        name: 'Equipment',
        description: 'Business equipment and tools',
        taxDeductible: true,
        color: '#06B6D4'
      },
      {
        id: 'cat_utilities',
        name: 'Utilities',
        description: 'Utilities and internet',
        taxDeductible: true,
        color: '#84CC16'
      },
      {
        id: 'cat_professional_services',
        name: 'Professional Services',
        description: 'Legal, accounting, and consulting',
        taxDeductible: true,
        color: '#F97316'
      },
      {
        id: 'cat_insurance',
        name: 'Insurance',
        description: 'Business insurance',
        taxDeductible: true,
        color: '#EC4899'
      },
      {
        id: 'cat_other',
        name: 'Other',
        description: 'Other business expenses',
        taxDeductible: false,
        color: '#6B7280'
      }
    ];
  }

  private async notifyApprover(report: ExpenseReport): Promise<void> {
    // Mock notification - would send email or push notification
    logger.info(`Expense report ${report.id} submitted for approval`);
  }
}

export const expenseTracking = new ExpenseTracking();
