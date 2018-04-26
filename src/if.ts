import { Rowan, RowanMeta, RowanContext, Next } from "./rowan";

/**
 * guards execution of a middleware chain with a predicate
 * if the predicate returns false for a given context, then its middleware is skipped entirely 
 * and next is called. 
 * if the predicate returns true, then the middleware 
 */
export class If<Ctx = any, Meta = any> extends Rowan<Ctx, Ctx, Meta>{
  constructor(private predicate: (ctx) => Promise<boolean>, private terminate = false) {
    super();
  }
  async process(ctx: Ctx, next: Next<Ctx>): Promise<any> {
    if (await this.predicate(ctx)) {
      return super.process(ctx, this.terminate ? () => Promise.resolve() : next);
    } else {
      return next();
    }
  }
}
