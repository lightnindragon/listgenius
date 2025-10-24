import { logger } from './logger';
import { emitTopRightToast } from '@/components/TopRightToast';

// Template data structures
export interface ListingTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: string;
  isBuiltIn: boolean;
  title: string;
  tags: string[];
  price?: number;
  shippingProfile?: string;
  etsyCategory?: string;
  materials: string[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'text' | 'select' | 'number';
  options?: string[];
  required: boolean;
  defaultValue?: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// Built-in template categories
export const templateCategories: TemplateCategory[] = [
  {
    id: 'jewelry',
    name: 'Jewelry',
    description: 'Rings, necklaces, earrings, bracelets',
    icon: '💍',
    color: 'blue'
  },
  {
    id: 'home-decor',
    name: 'Home Decor',
    description: 'Wall art, decorative items, furniture',
    icon: '🏠',
    color: 'green'
  },
  {
    id: 'clothing',
    name: 'Clothing',
    description: 'Apparel, accessories, vintage clothing',
    icon: '👕',
    color: 'purple'
  },
  {
    id: 'art-supplies',
    name: 'Art & Crafts',
    description: 'Art prints, craft supplies, DIY kits',
    icon: '🎨',
    color: 'orange'
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Vintage items, antiques, collectibles',
    icon: '🕰️',
    color: 'brown'
  },
  {
    id: 'personalized',
    name: 'Personalized Gifts',
    description: 'Custom items, personalized products',
    icon: '🎁',
    color: 'pink'
  },
  {
    id: 'seasonal',
    name: 'Seasonal',
    description: 'Holiday decorations, seasonal items',
    icon: '🎄',
    color: 'red'
  },
  {
    id: 'digital',
    name: 'Digital Downloads',
    description: 'Digital products, printables, templates',
    icon: '💻',
    color: 'cyan'
  }
];

// Template variables for dynamic content
export const templateVariables: TemplateVariable[] = [
  {
    name: 'COLOR',
    description: 'Product color',
    type: 'select',
    options: ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Pink', 'Orange', 'Black', 'White', 'Gray'],
    required: true,
    defaultValue: 'Blue'
  },
  {
    name: 'SIZE',
    description: 'Product size',
    type: 'select',
    options: ['Small', 'Medium', 'Large', 'Extra Large', 'One Size'],
    required: true,
    defaultValue: 'Medium'
  },
  {
    name: 'MATERIAL',
    description: 'Primary material',
    type: 'select',
    options: ['Cotton', 'Wood', 'Metal', 'Glass', 'Ceramic', 'Leather', 'Fabric', 'Paper', 'Plastic'],
    required: true,
    defaultValue: 'Cotton'
  },
  {
    name: 'STYLE',
    description: 'Product style',
    type: 'select',
    options: ['Modern', 'Vintage', 'Rustic', 'Minimalist', 'Bohemian', 'Industrial', 'Classic', 'Contemporary'],
    required: false,
    defaultValue: 'Modern'
  },
  {
    name: 'OCCASION',
    description: 'Perfect for',
    type: 'select',
    options: ['Everyday', 'Special Occasion', 'Wedding', 'Holiday', 'Birthday', 'Anniversary', 'Graduation', 'Baby Shower'],
    required: false,
    defaultValue: 'Everyday'
  },
  {
    name: 'CUSTOM_TEXT',
    description: 'Custom text/personalization',
    type: 'text',
    required: false,
    defaultValue: 'Your Name'
  }
];

// Listing Templates Manager
export class ListingTemplatesManager {
  private templates: Map<string, ListingTemplate> = new Map();
  private builtInTemplates: ListingTemplate[] = [];

  constructor() {
    this.loadBuiltInTemplates();
    logger.info('ListingTemplatesManager initialized');
  }

  private loadBuiltInTemplates() {
    this.builtInTemplates = [
      // Handmade Jewelry Template
      {
        id: 'jewelry-ring',
        userId: 'system',
        name: 'Handmade Ring Template',
        category: 'jewelry',
        isBuiltIn: true,
        title: 'Handmade {MATERIAL} Ring - {STYLE} Design',
        description: `Perfect template for handmade rings and jewelry

Beautiful handmade {MATERIAL} ring featuring a {STYLE} design. Perfect for {OCCASION}.

✨ Features:
• Made with high-quality {MATERIAL}
• {STYLE} design elements
• Comfortable fit
• Hypoallergenic materials
• Handcrafted with love

Perfect gift for {OCCASION} or treat yourself to something special.

📏 Available in multiple sizes
💎 Premium quality materials
🎁 Gift wrapping available

Custom personalization available - just message me with your preferences!`,
        tags: ['handmade', 'ring', '{MATERIAL}', '{STYLE}', 'jewelry', 'artisan', 'unique', 'custom'],
        price: 45.99,
        shippingProfile: 'standard',
        etsyCategory: 'Style > Rings',
        materials: ['{MATERIAL}', 'Sterling Silver', 'Gold Plating'],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Home Decor Template
      {
        id: 'home-decor-wall-art',
        userId: 'system',
        name: 'Wall Art Template',
        category: 'home-decor',
        isBuiltIn: true,
        title: '{STYLE} {MATERIAL} Wall Art - {COLOR}',
        description: `Template for wall art and decorative pieces

Stunning {STYLE} {MATERIAL} wall art in beautiful {COLOR}. Perfect for adding character to any room.

🏠 Features:
• High-quality {MATERIAL} construction
• {STYLE} design aesthetic
• {COLOR} finish
• Ready to hang
• Handcrafted details

Transform your space with this unique piece of art.

📐 Multiple sizes available
🎨 Custom colors available
📦 Carefully packaged for safe delivery

Great for {OCCASION} or as a thoughtful gift.`,
        tags: ['wall art', '{MATERIAL}', '{STYLE}', '{COLOR}', 'home decor', 'handmade', 'art', 'decorative'],
        price: 35.99,
        shippingProfile: 'standard',
        etsyCategory: 'Home & Living > Home Decor > Wall Decor',
        materials: ['{MATERIAL}', 'Wood Frame', 'Protective Coating'],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Vintage Clothing Template
      {
        id: 'vintage-clothing',
        userId: 'system',
        name: 'Vintage Clothing Template',
        category: 'vintage',
        isBuiltIn: true,
        title: 'Vintage {MATERIAL} {STYLE} - Size {SIZE}',
        description: `Template for vintage clothing and apparel

Authentic vintage {MATERIAL} piece in {STYLE} style. Size {SIZE}.

👗 Features:
• Authentic vintage piece
• {MATERIAL} material
• {STYLE} style
• Size {SIZE}
• Excellent condition

A unique addition to any wardrobe.

📏 Measurements provided
🧺 Care instructions included
📦 Eco-friendly packaging

Perfect for {OCCASION} or vintage fashion lovers.`,
        tags: ['vintage', '{MATERIAL}', '{STYLE}', 'size {SIZE}', 'clothing', 'fashion', 'retro', 'unique'],
        price: 28.99,
        shippingProfile: 'standard',
        etsyCategory: 'Clothing > Women\'s Clothing',
        materials: ['{MATERIAL}', 'Vintage Fabric'],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Personalized Gift Template
      {
        id: 'personalized-gift',
        userId: 'system',
        name: 'Personalized Gift Template',
        category: 'personalized',
        isBuiltIn: true,
        title: 'Personalized {MATERIAL} Gift - Custom {CUSTOM_TEXT}',
        description: `Template for personalized and custom gifts

Beautiful personalized {MATERIAL} gift featuring custom "{CUSTOM_TEXT}" text. Perfect for {OCCASION}.

🎁 Features:
• Custom "{CUSTOM_TEXT}" personalization
• High-quality {MATERIAL}
• Professional finish
• Gift-ready packaging
• Made to order

Create a one-of-a-kind gift that will be treasured forever.

✏️ Custom text included
🎨 Multiple color options
📦 Gift wrapping available
💝 Perfect for {OCCASION}

Please message me with your custom text and any special requests!`,
        tags: ['personalized', '{MATERIAL}', 'custom', 'gift', '{OCCASION}', 'handmade', 'unique', 'special'],
        price: 32.99,
        shippingProfile: 'standard',
        etsyCategory: 'Crafts & Supplies > Craft Supplies',
        materials: ['{MATERIAL}', 'Personalization Materials'],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Seasonal Template
      {
        id: 'seasonal-holiday',
        userId: 'system',
        name: 'Seasonal Holiday Template',
        category: 'seasonal',
        isBuiltIn: true,
        title: '{STYLE} Holiday {MATERIAL} Decor - {COLOR}',
        description: `Template for holiday and seasonal items

Festive {STYLE} holiday decoration made from {MATERIAL} in {COLOR}. Perfect for {OCCASION}.

🎄 Features:
• {STYLE} holiday design
• {MATERIAL} construction
• {COLOR} finish
• Weather resistant
• Handcrafted quality

Add festive cheer to your home this holiday season.

🎨 Multiple color options
📏 Various sizes available
📦 Ready to display
🎁 Great for gifting

Perfect for {OCCASION} celebrations and holiday decorating.`,
        tags: ['holiday', '{MATERIAL}', '{STYLE}', '{COLOR}', 'seasonal', 'decoration', 'festive', '{OCCASION}'],
        price: 24.99,
        shippingProfile: 'standard',
        etsyCategory: 'Home & Living > Home Decor > Holiday Decorations',
        materials: ['{MATERIAL}', 'Weather Resistant Coating'],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Store built-in templates
    this.builtInTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Save listing as template
  public async saveListingAsTemplate(
    userId: string,
    listingData: {
      title: string;
      description: string;
      tags: string[];
      price?: number;
      materials?: string[];
      category: string;
    },
    templateName: string,
    templateDescription?: string
  ): Promise<ListingTemplate> {
    try {
      const template: ListingTemplate = {
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        name: templateName,
        description: templateDescription || listingData.description,
        category: listingData.category,
        isBuiltIn: false,
        title: listingData.title,
        tags: listingData.tags,
        price: listingData.price,
        materials: listingData.materials || [],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.templates.set(template.id, template);
      
      logger.info('Template saved successfully', { 
        templateId: template.id, 
        userId, 
        templateName 
      });

      return template;
    } catch (error) {
      logger.error('Failed to save template', { error, userId, templateName });
      throw new Error('Failed to save template');
    }
  }

  // Load template
  public async loadTemplate(templateId: string): Promise<ListingTemplate | null> {
    try {
      const template = this.templates.get(templateId);
      if (template) {
        // Increment usage count for user templates
        if (!template.isBuiltIn) {
          template.usageCount++;
          template.updatedAt = new Date();
        }
        
        logger.info('Template loaded', { templateId, usageCount: template.usageCount });
        return template;
      }
      return null;
    } catch (error) {
      logger.error('Failed to load template', { error, templateId });
      return null;
    }
  }

  // Get templates by category
  public async getTemplatesByCategory(userId: string, category: string): Promise<ListingTemplate[]> {
    try {
      const userTemplates = Array.from(this.templates.values()).filter(
        template => template.userId === userId && template.category === category
      );
      
      const builtInTemplates = this.builtInTemplates.filter(
        template => template.category === category
      );

      return [...userTemplates, ...builtInTemplates].sort((a, b) => 
        b.updatedAt.getTime() - a.updatedAt.getTime()
      );
    } catch (error) {
      logger.error('Failed to get templates by category', { error, userId, category });
      return [];
    }
  }

  // Get all user templates
  public async getUserTemplates(userId: string): Promise<ListingTemplate[]> {
    try {
      const userTemplates = Array.from(this.templates.values()).filter(
        template => template.userId === userId
      );

      return userTemplates.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      logger.error('Failed to get user templates', { error, userId });
      return [];
    }
  }

  // Get all built-in templates
  public async getBuiltInTemplates(): Promise<ListingTemplate[]> {
    return [...this.builtInTemplates];
  }

  // Update template
  public async updateTemplate(
    templateId: string, 
    userId: string, 
    updates: Partial<ListingTemplate>
  ): Promise<ListingTemplate | null> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      if (template.userId !== userId && !template.isBuiltIn) {
        throw new Error('Unauthorized to update template');
      }

      const updatedTemplate = {
        ...template,
        ...updates,
        updatedAt: new Date()
      };

      this.templates.set(templateId, updatedTemplate);
      
      logger.info('Template updated', { templateId, userId });
      return updatedTemplate;
    } catch (error) {
      logger.error('Failed to update template', { error, templateId, userId });
      return null;
    }
  }

  // Delete template
  public async deleteTemplate(templateId: string, userId: string): Promise<boolean> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      if (template.userId !== userId) {
        throw new Error('Unauthorized to delete template');
      }

      if (template.isBuiltIn) {
        throw new Error('Cannot delete built-in templates');
      }

      this.templates.delete(templateId);
      
      logger.info('Template deleted', { templateId, userId });
      return true;
    } catch (error) {
      logger.error('Failed to delete template', { error, templateId, userId });
      return false;
    }
  }

  // Duplicate template
  public async duplicateTemplate(templateId: string, userId: string): Promise<ListingTemplate | null> {
    try {
      const originalTemplate = this.templates.get(templateId);
      if (!originalTemplate) {
        throw new Error('Template not found');
      }

      const duplicatedTemplate: ListingTemplate = {
        ...originalTemplate,
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        name: `${originalTemplate.name} (Copy)`,
        isBuiltIn: false,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.templates.set(duplicatedTemplate.id, duplicatedTemplate);
      
      logger.info('Template duplicated', { 
        originalId: templateId, 
        newId: duplicatedTemplate.id, 
        userId 
      });

      return duplicatedTemplate;
    } catch (error) {
      logger.error('Failed to duplicate template', { error, templateId, userId });
      return null;
    }
  }

  // Process template with variables
  public processTemplateWithVariables(
    template: ListingTemplate, 
    variables: { [key: string]: string }
  ): {
    title: string;
    description: string;
    tags: string[];
  } {
    let processedTitle = template.title;
    let processedDescription = template.description;
    let processedTags = [...template.tags];

    // Replace variables in title
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      processedTitle = processedTitle.replace(new RegExp(placeholder, 'g'), value);
    });

    // Replace variables in description
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      processedDescription = processedDescription?.replace(new RegExp(placeholder, 'g'), value) || '';
    });

    // Replace variables in tags
    processedTags = processedTags.map(tag => {
      let processedTag = tag;
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        processedTag = processedTag.replace(new RegExp(placeholder, 'g'), value);
      });
      return processedTag;
    });

    return {
      title: processedTitle,
      description: processedDescription || '',
      tags: processedTags
    };
  }

  // Get template variables used in template
  public getTemplateVariables(template: ListingTemplate): string[] {
    const variables = new Set<string>();
    
    // Find variables in title
    const titleMatches = template.title.match(/\{([^}]+)\}/g);
    if (titleMatches) {
      titleMatches.forEach(match => {
        variables.add(match.slice(1, -1)); // Remove { and }
      });
    }

    // Find variables in description
    const descMatches = template.description?.match(/\{([^}]+)\}/g);
    if (descMatches) {
      descMatches.forEach(match => {
        variables.add(match.slice(1, -1)); // Remove { and }
      });
    }

    // Find variables in tags
    template.tags.forEach(tag => {
      const tagMatches = tag.match(/\{([^}]+)\}/g);
      if (tagMatches) {
        tagMatches.forEach(match => {
          variables.add(match.slice(1, -1)); // Remove { and }
        });
      }
    });

    return Array.from(variables);
  }

  // Search templates
  public async searchTemplates(
    userId: string, 
    query: string
  ): Promise<ListingTemplate[]> {
    try {
      const userTemplates = await this.getUserTemplates(userId);
      const builtInTemplates = await this.getBuiltInTemplates();
      const allTemplates = [...userTemplates, ...builtInTemplates];

      const searchQuery = query.toLowerCase();
      
      return allTemplates.filter(template => 
        template.name.toLowerCase().includes(searchQuery) ||
        template.description?.toLowerCase().includes(searchQuery) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery))
      );
    } catch (error) {
      logger.error('Failed to search templates', { error, userId, query });
      return [];
    }
  }

  // Get template statistics
  public async getTemplateStats(userId: string): Promise<{
    totalTemplates: number;
    templatesByCategory: { [category: string]: number };
    mostUsedTemplate: ListingTemplate | null;
    recentlyCreated: ListingTemplate[];
  }> {
    try {
      const userTemplates = await this.getUserTemplates(userId);
      
      const templatesByCategory: { [category: string]: number } = {};
      userTemplates.forEach(template => {
        templatesByCategory[template.category] = (templatesByCategory[template.category] || 0) + 1;
      });

      const mostUsedTemplate = userTemplates.reduce((max, template) => 
        template.usageCount > max.usageCount ? template : max, 
        userTemplates[0] || { usageCount: 0 } as ListingTemplate
      );

      const recentlyCreated = userTemplates
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);

      return {
        totalTemplates: userTemplates.length,
        templatesByCategory,
        mostUsedTemplate: userTemplates.length > 0 ? mostUsedTemplate : null,
        recentlyCreated
      };
    } catch (error) {
      logger.error('Failed to get template stats', { error, userId });
      return {
        totalTemplates: 0,
        templatesByCategory: {},
        mostUsedTemplate: null,
        recentlyCreated: []
      };
    }
  }
}

// Export singleton instance
export const listingTemplatesManager = new ListingTemplatesManager();
