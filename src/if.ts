import { Rowan, Next, Meta, Processor } from "./rowan";

/**
 * guards execution of a middleware chain with a predicate
 * if the predicate returns false for a given context, then its middleware is skipped entirely 
 * and the given next is called. 
 * if the predicate returns true, then the middleware is executed, with the given next added to the end. 
 */
export class If<Ctx = any> extends Rowan<Ctx>{
  private terminate: boolean;

  constructor(predicate: (ctx: Ctx) => Promise<boolean> | boolean, middleware?: Processor<Ctx>[])
  constructor(predicate: (ctx: Ctx) => Promise<boolean> | boolean, terminate?: boolean)
  constructor(predicate: (ctx: Ctx) => Promise<boolean> | boolean, middleware: Processor<Ctx>[], terminate?: boolean)
  constructor(private predicate: (ctx: Ctx) => Promise<boolean> | boolean, arg: Processor<Ctx>[] | boolean, terminate?: boolean) {
    super(Array.isArray(arg) ? arg : []);
    this.terminate = !Array.isArray(arg) ? arg : (terminate || false)
  }
  async process(ctx: Ctx, next: Next): Promise<void> {
    if (await this.predicate(ctx)) {
      await super.process(ctx, this.terminate ? () => Promise.resolve() : next);
    } else {
      await next();
    }
  }
}
