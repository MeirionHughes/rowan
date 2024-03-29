export type Next = () => Promise<void>;
export function NextNoop() { return Promise.resolve(); }
export type Handler<Ctx> = (ctx: Ctx, next?:Next) => Promise<void>;
export type Meta = { [index: string]: any };
export type MetaHierarchy = { meta?: Meta, children?: MetaHierarchy[] }

export type Middleware<Ctx> = {
  meta?: Meta;
  middleware?: Middleware<Ctx>[];
  process(ctx: Ctx, next: Next): Promise<void>;
}

export type Processor<Ctx> = Handler<Ctx> | Middleware<Ctx>

export interface IRowan<Ctx> extends Middleware<Ctx> {
  use(h: Processor<Ctx>, meta?: Meta): IRowan<Ctx>;
  readonly middleware: Middleware<Ctx>[];
}

export class Rowan<Ctx = any> implements IRowan<Ctx>{
  middleware: Middleware<Ctx>[];

  constructor(middleware: Processor<Ctx>[] = [], public meta: Meta = {}) {
    this.middleware = middleware.map(x => Rowan.convertToMiddleware(x));
  }

  use(input: Processor<Ctx>, meta?: any): this {
    this.middleware.push(Rowan.convertToMiddleware(input, meta));
    return this;
  }

  process(ctx: Ctx, next: Next = NextNoop): Promise<void> {
    return Rowan.process(this.middleware, ctx, next);
  }

  static process<Ctx>(middleware: Middleware<Ctx>[], ctx: Ctx, next: Next = NextNoop): Promise<void> {
    for (let index = middleware.length - 1; index >= 0; index -= 1) {
      const item = middleware[index];
      next = item.process.bind(item, ctx, next);
    }
    return next();
  }

  static convertToMiddleware<Ctx>(input: Processor<Ctx>, meta?: Meta) {
    if (isMiddleware(input)) {
      input.meta = input.meta || meta;
      return input;
    } else {
      return {
        meta: input["meta"] || meta,
        process: isAutoHandler(input) ? function (ctx, next) { return input(ctx, undefined).then(_ => next()) } : input
      } as Middleware<Ctx>;
    }
  }

  /** returns the meta hierarchy of middleware */
  static hierarchy<Ctx>(input: Middleware<Ctx>): MetaHierarchy {
    return {
      meta: input.meta,
      children: input.middleware ? input.middleware.map(Rowan.hierarchy) : undefined
    }
  }
}

export function isMiddleware(obj): obj is Middleware<any> {
  return typeof (obj) === "object" && typeof (obj["process"]) === "function";
}

export function isAutoHandler(obj): boolean {
  return typeof (obj) === "function" && obj.length <= 1;
}

