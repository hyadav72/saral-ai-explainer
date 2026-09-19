import express from 'express';
import { historyStore } from '../services/store.js';

const router = express.Router();

// GET /api/history - list past explanations for device
router.get('/', (req, res) => {
  const deviceId = req.query.deviceId || req.headers['x-device-id'] || 'anonymous';
  const history = historyStore.getByDevice(deviceId);
  res.json({
    success: true,
    data: history
  });
});

// GET /api/history/:id - fetch single item
router.get('/:id', (req, res) => {
  const deviceId = req.query.deviceId || req.headers['x-device-id'];
  const item = historyStore.getById(req.params.id, deviceId);
  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Explanation not found.'
    });
  }
  res.json({
    success: true,
    data: item
  });
});

// DELETE /api/history/:id - remove single item
router.delete('/:id', (req, res) => {
  const deviceId = req.query.deviceId || req.headers['x-device-id'];
  const deleted = historyStore.delete(req.params.id, deviceId);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Explanation not found or already deleted.'
    });
  }
  res.json({
    success: true,
    message: 'Item removed from history.',
    data: deleted
  });
});

export default router;
