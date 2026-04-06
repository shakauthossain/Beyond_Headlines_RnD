import { Router } from 'express';
import { clusters, scrapedHeadlines } from '../data/mockData';
import { ok, notFound } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /clusters:
 *   get:
 *     summary: List topic clusters
 *     tags: [Clusters — Step 1]
 *     parameters:
 *       - in: query
 *         name: emerging
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of clusters
 */
router.get('/', (req, res) => {
  const { emerging } = req.query;
  let filtered = [...clusters];
  if (emerging === 'true') filtered = filtered.filter(c => c.isEmerging);
  return ok(res, filtered);
});

/**
 * @swagger
 * /clusters/{id}:
 *   get:
 *     summary: Get cluster with headlines
 *     tags: [Clusters — Step 1]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cluster with its headlines
 *       404:
 *         description: Not found
 */
router.get('/:id', (req, res) => {
  const cluster = clusters.find(c => c.id === req.params.id);
  if (!cluster) return notFound(res, 'Cluster not found');
  
  const headlines = scrapedHeadlines.filter(h => cluster.headlineIds.includes(h.id));
  return ok(res, { ...cluster, headlines });
});

/**
 * @swagger
 * /clusters/headlines/raw:
 *   get:
 *     summary: Get raw scraped headlines
 *     tags: [Clusters — Step 1]
 *     parameters:
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of raw headlines
 */
router.get('/headlines/raw', (req, res) => {
  const { source } = req.query;
  let filtered = [...scrapedHeadlines];
  if (source) filtered = filtered.filter(h => h.source === source);
  return ok(res, filtered);
});

export default router;
