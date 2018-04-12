export interface IMiddleware<TCtx, TMeta> {
  readonly meta: TMeta;
  process(ctx: TCtx, next: () => Promise<void>): Promise<void>;
}

export interface IProcessor<TCtx, TMeta> extends IMiddleware<TCtx, TMeta> {
  readonly middleware: Iterable<IMiddleware<TCtx, TMeta>>;
  use(middleware: IMiddleware<TCtx, TMeta>): this;
  use(handler: (ctx: TCtx, next: () => Promise<void>) => (Promise<void>)): this;
}

export type Meta = {
  [index: string]: any;
};

export class Processor<TCtx, TMeta = Meta> implements IProcessor<TCtx, TMeta>{
  private _meta: TMeta;
  private _middleware: IMiddleware<TCtx, TMeta>[] = [];
  constructor() {
  }
  get meta() { return this._meta; }
  get middleware() { return this._middleware; }

  use(middleware: IMiddleware<TCtx, TMeta>): this;
  use(handler: (ctx: TCtx, next: () => Promise<void>) => (Promise<void>)): this;
  use(input: IMiddleware<TCtx, TMeta> | ((ctx: TCtx, next: () => Promise<void>) => (Promise<void>))): this {
    if (typeof input === "function") {
      this._middleware.push({
        async process(ctx, next) {
          return input(ctx, next);
        },
        meta: undefined
      })
    }
    return this;
  }

  async process(ctx: TCtx, next: () => Promise<void> = () => Promise.resolve()): Promise<void> {
    let stack = this._middleware.slice().reverse();

    for (let item of stack) {
      next = () => { return item.process(ctx, next); };
    }
    return await next();
  }
}

let app = new Processor();

app.use(async (ctx, next) => {
  console.log("one");
  await next();
});

app.use(async (ctx, next) => {
  console.log("two");
  await next();
});

async function main() {
  await app.process({});
}

main().catch(console.log);