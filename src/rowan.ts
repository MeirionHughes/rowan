export type Next<Ctx> = (ctx?: Ctx) => Promise<void>;
export type Handler<Ctx, CtxOut> = (ctx: Ctx, next: Next<CtxOut>) => Promise<void> | void;
export type AutoHandler<Ctx> = (ctx: Ctx) => Promise<void> | void;
export type Middleware<Ctx, CtxOut, TMeta = any> = {
  meta?: TMeta;
  process(ctx: Ctx, next: Next<CtxOut>): Promise<void>;
}

export interface IRowan<CtxStart, CtxEnd=CtxStart, TMeta = any> extends Middleware<CtxStart, CtxEnd, TMeta> {
  use<CtxOut=CtxEnd>(m: Middleware<CtxEnd, CtxOut, TMeta>): IRowan<CtxStart, CtxOut, TMeta>;
  use<CtxOut=CtxEnd>(h: Handler<CtxEnd, CtxOut>, meta?: TMeta): IRowan<CtxStart, CtxOut, TMeta>;
  execute(ctx: CtxStart): Promise<CtxEnd>;
  readonly middleware: Middleware<any, any, TMeta>[];
}

export type RowanMeta = { [index: string]: any };
export type RowanContext = { [index: string]: any };

export function isMiddleware(obj): obj is Middleware<any, any> {
  return typeof (obj) === "object" && typeof (obj["process"]) === "function";
}

export function isAutoHandler(obj): obj is AutoHandler<any> {
  return typeof (obj) === "function" && obj.length <= 1;
}

export class Rowan<CtxStart=RowanContext, CtxEnd=CtxStart, Meta=RowanMeta> implements IRowan<CtxStart, CtxEnd, Meta>{
  private _meta: Meta;
  protected _middleware: Middleware<any, any, Meta>[] = [];

  get middleware() { return this._middleware; }
  get meta() { return this._meta; }

  use<CtxOut = CtxEnd>(m: Middleware<CtxEnd, CtxOut, Meta>): IRowan<CtxStart, CtxOut, Meta>;
  use<CtxOut = CtxEnd>(h: Handler<CtxEnd, CtxOut>, meta?: Meta): IRowan<CtxStart, CtxOut, Meta>;
  use<CtxOut = CtxEnd>(input: any, meta?: any) {
    this._middleware.push(this._convert(input));
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

  process<CtxOut = CtxStart>(ctx: CtxStart, next?: (ctx?) => Promise<void>): Promise<void>
  process<CtxOut = CtxStart>(ctx: CtxStart, next: (ctx?) => Promise<void> = () => Promise.resolve()): Promise<void> {
    const stack = this._middleware.slice().reverse();
    var _ctx: any = ctx; //shared scope;
    for (let item of stack) {
      const _next = next; //move into closure scope
      next = function (__ctx) { _ctx = __ctx || _ctx; return item.process(_ctx, _next); };
    }
    return next(_ctx);
  }

  private _convert(input: Middleware<any, any, Meta> | Handler<any, any>, meta?: Meta) {
    if (isMiddleware(input)) {
      return input;
    } else {
      return {
        meta: meta || input["meta"],
        process: isAutoHandler(input) ? async function (ctx, next) { await input(ctx); await next(ctx); } : input
      } as Middleware<any, any, Meta>;
    }
  }
}