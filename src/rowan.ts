export type RowanContext = { $done ?: true };
export type TaskHandler<TCtx extends RowanContext> = (ctx: TCtx) => Promise<any> | any;
export type ErrorHandler<TCtx extends RowanContext> = (ctx: TCtx, err: any) => Promise<any> | any;
export type Handler<TCtx extends RowanContext> = TaskHandler<TCtx> | ErrorHandler<TCtx> | Processor<TCtx>;

export interface Processor<TCtx extends RowanContext> {
  process(ctx: TCtx, err: any): Promise<any> | any;
}

export class Rowan<TCtx extends RowanContext> implements Processor<TCtx> {
  constructor(private _middleware: Handler<TCtx>[] = []) { }
  process(ctx: TCtx): Promise<any>
  process(ctx: TCtx, err: any): Promise<any>
  process(ctx: TCtx, err?: any): Promise<any> {
    return Rowan.execute(ctx, err, this._middleware, true);
  }
  use(handler: Handler<TCtx>, ...handlers: Handler<TCtx>[]): this {
    if (handlers.length == 0) {
      this._middleware.push(handler);
    }
    else {
      const _handlers = [handler, ...handlers];
      this._middleware.push({
        process: function (ctx, err) {
          return Rowan.execute(ctx, err, _handlers, false);
        }
      });
    }
    return this;
  }
  static async execute<Ctx extends RowanContext>(ctx: Ctx, err: any, handlers: Handler<Ctx>[], terminate: boolean = false): Promise<any> {
    let result: any = err;
    for (let handler = handlers[0], i = 0; i < handlers.length; handler = handlers[++i]) {
      if (ctx.$done === true) {
        break;
      }
      try {
        if (isProcessor(handler)) {
          result = await handler.process(ctx, err);
        }
        else if (isErrorHandler<Ctx>(handler)) {
          if (err != undefined) {
            result = await (<ErrorHandler<Ctx>>handler)(ctx, err);
          }
        } else if (err == undefined) {
          result = await handler(ctx);
        }
      } catch (ex) {
        result = ex;
      }

      if (result === false) {
        return ((i == handlers.length - 1) || terminate) ? false : err;
      }
      else if (result === true) {
        result = true;
        err = undefined;
      }
      else if (result != undefined) {
        err = result;
      }
    }

    if (err)
      throw err;

    return result;
  }
}

function isErrorHandler<TCtx>(handler: Handler<TCtx>): handler is ErrorHandler<TCtx> {
  return typeof (handler) == "function" && handler.length == 2;
}

function isProcessor<TCtx>(handler: Handler<TCtx> | Processor<TCtx>): handler is Processor<TCtx> {
  return typeof (handler) == "object" && typeof (handler.process) == "function";
}