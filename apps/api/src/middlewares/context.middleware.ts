import { FastifyRequest, FastifyReply, DoneFuncWithErrOrRes } from 'fastify';
import { contextStorage } from '../lib/context';

export const contextRequestHook = (request: FastifyRequest, reply: FastifyReply, done: DoneFuncWithErrOrRes) => {
  contextStorage.run({
    ip: request.ip,
    requestId: request.id as string
  }, () => {
    done();
  });
};

/**
 * Hook to update context with user ID after authentication
 * This should be called after authenticate middleware
 */
export const updateContextWithUser = async (request: FastifyRequest) => {
  const store = contextStorage.getStore();
  if (store) {
    const user = (request as any).user;
    if (user && user.sub) {
      store.userId = user.sub;
    }
  }
};
