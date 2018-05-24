import {After} from './src';
import { Rowan } from './src';

let foo = new Rowan();
let bar = new Rowan();

bar.use((ctx, next)=>{
  console.log("boo1:", ctx);
  return next();
});

bar.use((ctx, next)=>{
  console.log("boo2:", ctx);
  return next();
});


foo.use(bar);

foo.process("hello world")