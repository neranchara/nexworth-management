import { FastifyInstance } from 'fastify';
import { 
  listGoalsHandler, 
  createGoalHandler, 
  updateGoalHandler, 
  deleteGoalHandler,
  getGoalsSummaryHandler
} from '../controllers/goal.controller';

export async function goalRoutes(fastify: FastifyInstance) {
  // Protect all goal routes
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.get('/', listGoalsHandler);
  fastify.get('/summary', getGoalsSummaryHandler);
  fastify.post('/', createGoalHandler);
  fastify.put('/:id', updateGoalHandler);
  fastify.delete('/:id', deleteGoalHandler);
}
