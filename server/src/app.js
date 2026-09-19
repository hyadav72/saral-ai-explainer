import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import explainRoutes from './routes/explain.js';
import historyRoutes from './routes/history.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health check & status endpoint
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(
    process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== 'mock' &&
    process.env.ANTHROPIC_API_KEY.trim().length > 10
  );

  res.json({
    status: 'ok',
    app: 'Saral — AI Document Explainer',
    aiStatus: hasKey ? 'live-claude' : 'demo-mode',
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/explain', explainRoutes);
app.use('/api/history', historyRoutes);

// In production, serve the built React client if available
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

export default app;
