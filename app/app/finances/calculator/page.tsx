'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { 
  getProfitCalculator, 
  ProfitCalculation, 
  MaterialCost, 
  LaborCost, 
  ShippingCost,
  PricingAnalysis
} from '@/lib/profit-calculator';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Download,
  BarChart3,
  Package,
  Truck,
  CreditCard,
  Target,
  Users
} from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

export default function ProfitCalculatorPage() {
  const { user, isLoaded } = useUser();
  const [calculation, setCalculation] = useState<ProfitCalculation | null>(null);
  const [pricingAnalysis, setPricingAnalysis] = useState<PricingAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [productDetails, setProductDetails] = useState({
    sellingPrice: 0,
    quantity: 1
  });
  
  const [materials, setMaterials] = useState<MaterialCost[]>([]);
  const [labor, setLabor] = useState<LaborCost>({
    hoursWorked: 0,
    hourlyRate: 0,
    totalCost: 0,
    laborType: 'production',
    notes: ''
  });
  
  const [shipping, setShipping] = useState<ShippingCost>({
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
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'calculator' | 'analysis' | 'scenarios'>('calculator');
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    quantity: 0,
    unitCost: 0,
    category: 'raw_material' as const,
    supplier: '',
    notes: ''
  });

  const profitCalculator = getProfitCalculator();

  useEffect(() => {
    if (user && isLoaded) {
      calculateProfit();
    }
  }, [user, isLoaded, productDetails, materials, labor, shipping]);

  const calculateProfit = () => {
    try {
      profitCalculator.setProductDetails(productDetails.sellingPrice, productDetails.quantity);
      
      // Set labor cost
      profitCalculator.setLaborCost(labor);
      
      // Set shipping cost
      profitCalculator.setShippingCost(shipping);
      
      // Add materials
      materials.forEach(material => {
        profitCalculator.addMaterialCost(material);
      });
      
      const result = profitCalculator.calculateProfit();
      setCalculation(result);
      
      // Generate pricing analysis with mock competitor data
      const competitorPrices = [15, 18, 22, 25, 28, 30, 32, 35, 38, 40];
      const analysis = profitCalculator.analyzePricing(competitorPrices);
      setPricingAnalysis(analysis);
    } catch (error) {
      console.error('Error calculating profit:', error);
      emitTopRightToast('Error calculating profit', 'error');
    }
  };

  const addMaterial = () => {
    if (!newMaterial.name || newMaterial.quantity <= 0 || newMaterial.unitCost <= 0) {
      emitTopRightToast('Please fill in all material fields', 'error');
      return;
    }

    const material: MaterialCost = {
      id: `material_${Date.now()}`,
      name: newMaterial.name,
      quantity: newMaterial.quantity,
      unitCost: newMaterial.unitCost,
      totalCost: newMaterial.quantity * newMaterial.unitCost,
      category: newMaterial.category,
      supplier: newMaterial.supplier,
      notes: newMaterial.notes
    };

    setMaterials(prev => [...prev, material]);
    setNewMaterial({
      name: '',
      quantity: 0,
      unitCost: 0,
      category: 'raw_material',
      supplier: '',
      notes: ''
    });
    setShowAddMaterial(false);
  };

  const removeMaterial = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const updateLabor = (updates: Partial<LaborCost>) => {
    const updatedLabor = { ...labor, ...updates };
    if (updates.hoursWorked !== undefined || updates.hourlyRate !== undefined) {
      updatedLabor.totalCost = updatedLabor.hoursWorked * updatedLabor.hourlyRate;
    }
    setLabor(updatedLabor);
  };

  const updateShipping = (updates: Partial<ShippingCost>) => {
    const updatedShipping = { ...shipping, ...updates };
    updatedShipping.totalCost = 
      updatedShipping.domestic.cost +
      updatedShipping.international.cost +
      updatedShipping.insurance +
      updatedShipping.tracking +
      updatedShipping.packaging;
    setShipping(updatedShipping);
  };

  const exportToCSV = () => {
    if (!calculation) return;
    
    const csv = profitCalculator.exportCostBreakdown();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profit-calculator-breakdown.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getProfitColor = (margin: number) => {
    if (margin >= 30) return 'text-green-600';
    if (margin >= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Sign in required
        </h1>
        <p className="text-gray-600 mb-6">
          Please sign in to use the profit calculator.
        </p>
        <a
          href="/sign-in"
          className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <DashboardLayout onCreateListingClick={() => {}}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profit Calculator</h1>
          <p className="text-gray-600">
            Calculate detailed profit margins and optimize your pricing strategy.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'calculator', name: 'Calculator', icon: Calculator },
              { id: 'analysis', name: 'Pricing Analysis', icon: BarChart3 },
              { id: 'scenarios', name: 'What-If Scenarios', icon: Target }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Calculator Tab */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Product Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={productDetails.sellingPrice}
                      onChange={(e) => setProductDetails(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      value={productDetails.quantity}
                      onChange={(e) => setProductDetails(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>

              {/* Materials */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Materials</h3>
                  <Button
                    onClick={() => setShowAddMaterial(true)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Material
                  </Button>
                </div>

                {materials.length === 0 ? (
                  <p className="text-gray-500 text-sm">No materials added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {materials.map((material) => (
                      <div key={material.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{material.name}</p>
                          <p className="text-sm text-gray-500">
                            {material.quantity} × {formatCurrency(material.unitCost)} = {formatCurrency(material.totalCost)}
                          </p>
                        </div>
                        <Button
                          onClick={() => removeMaterial(material.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Labor */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Labor</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hours Worked
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={labor.hoursWorked}
                      onChange={(e) => updateLabor({ hoursWorked: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hourly Rate ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={labor.hourlyRate}
                      onChange={(e) => updateLabor({ hourlyRate: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Cost
                    </label>
                    <Input
                      value={formatCurrency(labor.totalCost)}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Domestic Shipping ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={shipping.domestic.cost}
                      onChange={(e) => updateShipping({
                        domestic: { ...shipping.domestic, cost: parseFloat(e.target.value) || 0 }
                      })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      International Shipping ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={shipping.international.cost}
                      onChange={(e) => updateShipping({
                        international: { ...shipping.international, cost: parseFloat(e.target.value) || 0 }
                      })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Insurance ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={shipping.insurance}
                      onChange={(e) => updateShipping({ insurance: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tracking ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={shipping.tracking}
                      onChange={(e) => updateShipping({ tracking: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-6">
              {calculation && (
                <>
                  {/* Profit Summary */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Profit Summary</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Revenue:</span>
                        <span className="font-medium">{formatCurrency(calculation.totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Costs:</span>
                        <span className="font-medium">{formatCurrency(calculation.totalCosts)}</span>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Net Profit:</span>
                          <span className={`font-bold ${getProfitColor(calculation.netProfitMargin)}`}>
                            {formatCurrency(calculation.netProfit)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Profit Margin:</span>
                          <span className={`font-bold ${getProfitColor(calculation.netProfitMargin)}`}>
                            {calculation.netProfitMargin.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Breakdown</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Materials:</span>
                        <span className="font-medium">{formatCurrency(calculation.costBreakdown.materials.reduce((sum, m) => sum + m.totalCost, 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Labor:</span>
                        <span className="font-medium">{formatCurrency(calculation.costBreakdown.labor.totalCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping:</span>
                        <span className="font-medium">{formatCurrency(calculation.costBreakdown.shipping.totalCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Etsy Fees:</span>
                        <span className="font-medium">{formatCurrency(calculation.costBreakdown.etsyFees.totalFees)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Break-even Analysis */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Break-even Analysis</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Break-even Price:</span>
                        <span className="font-medium">{formatCurrency(calculation.breakEvenPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Break-even Quantity:</span>
                        <span className="font-medium">{calculation.breakEvenQuantity}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {calculation.recommendations.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
                      <div className="space-y-3">
                        {calculation.recommendations.map((rec, index) => (
                          <div key={index} className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-start">
                              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                              <div>
                                <p className="font-medium text-blue-900">{rec.title}</p>
                                <p className="text-sm text-blue-700">{rec.description}</p>
                                <p className="text-xs text-blue-600 mt-1">
                                  Potential savings: {formatCurrency(rec.potentialSavings)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Export */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <Button
                      onClick={exportToCSV}
                      className="w-full"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export to CSV
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Pricing Analysis Tab */}
        {activeTab === 'analysis' && pricingAnalysis && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Current Price</h4>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(pricingAnalysis.currentPrice)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Recommended Price</h4>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(pricingAnalysis.recommendedPrice)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Price Range</h4>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(pricingAnalysis.priceRange.min)} - {formatCurrency(pricingAnalysis.priceRange.max)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Competitor Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Lowest Competitor</h4>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(pricingAnalysis.competitorPrices.min)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Average Competitor</h4>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(pricingAnalysis.competitorPrices.average)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Highest Competitor</h4>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(pricingAnalysis.competitorPrices.max)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* What-If Scenarios Tab */}
        {activeTab === 'scenarios' && calculation && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">What-If Scenarios</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scenario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {calculation.scenarios.map((scenario, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {scenario.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(scenario.sellingPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {scenario.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(scenario.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(scenario.totalCosts)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(scenario.netProfit)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={getProfitColor(scenario.netProfitMargin)}>
                            {scenario.netProfitMargin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Add Material Modal */}
        {showAddMaterial && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Material</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material Name *
                  </label>
                  <Input
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Cotton fabric"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={newMaterial.quantity}
                      onChange={(e) => setNewMaterial(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Cost ($) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newMaterial.unitCost}
                      onChange={(e) => setNewMaterial(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newMaterial.category}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="raw_material">Raw Material</option>
                    <option value="component">Component</option>
                    <option value="packaging">Packaging</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <Input
                    value={newMaterial.supplier}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="Supplier name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <Textarea
                    value={newMaterial.notes}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAddMaterial(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={addMaterial}
                >
                  Add Material
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <TopRightToast />
    </DashboardLayout>
  );
}
