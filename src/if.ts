import { Rowan, Next, Meta, Processor } from "./rowan";

/**
 * guards execution of a middleware chain with a predicate
 * if the predicate returns false for a given context, then its middleware is skipped entirely 
 * and next is called. 
 * if the predicate returns true, then the middleware 
 */
export class If<Ctx = any> extends Rowan<Ctx>{
  private terminate: boolean;

  constructor(predicate: (ctx: Ctx) => Promise<boolean> | boolean, middleware?: Processor<Ctx>[])
  constructor(predicate: (ctx: Ctx) => Promise<boolean> | boolean, terminate?: boolean)
  constructor(predicate: (ctx: Ctx) => Promise<boolean> | boolean, middleware: Processor<Ctx>[], terminate?: boolean)
  constructor(private predicate: (ctx: Ctx) => Promise<boolean> | boolean, arg1: Processor<Ctx>[] | boolean, terminate?: boolean) {
    super(Array.isArray(arg1) ? arg1 : []);
    this.terminate = !Array.isArray(arg1) ? arg1 : (terminate || false)
  }
  async process(ctx: Ctx, next: Next): Promise<void> {
    if (await this.predicate(ctx)) {
      return super.process(ctx, this.terminate ? () => Promise.resolve() : next);
    } else {
      return next();
    }
  }
}
