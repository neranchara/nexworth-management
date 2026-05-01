import { FastifyInstance } from 'fastify';
import {
  listCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler
} from '../controllers/category.controller.js';
import { requireRole } from '../middlewares/rbac.middleware.js';

export default async function categoryRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.get('/categories', listCategoriesHandler);
  
  // Admin-only routes
  fastify.post('/categories', { preHandler: [requireRole(['Admin'])] }, createCategoryHandler);
  fastify.put('/categories/:id', { preHandler: [requireRole(['Admin'])] }, updateCategoryHandler);
  fastify.delete('/categories/:id', { preHandler: [requireRole(['Admin'])] }, deleteCategoryHandler);
}
