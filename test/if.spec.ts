import { expect } from "chai";
import { Rowan, Catch } from "../src";
import { If } from "../dist/commonjs";

describe("If", () => {

  it("positive predicate calls child handler", async () => {

    let wasCalled = false;
    let next = () => { wasCalled = true; return Promise.resolve(); }

    let _if = new If(() => true, [() => { wasCalled = true; return Promise.resolve(); }]);

    await _if.process("foo", () => Promise.resolve());

    expect(wasCalled).to.be.true;
  });

  it("negative predicate calls next handler only", async () => {
    let nextCalled = false;
    let wasCalled = false;
    let next = () => { nextCalled = true; return Promise.resolve(); }

    let _if = new If(() => false, [(_, n) => { wasCalled = true; return n(); }]);

    await _if.process("foo", next);

    expect(nextCalled).to.be.true;
    expect(wasCalled).to.be.false;
  });
});