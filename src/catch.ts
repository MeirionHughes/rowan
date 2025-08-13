import { Rowan, Next, Processor } from "./rowan.js";

/**
 * A middleware container that wraps its child middleware execution in error handling.
 * If any error occurs during the processing of child middleware or the next() call,
 * it will be caught and passed to the provided error handler function.
 * 
 * This is useful for implementing centralized error handling, logging errors,
 * transforming errors, or providing fallback behavior when middleware fails.
 * 
 * @template Ctx - The type of the context object
 * 
 * @example
 * ```typescript
 * const errorHandler = new Catch(
 *   async (error, ctx) => {
 *     console.error('Error occurred:', error.message);
 *     ctx.error = error;
 *     ctx.response = { error: 'Internal server error' };
 *   },
 *   async (ctx) => {
 *     // This middleware might throw an error
 *     if (ctx.shouldFail) {
 *       throw new Error('Something went wrong');
 *     }
 *     ctx.success = true;
 *   }
 * );
 * 
 * await errorHandler.process(context, next);
 * ```
 */
export class Catch<Ctx = any> extends Rowan<Ctx>{
  /**
   * Creates a new Catch middleware container.
   * 
   * @param onError - Async function called when an error is caught.
   *                 Receives the error and context as parameters.
   * @param middleware - Variable number of processors to wrap with error handling
   * 
   * @example
   * ```typescript
   * const catchMiddleware = new Catch(
   *   async (err, ctx) => {
   *     // Log the error
   *     console.error('Caught error:', err);
   *     
   *     // Set error response
   *     ctx.statusCode = 500;
   *     ctx.body = { error: 'Internal Server Error' };
   *     
   *     // Optionally re-throw to propagate
   *     // throw err;
   *   },
   *   middleware1,
   *   middleware2,
   *   middleware3
   * );
   * ```
   */
  constructor(private onError: (err: Error, ctx: Ctx) => Promise<void>, ...middleware: Processor<Ctx>[]) {
    super(middleware);
  }
  
  /**
   * Processes the context through child middleware with error handling.
   * 
   * The processing follows this flow:
   * 1. Executes child middleware via super.process()
   * 2. Calls the provided next() function
   * 3. If any error occurs in steps 1-2, calls the onError handler
   * 4. The onError handler can handle, transform, or re-throw the error
   * 
   * @param ctx - The context object to process
   * @param next - Function to call the next middleware in the chain
   * @returns A Promise that resolves when processing completes or error handling finishes
   * 
   * @example
   * ```typescript
   * await catchMiddleware.process(context, async () => {
   *   // This next function might also throw errors that will be caught
   *   await riskyOperation();
   * });
   * ```
   */
  process(ctx: Ctx, next: Next) {
    const self = this;
    return super.process(ctx, next).catch(function(err) { 
      return self.onError(err, ctx as Ctx); 
    });
  }
}