import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";

const STORE_KEY = "rq-cache";

export const idbPersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => (await get(`${STORE_KEY}:${key}`)) ?? null,
    setItem: async (key, value) => {
      await set(`${STORE_KEY}:${key}`, value);
    },
    removeItem: async (key) => {
      await del(`${STORE_KEY}:${key}`);
    },
  },
  throttleTime: 1000,
});
