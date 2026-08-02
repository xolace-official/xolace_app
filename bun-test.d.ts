// Hand-rolled stand-in for @types/bun — covers only what our tests import.
// Extend as needed rather than pulling the full types package.
declare module "bun:test" {
  type TestFn = () => void | Promise<void>;

  interface It {
    (name: string, fn: TestFn): void;
    each<T>(cases: readonly T[]): (name: string, fn: (value: T) => void | Promise<void>) => void;
  }

  export function describe(name: string, fn: () => void): void;
  export const it: It;
  export function expect<T = unknown>(actual: T): any;
  export const mock: {
    (fn?: (...args: any[]) => any): any;
    module(path: string, factory: () => unknown): void;
  };
}
