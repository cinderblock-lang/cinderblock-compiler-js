import { CodeLocation } from "../location/code-location";
import { TokenGroup } from "../parser/token";
import { Component } from "./component";
import { Expression } from "./expression/base";
import { Statement } from "./statement/base";
import { ReturnStatement } from "./statement/return";

export class ComponentGroup {
  readonly #components: Array<Component>;

  constructor(...components: Array<Component>) {
    this.#components = components;
  }

  get Length() {
    return this.#components.length;
  }

  get First() {
    return this.#components[0];
  }

  get Last() {
    return this.#components[this.#components.length - 1];
  }

  get CodeLocation() {
    return new CodeLocation(
      this.First.CodeLocation.FileName,
      this.First.CodeLocation.StartLine,
      this.First.CodeLocation.StartColumn,
      this.Last.CodeLocation.EndLine,
      this.Last.CodeLocation.EndColumn
    );
  }

  get json() {
    return this.#components;
  }

  *iterator() {
    for (const component of this.#components) yield component;
  }

  map<T>(handler: (input: Component) => T) {
    return this.#components.map(handler);
  }

  filter(predicate: (item: Component) => boolean) {
    return this.#components.filter(predicate);
  }

  find<T>(checker: abstract new (...args: any[]) => T): T {
    return this.#components.find((c) => c instanceof checker) as T;
  }

  find_all<T>(checker: abstract new (...args: any[]) => T): T[] {
    return this.#components.filter((c) => c instanceof checker) as T[];
  }

  static ParseWhile(
    token_group: TokenGroup,
    factory: (group: TokenGroup) => [TokenGroup, Component],
    look_for: Array<string>,
    finish_factory: (group: TokenGroup) => string = (g) => g.Text
  ): [TokenGroup, ComponentGroup] {
    const result: Array<Component> = [];

    while (!look_for.includes(finish_factory(token_group))) {
      const [t, r] = factory(token_group);
      token_group = t;
      result.push(r);
    }

    return [token_group.Next, new ComponentGroup(...result)];
  }

  static ParseOptionalExpression(token_group: TokenGroup) {
    return token_group.Text === "{"
      ? this.ParseWhile(token_group.Next, Statement.Parse, ["}"])
      : (() => {
          const [tokens, expression] = Expression.Parse(token_group, [";"]);

          return [
            tokens,
            new ComponentGroup(
              new ReturnStatement(token_group.CodeLocation, expression)
            ),
          ] as const;
        })();
  }
}
