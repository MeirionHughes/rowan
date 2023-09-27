import { Rowan, Next } from "./rowan.js";

/** 
 * executes its middleware after next has returned. 
 */
export class After<Ctx = any> extends Rowan<Ctx>{
  process(ctx: Ctx, next: Next) {
    return next().then(_ => super.process(ctx, function () { return Promise.resolve() }))
  }
}