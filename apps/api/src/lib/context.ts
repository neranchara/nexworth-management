import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  userId?: string;
  ip?: string;
  requestId?: string;
}

export const contextStorage = new AsyncLocalStorage<RequestContext>();

export const getContext = (): RequestContext | undefined => {
  return contextStorage.getStore();
};

export const setContext = (context: RequestContext, callback: () => void) => {
  contextStorage.run(context, callback);
};
