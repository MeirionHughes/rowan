import { Rowan, Next, Processor } from "./rowan";

/**
 * calls next then, if the predicate returns true, executes the given middleware
 */
export class AfterIf<Ctx = any> extends Rowan<Ctx>{
  constructor(private predicate: (ctx: Ctx) => Promise<boolean>, middleware: Processor<Ctx>[]) {
    super(middleware);
  }
  process(ctx: Ctx, next: Next): Promise<void> {
    return next()
      .then(() => this.predicate(ctx))
      .then((r) => {
        if (r) {
          return super.process(ctx);
        }
      });
  }
}
