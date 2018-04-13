import { Rowan } from './src/rowan';

class Router extends Rowan {
  async process(ctx, next) {
    console.log("four");
    await super.process(ctx, next);
  }
}

let app = new Rowan();
let sub = new Rowan();
let router = new Router();

app.use(async (ctx, next) => {
  console.log("one");
  await next();
});

app.use((ctx) => {
  console.log("two");
});

app.use(sub);

sub.use((ctx) => {
  console.log("three");
});

app.use(router);

router.use(() => {
  console.log("five");
});

async function main() {
  await app.process({ foo: "bar" });
}

main().catch(console.log);