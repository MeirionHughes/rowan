import { Rowan, Next, Middleware, Processor } from "./rowan";

/** 
 * executes its middleware after next has returned. 
 */
export class Catch<Ctx = any> extends Rowan<Ctx>{
  constructor(private onerror: (err) => Promise<void>, middleware?: Processor<Ctx>[]) {
    super(middleware);
  }
  async process(ctx: Ctx, next: Next) {
    try {
      await next();
    } catch (err) {
      await this.onerror(err);
    }
  }
}