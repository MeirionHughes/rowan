import { expect } from "chai";
import {  AfterIf } from "../src/after-if.js";

describe("AfterIf", () => {

  it("positive predicate calls child handler after next", async () => {
    let wasCalled = false;
    let order = [];

    let _after = new AfterIf(
      () => Promise.resolve(true), [
        () => { wasCalled = true; order.push("bar"); return Promise.resolve(); }
    ]);

    await _after.process("foo", () => {order.push("foo"); return Promise.resolve()});

    expect(wasCalled).to.be.true;
    expect(order).to.be.eql(["foo", "bar"]);
  });

  it("negative predicate skips middleware", async () => {
    let wasCalled = false;
    let order = [];

    let _after = new AfterIf(
      () => Promise.resolve(false), [
        () => { wasCalled = true; return Promise.resolve(); }
    ]);

    await _after.process("foo", () => {order.push("foo"); return Promise.resolve()});

    expect(wasCalled).to.be.false;
    expect(order).to.be.eql(["foo"]);
  });

  it("error during predicate calls is catchable", async () => {
    let nextCalled = false;
    let wasCalled = false;
    let error = Error();
    let caught = null;
    let next = () => { throw error }

    let _if = new AfterIf(() => {throw error}, [(_, n) => { wasCalled = true; return n(); }]);

    try {
      await _if.process("foo", next);
    } catch (err) {
      caught = err;
    }

    expect(caught).to.be.eq(error);
    expect(wasCalled).to.be.false;
  });
});