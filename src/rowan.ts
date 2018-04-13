export type IHandler<TCtx> = (ctx: TCtx, next: () => Promise<void>) => Promise<void>;
export type IAutoNextHandler<TCtx> = (ctx: TCtx) => Promise<void> | void;

export interface IMiddleware<TCtx, TMeta> {
  readonly meta?: TMeta;
  process(ctx: TCtx, next: () => Promise<void>): Promise<void>;
}

export interface IProcessor<TCtx, TMeta> extends IMiddleware<TCtx, TMeta> {
  readonly middleware: Iterable<IMiddleware<TCtx, TMeta>>;
  use(middleware: IMiddleware<TCtx, TMeta>): this;
  use(handler: (ctx: TCtx, next: () => Promise<void>) => (Promise<void>)): this;
}

export type RowanContext = {
  [index: string]: any;
};

export type RowanMeta = {
  [index: string]: any;
};

export function isMiddleware(obj): obj is IMiddleware<any, any> {
  return typeof (obj) === "object" && typeof (obj["process"]) === "function";
}

export function isAutoHandler(obj): obj is IAutoNextHandler<any> {
  return typeof (obj) === "function" && obj.length <= 1;
}

export class Rowan<TCtx = RowanContext, TMeta = RowanMeta> implements IProcessor<TCtx, TMeta>{
  private _meta: TMeta;
  private _middleware: IMiddleware<TCtx, TMeta>[];
  private _stackCache;
  constructor(middleware?: (IHandler<TCtx> | IAutoNextHandler<TCtx> | IMiddleware<TCtx, TMeta>)[], meta?: TMeta) {
    this._middleware = middleware ? middleware.map(x => this._convert(x)) : [];
    this._meta = meta;
  }
  get meta() { return this._meta; }
  get middleware() { return this._middleware as Iterable<IMiddleware<TCtx, TMeta>>; }

  use(middleware: IMiddleware<TCtx, TMeta>): this;
  use(handler: IHandler<TCtx> | IAutoNextHandler<TCtx>, meta?: TMeta): this;
  use(input: IMiddleware<TCtx, TMeta> | IHandler<TCtx> | IAutoNextHandler<TCtx>, meta?: TMeta): this {
    this._middleware.push(this._convert(input));
    return this;
  }

  private _convert(input: IMiddleware<TCtx, TMeta> | IHandler<TCtx> | IAutoNextHandler<TCtx>, meta?: TMeta) {
    if (isMiddleware(input)) {
      return input;
    } else {
      return {
        meta: meta || input["meta"],
        process: isAutoHandler(input) ? async function (ctx, next) { await input(ctx); await next(); } : input
      } as IMiddleware<TCtx, TMeta>;
    }
  }

  async process(ctx: TCtx, next: () => Promise<void> = () => Promise.resolve()): Promise<void> {
    const stack = this._middleware.slice().reverse();
    for (let item of stack) {
      const _next = next; //move into closure scope
      next = function () { return item.process(ctx, _next); };
    }
    return await next();
  }
}