import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import localforage from 'localforage';
import { queryClient } from './queryClient';

export const enablePersistence = () => {
  if (typeof window === 'undefined') return;

  const persister = createAsyncStoragePersister({
    storage: localforage,
    throttleTime: 1000,
  });

  persistQueryClient({
    queryClient,
    persister,
    maxAge: 24 * 60 * 60 * 1000,
    dehydrateOptions: {
      shouldDehydrateQuery: (q) => q.state.status === 'success',
    },
  });
};

