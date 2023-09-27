import { expect } from "chai";
import { Catch } from "../src/catch.js";

describe("Catch", () => {
  it("catches errors", async () => {
    let wasCalled = false;
    let ctx = {};
    let result = undefined;
    let expected = "foo bar";

    let _catch = new Catch(async (err, ctx) => { result = err });

    _catch.use(async (ctx) => {
      wasCalled = true;
      throw expected;
    });

    await _catch.process(ctx, () => Promise.resolve());

    expect(wasCalled).to.be.true;
    expect(result).to.be.eql(expected);
  });

  it("catches errors and can rethrow", async () => {
    let wasCaught = false;
    let ctx = {};
    let result = undefined;
    let expected = "foo bar";

    let _catch = new Catch(async (err, ctx) => { wasCaught = true; throw err });

    _catch.use(async (ctx) => {
      throw expected;
    });

    try {
      await _catch.process(ctx, () => Promise.resolve());
    } catch (err) {
      result = err;
    }

    expect(wasCaught).to.be.true;
    expect(result).to.be.eql(expected);
  });
});