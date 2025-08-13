# Rowan

A lightweight async middleware library with comprehensive TypeScript support.

![584023-200](https://cloud.githubusercontent.com/assets/3584509/21929203/1ffa1db6-d987-11e6-8e07-77a6131097af.png)

[![NPM version](https://img.shields.io/npm/v/rowan.svg)](https://npmjs.org/package/rowan)
[![NPM downloads](https://img.shields.io/npm/dm/rowan.svg)](https://npmjs.org/package/rowan)
[![CI Status](https://github.com/MeirionHughes/rowan/actions/workflows/ci.yml/badge.svg)](https://github.com/MeirionHughes/rowan/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/endpoint?url=https://meirionhughes.github.io/rowan/coverage-badge.json)](https://meirionhughes.github.io/rowan/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![ESM/CJS](https://img.shields.io/badge/Module-ESM%2FCJS-yellow.svg)](https://nodejs.org/api/esm.html)

## Installation

```bash
npm install rowan
```

## Usage

Rowan provides a powerful async middleware system with comprehensive TypeScript support. Build sophisticated control-flow patterns with error handling, conditional execution, and post-processing capabilities.

### Basic Example

Create a Rowan instance and add middleware using the `use` method:

```ts
import { Rowan } from 'rowan';

// Create an app instance
const app = new Rowan();

// Add middleware and handlers
app.use(async (ctx) => {
  console.log(`Processing: ${ctx.message}`);
});

// Process with context
await app.process({ message: "Hello, World!" });
// Output: Processing: Hello, World!
```

### ESM and CommonJS Support

Rowan supports both modern ESM and legacy CommonJS imports:

```ts
// ESM (recommended)
import { Rowan, If, After, Catch } from 'rowan';

// CommonJS
const { Rowan, If, After, Catch } = require('rowan');
```

## Middleware Types

Rowan supports three types of processors, each with specific use cases:

### Handler Functions

**Handler** functions receive both `ctx` and `next` parameters. You must explicitly call `next()` to continue the middleware chain:

```ts
app.use(async (ctx, next) => {
  ctx.startTime = Date.now();
  await next(); // Continue to next middleware
  ctx.duration = Date.now() - ctx.startTime;
  console.log(`Request completed in ${ctx.duration}ms`);
});
```

### Auto-Handler Functions

**AutoHandler** functions receive only the `ctx` parameter. The next middleware is automatically called unless an error is thrown:

```ts
app.use(async (ctx) => {
  // Automatically calls next() after this function
  ctx.data = JSON.parse(ctx.rawData);
  ctx.processed = true;
});
```

### Middleware Objects

**Middleware** objects implement a `process` method with `ctx` and `next` parameters:

```ts
class LoggingMiddleware {
  async process(ctx, next) {
    console.log('Before processing');
    await next();
    console.log('After processing');
  }
}

app.use(new LoggingMiddleware());

// Or inline object
app.use({
  async process(ctx, next) {
    await next();
    console.log('Request complete');
  }
});
```

## Middleware Helpers

Rowan provides powerful helper classes for common middleware patterns:

### If - Conditional Execution

Execute middleware only when a predicate condition is met:

```ts
import { If } from 'rowan';

const app = new Rowan<string>();

app.use(
  new If(
    async (ctx: string) => ctx.startsWith("admin"),
    [
      async (ctx) => console.log("Admin access:", ctx)
    ],
    true // terminate if condition is true (don't call next)
  )
);

app.use(async (ctx) => {
  console.log("Regular access:", ctx);
});

await app.process('admin-user'); // Output: Admin access: admin-user
await app.process('regular-user'); // Output: Regular access: regular-user
```

### After - Post-Processing

Execute middleware after the next middleware completes:

```ts
import { After } from 'rowan';

const app = new Rowan();

app.use(new After([
  async (ctx) => {
    console.log("Response:", ctx.output);
    ctx.logged = true;
  }
]));

app.use(async (ctx) => {
  console.log("Processing request...");
  ctx.output = `Processed: ${ctx.input}`;
});

await app.process({ input: "hello" });
// Output: 
// Processing request...
// Response: Processed: hello
```

### AfterIf - Conditional Post-Processing

Execute middleware after next() completes, but only if a condition is met:

```ts
import { AfterIf } from 'rowan';

const app = new Rowan();

app.use(new AfterIf(
  async (ctx) => ctx.valid === true,
  [
    async (ctx) => {
      console.log("Valid result:", ctx.result);
    }
  ]
));

app.use(async (ctx) => {
  console.log("Validating...");
  if (ctx.input?.length > 5) {
    ctx.valid = true;
    ctx.result = `Valid: ${ctx.input}`;
  }
});

await app.process({ input: "hello" });        // Only "Validating..."
await app.process({ input: "hello world" });  // "Validating..." then "Valid result: Valid: hello world"
```

### Catch - Error Handling

Wrap middleware execution with comprehensive error handling:

```ts
import { Catch } from 'rowan';

const app = new Rowan();

app.use(
  new Catch(
    async (error, ctx) => {
      console.log("Error caught:", error.message);
      ctx.error = true;
      ctx.errorMessage = error.message;
      // Don't re-throw to handle gracefully
    },
    async (ctx) => {
      if (!ctx.input) {
        throw new Error("Input is required");
      }
      ctx.processed = true;
    }
  )
);

await app.process({ input: "hello" }); // Normal processing
await app.process({}); // Error caught: Input is required
```

## Advanced Usage

### Static Methods

#### Rowan.process()

Execute a sequence of middleware with automatic chaining:

```ts
import { Rowan } from 'rowan';

const middlewares = [
  {
    async process(ctx, next) {
      console.log("First middleware");
      await next();
    }
  },
  {
    async process(ctx, next) {
      console.log("Second middleware");
      await next();
    }
  }
];

await Rowan.process(middlewares, { message: "hello" }, async () => {
  console.log("Final step");
});

// Output:
// First middleware
// Second middleware
// Final step
```

#### Rowan.hierarchy()

Build a meta hierarchy from middleware with metadata:

```ts
import { Rowan } from 'rowan';

const app = new Rowan([], { name: "App" });
const subRouter = new Rowan();
subRouter.meta = { name: "SubRouter" };

subRouter.use(async (ctx, next) => {
  await next();
}, { name: "Handler1" });

subRouter.use({
  meta: { name: "Handler2" },
  async process(ctx, next) {
    await next();
  }
});

app.use(subRouter);

const hierarchy = Rowan.hierarchy(app);
console.log(JSON.stringify(hierarchy, null, 2));

// Output:
// {
//   "meta": { "name": "App" },
//   "children": [
//     {
//       "meta": { "name": "SubRouter" },
//       "children": [
//         { "meta": { "name": "Handler1" } },
//         { "meta": { "name": "Handler2" } }
//       ]
//     }
//   ]
// }
```

#### Rowan.convertToMiddleware()

Convert handlers to middleware objects with metadata:

```ts
import { Rowan } from 'rowan';

const handler = async (ctx) => {
  ctx.processed = true;
};

const middleware = Rowan.convertToMiddleware(handler, { name: "ProcessHandler" });

console.log(middleware);
// Output:
// {
//   meta: { name: "ProcessHandler" },
//   process: [Function]
// }
```

### Utility Functions

#### Type Guards

```ts
import { isMiddleware, isAutoHandler } from 'rowan';

const handler = async (ctx) => {};
const middleware = { async process(ctx, next) {} };

console.log(isAutoHandler(handler));    // true
console.log(isMiddleware(middleware));  // true
console.log(isMiddleware(handler));     // false
```

## Development

### Building the Project

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:cover

# Lint code
npm run lint

# Build for production (ESM + CJS)
npm run build

# Clean build artifacts
npm run clean
```

### Project Structure

```
rowan/
├── src/           # TypeScript source files
│   ├── rowan.ts   # Core Rowan class and types
│   ├── if.ts      # If conditional middleware
│   ├── after.ts   # After post-processing middleware
│   ├── after-if.ts # AfterIf conditional post-processing
│   ├── catch.ts   # Catch error handling middleware
│   └── index.ts   # Main exports
├── test/          # Test files (Mocha + Chai)
├── dist/          # Built output
│   ├── esm/       # ES Module build
│   └── cjs/       # CommonJS build
└── coverage/      # Coverage reports
```

## Requirements

- **Node.js** >= 18.0.0
- **TypeScript** >= 5.0.0 (for development)

## License

MIT © [Meirion Hughes](https://github.com/MeirionHughes)

## Credits

"Rowan" Icon courtesy of [The Noun Project](https://thenounproject.com/), by [ludmil](https://thenounproject.com/Maludk), under [CC 3.0](http://creativecommons.org/licenses/by/3.0/us/)