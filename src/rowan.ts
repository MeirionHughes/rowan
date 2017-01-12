export type BaseError = any;
export type TaskResult = BaseError | boolean | void;
export type TaskHandler<TCtx> = (ctx: TCtx) => Promise<TaskResult> | TaskResult;
export type ErrorHandler<TCtx> = (ctx: TCtx, err: BaseError) => Promise<TaskResult> | TaskResult;
export type Handler<TCtx> = TaskHandler<TCtx> | ErrorHandler<TCtx> | IProcessor<TCtx>;

export interface IProcessor<TCtx> {
  process(ctx: TCtx, err: BaseError | undefined): Promise<TaskResult> | TaskResult;
}

export interface IRowan<TCtx> extends IProcessor<TCtx> {
  use(handler: Handler<TCtx>, ...handlers: Handler<TCtx>[]): this;
}

export class Rowan<TCtx> implements IRowan<TCtx> {
  private _middleware: Handler<TCtx>[] = [];  /** execute the middleware chain with the given ctx */

  process(ctx: TCtx): Promise<TaskResult>
  process(ctx: TCtx, err: BaseError | undefined): Promise<TaskResult>
  process(ctx: TCtx, err?: BaseError | undefined): Promise<TaskResult> {
    return Rowan.execute(ctx, err, this._middleware);
  }

  /** append a handler, a sequence or a chain processor to the middleware*/
  use(handler: Handler<TCtx>, ...handlers: Handler<TCtx>[]): this {
    if (isChain<TCtx>(handler) || handlers.length == 0) {
      this._middleware.push(handler);
    }
    else {
      if (isErrorHandler<TCtx>(handler)) {
        this._middleware.push(function (ctx, err) {
          return Rowan.execute(ctx, err, [handler, ...handlers]);
        });
      } else {
        this._middleware.push(function (ctx) {
          return Rowan.execute(ctx, undefined, [handler, ...handlers]);
        });
      }
    }
    return this;
  }

  /** asynchronously execute a middleware chain */
  static async execute<Ctx>(ctx: Ctx, err: BaseError | undefined, handlers: Handler<Ctx>[]): Promise<TaskResult> {
    let result: TaskResult = err;
    for (let handler = handlers[0], i = 0; i < handlers.length; handler = handlers[++i]) {
      const isLast = i == handlers.length - 1;
      const last = result;
      try {
        if (isChain(handler)) {
          result = await handler.process(ctx, err);
        } else if (isErrorHandler<Ctx>(handler)) {
          if (err != undefined) {
            result = await (<ErrorHandler<Ctx>>handler)(ctx, err);
          }
        } else if (err == undefined) {
          result = await handler(ctx);
        }
        if (typeof (result) == "boolean") {
          if (result == false) {
            return isLast ? false : err; // abort chain - allow continuation after chain
          }
          else { // returning true clears error; 
            err = undefined;
            result = undefined;
          }
        } else if (result != undefined) {
          err = result;
        }
      } catch (exception) {
        err = exception;
      }
    }
    return result || err;
  }
}

function isErrorHandler<TCtx>(handler: Handler<TCtx>): handler is ErrorHandler<TCtx> {
  return typeof (handler) == "function" && handler.length == 2;
}

function isChain<TCtx>(handler: Handler<TCtx> | IProcessor<TCtx>): handler is IProcessor<TCtx> {
  return typeof (handler) == "object" && typeof (handler.process) == "function" && handler.process.length == 2;
}