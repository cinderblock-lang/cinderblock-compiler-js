import { ComponentGroup } from "../../ast/component-group";
import { FunctionParameter } from "../../ast/function-parameter";
import { Property } from "../../ast/property";
import { Type } from "../../ast/type/base";
import { FunctionType } from "../../ast/type/function";
import { IterableType } from "../../ast/type/iterable";
import { IsPrimitiveName, PrimitiveType } from "../../ast/type/primitive";
import { ReferenceType } from "../../ast/type/reference";
import { SchemaType } from "../../ast/type/schema";
import { UseType } from "../../ast/type/use";
import { TokenGroup } from "../token";
import { BuildWhile, BuildWhileOnStart, ExpectNext, NextBlock } from "../utils";

export function ExtractFunctionParameter(
  tokens: TokenGroup
): FunctionParameter {
  const name = NextBlock(tokens);
  if (tokens.peek()?.Text === "?") {
    ExpectNext(tokens, "?");
    ExpectNext(tokens, ":");
    const type = ExtractType(tokens);
    return new FunctionParameter(name.CodeLocation, name.Text, type, true);
  }

  if (tokens.peek()?.Text !== ":") {
    return new FunctionParameter(
      name.CodeLocation,
      name.Text,
      undefined,
      false
    );
  }
  ExpectNext(tokens, ":");
  const type = ExtractType(tokens);

  return new FunctionParameter(name.CodeLocation, name.Text, type, false);
}

export function ExtractProperty(tokens: TokenGroup): Property {
  const name = NextBlock(tokens);
  let optional = false;
  if (tokens.peek()?.Text === "?") {
    optional = true;
    ExpectNext(tokens, "?");
  }

  ExpectNext(tokens, ":");
  const type = ExtractType(tokens);

  return new Property(name.CodeLocation, name.Text, type, optional);
}

function ExtractFunction(tokens: TokenGroup) {
  let parameters: Array<FunctionParameter> = [];
  if (tokens.peek()?.Text !== ")")
    parameters = BuildWhileOnStart(tokens, ",", ")", () =>
      ExtractFunctionParameter(tokens)
    );
  else ExpectNext(tokens, ")");

  ExpectNext(tokens, "->");

  return {
    parameters,
    returns: ExtractType(tokens),
  };
}

function ExtractSchema(tokens: TokenGroup) {
  const properties = BuildWhile(tokens, "{", ";", "}", () =>
    ExtractProperty(tokens)
  );

  return { name, properties };
}

function ExtractIterable(tokens: TokenGroup) {
  const result = ExtractType(tokens);
  ExpectNext(tokens, "]");

  return result;
}

function ExtractUse(tokens: TokenGroup) {
  const constraints = BuildWhileOnStart(tokens, "|", "=", () =>
    ExtractType(tokens)
  );

  return {
    name: NextBlock(tokens).Text,
    constraints,
  };
}

export function ExtractType(tokens: TokenGroup): Type {
  const current = NextBlock(tokens);

  if (IsPrimitiveName(current.Text)) {
    return new PrimitiveType(current.CodeLocation, current.Text);
  }

  switch (current.Text) {
    case "use": {
      const { name, constraints } = ExtractUse(tokens);
      return new UseType(
        current.CodeLocation,
        name,
        new ComponentGroup(...constraints)
      );
    }
    case "[": {
      return new IterableType(current.CodeLocation, ExtractIterable(tokens));
    }
    case "(": {
      const { parameters, returns } = ExtractFunction(tokens);
      return new FunctionType(
        current.CodeLocation,
        new ComponentGroup(...parameters),
        returns
      );
    }
    case "schema": {
      const { properties, name } = ExtractSchema(tokens);
      return new SchemaType(
        current.CodeLocation,
        new ComponentGroup(...properties)
      );
    }
    default:
      return new ReferenceType(current.CodeLocation, current.Text);
  }
}
