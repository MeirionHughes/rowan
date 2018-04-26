export type Next<Ctx> = (ctx?: Ctx) => Promise<Ctx | void>;
export type Handler<Ctx, CtxOut> = (ctx: Ctx, next: Next<CtxOut>) => Promise<Ctx | void> | Ctx | void;
export type AutoHandler<Ctx> = (ctx: Ctx) => Promise<Ctx | void> | Ctx | void;
export type Middleware<Ctx, CtxOut, TMeta = any> = {
  meta?: TMeta;
  process(ctx: Ctx, next: Next<CtxOut>): Promise<Ctx | void>;
}

export interface IRowan<CtxStart, CtxEnd=CtxStart, TMeta = any> extends Middleware<CtxStart, CtxEnd, TMeta> {
  use<CtxOut=CtxEnd>(m: Middleware<CtxEnd, CtxOut, TMeta>): IRowan<CtxStart, CtxOut, TMeta>;
  use<CtxOut=CtxEnd>(h: Handler<CtxEnd, CtxOut>, meta?: TMeta): IRowan<CtxStart, CtxOut, TMeta>;
  execute(ctx: CtxStart): Promise<CtxEnd>;
  readonly middleware: Middleware<any, any, TMeta>[];
}

export type RowanMeta = { [index: string]: any };
export type RowanContext = { [index: string]: any };

export class Rowan<CtxStart=RowanContext, CtxEnd=CtxStart, Meta=RowanMeta> implements IRowan<CtxStart, CtxEnd, Meta>{
  private _meta: Meta;
  protected _middleware: Middleware<any, any, Meta>[] = [];

  get middleware() { return this._middleware; }
  get meta() { return this._meta; }

  use<CtxOut = CtxEnd>(m: Middleware<CtxEnd, CtxOut, Meta>): IRowan<CtxStart, CtxOut, Meta>;
  use<CtxOut = CtxEnd>(h: Handler<CtxEnd, CtxOut>, meta?: Meta): IRowan<CtxStart, CtxOut, Meta>;
  use<CtxOut = CtxEnd>(input: any, meta?: any) {
    this._middleware.push(Rowan.convertToMiddleware(input));
    return this as any as IRowan<CtxStart, CtxOut, Meta>;
  }

  async execute(ctx: CtxStart): Promise<CtxEnd> {
    let resolve, reject;
    return new Promise<CtxEnd>(async (r, x) => {
      try {
        await this.process(ctx, async (_ctx?) => { r(_ctx || ctx); });
      } catch (e) { x(e); }
    })
  }

  process<CtxOut = CtxStart>(ctx: CtxStart, next?: Next<any>): Promise<CtxOut | void>
  process<CtxOut = CtxStart>(ctx: CtxStart, next: Next<any> = () => Promise.resolve()): Promise<CtxOut | void> {
    return Rowan.process(this.middleware, ctx, next);
  }

  static async execute(middleware: Middleware<any, any>[], ctx: any): Promise<any> {
    let resolve, reject;
    return new Promise<any>(async (r, x) => {
      try {
        await Rowan.process(middleware, ctx, async (_ctx?) => { r(_ctx || ctx); });
      } catch (e) { x(e); }
    })
  }

  static process(middleware: Middleware<any, any>[], ctx: any, next: (ctx?) => Promise<void> = (x) => Promise.resolve(x || ctx)): Promise<void> {
    const stack = middleware.slice().reverse();
    var _ctx: any = ctx; //shared scope;
    for (let item of stack) {
      const _next = next; //move into closure scope
      next = function (__ctx) { _ctx = __ctx || _ctx; return item.process(_ctx, _next); };
    }
    return next(_ctx);
  }

  static convertToMiddleware(input: Middleware<any, any> | Handler<any, any> | AutoHandler<any>, meta?: any) {
    if (isMiddleware(input)) {
      return input;
    } else {
      return {
        meta: meta || input["meta"],
        process: isAutoHandler(input) ? async function (ctx, next) { await input(ctx); return await next(ctx); } : input
      } as Middleware<any, any, any>;
    }
  }
}

export function isMiddleware(obj): obj is Middleware<any, any> {
  return typeof (obj) === "object" && typeof (obj["process"]) === "function";
}

export function isAutoHandler(obj): obj is AutoHandler<any> {
  return typeof (obj) === "function" && obj.length <= 1;
}