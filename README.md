# Rowan

A lightweight async middleware library.  

![584023-200](https://cloud.githubusercontent.com/assets/3584509/21929203/1ffa1db6-d987-11e6-8e07-77a6131097af.png)

[![NPM version][npm-image]][npm-url]
[![NPM downloads][npm-downloads]][npm-url]
[![Travis Status][travis-image]][travis-url]
[![codecov](https://codecov.io/gh/MeirionHughes/rowan/branch/master/graph/badge.svg)](https://codecov.io/gh/MeirionHughes/rowan)

[Documentation](https://github.com/MeirionHughes/rowan/wiki)

## Usage

Rowan can be used to build asynchronous middleware-style control-flow and error-handling, with particular focus on providing a rich typescript experience. 

Create an instance of the Rowan class (or derivation) and call `use` with a middleware function

```ts
import {Rowan} from 'rowan';

// Create a (derived) app
const app = new Rowan();

// Add middleware and handlers
app.use(async (ctx) => {
  console.log(`foo: ${ctx.foo}`);
});

```

Once the middleware is all setup you call `process` and pass along the context. 


```ts
// Use it 
await app.execute({ foo: "bar!" });
```

... which in this example would output to console: 

>foo: bar!

## Processors
Processors are either a `Handler<Ctx>`,  `AutoHandler<Ctx>` or `Middleware<Ctx>` type signature. 

* *Handler* is a *two*-parameter function that will be given the  `ctx` and `next` callback. You are required to call `next` if you wish processing to continue to the next middleware processors in the chain. 

```ts
app.use(async (ctx, next) => {
  ctx["start"] = Date.now();
  await next();
  ctx["finish"] = Date.now();
});
```


* *AutoHandler* is a *one*-parameter function that will be given the `ctx` object. The next processor in the chain will automatically be called for you, unless you throw an Error. 

```ts
app.use(async (ctx) => {
  ctx.data = JSON.parse(ctx.raw);
});
```

* *Middleware* is a object containing a method `process` that will be called with *two*-parameters:  `ctx` and `next`. It is expected that `process` will return a `Promise<void>`. 

```ts
app.use({
  async process(ctx, next){
    await next();
    consol.log("Complete");
  }
});
```

## Build

```
npm install
npm test
```

there is an `example.ts` that you can run with ts-node

```
ts-node example
```

## Credits
"Rowan" Icon courtesy of [The Noun Project](https://thenounproject.com/), by [ludmil](https://thenounproject.com/Maludk), under [CC 3.0](http://creativecommons.org/licenses/by/3.0/us/)

[npm-url]: https://npmjs.org/package/rowan
[npm-image]: https://img.shields.io/npm/v/rowan.svg
[npm-downloads]: https://img.shields.io/npm/dm/rowan.svg
[travis-url]: https://travis-ci.org/MeirionHughes/rowan
[travis-image]: https://img.shields.io/travis/MeirionHughes/rowan/master.svg