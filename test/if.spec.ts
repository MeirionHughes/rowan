import { expect } from "chai";
import { If } from "../src";

describe("If", () => {

  it("positive predicate calls child handler", async () => {
    let wasCalled = false;

    let _if = new If(() => Promise.resolve(true), [() => { wasCalled = true; return Promise.resolve(); }]);

    await _if.process("foo", () => Promise.resolve());

    expect(wasCalled).to.be.true;
  });

  it("negative predicate calls next handler only", async () => {
    let nextCalled = false;
    let wasCalled = false;
    let next = () => { nextCalled = true; return Promise.resolve(); }

    let _if = new If(() => Promise.resolve(false), [(_, n) => { wasCalled = true; return n(); }]);

    await _if.process("foo", next);

    expect(nextCalled).to.be.true;
    expect(wasCalled).to.be.false;
  });

  it("error during predicate calls is catchable", async () => {
    let nextCalled = false;
    let wasCalled = false;
    let error = Error();
    let caught = null;
    let next = () => { throw error }

    let _if = new If(() => Promise.resolve(false), [(_, n) => { wasCalled = true; return n(); }]);

    try {
      await _if.process("foo", next);
    } catch (err) {
      caught = err;
    }

    expect(caught).to.be.eq(error);
    expect(wasCalled).to.be.false;
  });
});