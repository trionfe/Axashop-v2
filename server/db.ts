import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Octokit } from "@octokit/rest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_VERCEL = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_DIR = IS_VERCEL ? '/tmp/axashop-data' : path.join(__dirname, 'data');

// Configuration GitHub
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const REPO_OWNER = "trionfe";
const REPO_NAME = "Axashop-v2";

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Helper to ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Charge depuis GitHub et cache localement
async function fetchFromGitHub(filename: string) {
  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `server/data/${filename}`,
    });
    if (!Array.isArray(fileData) && fileData.type === 'file') {
      const content = Buffer.from(fileData.content, 'base64').toString('utf8');
      const parsed = JSON.parse(content);
      fs.writeFileSync(path.join(DATA_DIR, filename), content);
      console.log(`[GitHub] Loaded ${filename} (${parsed.length} items)`);
      return parsed;
    }
  } catch (e) {
    console.error(`[GitHub] Failed to fetch ${filename}:`, e);
  }
  return [];
}

// Lit en local, et si vide/absent charge depuis GitHub
async function readJsonAsync(filename: string): Promise<any[]> {
  const filePath = path.join(DATA_DIR, filename);
  if (fs.existsSync(filePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  return await fetchFromGitHub(filename);
}

// Version sync (fallback, utilisée pour les écritures)
function readJson(filename: string) {
  const filePath = path.join(DATA_DIR, filename);
  if (fs.existsSync(filePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  return [];
}

// Helper to write JSON file and SYNC to GitHub via API
async function writeJson(filename: string, data: any) {
  const filePath = path.join(DATA_DIR, filename);
  const content = JSON.stringify(data, null, 2);
  
  // 1. Sauvegarde locale immédiate
  fs.writeFileSync(filePath, content);

  // 2. Synchronisation GitHub via API
  try {
    console.log(`[GitHub API] Syncing ${filename}...`);
    const githubPath = `server/data/${filename}`;
    
    // Récupérer le SHA du fichier actuel sur GitHub
    let sha: string | undefined;
    try {
      const { data: fileData } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: githubPath,
      });
      if (!Array.isArray(fileData)) {
        sha = fileData.sha;
      }
    } catch (e) {
      console.log(`[GitHub API] File ${filename} not found on GitHub, will create it.`);
    }

    // Mettre à jour le fichier sur GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: githubPath,
      message: `data: update ${filename} via admin`,
      content: Buffer.from(content).toString('base64'),
      sha: sha,
    });
    console.log(`[GitHub API] Successfully synced ${filename} to GitHub`);
  } catch (error) {
    console.error(`[GitHub API] Failed to sync with GitHub:`, error);
  }
}

export async function getDb() {
  return null;
}

export async function upsertUser(user: any) {
  const users = readJson('users.json');
  const index = users.findIndex((u: any) => u.openId === user.openId);
  if (index >= 0) {
    users[index] = { ...users[index], ...user, updatedAt: new Date() };
  } else {
    users.push({ ...user, id: Date.now(), createdAt: new Date(), updatedAt: new Date() });
  }
  await writeJson('users.json', users);
}

export async function getUserByOpenId(openId: string) {
  const users = readJson('users.json');
  if (openId === "admin-session") {
    return {
      id: 0,
      openId: "admin-session",
      name: "Administrator",
      role: "admin",
    };
  }
  return users.find((u: any) => u.openId === openId);
}

export async function getAllColumns() {
  const cols = await readJsonAsync('columns.json');
  return cols.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
}

export async function getColumnById(id: number) {
  const cols = await readJsonAsync('columns.json');
  return cols.find((c: any) => c.id === id);
}

export async function getVisibleProducts() {
  const prods = await readJsonAsync('products.json');
  return prods.filter((p: any) => p.isVisible !== false);
}

export async function getProductsByColumnId(columnId: number) {
  const prods = await readJsonAsync('products.json');
  return prods.filter((p: any) => p.columnId === columnId);
}

export async function getProductById(id: number) {
  const prods = await readJsonAsync('products.json');
  return prods.find((p: any) => p.id === id);
}

export async function getAllProductsAdmin() {
  return await readJsonAsync('products.json');
}

export async function getLatestStatistics() {
  const stats = readJson('statistics.json');
  return stats[stats.length - 1] || {
    totalRevenue: "0",
    activeProducts: 0,
    totalUsers: 0,
    pendingOrders: 0
  };
}

export async function createColumn(data: any) {
  const columns = readJson('columns.json');
  const newColumn = { ...data, id: Date.now(), isActive: true };
  columns.push(newColumn);
  await writeJson('columns.json', columns);
  return newColumn;
}

export async function updateColumn(data: any) {
  const columns = readJson('columns.json');
  const index = columns.findIndex((c: any) => c.id === data.id);
  if (index >= 0) {
    columns[index] = { ...columns[index], ...data };
    await writeJson('columns.json', columns);
  }
  return columns[index];
}

export async function createProduct(data: any) {
  const products = readJson('products.json');
  const newProduct = { ...data, id: Date.now(), isVisible: true, createdAt: new Date() };
  products.push(newProduct);
  await writeJson('products.json', products);
  return newProduct;
}

// Reviews functions
export async function createReview(data: any) {
  const reviews = readJson('reviews.json');
  const newReview = { 
    ...data, 
    id: Date.now(), 
    isApproved: true, 
    createdAt: new Date(),
    updatedAt: new Date()
  };
  reviews.push(newReview);
  await writeJson('reviews.json', reviews);
  return newReview;
}

export async function getAllReviews() {
  const reviews = await readJsonAsync('reviews.json');
  return reviews.sort((a: any, b: any) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getApprovedReviews() {
  const reviews = await readJsonAsync('reviews.json');
  return reviews
    .filter((r: any) => r.isApproved !== false)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function deleteReview(id: number) {
  const reviews = readJson('reviews.json');
  const filtered = reviews.filter((r: any) => r.id !== id);
  await writeJson('reviews.json', filtered);
  return { success: true };
}

// Orders functions
export async function createOrder(data: any) {
  const orders = readJson('orders.json');
  const newOrder = { 
    ...data, 
    id: data.orderId || `AXA-${Date.now()}`,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  orders.push(newOrder);
  await writeJson('orders.json', orders);
  return newOrder;
}

export async function getAllOrders() {
  const orders = await readJsonAsync('orders.json');
  return orders.sort((a: any, b: any) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateOrderStatus(orderId: string, status: string, deliveryData?: { text?: string, fileUrl?: string }) {
  const orders = readJson('orders.json');
  const index = orders.findIndex((o: any) => o.id === orderId || o.orderId === orderId);
  if (index >= 0) {
    orders[index] = { 
      ...orders[index], 
      status, 
      deliveryData,
      updatedAt: new Date() 
    };
    await writeJson('orders.json', orders);
    return orders[index];
  }
  return null;
}

export async function updateProduct(id: number, data: any) {
  const products = readJson('products.json');
  const index = products.findIndex((p: any) => p.id === id);
  if (index >= 0) {
    products[index] = { ...products[index], ...data, updatedAt: new Date() };
    await writeJson('products.json', products);
    return products[index];
  }
  return null;
}

export async function deleteProduct(id: number) {
  const products = readJson('products.json');
  const filtered = products.filter((p: any) => p.id !== id);
  await writeJson('products.json', filtered);
  return { success: true };
}

export async function deleteColumn(id: number) {
  const columns = readJson('columns.json');
  const filtered = columns.filter((c: any) => c.id !== id);
  await writeJson('columns.json', filtered);
  return { success: true };
}
