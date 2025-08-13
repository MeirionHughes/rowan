import { Rowan, Next, NextNoop, Processor } from "./rowan.js";

/**
 * A middleware container that conditionally executes its child middleware based on a predicate.
 * The predicate is evaluated before any middleware execution, providing branching logic
 * for middleware chains.
 * 
 * If the predicate returns false, the child middleware is skipped entirely and the
 * next middleware in the chain is called immediately. If the predicate returns true,
 * the child middleware is executed, and optionally the next middleware can be called
 * or terminated based on the terminate parameter.
 * 
 * @template Ctx - The type of the context object
 * 
 * @example
 * ```typescript
 * // Simple conditional middleware
 * const authCheck = new If(
 *   async (ctx) => ctx.user.isAuthenticated,
 *   [
 *     async (ctx) => console.log('User is authenticated'),
 *     async (ctx) => ctx.authenticated = true
 *   ]
 * );
 * 
 * // Conditional middleware with termination
 * const errorCheck = new If(
 *   async (ctx) => ctx.hasError,
 *   [async (ctx) => ctx.response = { error: 'Something went wrong' }],
 *   true // terminate - don't call next() if condition is true
 * );
 * ```
 */
export class If<Ctx = any> extends Rowan<Ctx> {
  private terminate: boolean;

  /**
   * Creates an If middleware with a predicate and optional middleware array.
   * 
   * @param predicate - Async function that determines whether to execute middleware
   * @param middleware - Array of processors to execute if predicate returns true
   */
  constructor(predicate: (ctx: Ctx) => Promise<boolean>, middleware?: Processor<Ctx>[]);
  
  /**
   * Creates an If middleware with a predicate and termination flag.
   * 
   * @param predicate - Async function that determines whether to execute middleware
   * @param terminate - If true, don't call next() when predicate is true
   */
  constructor(predicate: (ctx: Ctx) => Promise<boolean>, terminate?: boolean);
  
  /**
   * Creates an If middleware with a predicate, middleware array, and termination flag.
   * 
   * @param predicate - Async function that determines whether to execute middleware
   * @param middleware - Array of processors to execute if predicate returns true
   * @param terminate - If true, don't call next() when predicate is true
   */
  constructor(predicate: (ctx: Ctx) => Promise<boolean>, middleware: Processor<Ctx>[], terminate?: boolean);
  
  /**
   * Internal constructor implementation that handles all overloads.
   * 
   * @param predicate - Async function that returns true to execute middleware, false to skip
   * @param arg - Either a middleware array or a boolean terminate flag
   * @param terminate - Optional termination flag when arg is a middleware array
   * 
   * @example
   * ```typescript
   * // With middleware only
   * new If(async (ctx) => ctx.shouldProcess, [middleware1, middleware2]);
   * 
   * // With terminate flag only
   * new If(async (ctx) => ctx.shouldStop, true);
   * 
   * // With both middleware and terminate flag
   * new If(async (ctx) => ctx.condition, [middleware1], true);
   * ```
   */
  constructor(private predicate: (ctx: Ctx) => Promise<boolean>, arg?: Processor<Ctx>[] | boolean, terminate?: boolean) {
    super(Array.isArray(arg) ? arg : []);
    this.terminate = !Array.isArray(arg) ? !!arg : (terminate || false)
  }
  
  /**
   * Processes the context by evaluating the predicate and conditionally executing middleware.
   * 
   * If the predicate returns true:
   * - Child middleware is executed
   * - If terminate is false (default), next() is called after child middleware
   * - If terminate is true, next() is not called (chain stops here)
   * 
   * If the predicate returns false:
   * - Child middleware is skipped
   * - next() is called immediately
   * 
   * @param ctx - The context object to process
   * @param next - Function to call the next middleware in the chain
   * @returns A Promise that resolves when processing is complete
   * 
   * @example
   * ```typescript
   * await ifMiddleware.process(context, async () => {
   *   console.log('This runs only if predicate is false or terminate is false');
   * });
   * ```
   */
  process(ctx: Ctx, next: Next): Promise<void> {
    const self = this;
    return this.predicate(ctx).then(function(r) { 
      return r ? self.processInternal(ctx, self.terminate ? NextNoop : next) : next(); 
    });
  }

  /**
   * Internal method to process child middleware with the appropriate next function.
   * 
   * @param ctx - The context object to process
   * @param next - Function to call after child middleware completes
   * @returns A Promise that resolves when child middleware processing is complete
   */
  private processInternal(ctx: Ctx, next: Next): Promise<void> {
    return super.process(ctx, next);
  }
}
