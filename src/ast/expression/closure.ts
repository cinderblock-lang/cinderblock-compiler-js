import { IClosure, IConcreteType, IInstance } from "../../linker/closure";
import { TokenGroup } from "../../parser/token";
import { Component } from "../component";
import { Statement } from "../statement/base";
import { ReturnStatement } from "../statement/return";
import { SubStatement } from "../statement/sub";
import { Type } from "../type/base";
import { Expression } from "./base";

export class Closure implements IClosure {
  readonly #components: Array<Statement>;

  constructor(...components: Array<Statement>) {
    this.#components = components;
  }

  ResolveType(type: Type): IConcreteType | undefined {
    return undefined;
  }

  Resolve(name: string): IInstance | undefined {
    const variable = this.#components.filter(
      (c) => c instanceof SubStatement && c.Name === name
    );

    if (variable.length > 0) return variable[0] as SubStatement;
  }

  static #ParseWhile(
    token_group: TokenGroup,
    factory: (group: TokenGroup) => [TokenGroup, Component],
    look_for: Array<string>,
    finish_factory: (group: TokenGroup) => string = (g) => g.Text
  ): [TokenGroup, Closure] {
    const result: Array<Component> = [];

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
