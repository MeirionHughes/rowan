import { Rowan } from '../src/rowan';
import { assert, expect } from 'chai';

interface Context {
  auth?: boolean;
  req?: { path?: string };
  res?: { status?: number };
  params?: { [x: string]: any };
};

class DerivedError extends Error {
  status: number = 404;
}

describe("Basic Middleware", () => {
  it("when there is a single middleware, should it should be called", async () => {
    let rowan = new Rowan<Context>();
    var called = [false];

    rowan.use(async (ctx) => {
      called[0] = true;
    });

    await rowan.process({});

    expect(called).to.deep.equal([true]);
  });

  it("when there are multiple middleware, then each should be called", async () => {
    let rowan = new Rowan<Context>();
    var called = [false];

    rowan.use(async (ctx) => {
      called[0] = true;
    });

    rowan.use(async (ctx) => {
      called[1] = true;
    });

    await rowan.process({});

    expect(called).to.deep.equal([true, true]);

  });

  it("when there is no error, then error middleware should be called", async () => {
    let rowan = new Rowan<Context>();
    var called = [false, false];

    rowan.use(async (ctx) => {
      called[0] = true;
    });

    rowan.use(async (ctx, err) => {
      assert.fail(true, true, "method not yet implemented", "");
    });

    rowan.use(async (ctx) => {
      called[1] = true;
    });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true, true]);
    } catch (err) { assert.fail(err); }
  });

  it("when there is an error, then error middleware should be called", async () => {
    let rowan = new Rowan<Context>();
    var called = [false, false];

    rowan.use(async (ctx) => {
      called[0] = true;
      throw Error("foo");
    });

    rowan.use(async (ctx, err) => {
      called[1] = true;
    });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true, true]);
    } catch (err) { assert.fail(err); }

  });

  it("when error middleware returns true, clear error", async () => {
    let rowan = new Rowan<Context>();
    var called = [false, false, false];

    rowan.use(async (ctx) => {
      called[0] = true;
      throw Error("foo");
    });

    rowan.use(async (ctx, err) => {
      called[1] = true;
      return true;
    });

    rowan.use(async (ctx) => {
      called[2] = true;
    });

    rowan.use(async (ctx, err) => {
      assert.fail("error was not cleared");
    });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true, true, true]);
    } catch (err) { assert.fail(err); }

  });

  it("when handler returns false, then termiate processing", async () => {
    let rowan = new Rowan<Context>();
    var called = [false];

    rowan.use(async (ctx) => {
      called[0] = true;
      return false;
    });

    rowan.use(async (ctx, err) => {
      assert.fail();
    });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true]);
    } catch (err) { assert.fail(err); }

  });
});

describe("Chained Middleware", () => {
  it("when processed, all tasks in chain should be called", async () => {
    let rowan = new Rowan<Context>();
    var called = [false, false];

    rowan.use(
      async (ctx) => {
        called[0] = true;
      },
      async (ctx) => {
        called[1] = true;
      });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true, true]);
    } catch (err) { assert.fail(err); }

  });

  it("when no error, error handlers should not be called", async () => {
    let rowan = new Rowan<Context>();
    var called = [false, false];

    rowan.use(
      async (ctx) => {
        called[0] = true;
      },
      async (ctx, err) => {
        assert.fail();
      },
      async (ctx) => {
        called[1] = true;
      });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true, true]);
    } catch (err) { assert.fail(err); }

  });

  it("when chain task throws error, error handlers in chain should be called", async () => {
    let rowan = new Rowan<Context>();
    var called = [false, false];

    rowan.use(
      async (ctx) => {
        called[0] = true;
        throw Error("foo");
      },
      async (ctx) => {
        assert.fail("non-error handler called");
      },
      async (ctx, err) => {
        called[1] = true;
      });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true, true]);
    } catch (err) { assert.fail(err); }

  });

  it("when chain task throws error, error handlers after chain should be called", async () => {
    let rowan = new Rowan<Context>();
    var called = [false, false, false];

    rowan.use(
      async (ctx) => {
        called[0] = true;
        throw Error("foo");
      },
      async (ctx) => {
        assert.fail("non-error handler called");
      },
      async (ctx, err) => {
        called[1] = true;
        throw err;
      });

    rowan.use(
      async (ctx, err) => {
        called[2] = true;
      });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true, true, true]);
    } catch (err) { assert.fail(err); }

  });

  it("when task in chain returns false, but is not last, then termiate chain but continue processing", async () => {
    let rowan = new Rowan<Context>();
    var called = [false, false];

    rowan.use(
      async (ctx) => {
        called[0] = true;
      },
      async (ctx) => {
        return false;
      },
      async (ctx) => {
        assert.fail();
      });

    rowan.use(async (ctx) => {
      called[1] = true;
    });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true, true]);
    } catch (err) { assert.fail(err); }

  });

  it("when last task in chain returns false, then termiate processing", async () => {
    let rowan = new Rowan<Context>();
    var called = [false,];

    rowan.use(
      async (ctx) => {
        called[0] = true;
      },
      async (ctx) => {
        return false;
    });

    rowan.use(async (ctx) => {
      assert.fail();
    });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true]);
    } catch (err) { assert.fail(err); }

  });
});

describe("Error Middleware", () => {
  it("should support throwing Error", async () => {
    let rowan = new Rowan<Context>();
    var called = [false];

    rowan.use(async (ctx) => {
      throw Error();
    });

    rowan.use(async (ctx, err) => {
      called[0] = true;
      expect(err instanceof Error).to.be.true;
    });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true]);
    } catch (err) { assert.fail(err); }

  });

  it("chain with error handler returning false, should not clear error", async () => {
    let rowan = new Rowan<Context>();
    var called = [false];

    rowan.use(
      (_) => Error(),
      (_, err) => false,
      (_) => assert.fail(),
    );

    rowan.use(_ => assert.fail());

    rowan.use((_, err) => {
      called[0] = true;
    });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true]);
    } catch (err) { assert.fail(err); }

  });

  it("chain with error handler returning false, should not clear error of parent scope", async () => {
    let rowan = new Rowan<Context>();
    var called = [false];

    rowan.use(
      (_, err) => false,
      (_) => assert.fail(),
    );

    rowan.use(_ => assert.fail());

    rowan.use((_, err) => {
      called[0] = true;
    });

    await rowan.process(Error(), {});

    try {
      expect(called).to.deep.equal([true]);
    } catch (err) { assert.fail(err); }

  });

  it("should support returning Error", async () => {
    let rowan = new Rowan<Context>();
    var called = [false];

    rowan.use(async (ctx) => {
      return Error();
    });

    rowan.use(async (ctx, err) => {
      called[0] = true;
      expect(err instanceof Error).to.be.true;
    });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true]);
    } catch (err) { assert.fail(err); }

  });

  it("should support chain of error-handlers", async () => {
    let rowan = new Rowan<Context>();
    var called = [false, false];

    rowan.use(async (ctx) => {
      return "foo";
    });

    rowan.use(async (ctx, err) => {
      called[0] = true;
      expect(err).to.be("foo");
    },
      async (ctx, err) => {
        called[1] = true;
        expect(err).to.be("foo");
      });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true, true]);
    } catch (err) { assert.fail(err); }

  });

  it("should support using a derived Error class", async () => {
    let rowan = new Rowan<Context>();
    var called = [false];

    rowan.use(async (ctx) => {
      return new DerivedError();
    });

    rowan.use(async (ctx, err) => {
      called[0] = true;
    });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true]);
    } catch (err) { assert.fail(err); }

  });
});

describe("Synchronous Middleware", () => {
  it("middleware should be called", async () => {
    let rowan = new Rowan<Context>();
    var called = [false, false];

    rowan.use((ctx) => {
      called[0] = true;
    });

    rowan.use((ctx, err) => {
      assert.fail("error middleware called without error");
    });

    rowan.use((ctx) => {
      called[1] = true;
    });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true, true]);
    } catch (err) { assert.fail(err); }

  });

  it("should support returning Error", async () => {
    let rowan = new Rowan<Context>();
    var called = [false];

    rowan.use((ctx) => {
      return Error();
    });

    rowan.use((ctx, err) => {
      called[0] = true;
    });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true]);
    } catch (err) { assert.fail(err); }

  });

  it("should support clearing Error", async () => {
    let rowan = new Rowan<Context>();
    var called = [false];

    rowan.use((ctx) => {
      return new DerivedError();
    });

    rowan.use((ctx, err) => {
      called[0] = true;
      return true;
    });

    rowan.use(async (ctx, err) => {
      assert.fail("error wasn't cleared");
    });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true]);
    } catch (err) { assert.fail(err); }

  });

  it("should support chains", async () => {
    let rowan = new Rowan<Context>();
    var called = [false, false];

    rowan.use(
      (ctx) => {
        return new DerivedError();
      },
      (ctx, err) => {
        called[0] = true;
        return true;
      });

    rowan.use((ctx, err) => {
      assert.fail("error wasn't cleared");
    });

    rowan.use((ctx) => {
      called[1] = true;
    });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true, true]);
    } catch (err) { assert.fail(err); }

  });
});

describe("Nested Chain Processors", () => {
  it("should use Processors as middleware", async () => {
    let rowan = new Rowan<Context>();
    let nested = new Rowan<Context>();
    var called = [false, false, false];

    nested.use((ctx) => {
      called[0] = true;
    });

    nested.use((ctx, err) => {
      assert.fail("error middleware called without error");
    });

    nested.use((ctx) => {
      called[1] = true;
    });

    rowan.use(nested);

    rowan.use((ctx) => {
      called[2] = true;
    });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([true, true, true]);
    } catch (err) { assert.fail(err); }

  });

  it("should use Processors when errors", async () => {
    let rowan = new Rowan<Context>();
    let nested = new Rowan<Context>();
    var called = [false, false];

    nested.use((ctx) => {
      assert.fail();
    });

    nested.use((ctx, err) => {
      called[0] = true;
      expect(err instanceof Error).to.be.true;
    });

    rowan.use(nested);

    rowan.use((ctx, err) => {
      called[1] = true;
      expect(err instanceof Error).to.be.true;
    });

    await rowan.process(Error("err"), {});

    try {
      expect(called).to.deep.equal([true, true]);
    } catch (err) { assert.fail(err); }

  });

  it("should terminating within a processor terminates parent", async () => {
    let rowan = new Rowan<Context>();
    let nested = new Rowan<Context>();
    var called = [];

    rowan.use({
      process: function (ctx, err) {
        return false;
      }
    });

    rowan.use({
      process: function (ctx, err) {
        assert.fail();
      }
    });

    await rowan.process({});

    try {
      expect(called).to.deep.equal([]);
    } catch (err) { assert.fail(err); }

  });
});