import { Rowan, Middleware } from '../src/rowan.js';
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
      let rowan: any = new Rowan([(ctx, next) => next!()]);
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

      rowan.use(() => { })

      Rowan.convertToMiddleware = old;
      expect(wasCalled).to.be.true;
    });
    it("can auto infer use context", async ()=>{
      let rowan = new Rowan<{foo: "bar"}>();

      rowan.use(async ({foo})=>{
        foo = "bar";
      })
    })
    it("can auto call next if parameter not defined within callback", async ()=>{
      let rowan = new Rowan<{foo: "bar"}>();
      let wasCalled = false;
      let wasNotCalled = true;

      rowan.use(async ({foo})=>{
        foo = "bar";
      })

      rowan.use(async ({foo}, next)=>{
        wasCalled = true; 
        return void 0;
      }) 

      rowan.use(async ({foo}, next)=>{
        wasNotCalled = false; 
      })
      
      await rowan.process({foo:"bar"});

      expect(wasCalled).to.be.true;
      expect(wasNotCalled).to.be.true;
    })
  });

  describe("process", () => {
    it("it calls static process", async () => {
      let wasCalled = false;
      let old = Rowan.process;
      Rowan.process = async () => {
        wasCalled = true;
      }
      let rowan = new Rowan([(ctx, next) => next!()]);

      rowan.process({})
      Rowan.process = old;
      expect(wasCalled).to.be.true;
    });
  });

  describe("Usage", () => {
    it("can derive", async () => {

      let wasCalled = false;

      class MyApp extends Rowan {
        async process(ctx:unknown) {
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
      let sleep = (ms:number) => new Promise(r => setTimeout(r, ms));

      rowan.use(async (ctx) => {
        await sleep(delay);
      });

      rowan.use(async (ctx, next) => {
        if (ctx.value >= 0.5)
          next!();
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
    });

    it("hierarchy should return meta hierarchy", async () => {
      let childMiddleware = {
        meta: { name: "child" },
        process: async () => {}
      };
      
      let parentMiddleware = {
        meta: { name: "parent" },
        middleware: [childMiddleware],
        process: async () => {}
      };
      
      let result = Rowan.hierarchy(parentMiddleware);
      expect(result.meta).to.deep.equal({ name: "parent" });
      expect(result.children).to.have.length(1);
      expect(result.children![0].meta).to.deep.equal({ name: "child" });
    });

    it("hierarchy should handle middleware without children", async () => {
      let middleware = {
        meta: { name: "simple" },
        process: async () => {}
      };
      
      let result = Rowan.hierarchy(middleware);
      expect(result.meta).to.deep.equal({ name: "simple" });
      expect(result.children).to.be.undefined;
    });
  });

  describe("Utility Functions", () => {
    it("isMiddleware should return true for middleware objects", async () => {
      const { isMiddleware } = await import('../src/rowan.js');
      
      let middleware = {
        process: () => Promise.resolve()
      };
      
      expect(isMiddleware(middleware)).to.be.true;
    });

    it("isMiddleware should return false for non-middleware objects", async () => {
      const { isMiddleware } = await import('../src/rowan.js');
      
      expect(isMiddleware({})).to.be.false;
      expect(isMiddleware(null)).to.be.false;
      expect(isMiddleware(() => {})).to.be.false;
    });

    it("isAutoHandler should return true for functions with 0-1 parameters", async () => {
      const { isAutoHandler } = await import('../src/rowan.js');
      
      expect(isAutoHandler(() => {})).to.be.true;
      expect(isAutoHandler((ctx: any) => {})).to.be.true;
    });

    it("isAutoHandler should return false for functions with more parameters", async () => {
      const { isAutoHandler } = await import('../src/rowan.js');
      
      expect(isAutoHandler((ctx: any, next: any) => {})).to.be.false;
      expect(isAutoHandler((a: any, b: any, c: any) => {})).to.be.false;
    });

    it("isAutoHandler should return false for non-functions", async () => {
      const { isAutoHandler } = await import('../src/rowan.js');
      
      expect(isAutoHandler({})).to.be.false;
      expect(isAutoHandler(null)).to.be.false;
      expect(isAutoHandler("string")).to.be.false;
    });

    it("NextNoop should return resolved promise", async () => {
      const { NextNoop } = await import('../src/rowan.js');
      
      let result = NextNoop();
      expect(result).to.be.instanceof(Promise);
      await result; // Should not throw
    });
  });

  describe("Edge Cases", () => {
    it("convertToMiddleware should handle middleware with existing meta", async () => {
      let middleware = {
        meta: { existing: "meta" },
        process: async () => {}
      };
      
      let result = Rowan.convertToMiddleware(middleware, { new: "meta" });
      expect(result.meta).to.deep.equal({ existing: "meta" });
    });

    it("convertToMiddleware should handle handler with meta property", async () => {
      let handler = (ctx: any) => Promise.resolve();
      (handler as any).meta = { handler: "meta" };
      
      let result = Rowan.convertToMiddleware(handler);
      expect(result.meta).to.deep.equal({ handler: "meta" });
    });
  });
});