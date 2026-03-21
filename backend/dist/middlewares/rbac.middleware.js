export const requireRole = (allowedRoles) => {
    return async (request, reply) => {
        try {
            await request.jwtVerify();
            const decoded = request.user;
            if (!decoded.role) {
                return reply.status(403).send({ error: 'Role not found in token' });
            }
            // Check if the user's role is in the list of allowed roles.
            // E.g. ['Admin', 'Officer'] 
            if (!allowedRoles.includes(decoded.role) && !allowedRoles.includes('*')) {
                return reply.status(403).send({ error: 'Forbidden: Insufficient permissions' });
            }
        }
        catch (err) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
    };
};
