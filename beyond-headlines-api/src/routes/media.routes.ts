import { Router } from 'express';
import { mediaAssets } from '../data/mockData';
import { authenticate } from '../middleware/auth';
import { ok, created, noContent, notFound } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /media:
 *   get:
 *     summary: List media assets
 *     tags: [Media]
 */
router.get('/', authenticate, (req, res) => {
  return ok(res, mediaAssets);
});

router.get('/:id', authenticate, (req, res) => {
  const asset = mediaAssets.find(a => a.id === req.params.id);
  if (!asset) return notFound(res, 'Media not found');
  return ok(res, asset);
});

router.post('/upload', authenticate, (req, res) => {
  const newAsset = {
    id: `m${mediaAssets.length + 1}`,
    url: 'https://cdn.beyondheadlines.com/mock-upload.jpg',
    type: 'IMAGE',
    filename: 'upload.jpg',
    size: 1024 * 50,
    createdAt: new Date().toISOString(),
  };
  mediaAssets.push(newAsset as any);
  return created(res, newAsset);
});

router.patch('/:id', authenticate, (req, res) => {
  const index = mediaAssets.findIndex(a => a.id === req.params.id);
  if (index === -1) return notFound(res, 'Media not found');
  mediaAssets[index] = { ...mediaAssets[index], ...req.body };
  return ok(res, mediaAssets[index]);
});

router.delete('/:id', authenticate, (req, res) => {
  const index = mediaAssets.findIndex(a => a.id === req.params.id);
  if (index === -1) return notFound(res, 'Media not found');
  mediaAssets.splice(index, 1);
  return noContent(res);
});

export default router;
