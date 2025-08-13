import { Rowan, Next } from "./rowan.js";

/**
 * A middleware container that executes its child middleware after the next middleware
 * in the chain has completed. This is useful for post-processing, cleanup, logging,
 * or any operations that should happen after the main processing logic.
 * 
 * The After middleware ensures that its child middleware runs only after next() has
 * completed successfully. This creates a "post-processing" pattern where you can
 * add middleware that responds to or modifies the results of upstream processing.
 * 
 * @template Ctx - The type of the context object
 * 
 * @example
 * ```typescript
 * const after = new After([
 *   async (ctx) => console.log('Response:', ctx.response),
 *   async (ctx) => ctx.logged = true,
 *   async (ctx) => {
 *     // Send analytics after request is complete
 *     await analytics.track(ctx.userId, 'request_completed');
 *   }
 * ]);
 * 
 * await after.process(context, async () => {
 *   // Main request processing
 *   context.response = await processRequest(context.request);
 * });
 * ```
 */
export class After<Ctx = any> extends Rowan<Ctx>{
  /**
   * Processes the context by first calling next(), then executing all child middleware.
   * Child middleware is executed in sequence after the next middleware chain completes.
   * 
   * @param ctx - The context object to process
   * @param next - Function to call the next middleware in the chain
   * @returns A Promise that resolves when both next() and all child middleware have completed
   * 
   * @example
   * ```typescript
   * await after.process(ctx, async () => {
   *   // This runs first
   *   ctx.processed = true;
   * });
   * // Child middleware runs after the above completes
   * ```
   */
  process(ctx: Ctx, next: Next) {
    const self = this;
    return next().then(function(_) { 
      return self.processInternal(ctx, function () { return Promise.resolve(); }); 
    });
  }

  /**
   * Internal method to process child middleware without calling the main next function.
   * 
   * @param ctx - The context object to process
   * @param next - No-op next function for child middleware
   * @returns A Promise that resolves when child middleware processing is complete
   */
  private processInternal(ctx: Ctx, next: Next): Promise<void> {
    return super.process(ctx, next);
  }
}