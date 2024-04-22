import {
  ClosureContext,
  IClosure,
  IConcreteType,
  IDiscoverableType,
  IInstance,
  Scope,
} from "../linker/closure";
import { TokenGroup } from "../parser/token";
import { Statement } from "./statement/base";
import { ReturnStatement } from "./statement/return";
import { SubStatement } from "./statement/sub";
import { Expression } from "./expression/base";
import { WriterFile } from "../writer/file";
import { WriterStatement } from "../writer/statement";
import { LinkerError } from "../linker/error";
import { Type } from "./type/base";
import { WriterFunction } from "../writer/entity";

export class Block implements IClosure {
  readonly #components: Array<Statement>;

  constructor(...components: Array<Statement>) {
    this.#components = components;
  }

  DiscoverType(name: string, ctx: ClosureContext): IDiscoverableType[] {
    return [];
  }

  ResolveType(name: string, ctx: ClosureContext): Array<IConcreteType> {
    return [];
  }

  Resolve(name: string): Array<IInstance> {
    const variable = this.#components.filter(
      (c) => c instanceof SubStatement && c.Name === name
    );

    if (variable.length > 0) return variable as Array<SubStatement>;

    return [];
  }

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, Array<WriterStatement>] {
    let result: Array<WriterStatement> = [];
    for (const component of this.#components) {
      if (component instanceof SubStatement) continue;
      let output: WriterStatement;
      [file, func, output] = component.Build(file, func, scope.With(this));
      result = [...result, output];
    }

    return [file, func, result];
  }

  ResolvesTo(scope: Scope): Type {
    for (const component of this.#components)
      if (component instanceof ReturnStatement)
        return component.ResolveType(scope.With(this));

    throw new LinkerError(
      this.#components[0].CodeLocation,
      "error",
      "Code not resolve block type"
    );
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
