import { PrimitiveType } from "../type/primitive";
import { FunctionEntity } from "./function";
import { Entity } from "./base";
import { describe, it } from "node:test";
import { Tokenise } from "../../parser";
import assert from "node:assert";
import AssertExtra from "../../test-utils/assert-extra";
import { ReturnStatement } from "../statement/return";
import { LiteralExpression } from "../expression/literal";

describe("FunctionEntity.Parser", () => {
  it("Parses a basic function", () => {
    const code = `fn test(): string { return ""; }`;

    const tokens = Tokenise(code, "test.cb");

    const [token_group, result] = Entity.Parse(tokens).Destructured;

    AssertExtra.InstanceOf(result, FunctionEntity);
    assert.equal(token_group.Done, true);
    assert.equal(result.Name, "test");
    AssertExtra.ParametersWith(result.Parameters, []);
    const type = result.Returns;
    AssertExtra.InstanceOf(type, PrimitiveType);
    assert.equal(type.Name, "string");

    AssertExtra.BlockWith(result.Content, [
      {
        type: ReturnStatement,
        tester(statement) {
          const value = statement.Value;
          AssertExtra.InstanceOf(value, LiteralExpression);
          assert.equal(value.Type, "string");
          assert.equal(value.Value, '""');
        },
      },
    ]);
  });

  it("Returns a token group after the function", () => {
    const code = `fn test(): string { return ""; } another`;

    const tokens = Tokenise(code, "test.cb");

    const [token_group, result] = Entity.Parse(tokens).Destructured;

    AssertExtra.InstanceOf(result, FunctionEntity);
    assert.equal(token_group.Text, "another");
  });
});
