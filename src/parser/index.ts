import { SplitTokens } from "./tokeniser";
import { TokenGroup } from "./token";
import { ParserError } from "./error";
import { BuildWhile, BuildWhilePeek, ExpectNext, NextBlock } from "./utils";
import { ExtractEntity } from "./extractors/entity";
import { ComponentGroup } from "../ast/component-group";
import { Namespace } from "../ast/namespace";

function ExtractNamespace(tokens: TokenGroup, exported = false): Namespace {
  const start = tokens.peek();
  if (!start) throw new ParserError(undefined, "No namespace implementation");
  if (start.Text === "export") {
    NextBlock(tokens);
    return ExtractNamespace(tokens, true);
  }

  const using: Array<string> = [];
  const name = BuildWhile(
    tokens,
    "namespace",
    ".",
    "{",
    () => NextBlock(tokens).Text
  ).join(".");

  const entities = BuildWhilePeek(
    tokens,
    (v) => v !== "}",
    () => ExtractEntity(tokens, name, using)
  );

  ExpectNext(tokens, "}");

  return new Namespace(
    start.CodeLocation,
    exported,
    name,
    new ComponentGroup(...entities)
  );
}

export function ParseCinderblock(
  input: string,
  file_name: string
): ComponentGroup {
  const tokens = SplitTokens(input, file_name);
  const group = new TokenGroup(tokens);

  const result: Array<Namespace> = [];
  while (group.peek()) {
    result.push(ExtractNamespace(group));
  }

  return new ComponentGroup(...result);
}
