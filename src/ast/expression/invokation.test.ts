import { describe, it } from "node:test";
import { Expression } from "./base";
import { Tokenise } from "../../parser";
import AssertExtra from "../../test-utils/assert-extra";
import { InvokationExpression } from "./invokation";
import { ReferenceExpression } from "./reference";
import assert from "node:assert";
import { TokeniserContext } from "../../parser/context";

describe("Invokation.Parser", () => {
  it("Parses a basic invokation", () => {
    const [token_group, result] = Expression.Parse(
      Tokenise(`test();`, "test.cb"),
      new TokeniserContext("Test", true)
    ).Destructured;

    AssertExtra.InstanceOf(result, InvokationExpression);
    const subject = result.Subject;
    AssertExtra.InstanceOf(subject, ReferenceExpression);
    assert.equal(subject.Name, "test");
    const parameters = result.Parameters;
    assert.equal(parameters.length, 0);
  });

  it("Parses function a function parameter", () => {
    const [token_group, result] = Expression.Parse(
      Tokenise(`test(hello);`, "test.cb"),
      new TokeniserContext("Test", true)
    ).Destructured;

    AssertExtra.InstanceOf(result, InvokationExpression);
    const subject = result.Subject;
    AssertExtra.InstanceOf(subject, ReferenceExpression);
    assert.equal(subject.Name, "test");
    const parameters = result.Parameters;
    assert.equal(parameters.length, 1);
    const hello = parameters[0];
    AssertExtra.InstanceOf(hello, ReferenceExpression);
    assert.equal(hello.Name, "hello");
  });

  it("Parses multiple function parameters", () => {
    const [token_group, result] = Expression.Parse(
      Tokenise(`test(hello, world);`, "test.cb"),
      new TokeniserContext("Test", true)
    ).Destructured;

    AssertExtra.InstanceOf(result, InvokationExpression);
    const subject = result.Subject;
    AssertExtra.InstanceOf(subject, ReferenceExpression);
    assert.equal(subject.Name, "test");
    const parameters = result.Parameters;
    assert.equal(parameters.length, 2);
    const hello = parameters[0];
    AssertExtra.InstanceOf(hello, ReferenceExpression);
    assert.equal(hello.Name, "hello");
    const world = parameters[1];
    AssertExtra.InstanceOf(world, ReferenceExpression);
    assert.equal(world.Name, "world");
  });
});
