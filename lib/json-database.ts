import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'saved-generations.json');

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Initialize database file
const initDatabase = () => {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
  }
};

// Read data from JSON file
const readData = () => {
  initDatabase();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return [];
  }
};

// Write data to JSON file
const writeData = (data: any[]) => {
  initDatabase();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to database:', error);
  }
};

export const jsonDatabase = {
  savedGeneration: {
    findMany: async (options?: { where?: any; orderBy?: any; take?: number }) => {
      const data = readData();
      let filtered = data;
      
      if (options?.where) {
        if (options.where.userId) {
          filtered = filtered.filter((item: any) => item.userId === options.where.userId);
        }
      }
      
      if (options?.orderBy) {
        const [field, direction] = Object.entries(options.orderBy)[0];
        filtered.sort((a: any, b: any) => {
          const aVal = new Date(a[field]).getTime();
          const bVal = new Date(b[field]).getTime();
          return direction === 'desc' ? bVal - aVal : aVal - bVal;
        });
      }
      
      if (options?.take) {
        filtered = filtered.slice(0, options.take);
      }
      
      return filtered;
    },
    
    create: async (data: any) => {
      const items = readData();
      const newItem = {
        id: `json-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...data.data,
        createdAt: new Date().toISOString()
      };
      items.push(newItem);
      writeData(items);
      return newItem;
    },
    
    deleteMany: async (options: { where: any }) => {
      const items = readData();
      const filtered = items.filter((item: any) => {
        if (options.where.id && options.where.userId) {
          return !(item.id === options.where.id && item.userId === options.where.userId);
        }
        return true;
      });
      writeData(filtered);
      return { count: items.length - filtered.length };
    },
    
    count: async (options?: { where?: any }) => {
      const data = readData();
      if (options?.where?.userId) {
        return data.filter((item: any) => item.userId === options.where.userId).length;
      }
      return data.length;
    }
  }
};
