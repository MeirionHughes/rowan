import { Rowan } from './src/index.js';
import { After } from './src/index.js';

let rowan = new Rowan();

rowan.use(new After([(ctx, next) => {
  ctx.value /= 2;
  return next();
}]))

rowan.use((ctx, next) => {
  ctx.value += 1;
  return next();
});

async function main() {
  const N = 10000000;
  let start = Date.now();
  for (let i = 0; i < N; i++) {
    await rowan.process({ value: 0 });
  }
  let end = Date.now();

  console.log(`${N / ((end - start) / 1000)}ops/s`)
}

main().catch(console.log);