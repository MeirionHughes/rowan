const Rowan = require('./lib/rowan').Rowan;

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
    app.use((ctx) => { /* never called*/ }));

  // Nest applications / routes / processors
  app.use({
    process: async function (ctx, err) {
      if (err != undefined)
        console.log("handle error");
      else
        console.log("handle ctx");

      //Run a chain manually and return its result
      return await Rowan.execute(ctx, undefined, [
        (_) => { console.log("moo"); },
        (_) => false // kill execution through stack
      ]);
    }
  });

  app.use((_) => {
    //unreachable;
  });

  // Use it 
  await app.process({ foo: "bar" });
};

main().catch((err)=>{
  console.log(err);
  process.exit(1);
});