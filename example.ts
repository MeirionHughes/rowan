type Meta = { [index: string]: any };
type Next<Ctx> = (ctx?: Ctx) => Promise<void>;
type Handler<Ctx, CtxOut> = (ctx: Ctx, next: Next<CtxOut>) => void;
type Middleware<Ctx, CtxOut, TMeta = Meta> = {
  meta?: TMeta;
  process(ctx: Ctx, next: Next<CtxOut>): void;
}

interface IRowan<CtxStart, Ctx=CtxStart, TMeta = Meta> extends Middleware<CtxStart, Ctx, TMeta> {
  use<CtxOut=Ctx>(m: Middleware<Ctx, CtxOut, TMeta>): IRowan<CtxStart, CtxOut, TMeta>;
  use<CtxOut=Ctx>(h: Handler<Ctx, CtxOut>, meta?: TMeta): IRowan<CtxStart, CtxOut, TMeta>;
}

let app: IRowan<{ name: string }>;
let sub: IRowan<{ name: string }>;

app
  .use(sub)
  .use((ctx) => {
  })
  .use(async (ctx, next) => {
    await next();
  })
  .use({
    process(ctx, next) {
    }
  });
