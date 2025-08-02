// Railway startup script for better debugging
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Starting Transport Pro on Railway...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT || '5000');

// Check if build files exist
const buildPath = path.resolve(__dirname, 'dist');
const publicPath = path.resolve(__dirname, 'dist/public');
const serverPath = path.resolve(__dirname, 'dist/index.js');

console.log('Checking build files...');
console.log('dist/ exists:', fs.existsSync(buildPath));
console.log('dist/public/ exists:', fs.existsSync(publicPath));
console.log('dist/index.js exists:', fs.existsSync(serverPath));

if (fs.existsSync(publicPath)) {
  const files = fs.readdirSync(publicPath);
  console.log('Files in dist/public:', files.slice(0, 5));
}

// Set production environment
process.env.NODE_ENV = 'production';

// Start the actual server
console.log('Starting server...');
await import('./dist/index.js');