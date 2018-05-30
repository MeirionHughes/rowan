import { Rowan, Middleware } from '../src/rowan';
import { assert, expect } from 'chai'

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
      let rowan: any = new Rowan([(ctx, next)=>next()]);
      Rowan.convertToMiddleware = old;
      expect(wasCalled).to.be.true;
    });
  });
});