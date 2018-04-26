import { Rowan, Next, Middleware, RowanMeta, RowanContext } from "./rowan";

/** 
 * executes given middleware after next has returned. 
 */
export class After<Ctx = any, Meta = any> implements Middleware<Ctx, Ctx, Meta>{
  constructor(private _middleware: Middleware<Ctx, Ctx, Meta>) {}
  async process(ctx: Ctx, next: Next<Ctx>) {
    ctx = await next() || ctx;
    return this._middleware.process(ctx, () => Promise.resolve());
  }
}