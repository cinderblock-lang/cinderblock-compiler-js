import { PrimitiveType } from "../type/primitive";
import { StructEntity } from "./struct";
import { Entity } from "./base";
import { describe, it } from "node:test";
import { Tokenise } from "../../parser";
import assert from "node:assert";
import AssertExtra from "../../test-utils/assert-extra";

describe("StructEntity.Parser", () => {
  it("Parses a basic struct", () => {
    const code = `struct Test {}`;

    const tokens = Tokenise(code, "test.cb");

    const [token_group, result] = Entity.Parse(tokens).Destructured;

    AssertExtra.InstanceOf(result, StructEntity);
    assert.equal(token_group.Done, true);
    assert.equal(result.Keys.length, 0);
    assert.equal(result.Name, "Test");
  });

  it("Returns a token group after the struct", () => {
    const code = `struct Test {} another`;

    const tokens = Tokenise(code, "test.cb");

    const [token_group, result] = Entity.Parse(tokens).Destructured;

    AssertExtra.InstanceOf(result, StructEntity);
    assert.equal(token_group.Text, "another");
    assert.equal(result.Keys.length, 0);
    assert.equal(result.Name, "Test");
  });

  it("Parses the property types", () => {
    const code = `struct Test { test: string; second: int; }`;

    const tokens = Tokenise(code, "test.cb");

    const [token_group, result] = Entity.Parse(tokens).Destructured;

    AssertExtra.InstanceOf(result, StructEntity);
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
