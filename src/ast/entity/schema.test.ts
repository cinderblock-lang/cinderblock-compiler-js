import { PrimitiveType } from "../type/primitive";
import { SchemaEntity } from "./schema";
import { Entity } from "./base";
import { describe, it } from "node:test";
import { Tokenise } from "../../parser";
import assert from "node:assert";
import AssertExtra from "../../test-utils/assert-extra";
import { TokeniserContext } from "../../parser/context";

describe("SchemaEntity.Parser", () => {
  it("Parses a basic schema", () => {
    const code = `schema Test {}`;

    const tokens = Tokenise(code, "test.cb");

    const [token_group, result] = Entity.Parse(
      tokens,
      new TokeniserContext("Test", true)
    ).Destructured;

    AssertExtra.InstanceOf(result, SchemaEntity);
    assert.equal(token_group.Done, true);
    assert.equal(result.Keys.length, 0);
    assert.equal(result.Name, "Test");
  });

  it("Returns a token group after the schema", () => {
    const code = `schema Test {} another`;

    const tokens = Tokenise(code, "test.cb");

    const [token_group, result] = Entity.Parse(
      tokens,
      new TokeniserContext("Test", true)
    ).Destructured;

    AssertExtra.InstanceOf(result, SchemaEntity);
    assert.equal(token_group.Text, "another");
    assert.equal(result.Keys.length, 0);
    assert.equal(result.Name, "Test");
  });

  it("Parses the property types", () => {
    const code = `schema Test { test: string; second: int; }`;

    const tokens = Tokenise(code, "test.cb");

    const [token_group, result] = Entity.Parse(
      tokens,
      new TokeniserContext("Test", true)
    ).Destructured;

    AssertExtra.InstanceOf(result, SchemaEntity);
    assert.equal(token_group.Done, true);
    assert.deepEqual(result.Keys, ["test", "second"]);
    assert.equal(result.Name, "Test");

    AssertExtra.PropertyWith(result.GetKey("test"), "test", false, (type) => {
      AssertExtra.InstanceOf(type, PrimitiveType);
      assert.equal(type.Name, "string");
    });

    AssertExtra.PropertyWith(
      result.GetKey("second"),
      "second",
      false,
      (type) => {
        AssertExtra.InstanceOf(type, PrimitiveType);
        assert.equal(type.Name, "int");
      }
    );
  });
});
