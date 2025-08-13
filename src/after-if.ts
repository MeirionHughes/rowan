import { Rowan, Next, Processor } from "./rowan.js";

/**
 * A middleware container that executes its child middleware only if a predicate returns true,
 * and only after the next middleware in the chain has completed.
 * 
 * This is useful for conditional post-processing based on the results of upstream middleware.
 * The predicate is evaluated after next() has been called, allowing you to conditionally
 * execute middleware based on what happened during the main processing chain.
 * 
 * @template Ctx - The type of the context object
 * 
 * @example
 * ```typescript
 * const afterIf = new AfterIf(
 *   async (ctx) => ctx.success === true,
 *   [
 *     async (ctx) => console.log('Success handler'),
 *     async (ctx) => ctx.logSuccess = true
 *   ]
 * );
 * 
 * // Will only run success handlers if ctx.success is true after main processing
 * await afterIf.process(context, async () => {
 *   // Main processing logic
 *   context.success = true;
 * });
 * ```
 */
export class AfterIf<Ctx = any> extends Rowan<Ctx>{
  /**
   * Creates a new AfterIf middleware container.
   * 
   * @param predicate - Async function that determines whether to execute the middleware.
   *                   Called after next() has completed with the processed context.
   * @param middleware - Array of processors to execute if the predicate returns true
   * 
   * @example
   * ```typescript
   * const afterIf = new AfterIf(
   *   async (ctx) => ctx.statusCode === 200,
   *   [
   *     async (ctx) => ctx.cached = true,
   *     async (ctx) => console.log('Request successful')
   *   ]
   * );
   * ```
   */
  constructor(private predicate: (ctx: Ctx) => Promise<boolean>, middleware: Processor<Ctx>[]) {
    super(middleware);
  }
  
  /**
   * Processes the context by first calling next(), then evaluating the predicate,
   * and finally executing the child middleware if the predicate returns true.
   * 
   * @param ctx - The context object to process
   * @param next - Function to call the next middleware in the chain
   * @returns A Promise that resolves when processing is complete
   */
  process(ctx: Ctx, next: Next): Promise<void> {
    const self = this;
    return next()
      .then(function() { 
        return self.predicate(ctx); 
      })
      .then(function(r) {
        if (r) {
          return self.processInternal(ctx);
        }
      });
  }

  /**
   * Internal method to process child middleware without calling next.
   * 
   * @param ctx - The context object to process
   * @returns A Promise that resolves when child middleware processing is complete
   */
  private processInternal(ctx: Ctx): Promise<void> {
    return super.process(ctx);
  }
}
