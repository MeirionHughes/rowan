import { Rowan, Next, Processor } from "./rowan";

/** 
 * executes its middleware after next has returned. 
 */
export class After<Ctx = any> extends Rowan<Ctx>{
  async process(ctx: Ctx, next: Next) {
    await next();
    await super.process(ctx, () => Promise.resolve());
  }
}