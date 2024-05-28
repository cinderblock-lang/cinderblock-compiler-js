import { describe, it } from "node:test";
import { Tokenise } from "../../parser";
import { Entity } from "./base";
import AssertExtra from "../../test-utils/assert-extra";
import { UsingEntity } from "./using";
import assert from "node:assert";

describe("UsingEntity.Parser", () => {
  it("Parses a using entity", () => {
    const code = `using Test.Name;`;

    const tokens = Tokenise(code, "test.cb");

    const [token_group, result] = Entity.Parse(tokens).Destructured;

    AssertExtra.InstanceOf(result, UsingEntity);

    assert.equal(result.Name, "Test.Name");
  });

  it("Returns the token after the using statement", () => {
    const code = `using Test.Name; another`;

    const tokens = Tokenise(code, "test.cb");

    const [token_group, result] = Entity.Parse(tokens).Destructured;

    AssertExtra.InstanceOf(result, UsingEntity);

    assert.equal(token_group.Text, "another");
  });
});
