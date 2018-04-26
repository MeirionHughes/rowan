import { Rowan, Next, If, After } from './src';

let delay = (ms: number) => new Promise(r => setTimeout(r, ms));

let app = new Rowan<{ name: string }>()
  .use(new After())
  .use(async (ctx) => {
    console.log("one");
  })
  .use(
  new If(async (ctx) => ctx.name == "John")
    .use(async (ctx, next) => {
      ctx.name = "John Doe";
      await next();
      console.log("three");
    }))
  .use({
    async process(ctx, next: Next<{ age: number }>) {
      console.log("two");
      await next({ age: 20 });
    },
  });

async function main() {
  let input = { name: "John" };
  let result = await app.execute(input);
  console.log(input);
  console.log(result);
}

main().catch(console.log);