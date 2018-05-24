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

Check the [Documentation](https://github.com/MeirionHughes/rowan/wiki) for more information;

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
