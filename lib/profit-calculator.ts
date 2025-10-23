import { emitTopRightToast } from '@/components/TopRightToast';

// Cost categories
export interface CostBreakdown {
  // Direct costs
  materials: MaterialCost[];
  labor: LaborCost;
  shipping: ShippingCost;
  
  // Platform costs
  etsyFees: EtsyFees;
  paymentProcessing: PaymentProcessingFee;
  
  // Marketing costs
  marketingSpend: MarketingCost[];
  
  // Other costs
  overhead: OverheadCost[];
  
  // Taxes
  taxes: TaxCost[];
}

// Material cost structure
export interface MaterialCost {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier?: string;
  category: 'raw_material' | 'component' | 'packaging' | 'other';
  notes?: string;
}

// Labor cost structure
export interface LaborCost {
  hoursWorked: number;
  hourlyRate: number;
  totalCost: number;
  laborType: 'design' | 'production' | 'packaging' | 'quality_control' | 'other';
  notes?: string;
}

// Shipping cost structure
export interface ShippingCost {
  domestic: {
    cost: number;
    method: string;
    weight: number;
    dimensions: { length: number; width: number; height: number };
  };
  international: {
    cost: number;
    method: string;
    countries: string[];
    weight: number;
    dimensions: { length: number; width: number; height: number };
  };
  insurance: number;
  tracking: number;
  packaging: number;
  totalCost: number;
}

// Etsy fees structure
export interface EtsyFees {
  listingFee: number;
  transactionFee: number;
  paymentProcessingFee: number;
  offsiteAdsFee: number;
  currencyConversionFee: number;
  totalFees: number;
}

// Payment processing fees
export interface PaymentProcessingFee {
  stripeFee: number;
  paypalFee: number;
  etsyPaymentsFee: number;
  totalFee: number;
}

// Marketing costs
export interface MarketingCost {
  id: string;
  name: string;
  amount: number;
  type: 'etsy_ads' | 'google_ads' | 'facebook_ads' | 'instagram_ads' | 'pinterest_ads' | 'other';
  date: Date;
  notes?: string;
}

// Overhead costs
export interface OverheadCost {
  id: string;
  name: string;
  amount: number;
  type: 'rent' | 'utilities' | 'equipment' | 'software' | 'insurance' | 'professional_services' | 'other';
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
  allocatedToProduct: number;
  notes?: string;
}

// Tax costs
export interface TaxCost {
  id: string;
  name: string;
  amount: number;
  type: 'sales_tax' | 'income_tax' | 'business_tax' | 'other';
  region: string;
  rate: number;
  notes?: string;
}

// Profit calculation result
export interface ProfitCalculation {
  // Revenue
  sellingPrice: number;
  quantity: number;
  totalRevenue: number;
  
  // Costs
  costBreakdown: CostBreakdown;
  totalCosts: number;
  
  // Profit metrics
  grossProfit: number;
  grossProfitMargin: number;
  netProfit: number;
  netProfitMargin: number;
  
  // Recommendations
  recommendations: ProfitRecommendation[];
  
  // Break-even analysis
  breakEvenPrice: number;
  breakEvenQuantity: number;
  
  // What-if scenarios
  scenarios: ProfitScenario[];
}

// Profit recommendations
export interface ProfitRecommendation {
  type: 'increase_price' | 'reduce_costs' | 'increase_volume' | 'optimize_shipping' | 'negotiate_suppliers';
  title: string;
  description: string;
  potentialSavings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'low' | 'medium' | 'high';
}

// Profit scenarios
export interface ProfitScenario {
  name: string;
  sellingPrice: number;
  quantity: number;
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  netProfitMargin: number;
}

// Product pricing analysis
export interface PricingAnalysis {
  currentPrice: number;
  recommendedPrice: number;
  priceRange: {
    min: number;
    max: number;
    optimal: number;
  };
  competitorPrices: {
    min: number;
    max: number;
    average: number;
  };
  priceElasticity: number;
  demandForecast: {
    price: number;
    demand: number;
  }[];
}

class ProfitCalculator {
  private costBreakdown: CostBreakdown;
  private sellingPrice: number;
  private quantity: number;

  constructor() {
    this.costBreakdown = this.initializeCostBreakdown();
    this.sellingPrice = 0;
    this.quantity = 1;
  }

  private initializeCostBreakdown(): CostBreakdown {
    return {
      materials: [],
      labor: {
        hoursWorked: 0,
        hourlyRate: 0,
        totalCost: 0,
        laborType: 'production',
        notes: ''
      },
      shipping: {
        domestic: {
          cost: 0,
          method: 'standard',
          weight: 0,
          dimensions: { length: 0, width: 0, height: 0 }
        },
        international: {
          cost: 0,
          method: 'standard',
          countries: [],
          weight: 0,
          dimensions: { length: 0, width: 0, height: 0 }
        },
        insurance: 0,
        tracking: 0,
        packaging: 0,
        totalCost: 0
      },
      etsyFees: {
        listingFee: 0.20,
        transactionFee: 0,
        paymentProcessingFee: 0,
        offsiteAdsFee: 0,
        currencyConversionFee: 0,
        totalFees: 0
      },
      paymentProcessing: {
        stripeFee: 0,
        paypalFee: 0,
        etsyPaymentsFee: 0,
        totalFee: 0
      },
      marketingSpend: [],
      overhead: [],
      taxes: []
    };
  }

  // Set selling price and quantity
  setProductDetails(sellingPrice: number, quantity: number = 1): void {
    this.sellingPrice = sellingPrice;
    this.quantity = quantity;
    this.updateEtsyFees();
  }

  // Add material cost
  addMaterialCost(material: Omit<MaterialCost, 'id' | 'totalCost'>): string {
    const id = `material_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const totalCost = material.quantity * material.unitCost;
    
    const materialCost: MaterialCost = {
      ...material,
      id,
      totalCost
    };

    this.costBreakdown.materials.push(materialCost);
    return id;
  }

  // Update material cost
  updateMaterialCost(id: string, updates: Partial<MaterialCost>): boolean {
    const index = this.costBreakdown.materials.findIndex(m => m.id === id);
    if (index === -1) return false;

    const material = this.costBreakdown.materials[index];
    const updatedMaterial = { ...material, ...updates };
    
    // Recalculate total cost if quantity or unit cost changed
    if (updates.quantity !== undefined || updates.unitCost !== undefined) {
      updatedMaterial.totalCost = updatedMaterial.quantity * updatedMaterial.unitCost;
    }

    this.costBreakdown.materials[index] = updatedMaterial;
    return true;
  }

  // Remove material cost
  removeMaterialCost(id: string): boolean {
    const index = this.costBreakdown.materials.findIndex(m => m.id === id);
    if (index === -1) return false;

    this.costBreakdown.materials.splice(index, 1);
    return true;
  }

  // Set labor cost
  setLaborCost(labor: Omit<LaborCost, 'totalCost'>): void {
    this.costBreakdown.labor = {
      ...labor,
      totalCost: labor.hoursWorked * labor.hourlyRate
    };
  }

  // Set shipping cost
  setShippingCost(shipping: Partial<ShippingCost>): void {
    this.costBreakdown.shipping = {
      ...this.costBreakdown.shipping,
      ...shipping
    };
    
    // Recalculate total shipping cost
    this.costBreakdown.shipping.totalCost = 
      this.costBreakdown.shipping.domestic.cost +
      this.costBreakdown.shipping.international.cost +
      this.costBreakdown.shipping.insurance +
      this.costBreakdown.shipping.tracking +
      this.costBreakdown.shipping.packaging;
  }

  // Update Etsy fees based on selling price
  private updateEtsyFees(): void {
    const price = this.sellingPrice;
    
    // Etsy transaction fee (6.5% of sale price)
    this.costBreakdown.etsyFees.transactionFee = price * 0.065;
    
    // Payment processing fee (3% + $0.25)
    this.costBreakdown.etsyFees.paymentProcessingFee = price * 0.03 + 0.25;
    
    // Offsite ads fee (15% if applicable)
    this.costBreakdown.etsyFees.offsiteAdsFee = price * 0.15;
    
    // Currency conversion fee (2.5% if applicable)
    this.costBreakdown.etsyFees.currencyConversionFee = price * 0.025;
    
    // Calculate total fees
    this.costBreakdown.etsyFees.totalFees = 
      this.costBreakdown.etsyFees.listingFee +
      this.costBreakdown.etsyFees.transactionFee +
      this.costBreakdown.etsyFees.paymentProcessingFee +
      this.costBreakdown.etsyFees.offsiteAdsFee +
      this.costBreakdown.etsyFees.currencyConversionFee;
  }

  // Add marketing cost
  addMarketingCost(marketing: Omit<MarketingCost, 'id'>): string {
    const id = `marketing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const marketingCost: MarketingCost = {
      ...marketing,
      id
    };

    this.costBreakdown.marketingSpend.push(marketingCost);
    return id;
  }

  // Add overhead cost
  addOverheadCost(overhead: Omit<OverheadCost, 'id'>): string {
    const id = `overhead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const overheadCost: OverheadCost = {
      ...overhead,
      id
    };

    this.costBreakdown.overhead.push(overheadCost);
    return id;
  }

  // Add tax cost
  addTaxCost(tax: Omit<TaxCost, 'id'>): string {
    const id = `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const taxCost: TaxCost = {
      ...tax,
      id
    };

    this.costBreakdown.taxes.push(taxCost);
    return id;
  }

  // Calculate total costs
  private calculateTotalCosts(): number {
    const materialCosts = this.costBreakdown.materials.reduce((sum, m) => sum + m.totalCost, 0);
    const laborCost = this.costBreakdown.labor.totalCost;
    const shippingCost = this.costBreakdown.shipping.totalCost;
    const etsyFees = this.costBreakdown.etsyFees.totalFees;
    const paymentProcessing = this.costBreakdown.paymentProcessing.totalFee;
    const marketingCosts = this.costBreakdown.marketingSpend.reduce((sum, m) => sum + m.amount, 0);
    const overheadCosts = this.costBreakdown.overhead.reduce((sum, o) => sum + o.allocatedToProduct, 0);
    const taxCosts = this.costBreakdown.taxes.reduce((sum, t) => sum + t.amount, 0);

    return materialCosts + laborCost + shippingCost + etsyFees + paymentProcessing + marketingCosts + overheadCosts + taxCosts;
  }

  // Calculate profit
  calculateProfit(): ProfitCalculation {
    const totalRevenue = this.sellingPrice * this.quantity;
    const totalCosts = this.calculateTotalCosts();
    const grossProfit = totalRevenue - totalCosts;
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netProfit = grossProfit; // Net profit is same as gross profit in this calculation
    const netProfitMargin = grossProfitMargin;

    const recommendations = this.generateRecommendations(totalCosts, grossProfitMargin);
    const breakEvenPrice = totalCosts;
    const breakEvenQuantity = this.sellingPrice > 0 ? Math.ceil(totalCosts / this.sellingPrice) : 0;
    const scenarios = this.generateScenarios();

    return {
      sellingPrice: this.sellingPrice,
      quantity: this.quantity,
      totalRevenue,
      costBreakdown: this.costBreakdown,
      totalCosts,
      grossProfit,
      grossProfitMargin,
      netProfit,
      netProfitMargin,
      recommendations,
      breakEvenPrice,
      breakEvenQuantity,
      scenarios
    };
  }

  // Generate profit recommendations
  private generateRecommendations(totalCosts: number, profitMargin: number): ProfitRecommendation[] {
    const recommendations: ProfitRecommendation[] = [];

    // Low profit margin recommendations
    if (profitMargin < 20) {
      recommendations.push({
        type: 'increase_price',
        title: 'Consider Increasing Price',
        description: 'Your profit margin is below 20%. Consider increasing your selling price by 10-15%.',
        potentialSavings: this.sellingPrice * 0.15,
        difficulty: 'medium',
        priority: 'high'
      });
    }

    // High material costs
    const materialCosts = this.costBreakdown.materials.reduce((sum, m) => sum + m.totalCost, 0);
    if (materialCosts > totalCosts * 0.4) {
      recommendations.push({
        type: 'negotiate_suppliers',
        title: 'Negotiate Material Costs',
        description: 'Material costs represent over 40% of total costs. Consider negotiating with suppliers or finding alternatives.',
        potentialSavings: materialCosts * 0.1,
        difficulty: 'medium',
        priority: 'high'
      });
    }

    // High shipping costs
    if (this.costBreakdown.shipping.totalCost > totalCosts * 0.2) {
      recommendations.push({
        type: 'optimize_shipping',
        title: 'Optimize Shipping Strategy',
        description: 'Shipping costs are high. Consider bulk shipping discounts or alternative carriers.',
        potentialSavings: this.costBreakdown.shipping.totalCost * 0.15,
        difficulty: 'easy',
        priority: 'medium'
      });
    }

    // High Etsy fees
    if (this.costBreakdown.etsyFees.totalFees > totalCosts * 0.3) {
      recommendations.push({
        type: 'reduce_costs',
        title: 'Consider Direct Sales',
        description: 'Etsy fees are high. Consider selling directly through your own website.',
        potentialSavings: this.costBreakdown.etsyFees.totalFees,
        difficulty: 'hard',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  // Generate what-if scenarios
  private generateScenarios(): ProfitScenario[] {
    const scenarios: ProfitScenario[] = [];
    const baseCosts = this.calculateTotalCosts();

    // Price scenarios
    const priceScenarios = [
      { name: '10% Price Increase', price: this.sellingPrice * 1.1 },
      { name: '20% Price Increase', price: this.sellingPrice * 1.2 },
      { name: '10% Price Decrease', price: this.sellingPrice * 0.9 },
      { name: '20% Price Decrease', price: this.sellingPrice * 0.8 }
    ];

    priceScenarios.forEach(scenario => {
      const revenue = scenario.price * this.quantity;
      const profit = revenue - baseCosts;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      scenarios.push({
        name: scenario.name,
        sellingPrice: scenario.price,
        quantity: this.quantity,
        totalRevenue: revenue,
        totalCosts: baseCosts,
        netProfit: profit,
        netProfitMargin: margin
      });
    });

    // Volume scenarios
    const volumeScenarios = [
      { name: '2x Volume', quantity: this.quantity * 2 },
      { name: '5x Volume', quantity: this.quantity * 5 },
      { name: '10x Volume', quantity: this.quantity * 10 }
    ];

    volumeScenarios.forEach(scenario => {
      const revenue = this.sellingPrice * scenario.quantity;
      // Assume some economies of scale for costs
      const costReduction = Math.min(0.15, scenario.quantity * 0.01); // Up to 15% cost reduction
      const adjustedCosts = baseCosts * (1 - costReduction) * scenario.quantity;
      const profit = revenue - adjustedCosts;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      scenarios.push({
        name: scenario.name,
        sellingPrice: this.sellingPrice,
        quantity: scenario.quantity,
        totalRevenue: revenue,
        totalCosts: adjustedCosts,
        netProfit: profit,
        netProfitMargin: margin
      });
    });

    return scenarios;
  }

  // Analyze pricing
  analyzePricing(competitorPrices: number[]): PricingAnalysis {
    const minCompetitor = Math.min(...competitorPrices);
    const maxCompetitor = Math.max(...competitorPrices);
    const avgCompetitor = competitorPrices.reduce((sum, price) => sum + price, 0) / competitorPrices.length;

    const totalCosts = this.calculateTotalCosts();
    const recommendedPrice = totalCosts * 1.3; // 30% markup

    const priceRange = {
      min: totalCosts * 1.1, // 10% markup minimum
      max: avgCompetitor * 1.2, // 20% above average competitor
      optimal: recommendedPrice
    };

    // Simple price elasticity calculation
    const priceElasticity = -0.5; // Assume moderate elasticity

    // Demand forecast for different prices
    const demandForecast = [];
    for (let price = priceRange.min; price <= priceRange.max; price += (priceRange.max - priceRange.min) / 10) {
      const demand = Math.max(0, this.quantity * (1 + priceElasticity * (price - this.sellingPrice) / this.sellingPrice));
      demandForecast.push({ price, demand });
    }

    return {
      currentPrice: this.sellingPrice,
      recommendedPrice,
      priceRange,
      competitorPrices: {
        min: minCompetitor,
        max: maxCompetitor,
        average: avgCompetitor
      },
      priceElasticity,
      demandForecast
    };
  }

  // Export cost breakdown to CSV
  exportCostBreakdown(): string {
    const lines = ['Category,Item,Cost,Notes'];
    
    // Materials
    this.costBreakdown.materials.forEach(material => {
      lines.push(`Materials,${material.name},${material.totalCost.toFixed(2)},${material.notes || ''}`);
    });
    
    // Labor
    lines.push(`Labor,${this.costBreakdown.labor.laborType},${this.costBreakdown.labor.totalCost.toFixed(2)},${this.costBreakdown.labor.notes || ''}`);
    
    // Shipping
    lines.push(`Shipping,Domestic,${this.costBreakdown.shipping.domestic.cost.toFixed(2)},`);
    lines.push(`Shipping,International,${this.costBreakdown.shipping.international.cost.toFixed(2)},`);
    lines.push(`Shipping,Insurance,${this.costBreakdown.shipping.insurance.toFixed(2)},`);
    
    // Etsy Fees
    lines.push(`Etsy Fees,Listing Fee,${this.costBreakdown.etsyFees.listingFee.toFixed(2)},`);
    lines.push(`Etsy Fees,Transaction Fee,${this.costBreakdown.etsyFees.transactionFee.toFixed(2)},`);
    lines.push(`Etsy Fees,Payment Processing,${this.costBreakdown.etsyFees.paymentProcessingFee.toFixed(2)},`);
    
    // Marketing
    this.costBreakdown.marketingSpend.forEach(marketing => {
      lines.push(`Marketing,${marketing.name},${marketing.amount.toFixed(2)},${marketing.notes || ''}`);
    });
    
    // Overhead
    this.costBreakdown.overhead.forEach(overhead => {
      lines.push(`Overhead,${overhead.name},${overhead.allocatedToProduct.toFixed(2)},${overhead.notes || ''}`);
    });
    
    // Taxes
    this.costBreakdown.taxes.forEach(tax => {
      lines.push(`Taxes,${tax.name},${tax.amount.toFixed(2)},${tax.notes || ''}`);
    });
    
    return lines.join('\n');
  }

  // Get cost breakdown summary
  getCostSummary(): Record<string, number> {
    return {
      materials: this.costBreakdown.materials.reduce((sum, m) => sum + m.totalCost, 0),
      labor: this.costBreakdown.labor.totalCost,
      shipping: this.costBreakdown.shipping.totalCost,
      etsyFees: this.costBreakdown.etsyFees.totalFees,
      paymentProcessing: this.costBreakdown.paymentProcessing.totalFee,
      marketing: this.costBreakdown.marketingSpend.reduce((sum, m) => sum + m.amount, 0),
      overhead: this.costBreakdown.overhead.reduce((sum, o) => sum + o.allocatedToProduct, 0),
      taxes: this.costBreakdown.taxes.reduce((sum, t) => sum + t.amount, 0)
    };
  }

  // Reset calculator
  reset(): void {
    this.costBreakdown = this.initializeCostBreakdown();
    this.sellingPrice = 0;
    this.quantity = 1;
  }
}

// Default profit calculator instance
let profitCalculator: ProfitCalculator | null = null;

export function getProfitCalculator(): ProfitCalculator {
  if (!profitCalculator) {
    profitCalculator = new ProfitCalculator();
  }
  return profitCalculator;
}

export default ProfitCalculator;
