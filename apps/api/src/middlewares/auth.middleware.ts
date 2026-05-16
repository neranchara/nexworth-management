import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { updateContextWithUser } from './context.middleware';

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // 1. Extract token from Authorization header or Query String
    let token = '';
    const authHeader = request.headers.authorization;
    const queryToken = (request.query as any)?.token;

    if (authHeader) {
      token = authHeader.split(' ')[1];
    } else if (queryToken) {
      token = queryToken;
    }

    if (!token) {
      console.warn(`[AUTH-DEBUG] Missing token for ${request.method} ${request.url}`);
      return reply.status(401).send({ error: 'Unauthorized: Missing token' });
    }

    // 2. Verify JWT signature and expiration
    try {
      await request.jwtVerify();
    } catch (err: any) {
      console.error(`[AUTH-DEBUG] JWT Verification failed for ${request.method} ${request.url}:`, err.message);
      // Fallback: If jwtVerify failed (likely no header), try manual verification if we have a query token
      if (queryToken) {
        try {
          (request as any).user = await (request as any).server.jwt.verify(queryToken);
        } catch (manualErr: any) {
          console.error(`[AUTH-DEBUG] Manual JWT verification also failed:`, manualErr.message);
          throw manualErr; 
        }
      } else {
        throw err;
      }
    }

    // 3. Verify session in Database (Token Revocation Check)
    const session = await prisma.session.findUnique({
      where: { token }
    });

    if (!session) {
      console.warn(`[AUTH-DEBUG] Session NOT FOUND in DB for token: ${token.substring(0, 15)}...`);
      return reply.status(401).send({ error: 'Unauthorized: Session revoked or expired' });
    }

    // Optional: Check if session is expired in DB even if JWT is still valid
    if (session.expiresAt < new Date()) {
      console.warn(`[AUTH-DEBUG] Session EXPIRED in DB for token: ${token.substring(0, 15)}...`);
      // Cleanup expired session
      await prisma.session.delete({ where: { id: session.id } });
      return reply.status(401).send({ error: 'Unauthorized: Session expired' });
    }

    // Success log
    console.log(`[AUTH-DEBUG] Auth SUCCESS for ${request.method} ${request.url} (User: ${session.userId})`);
    
    // Update Global Context
    await updateContextWithUser(request);

  } catch (err: any) {
    console.error(`[AUTH-DEBUG] Catch block 401 for ${request.method} ${request.url}:`, err.message);
    return reply.status(401).send({ error: 'Unauthorized' });
  }
};
