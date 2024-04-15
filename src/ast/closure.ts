import {
  ClosureContext,
  IClosure,
  IConcreteType,
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

export class Closure implements IClosure {
  readonly #components: Array<Statement>;

  constructor(...components: Array<Statement>) {
    this.#components = components;
  }

  ResolveType(name: string, ctx: ClosureContext): IConcreteType | undefined {
    return undefined;
  }

  Resolve(name: string): IInstance | undefined {
    const variable = this.#components.filter(
      (c) => c instanceof SubStatement && c.Name === name
    );

    if (variable.length > 0) return variable[0] as SubStatement;
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
      [file, func, output] = component.Build(file, func, scope);
      result = [...result, output];
    }

    return [file, func, result];
  }

  ResolvesTo(scope: Scope): Type {
    for (const component of this.#components)
      if (component instanceof ReturnStatement)
        return component.ResolveType(scope);

    throw new LinkerError(
      this.#components[0].CodeLocation,
      "error",
      "Code not resolve block type"
    );
  }

  static #ParseWhile(
    token_group: TokenGroup,
    factory: (group: TokenGroup) => [TokenGroup, Statement],
    look_for: Array<string>,
    finish_factory: (group: TokenGroup) => string = (g) => g.Text
  ): [TokenGroup, Closure] {
    const result: Array<Statement> = [];

    while (!look_for.includes(finish_factory(token_group))) {
      const [t, r] = factory(token_group);
      token_group = t;
      result.push(r);
    }

    return [token_group.Next, new Closure(...result)];
  }

  static Parse(token_group: TokenGroup) {
    return token_group.Text === "{"
      ? this.#ParseWhile(token_group.Next, Statement.Parse, ["}"])
      : (() => {
          const [tokens, expression] = Expression.Parse(token_group, [";"]);

          return [
            tokens,
            new Closure(
              new ReturnStatement(token_group.CodeLocation, expression)
            ),
          ] as const;
        })();
  }
}
