import { Router } from 'express';
import authRoutes from './auth.routes';
import articleRoutes from './articles.routes';
import categoryRoutes from './categories.routes';
import tagRoutes from './tags.routes';
import clusterRoutes from './clusters.routes';
import researchRoutes from './research.routes';
import aiRoutes from './ai.routes';
import publishRoutes from './publish.routes';
import userRoutes from './users.routes';
import mediaRoutes from './media.routes';
import analyticsRoutes from './analytics.routes';
import intelligenceRoutes from './intelligence.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/articles', articleRoutes);
router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);
router.use('/clusters', clusterRoutes);
router.use('/research', researchRoutes);
router.use('/ai', aiRoutes);
router.use('/publish', publishRoutes);
router.use('/users', userRoutes);
router.use('/media', mediaRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/intelligence', intelligenceRoutes);

export default router;
