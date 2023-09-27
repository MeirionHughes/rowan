import { expect } from "chai";
import { If } from "../src/if.js";

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

  it("error in next call is catchable", async () => {
    let wasCalled = false;
    let error = Error();
    let caught = null;
    let next = () => { throw error }

    let _if = new If(async () => true, [(_, n) => { wasCalled = true; return n(); }]);

    try {
      await _if.process("foo", next);
    } catch (err) {
      caught = err;
    }

    expect(caught).to.be.eq(error);
    expect(wasCalled).to.be.true;
  }); 

  
  it("error in predicate call is catchable", async () => {
    let wasCalled = false;
    let error = Error();
    let caught = null;

    let _if = new If(async () => {throw error}, [(_, n) => { wasCalled = true; return n(); }]);

    try {
      await _if.process("foo", ()=>Promise.resolve());
    } catch (err) {
      caught = err;
    }
    expect(wasCalled).to.be.false;
    expect(caught).to.be.eq(error);
  });
    
  it("does not call next if terminate true, no middleware", async () => {
    let wasCalled = false;

    let _if = new If(async () => true, true);
    
    await _if.process("foo", async()=>{wasCalled = true});

    expect(wasCalled).to.be.false;
  }); 
  
  it("does not call next if terminate true", async () => {
    let wasCalled = false;
    let wasNextCalled = false;

    let _if = new If(async () => true, [async()=>{wasCalled = true}], true);
    
    await _if.process("foo", async()=>{wasNextCalled = true});

    expect(wasCalled).to.be.true;
    expect(wasNextCalled).to.be.false;
  });

  it("does call next if terminate false, no middleware", async () => {
    let wasCalled = false;

    let _if = new If(async () => true, false);
    
    await _if.process("foo", async()=>{wasCalled = true});

    expect(wasCalled).to.be.true;
  }); 
  
  it("does call next and middlware if terminate false", async () => {
    let wasCalled = false;
    let wasNextCalled = false;

    let _if = new If(async () => true, [async()=>{wasCalled = true}], false);
    
    await _if.process("foo", async()=>{wasNextCalled = true});

    expect(wasCalled).to.be.true;
    expect(wasNextCalled).to.be.true;
  });
});