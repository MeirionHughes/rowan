import { expect } from "chai";
import { After } from "../src/after.js";

describe("After", () => {
  it("calls middleware after next", async () => {
    let wasCalled = false;
    let order = [];

    let _after = new After([
        () => { wasCalled = true; order.push("bar"); return Promise.resolve(); }
    ]);

    await _after.process("foo", () => {order.push("foo"); return Promise.resolve()});

    expect(wasCalled).to.be.true;
    expect(order).to.be.eql(["foo", "bar"]);
  });    
});