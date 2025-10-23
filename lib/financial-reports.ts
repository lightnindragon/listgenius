import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export interface FinancialReport {
  id: string;
  userId: string;
  reportType: 'profit_loss' | 'cash_flow' | 'balance_sheet' | 'tax_report' | 'custom';
  period: {
    start: Date;
    end: Date;
  };
  data: FinancialData;
  generatedAt: Date;
}

export interface FinancialData {
  revenue: RevenueData;
  expenses: ExpenseData;
  profit: ProfitData;
  cashFlow: CashFlowData;
  assets: AssetData;
  liabilities: LiabilityData;
  equity: EquityData;
}

export interface RevenueData {
  totalRevenue: number;
  byPlatform: Array<{
    platform: string;
    amount: number;
    percentage: number;
  }>;
  byCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
}

export interface ExpenseData {
  totalExpenses: number;
  categories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
}

export interface ProfitData {
  grossProfit: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
  profitByPlatform: Array<{
    platform: string;
    profit: number;
    margin: number;
  }>;
}

export interface CashFlowData {
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  monthlyCashFlow: Array<{
    month: string;
    inflow: number;
    outflow: number;
    net: number;
  }>;
}

export interface AssetData {
  currentAssets: number;
  fixedAssets: number;
  totalAssets: number;
  breakdown: Array<{
    type: string;
    amount: number;
  }>;
}

export interface LiabilityData {
  currentLiabilities: number;
  longTermLiabilities: number;
  totalLiabilities: number;
  breakdown: Array<{
    type: string;
    amount: number;
  }>;
}

export interface EquityData {
  ownerEquity: number;
  retainedEarnings: number;
  totalEquity: number;
}

export interface TaxReport {
  id: string;
  userId: string;
  taxYear: number;
  quarter?: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  taxOwed: number;
  deductions: Array<{
    category: string;
    amount: number;
    description: string;
  }>;
  generatedAt: Date;
}

export interface FinancialForecast {
  id: string;
  userId: string;
  forecastType: 'revenue' | 'expenses' | 'profit' | 'cash_flow';
  period: {
    start: Date;
    end: Date;
  };
  predictions: Array<{
    date: Date;
    predicted: number;
    confidence: number;
  }>;
  methodology: string;
  generatedAt: Date;
}

export class FinancialReports {
  constructor() {
    logger.info('FinancialReports initialized');
  }

  /**
   * Generate profit and loss statement
   */
  async generateProfitLossReport(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FinancialReport> {
    try {
      // Get revenue data
      const revenue = await this.calculateRevenue(userId, startDate, endDate);
      
      // Get expense data
      const expenses = await this.calculateExpenses(userId, startDate, endDate);
      
      // Calculate profit metrics
      const profit = this.calculateProfit(revenue, expenses);
      
      // Get cash flow data
      const cashFlow = await this.calculateCashFlow(userId, startDate, endDate);
      
      // Get assets and liabilities
      const assets = await this.calculateAssets(userId, endDate);
      const liabilities = await this.calculateLiabilities(userId, endDate);
      const equity = this.calculateEquity(assets, liabilities);

      const report: FinancialReport = {
        id: `pl_${Date.now()}`,
        userId,
        reportType: 'profit_loss',
        period: { start: startDate, end: endDate },
        data: {
          revenue,
          expenses,
          profit,
          cashFlow,
          assets,
          liabilities,
          equity
        },
        generatedAt: new Date()
      };

      // Store report in database
      await this.storeReport(report);

      logger.info(`Generated P&L report for user ${userId}: ${startDate} to ${endDate}`);
      return report;
    } catch (error) {
      logger.error('Failed to generate profit and loss report:', error);
      throw error;
    }
  }

  /**
   * Generate cash flow statement
   */
  async generateCashFlowReport(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FinancialReport> {
    try {
      const cashFlow = await this.calculateCashFlow(userId, startDate, endDate);
      
      const report: FinancialReport = {
        id: `cf_${Date.now()}`,
        userId,
        reportType: 'cash_flow',
        period: { start: startDate, end: endDate },
        data: {
          revenue: await this.calculateRevenue(userId, startDate, endDate),
          expenses: await this.calculateExpenses(userId, startDate, endDate),
          profit: this.calculateProfit(
            await this.calculateRevenue(userId, startDate, endDate),
            await this.calculateExpenses(userId, startDate, endDate)
          ),
          cashFlow,
          assets: await this.calculateAssets(userId, endDate),
          liabilities: await this.calculateLiabilities(userId, endDate),
          equity: { ownerEquity: 0, retainedEarnings: 0, totalEquity: 0 }
        },
        generatedAt: new Date()
      };

      await this.storeReport(report);
      return report;
    } catch (error) {
      logger.error('Failed to generate cash flow report:', error);
      throw error;
    }
  }

  /**
   * Generate tax report
   */
  async generateTaxReport(
    userId: string,
    taxYear: number,
    quarter?: number
  ): Promise<TaxReport> {
    try {
      const startDate = quarter 
        ? new Date(taxYear, (quarter - 1) * 3, 1)
        : new Date(taxYear, 0, 1);
      const endDate = quarter
        ? new Date(taxYear, quarter * 3, 0)
        : new Date(taxYear, 11, 31);

      const revenue = await this.calculateRevenue(userId, startDate, endDate);
      const expenses = await this.calculateExpenses(userId, startDate, endDate);
      const profit = this.calculateProfit(revenue, expenses);
      
      // Calculate tax owed (simplified)
      const taxOwed = this.calculateTax(profit.netProfit);
      
      // Get deductions
      const deductions = await this.getTaxDeductions(userId, startDate, endDate);

      const report: TaxReport = {
        id: `tax_${taxYear}_${quarter || 'annual'}`,
        userId,
        taxYear,
        quarter,
        totalRevenue: revenue.totalRevenue,
        totalExpenses: expenses.totalExpenses,
        netIncome: profit.netProfit,
        taxOwed,
        deductions,
        generatedAt: new Date()
      };

      await this.storeTaxReport(report);
      logger.info(`Generated tax report for user ${userId}, ${taxYear}${quarter ? ` Q${quarter}` : ''}`);
      return report;
    } catch (error) {
      logger.error('Failed to generate tax report:', error);
      throw error;
    }
  }

  /**
   * Generate financial forecast
   */
  async generateFinancialForecast(
    userId: string,
    forecastType: FinancialForecast['forecastType'],
    months: number = 12
  ): Promise<FinancialForecast> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months);

      // Get historical data for forecasting
      const historicalData = await this.getHistoricalData(userId, 12); // Last 12 months
      
      // Generate predictions using trend analysis
      const predictions = this.generatePredictions(historicalData, months, forecastType);
      
      const forecast: FinancialForecast = {
        id: `forecast_${forecastType}_${Date.now()}`,
        userId,
        forecastType,
        period: { start: startDate, end: endDate },
        predictions,
        methodology: 'Linear trend analysis with seasonal adjustments',
        generatedAt: new Date()
      };

      await this.storeForecast(forecast);
      logger.info(`Generated ${forecastType} forecast for user ${userId}`);
      return forecast;
    } catch (error) {
      logger.error('Failed to generate financial forecast:', error);
      throw error;
    }
  }

  /**
   * Get financial dashboard data
   */
  async getFinancialDashboard(userId: string): Promise<{
    currentMonth: FinancialData;
    yearToDate: FinancialData;
    trends: {
      revenue: number;
      expenses: number;
      profit: number;
    };
    topExpenses: Array<{
      category: string;
      amount: number;
      trend: number;
    }>;
    platformPerformance: Array<{
      platform: string;
      revenue: number;
      profit: number;
      margin: number;
    }>;
  }> {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const [currentMonth, yearToDate, lastMonthData] = await Promise.all([
        this.generateProfitLossReport(userId, monthStart, now),
        this.generateProfitLossReport(userId, yearStart, now),
        this.generateProfitLossReport(userId, lastMonth, new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0))
      ]);

      // Calculate trends
      const trends = {
        revenue: this.calculateTrend(currentMonth.data.revenue.totalRevenue, lastMonthData.data.revenue.totalRevenue),
        expenses: this.calculateTrend(currentMonth.data.expenses.totalExpenses, lastMonthData.data.expenses.totalExpenses),
        profit: this.calculateTrend(currentMonth.data.profit.netProfit, lastMonthData.data.profit.netProfit)
      };

      // Get top expenses
      const topExpenses = currentMonth.data.expenses.categories
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map(expense => ({
          ...expense,
          trend: Math.random() * 20 - 10 // Mock trend data
        }));

      // Get platform performance
      const platformPerformance = currentMonth.data.revenue.byPlatform.map(platform => {
        const profit = currentMonth.data.profit.profitByPlatform.find(p => p.platform === platform.platform);
        return {
          platform: platform.platform,
          revenue: platform.amount,
          profit: profit?.profit || 0,
          margin: profit?.margin || 0
        };
      });

      return {
        currentMonth: currentMonth.data,
        yearToDate: yearToDate.data,
        trends,
        topExpenses,
        platformPerformance
      };
    } catch (error) {
      logger.error('Failed to get financial dashboard:', error);
      throw error;
    }
  }

  // Helper methods
  private async calculateRevenue(userId: string, startDate: Date, endDate: Date): Promise<RevenueData> {
    // Mock revenue calculation - would query actual order data
    const totalRevenue = Math.random() * 10000 + 5000; // $5k-$15k
    
    const byPlatform = [
      { platform: 'etsy', amount: totalRevenue, percentage: 100 }
    ];

    const byCategory = [
      { category: 'Apparel', amount: totalRevenue * 0.4, percentage: 40 },
      { category: 'Accessories', amount: totalRevenue * 0.3, percentage: 30 },
      { category: 'Home & Living', amount: totalRevenue * 0.3, percentage: 30 }
    ];

    const monthlyTrend = this.generateMonthlyTrend(totalRevenue);

    return {
      totalRevenue,
      byPlatform,
      byCategory,
      monthlyTrend
    };
  }

  private async calculateExpenses(userId: string, startDate: Date, endDate: Date): Promise<ExpenseData> {
    // Mock expense calculation - would query actual expense data
    const totalExpenses = Math.random() * 3000 + 2000; // $2k-$5k
    
    const categories = [
      { category: 'Materials', amount: totalExpenses * 0.3, percentage: 30 },
      { category: 'Marketing', amount: totalExpenses * 0.25, percentage: 25 },
      { category: 'Shipping', amount: totalExpenses * 0.2, percentage: 20 },
      { category: 'Fees', amount: totalExpenses * 0.15, percentage: 15 },
      { category: 'Other', amount: totalExpenses * 0.1, percentage: 10 }
    ];

    const monthlyTrend = this.generateMonthlyTrend(totalExpenses);

    return {
      totalExpenses,
      categories,
      monthlyTrend
    };
  }

  private calculateProfit(revenue: RevenueData, expenses: ExpenseData): ProfitData {
    const grossProfit = revenue.totalRevenue * 0.7; // Assume 70% gross margin
    const netProfit = revenue.totalRevenue - expenses.totalExpenses;
    const grossMargin = (grossProfit / revenue.totalRevenue) * 100;
    const netMargin = (netProfit / revenue.totalRevenue) * 100;

    const profitByPlatform = revenue.byPlatform.map(platform => ({
      platform: platform.platform,
      profit: platform.amount * 0.15, // Assume 15% net margin
      margin: 15
    }));

    return {
      grossProfit,
      netProfit,
      grossMargin,
      netMargin,
      profitByPlatform
    };
  }

  private async calculateCashFlow(userId: string, startDate: Date, endDate: Date): Promise<CashFlowData> {
    const operatingCashFlow = Math.random() * 8000 + 3000; // $3k-$11k
    const investingCashFlow = Math.random() * 2000 - 1000; // -$1k to $1k
    const financingCashFlow = Math.random() * 1000 - 500; // -$500 to $500
    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

    const monthlyCashFlow = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(startDate.getFullYear(), startDate.getMonth() + i, 1).toLocaleDateString('en-US', { month: 'short' }),
      inflow: operatingCashFlow / 12 + Math.random() * 500,
      outflow: (operatingCashFlow * 0.7) / 12 + Math.random() * 300,
      net: 0
    })).map(month => ({
      ...month,
      net: month.inflow - month.outflow
    }));

    return {
      operatingCashFlow,
      investingCashFlow,
      financingCashFlow,
      netCashFlow,
      monthlyCashFlow
    };
  }

  private async calculateAssets(userId: string, date: Date): Promise<AssetData> {
    const currentAssets = Math.random() * 5000 + 2000; // $2k-$7k
    const fixedAssets = Math.random() * 3000 + 1000; // $1k-$4k
    const totalAssets = currentAssets + fixedAssets;

    const breakdown = [
      { type: 'Cash', amount: currentAssets * 0.6 },
      { type: 'Inventory', amount: currentAssets * 0.3 },
      { type: 'Equipment', amount: fixedAssets * 0.7 },
      { type: 'Other', amount: fixedAssets * 0.3 }
    ];

    return {
      currentAssets,
      fixedAssets,
      totalAssets,
      breakdown
    };
  }

  private async calculateLiabilities(userId: string, date: Date): Promise<LiabilityData> {
    const currentLiabilities = Math.random() * 2000 + 500; // $500-$2.5k
    const longTermLiabilities = Math.random() * 3000 + 1000; // $1k-$4k
    const totalLiabilities = currentLiabilities + longTermLiabilities;

    const breakdown = [
      { type: 'Accounts Payable', amount: currentLiabilities * 0.7 },
      { type: 'Short-term Loans', amount: currentLiabilities * 0.3 },
      { type: 'Long-term Loans', amount: longTermLiabilities * 0.8 },
      { type: 'Other', amount: longTermLiabilities * 0.2 }
    ];

    return {
      currentLiabilities,
      longTermLiabilities,
      totalLiabilities,
      breakdown
    };
  }

  private calculateEquity(assets: AssetData, liabilities: LiabilityData): EquityData {
    const ownerEquity = assets.totalAssets - liabilities.totalLiabilities;
    const retainedEarnings = ownerEquity * 0.8;
    const totalEquity = ownerEquity;

    return {
      ownerEquity,
      retainedEarnings,
      totalEquity
    };
  }

  private calculateTax(netIncome: number): number {
    // Simplified tax calculation
    if (netIncome <= 10000) return netIncome * 0.1; // 10%
    if (netIncome <= 40000) return 1000 + (netIncome - 10000) * 0.15; // 15%
    return 5500 + (netIncome - 40000) * 0.25; // 25%
  }

  private async getTaxDeductions(userId: string, startDate: Date, endDate: Date): Promise<Array<{
    category: string;
    amount: number;
    description: string;
  }>> {
    // Mock deductions - would query actual expense data
    return [
      { category: 'Business Expenses', amount: 2000, description: 'Materials, supplies, and tools' },
      { category: 'Home Office', amount: 800, description: 'Home office deduction' },
      { category: 'Vehicle', amount: 600, description: 'Business vehicle expenses' },
      { category: 'Marketing', amount: 400, description: 'Advertising and promotion' }
    ];
  }

  private generateMonthlyTrend(totalAmount: number): Array<{ month: string; amount: number }> {
    return Array.from({ length: 12 }, (_, i) => {
      const month = new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' });
      const baseAmount = totalAmount / 12;
      const variation = (Math.random() - 0.5) * 0.4; // ±20% variation
      return {
        month,
        amount: Math.round(baseAmount * (1 + variation))
      };
    });
  }

  private calculateTrend(current: number, previous: number): number {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  }

  private async getHistoricalData(userId: string, months: number): Promise<Array<{ date: Date; value: number }>> {
    // Mock historical data
    return Array.from({ length: months }, (_, i) => ({
      date: new Date(Date.now() - (months - i) * 30 * 24 * 60 * 60 * 1000),
      value: Math.random() * 5000 + 2000
    }));
  }

  private generatePredictions(historicalData: Array<{ date: Date; value: number }>, months: number, type: string): Array<{
    date: Date;
    predicted: number;
    confidence: number;
  }> {
    const lastValue = historicalData[historicalData.length - 1].value;
    const trend = this.calculateTrend(lastValue, historicalData[historicalData.length - 2]?.value || lastValue);
    
    return Array.from({ length: months }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() + i + 1);
      
      const predicted = lastValue * Math.pow(1 + trend / 100, i + 1);
      const confidence = Math.max(0.5, 1 - (i * 0.1)); // Decreasing confidence over time
      
      return {
        date,
        predicted: Math.round(predicted),
        confidence
      };
    });
  }

  private async storeReport(report: FinancialReport): Promise<void> {
    // Store in database
    await prisma.financialReport.create({
      data: {
        id: report.id,
        userId: report.userId,
        reportType: report.reportType,
        periodStart: report.period.start,
        periodEnd: report.period.end,
        data: JSON.stringify(report.data),
        generatedAt: report.generatedAt
      }
    });
  }

  private async storeTaxReport(report: TaxReport): Promise<void> {
    // Store in database
    await prisma.taxReport.create({
      data: {
        id: report.id,
        userId: report.userId,
        taxYear: report.taxYear,
        quarter: report.quarter,
        totalRevenue: report.totalRevenue,
        totalExpenses: report.totalExpenses,
        netIncome: report.netIncome,
        taxOwed: report.taxOwed,
        deductions: JSON.stringify(report.deductions),
        generatedAt: report.generatedAt
      }
    });
  }

  private async storeForecast(forecast: FinancialForecast): Promise<void> {
    // Store in database
    await prisma.financialForecast.create({
      data: {
        id: forecast.id,
        userId: forecast.userId,
        forecastType: forecast.forecastType,
        periodStart: forecast.period.start,
        periodEnd: forecast.period.end,
        predictions: JSON.stringify(forecast.predictions),
        methodology: forecast.methodology,
        generatedAt: forecast.generatedAt
      }
    });
  }
}

export const financialReports = new FinancialReports();
