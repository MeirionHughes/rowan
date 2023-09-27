import { Rowan, Next, Processor } from "./rowan.js";

/** 
 * wraps execution of its middleware in a try-catch block and calls the callback onerror on an exception 
 */
export class Catch<Ctx = any> extends Rowan<Ctx>{
  constructor(private onError: (err: Error, ctx: Ctx) => Promise<void>, ...middleware: Processor<Ctx>[]) {
    super(middleware);
  }
  process(ctx: Ctx, next: Next) {
    return super.process(ctx, next).catch(err => this.onError(err, ctx as Ctx));
  }
}