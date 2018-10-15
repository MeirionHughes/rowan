import { Rowan, Next, NextNoop, Processor } from "./rowan";

/**
 * guards execution of a middleware chain with a predicate
 * if the predicate returns false for a given context, then its middleware is skipped entirely 
 * and the given next is called. 
 * if the predicate returns true, then the middleware is executed, with the given next added to the end. 
 */
export class If<Ctx = any> extends Rowan<Ctx> {
  private terminate: boolean;

  constructor(predicate: (ctx: Ctx) => Promise<boolean>, middleware?: Processor<Ctx>[])
  constructor(predicate: (ctx: Ctx) => Promise<boolean>, terminate?: boolean)
  constructor(predicate: (ctx: Ctx) => Promise<boolean>, middleware: Processor<Ctx>[], terminate?: boolean)
  constructor(private predicate: (ctx: Ctx) => Promise<boolean>, arg: Processor<Ctx>[] | boolean, terminate?: boolean) {
    super(Array.isArray(arg) ? arg : []);
    this.terminate = !Array.isArray(arg) ? arg : (terminate || false)
  }
  process(ctx: Ctx, next: Next): Promise<void> {
    return this.predicate(ctx).then(r => (r) ? super.process(ctx, this.terminate ? NextNoop : next) : next());
  }
}
