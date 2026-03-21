import { listUsersHandler, createUserHandler, listRolesHandler } from '../controllers/user.controller.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
export default async function userRoutes(server) {
    server.get('/users', { preHandler: [requireRole(['Admin'])] }, listUsersHandler);
    server.post('/users', { preHandler: [requireRole(['Admin'])] }, createUserHandler);
    server.get('/roles', { preHandler: [requireRole(['Admin'])] }, listRolesHandler);
}
