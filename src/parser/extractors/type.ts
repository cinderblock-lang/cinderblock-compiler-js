import {
  ComponentGroup,
  FunctionParameter,
  FunctionType,
  IterableType,
  Property,
  ReferenceType,
  SchemaType,
  Type,
  UseType,
} from "#compiler/ast";
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
    return new FunctionParameter(name.Location, name.Text, type, true);
  }

  if (tokens.peek()?.Text !== ":") {
    return new FunctionParameter(name.Location, name.Text, undefined, false);
  }
  ExpectNext(tokens, ":");
  const type = ExtractType(tokens);

  return new FunctionParameter(name.Location, name.Text, type, false);
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

  return new Property(name.Location, name.Text, type, optional);
}

function ExtractFunction(tokens: TokenGroup) {
  const parameters = BuildWhileOnStart(tokens, ",", ")", () =>
    ExtractFunctionParameter(tokens)
  );

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

  switch (current.Text) {
    case "use": {
      const { name, constraints } = ExtractUse(tokens);
      return new UseType(
        current.Location,
        name,
        new ComponentGroup(...constraints)
      );
    }
    case "[": {
      return new IterableType(current.Location, ExtractIterable(tokens));
    }
    case "(": {
      const { parameters, returns } = ExtractFunction(tokens);
      return new FunctionType(
        current.Location,
        new ComponentGroup(...parameters),
        returns
      );
    }
    case "schema": {
      const { properties, name } = ExtractSchema(tokens);
      return new SchemaType(
        current.Location,
        new ComponentGroup(...properties)
      );
    }
    default:
      return new ReferenceType(current.Location, current.Text);
  }
}
