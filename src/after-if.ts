import { Rowan, Next, Processor } from "./rowan";

/**
 * calls next then, if the predicate returns true, executes the given middleware
 */
export class AfterIf<Ctx = any> extends Rowan<Ctx>{
  constructor(private predicate: (ctx: Ctx) => Promise<boolean> | boolean, middleware: Processor<Ctx>[] ) {
    super(middleware);
  }
  async process(ctx: Ctx, next: Next): Promise<void> {
    await next();
    if (await this.predicate(ctx)) {
      await super.process(ctx);
    }
  }
}
