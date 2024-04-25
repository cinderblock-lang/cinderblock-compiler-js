import { TokenGroup } from "../parser/token";
import { Statement } from "./statement/base";
import { ReturnStatement } from "./statement/return";
import { Expression } from "./expression/base";
import { Scope } from "./scope";
import { CallStack } from "./callstack";
import { LinkedBlock } from "../linked-ast/block";
import { LinkedStatement } from "../linked-ast/statement/base";
import { LinkedType } from "../linked-ast/type/base";
import { LinkerError } from "../linker/error";

export class Block {
  readonly #components: Array<Statement>;

  constructor(...components: Array<Statement>) {
    this.#components = components;
  }

  Linked(scope: Scope, callstack: CallStack): [Scope, LinkedBlock] {
    let result: Array<LinkedStatement>;
    let returns: LinkedType | undefined = undefined;

    [scope, result] = this.#components.reduce(
      ([scope, map], n) => {
        if (n instanceof ReturnStatement)
          [scope, returns] = n
            .ReturnType(scope, callstack)
            .Linked(scope, callstack);

        let result: LinkedStatement;
        [scope, result] = n.Linked(scope, callstack);

        return [scope, [...map, result]];
      },
      [scope, []] as [Scope, Array<LinkedStatement>]
    );

    if (!returns)
      throw new LinkerError(
        this.#components[0].CodeLocation,
        "error",
        "Unable to determine return type"
      );

    return [scope, new LinkedBlock(result, returns)];
  }

  static Parse(
    token_group: TokenGroup,
    progress_single_line = true
  ): [TokenGroup, Block] {
    if (token_group.Text !== "{") {
      let expression: Expression;
      [token_group, expression] = Expression.Parse(token_group, [";"]);

      return [
        progress_single_line ? token_group.Next : token_group,
        new Block(new ReturnStatement(token_group.CodeLocation, expression)),
      ];
    }

    const result: Array<Statement> = [];
    token_group = token_group.Next;

    while (token_group.Text !== "}") {
      let r: Statement;
      [token_group, r] = Statement.Parse(token_group);
      token_group = token_group.Next;
      result.push(r);
    }

    return [token_group.Next, new Block(...result)];
  }
}
