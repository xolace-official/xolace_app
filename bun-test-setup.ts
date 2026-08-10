/**
 * Preloaded by `bun test` (see bunfig.toml).
 *
 * Bun cannot parse react-native's Flow-typed entry point, so any unit test that
 * reaches it transitively (e.g. store.ts -> unified-storage.ts) fails to import.
 * Stub the few native modules our pure-logic tests touch.
 */
import { mock } from 'bun:test';

mock.module('react-native', () => ({
  Platform: { OS: 'ios', select: (spec: Record<string, unknown>) => spec.ios ?? spec.default },
}));

mock.module('expo-sqlite/kv-store', () => {
  const store = new Map<string, string>();
  return {
    default: {
      getItemSync: (name: string) => store.get(name) ?? null,
      setItem: async (name: string, value: string) => void store.set(name, value),
      removeItem: async (name: string) => void store.delete(name),
    },
  };
});
