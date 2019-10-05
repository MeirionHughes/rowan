import { Rowan, Middleware } from '../src/rowan';
import { expect } from 'chai'

type Context = {
  value: boolean;
};

describe("Rowan", () => {
  describe("Constructor", () => {
    it("when created without param then middleware is an empty array", async () => {
      let rowan: any = new Rowan();
      expect(rowan.middleware).to.be.eql([]);
    });

    it("it calls convertToMiddleware", async () => {
      let wasCalled = false;
      let old = Rowan.convertToMiddleware;
      Rowan.convertToMiddleware = x => {
        wasCalled = true;
        return x as Middleware<any>;
      }
      let rowan: any = new Rowan([(ctx, next) => next()]);
      Rowan.convertToMiddleware = old;
      expect(wasCalled).to.be.true;
    });
  });

  describe("use", () => {
    it("it calls convertToMiddleware", async () => {
      let wasCalled = false;
      let rowan: any = new Rowan();

      let old = Rowan.convertToMiddleware;
      Rowan.convertToMiddleware = x => {
        wasCalled = true;
        return x as Middleware<any>;
      }

      rowan.use((ctx) => { })

      Rowan.convertToMiddleware = old;
      expect(wasCalled).to.be.true;
    });
  });

  describe("process", () => {
    it("it calls static process", async () => {
      let wasCalled = false;
      let old = Rowan.process;
      Rowan.process = async () => {
        wasCalled = true;
      }
      let rowan = new Rowan([(ctx, next) => next()]);

      rowan.process({})
      Rowan.process = old;
      expect(wasCalled).to.be.true;
    });
  });

  describe("Usage", () => {
    it("can derive", async () => {

      let wasCalled = false;

      class MyApp extends Rowan {
        async process(ctx) {
          wasCalled = true;
          return super.process(ctx);
        }
      }

      let foo = new MyApp();
      let ctx = { foo: "foo" };

      foo.use(async ctx => { ctx.foo = "bar" });

      await foo.process(ctx);

      expect(wasCalled).to.be.true;
      expect(ctx.foo).to.be.eq("bar");
    })

    it("can nest", async () => {
      let wasCalled = true;
      let foo = new Rowan();
      let bar = new Rowan();

      foo.use(bar);

      bar.use(async c => {
        wasCalled = true;
      })

      expect(wasCalled).to.be.true;
    })

    it("can run concurrently", async () => {
      let rowan = new Rowan();
      let count = 1000;
      let delay = 10;
      let ctx = new Array(count).fill(0).map(_ => { return { value: Math.random() } });
      let expected = ctx.map(x => { return { value: x.value >= 0.5 ? x.value * 2 : x.value } });
      let sleep = (ms) => new Promise(r => setTimeout(r, ms));

      rowan.use(async (ctx) => {
        await sleep(delay);
      });

      rowan.use(async (ctx, next) => {
        if (ctx.value >= 0.5)
          next();
      });

      rowan.use(async (ctx) => {
        ctx.value *= 2;
      });

      let start = Date.now();
      await Promise.all(ctx.map(x => rowan.process(x)));
      let span = Date.now() - start;

      expect(span).to.be.lessThan(delay * count);

      expect(ctx).to.be.eql(expected);
    });
  });

  describe("Static", () => {
    it("convertToMiddleware Handler", async () => {
      let result = Rowan.convertToMiddleware((ctx)=>Promise.resolve());      
      expect(typeof result.process).to.be.eq("function");  
    })
  });
});