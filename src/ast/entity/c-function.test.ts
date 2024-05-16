import { PrimitiveType } from "../type/primitive";
import { CFunction } from "./c-function";
import { Entity } from "./base";
import { describe, it } from "node:test";
import { Tokenise } from "../../parser";
import assert from "node:assert";
import AssertExtra from "../../test-utils/assert-extra";

describe("CFunction.Parser", () => {
  it("Parses a c function", () => {
    const code = `cfn [] test(): string \`return 0;\``;

    const tokens = Tokenise(code, "test.cb");

    const [token_group, result] = Entity.Parse(tokens).Destructured;

    AssertExtra.InstanceOf(result, CFunction);
    assert.equal(token_group.Done, true);
    assert.equal(result.Name, "test");
    AssertExtra.ParametersWith(result.Parameters, []);
    const type = result.Returns;
    AssertExtra.InstanceOf(type, PrimitiveType);
    assert.equal(type.Name, "string");

    assert.equal(result.Body, "return 0;");
  });

  it("Parses the types correctly", () => {
    const code = `cfn [] test(test: string, hello: int): string \`return 0;\``;

    const tokens = Tokenise(code, "test.cb");

    const [token_group, result] = Entity.Parse(tokens).Destructured;

    AssertExtra.InstanceOf(result, CFunction);
    assert.equal(token_group.Done, true);
    assert.equal(result.Name, "test");
    AssertExtra.ParametersWith(result.Parameters, [
      {
        name: "test",
        optional: false,
        tester(type) {
          AssertExtra.InstanceOf(type, PrimitiveType);
          assert.equal(type.Name, "string");
        },
      },
      {
        name: "hello",
        optional: false,
        tester(type) {
          AssertExtra.InstanceOf(type, PrimitiveType);
          assert.equal(type.Name, "int");
        },
      },
    ]);
    const type = result.Returns;
    AssertExtra.InstanceOf(type, PrimitiveType);
    assert.equal(type.Name, "string");

    assert.equal(result.Body, "return 0;");
  });

  it("Parses optional parameters", () => {
    const code = `cfn [] test(test?: string): string \`return 0;\``;

    const tokens = Tokenise(code, "test.cb");

    const [token_group, result] = Entity.Parse(tokens).Destructured;

    AssertExtra.InstanceOf(result, CFunction);
    assert.equal(token_group.Done, true);
    assert.equal(result.Name, "test");
    AssertExtra.ParametersWith(result.Parameters, [
      {
        name: "test",
        optional: true,
        tester(type) {
          AssertExtra.InstanceOf(type, PrimitiveType);
          assert.equal(type.Name, "string");
        },
      },
    ]);
    const type = result.Returns;
    AssertExtra.InstanceOf(type, PrimitiveType);
    assert.equal(type.Name, "string");

    assert.equal(result.Body, "return 0;");
  });
});
