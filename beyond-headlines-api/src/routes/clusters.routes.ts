import { Router } from 'express';
import { db } from '../db/client';
import { ok, notFound } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /clusters:
 *   get:
 *     summary: List topic clusters
 *     tags: [Step 01 - Clusters]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/apiTokenParam'
 *       - $ref: '#/components/parameters/emailParam'
 *       - in: query
 *         name: emerging
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of clusters
 */
router.get('/', async (req, res) => {
  const { emerging } = req.query;
  
  const where: any = {};
  if (emerging === 'true') {
    where.is_emerging = true;
  }

  const clusters = await db.cluster.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      headlines: true
    }
  });

  return ok(res, clusters);
});

/**
 * @swagger
 * /clusters/{id}:
 *   get:
 *     summary: Get cluster with headlines
 *     tags: [Step 01 - Clusters]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/apiTokenParam'
 *       - $ref: '#/components/parameters/emailParam'
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
router.get('/:id', async (req, res) => {
  const cluster = await db.cluster.findUnique({
    where: { id: req.params.id },
    include: {
      headlines: true
    }
  });

  if (!cluster) return notFound(res, 'Cluster not found');
  return ok(res, cluster);
});

/**
 * @swagger
 * /clusters/headlines/raw:
 *   get:
 *     summary: Get raw scraped headlines
 *     tags: [Step 01 - Clusters]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/apiTokenParam'
 *       - $ref: '#/components/parameters/emailParam'
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of raw headlines
 */
router.get('/headlines/raw', async (req, res) => {
  const { source } = req.query;
  
  const where: any = {};
  if (source) {
    where.source = source as string;
  }

  const headlines = await db.scrapedHeadline.findMany({
    where,
    orderBy: { scrapedAt: 'desc' },
    take: 100
  });

  return ok(res, headlines);
});

export default router;
