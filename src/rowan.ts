export type BaseError = any;
export type BaseContext = any;
export type TaskResult = BaseError | boolean | void;
export type TaskHandler<TCtx extends BaseContext> = (ctx: TCtx) => Promise<TaskResult> | TaskResult;
export type ErrorHandler<TCtx extends BaseContext> = (ctx: TCtx, err: BaseError) => Promise<TaskResult> | TaskResult;
export type Handler<TCtx extends BaseContext> = TaskHandler<TCtx> | ErrorHandler<TCtx> | IProcessor<TCtx>;

export interface IProcessor<TCtx extends BaseContext> {
  process(ctx: TCtx, err: BaseError | undefined): Promise<TaskResult> | TaskResult;
}

export interface IRowan<TCtx extends BaseContext> extends IProcessor<TCtx> {
  use(handler: Handler<TCtx>, ...handlers: Handler<TCtx>[]): this;
}

export class Rowan<TCtx extends BaseContext> implements IRowan<TCtx> {
  constructor(private _middleware: Handler<TCtx>[] = []) { }
  process(ctx: TCtx): Promise<TaskResult>
  process(ctx: TCtx, err: BaseError | undefined): Promise<TaskResult>
  process(ctx: TCtx, err?: BaseError | undefined): Promise<TaskResult> {
    return Rowan.execute(ctx, err, this._middleware, true);
  }
  use(handler: Handler<TCtx>, ...handlers: Handler<TCtx>[]): this {
    if (isProcessor<TCtx>(handler) || handlers.length == 0) {
      this._middleware.push(handler);
    }
    else {
      if (isErrorHandler<TCtx>(handler)) {
        this._middleware.push(function (ctx, err) {
          return Rowan.execute(ctx, err, [handler, ...handlers], false);
        });
      } else {
        this._middleware.push(function (ctx) {
          return Rowan.execute(ctx, undefined, [handler, ...handlers], false);
        });
      }
    }
    return this;
  }
  static async execute<Ctx extends BaseContext>(ctx: Ctx, err: BaseError | undefined, handlers: Handler<Ctx>[], terminate: boolean = false): Promise<TaskResult> {
    let result: TaskResult = err;
    for (let handler = handlers[0], i = 0; i < handlers.length; handler = handlers[++i]) {
      if (ctx._done === true) {
        break;        
      }
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

function isProcessor<TCtx>(handler: Handler<TCtx> | IProcessor<TCtx>): handler is IProcessor<TCtx> {
  return typeof (handler) == "object" && typeof (handler.process) == "function";
}