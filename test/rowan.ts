import { Rowan, RowanContext } from '../src/rowan';
import { assert, expect } from 'chai';

interface Context extends RowanContext  {
  auth?: boolean;
  req?: { path?: string };
  res?: { status?: number };
  params?: { [x: string]: any };
};

class DerivedError extends Error {
  status: number = 404;
}

describe("General", () => {
  it("when constructor without param is called then middleware is an empty array", async () => {
    let rowan: any = new Rowan<Context>();

    expect(rowan._middleware).to.not.be.undefined;
  });
});

