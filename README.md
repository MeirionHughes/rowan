# Rowan

A lightweight async/await task-middleware library.  

![584023-200](https://cloud.githubusercontent.com/assets/3584509/21929203/1ffa1db6-d987-11e6-8e07-77a6131097af.png)

[![NPM version][npm-image]][npm-url]
[![NPM downloads][npm-downloads]][npm-url]
[![Travis Status][travis-image]][travis-url]
[![codecov](https://codecov.io/gh/MeirionHughes/rowan/branch/master/graph/badge.svg)](https://codecov.io/gh/MeirionHughes/rowan)

## Install
* `npm install rowan`

## Usage

```ts
const Rowan = require('rowan').Rowan;

const main = async function () {

  // create a (derived) app
  const app = new Rowan();

  //add middleware
  app.use(async (ctx) => {
    console.log("Do something async...");
    throw Error("throw errors");
  });

  //add error handlers
  app.use((ctx, err) => {
    console.log("handle errors...");
    return true; // clear error - continue;           
  });

  const predicate = async function (ctx) {
    console.log("do something async...");
    await new Promise(r => setTimeout(r, 1000));

    return "errors...";
  }

  // add chains and predicates
  app.use(
    predicate,
    (ctx, err) => {
      console.log("abort task chains...");
      return false; // abort chain;
    },
    app.use((ctx) => { /* never called*/ })
  );

  // Nest applications / routes / processors
  app.use({
    process: async function (ctx, err) {
      if (err != undefined)
        console.log("handle error");
      else
        console.log("handle ctx");

      //Run a chain manually and return its result (false)
      return await Rowan.execute(ctx, err, [
        (_) => { console.log("moo");},
        (_) => false // kill execution through stack
      ]);
    }
  });  
  
  app.use((_) => {   
    // never called
  });

  // Use it 
  await app.process({ foo: "bar" });
}();
```

check [Documentation](https://github.com/MeirionHughes/rowan/wiki) for more information; 

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

