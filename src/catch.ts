import { Rowan, Next, Middleware, Processor } from "./rowan";

/** 
 * wraps execution of its middleware in a try-catch block and calls the callback onerror on an exception 
 */
export class Catch<Ctx = any> extends Rowan<Ctx>{
  constructor(private onerror: (ctx: Ctx & HasError) => Promise<void>, middleware?: Processor<Ctx>[]) {
    super(middleware);
  }
  async process(ctx: Ctx, next: Next) {
    try {
      await next();
    } catch (err) {
      ctx["error"] = err;
      await this.onerror(ctx as Ctx & HasError);
    }
  }
}

export type HasError = {
  error: Error;
}