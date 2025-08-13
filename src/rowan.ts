/**
 * Represents a function that can be called to proceed to the next middleware in the chain.
 * Should return a Promise that resolves when the next middleware has completed.
 * 
 * @returns A Promise that resolves when the next middleware completes
 */
export type Next = () => Promise<void>;

/**
 * A no-op implementation of the Next function that immediately resolves.
 * Used as a default when no next function is provided.
 * 
 * @returns A Promise that resolves immediately
 */
export function NextNoop() { return Promise.resolve(); }

/**
 * Represents a handler function that processes a context and optionally calls next.
 * Can be either a two-parameter function (context and next) or a one-parameter function (context only).
 * One-parameter functions automatically call next after completion.
 * 
 * @template Ctx - The type of the context object
 * @param ctx - The context object to process
 * @param next - Optional function to call the next middleware
 * @returns A Promise that resolves when processing is complete
 */
export type Handler<Ctx> = (ctx: Ctx, next?:Next) => Promise<void>;

/**
 * Represents metadata that can be attached to middleware for debugging, logging, or other purposes.
 * Can contain any key-value pairs.
 */
export type Meta = Record<string, any>;

/**
 * Represents a hierarchical structure of middleware metadata.
 * Used for debugging and visualization of middleware chains.
 */
export type MetaHierarchy = { meta?: Meta, children?: MetaHierarchy[] }

/**
 * Represents a middleware object that can process contexts and call the next middleware.
 * 
 * @template Ctx - The type of the context object
 */
export type Middleware<Ctx> = {
  /** Optional metadata associated with this middleware */
  meta?: Meta;
  /** Optional array of child middleware */
  middleware?: Middleware<Ctx>[];
  /**
   * Processes the context and calls the next middleware
   * @param ctx - The context to process
   * @param next - Function to call the next middleware
   * @returns A Promise that resolves when processing is complete
   */
  process(ctx: Ctx, next: Next): Promise<void>;
}

/**
 * Union type representing either a Handler function or a Middleware object.
 * 
 * @template Ctx - The type of the context object
 */
export type Processor<Ctx> = Handler<Ctx> | Middleware<Ctx>

/**
 * Interface defining the contract for Rowan middleware containers.
 * Extends Middleware to provide additional functionality for managing middleware chains.
 * 
 * @template Ctx - The type of the context object
 */
export interface IRowan<Ctx> extends Middleware<Ctx> {
  /**
   * Adds a processor to the middleware chain
   * @param h - The processor to add
   * @param meta - Optional metadata to associate with the processor
   * @returns This instance for method chaining
   */
  use(h: Processor<Ctx>, meta?: Meta): IRowan<Ctx>;
  /** Read-only array of middleware in this container */
  readonly middleware: Middleware<Ctx>[];
}

/**
 * Main class for creating and managing middleware chains.
 * Provides functionality to add middleware, process contexts, and manage metadata.
 * 
 * @template Ctx - The type of the context object that will be processed
 * 
 * @example
 * ```typescript
 * const app = new Rowan();
 * app.use(async (ctx) => {
 *   console.log('Processing:', ctx);
 * });
 * await app.process({ data: 'example' });
 * ```
 */
export class Rowan<Ctx = any> implements IRowan<Ctx>{
  /** Array of middleware processors in this container */
  middleware: Middleware<Ctx>[];

  /**
   * Creates a new Rowan middleware container.
   * 
   * @param middleware - Initial array of processors to add to the container
   * @param meta - Metadata to associate with this container
   * 
   * @example
   * ```typescript
   * const rowan = new Rowan([
   *   async (ctx) => console.log('First'),
   *   async (ctx) => console.log('Second')
   * ], { name: 'MyApp' });
   * ```
   */
  constructor(middleware: Processor<Ctx>[] = [], public meta: Meta = {}) {
    this.middleware = middleware.map(function(x) { return Rowan.convertToMiddleware(x); });
  }

  /**
   * Adds a processor to the middleware chain.
   * 
   * @param input - The processor (handler function or middleware object) to add
   * @param meta - Optional metadata to associate with the processor
   * @returns This instance for method chaining
   * 
   * @example
   * ```typescript
   * rowan
   *   .use(async (ctx) => console.log('First'))
   *   .use(async (ctx, next) => {
   *     console.log('Before');
   *     await next();
   *     console.log('After');
   *   });
   * ```
   */
  use(input: Processor<Ctx>, meta?: any): this {
    this.middleware.push(Rowan.convertToMiddleware(input, meta));
    return this;
  }

  /**
   * Processes a context through the middleware chain.
   * 
   * @param ctx - The context object to process
   * @param next - Optional function to call after all middleware has been processed
   * @returns A Promise that resolves when all middleware has completed
   * 
   * @example
   * ```typescript
   * await rowan.process({ userId: 123, data: 'example' });
   * ```
   */
  process(ctx: Ctx, next: Next = NextNoop): Promise<void> {
    return Rowan.process(this.middleware, ctx, next);
  }

  /**
   * Static method to process a middleware array with a context.
   * Sets up the middleware chain and executes it in reverse order.
   * 
   * @param middleware - Array of middleware to process
   * @param ctx - The context object to process
   * @param next - Optional function to call after all middleware has been processed
   * @returns A Promise that resolves when all middleware has completed
   * 
   * @example
   * ```typescript
   * const middleware = [
   *   { process: async (ctx, next) => { console.log('1'); await next(); } },
   *   { process: async (ctx, next) => { console.log('2'); await next(); } }
   * ];
   * await Rowan.process(middleware, { data: 'test' });
   * ```
   */
  static process<Ctx>(middleware: Middleware<Ctx>[], ctx: Ctx, next: Next = NextNoop): Promise<void> {
    for (let index = middleware.length - 1; index >= 0; index -= 1) {
      const item = middleware[index];
      next = item.process.bind(item, ctx, next);
    }
    return next();
  }

  /**
   * Converts a processor (handler function or middleware object) into a standardized middleware object.
   * Handles different types of input and normalizes them to the Middleware interface.
   * 
   * @param input - The processor to convert
   * @param meta - Optional metadata to associate with the middleware
   * @returns A standardized middleware object
   * 
   * @example
   * ```typescript
   * // Convert a handler function
   * const middleware = Rowan.convertToMiddleware(async (ctx) => console.log(ctx));
   * 
   * // Convert with metadata
   * const middleware2 = Rowan.convertToMiddleware(
   *   async (ctx, next) => { await next(); },
   *   { name: 'Logger' }
   * );
   * ```
   */
  static convertToMiddleware<Ctx>(input: Processor<Ctx>, meta?: Meta) {
    if (isMiddleware(input)) {
      input.meta = input.meta || meta;
      return input;
    } else {
      return {
        meta: (input as any)["meta"] || meta,
        process: isAutoHandler(input) ? function (ctx, next) { return input(ctx, undefined).then(function(_) { return next(); }); } : input
      } as Middleware<Ctx>;
    }
  }

  /**
   * Returns the metadata hierarchy of middleware for debugging and visualization.
   * Recursively traverses the middleware tree to build a hierarchical structure.
   * 
   * @param input - The middleware to analyze
   * @returns A hierarchical representation of the middleware metadata
   * 
   * @example
   * ```typescript
   * const hierarchy = Rowan.hierarchy(rowan);
   * console.log(JSON.stringify(hierarchy, null, 2));
   * // {
   * //   "meta": { "name": "MyApp" },
   * //   "children": [
   * //     { "meta": { "name": "Logger" } },
   * //     { "meta": { "name": "Auth" } }
   * //   ]
   * // }
   * ```
   */
  static hierarchy<Ctx>(input: Middleware<Ctx>): MetaHierarchy {
    return {
      meta: input.meta,
      children: input.middleware ? input.middleware.map(function(item) { return Rowan.hierarchy(item); }) : undefined
    }
  }
}

/**
 * Type guard to determine if an object is a middleware object.
 * Checks if the object has a 'process' method and is not null.
 * 
 * @param obj - The object to check
 * @returns True if the object is a middleware, false otherwise
 * 
 * @example
 * ```typescript
 * const middleware = { process: async (ctx, next) => next() };
 * const handler = async (ctx) => {};
 * 
 * console.log(isMiddleware(middleware)); // true
 * console.log(isMiddleware(handler)); // false
 * ```
 */
export function isMiddleware(obj: any): obj is Middleware<any> {
  return typeof (obj) === "object" && obj !== null && typeof (obj["process"]) === "function";
}

/**
 * Type guard to determine if a function is an auto-handler.
 * Auto-handlers are functions with 0 or 1 parameters that automatically call next() after completion.
 * Functions with 2 or more parameters are considered manual handlers that must call next() explicitly.
 * 
 * @param obj - The object to check
 * @returns True if the object is an auto-handler function, false otherwise
 * 
 * @example
 * ```typescript
 * const autoHandler = async (ctx) => console.log(ctx);
 * const manualHandler = async (ctx, next) => { await next(); };
 * 
 * console.log(isAutoHandler(autoHandler)); // true
 * console.log(isAutoHandler(manualHandler)); // false
 * ```
 */
export function isAutoHandler(obj: any): boolean {
  return typeof (obj) === "function" && obj.length <= 1;
}

