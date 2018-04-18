import { Rowan, RowanContext } from '../src/rowan';
import { assert, expect } from 'chai';

type Context = {
  value: boolean;
};

describe("General", () => {
  it("when constructor without param is called then middleware is an empty array", async () => {
    let rowan: any = new Rowan();
    expect(rowan._middleware).to.not.be.undefined;
  });
});