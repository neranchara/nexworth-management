import { FastifyInstance } from 'fastify';
import { 
  listRolePermissionsHandler, 
  updateRolePermissionsHandler,
  listAllRolesHandler,
  createRoleHandler,
  updateRoleHandler,
  deleteRoleHandler
} from '../controllers/permission.controller.js';

export default async function permissionRoutes(server: FastifyInstance) {
  server.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });


  server.get('/roles', listAllRolesHandler);
  server.post('/roles', createRoleHandler);
  server.put('/roles/:roleId', updateRoleHandler);
  server.delete('/roles/:roleId', deleteRoleHandler);
  server.get('/roles/:roleId/permissions', listRolePermissionsHandler);
  server.post('/roles/:roleId/permissions', updateRolePermissionsHandler);
}
