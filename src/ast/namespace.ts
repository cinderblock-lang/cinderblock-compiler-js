import type { Ast } from ".";
import { IConcreteType, IInstance } from "../linker/closure";
import { CodeLocation } from "../location/code-location";
import { TokenGroup } from "../parser/token";
import { Component } from "./component";
import { Entity } from "./entity/base";
import { EnumEntity } from "./entity/enum";
import { FunctionEntity } from "./entity/function";
import { StructEntity } from "./entity/struct";
import { UsingEntity } from "./entity/using";

/*
  TODO: We need to work out how to create a new scope for function entities
  The best bet is to make the With function on scope check if the closure is
  function. If it is, make it spawn from scratch with the correct using statements.

  Then we need to put a method on the AST to find the main and build from there.
*/

export class Namespace extends Component {
  readonly #name: string;
  readonly #contents: Array<Entity>;

  constructor(ctx: CodeLocation, name: string, content: Array<Entity>) {
    super(ctx);
    this.#name = name;
    this.#contents = content;
  }

  get Name() {
    return this.#name;
  }

  *#using() {
    for (const entity of this.#contents)
      if (entity instanceof UsingEntity) yield entity.Name;
  }

  Contains(func: FunctionEntity) {
    return !!this.#contents.find((c) => c === func);
  }

  ResolveType(name: string, ast: Ast): IConcreteType | undefined {
    for (const entity of this.#contents)
      if (
        (entity instanceof StructEntity || entity instanceof EnumEntity) &&
        entity.Name === name
      )
        return entity;

    for (const name of this.#using()) {
      const result = ast.GetNamespace(name).ResolveType(name, ast);
      if (result) return result;
    }
  }

  Resolve(name: string, ast: Ast): IInstance | undefined {
    for (const entity of this.#contents)
      if (entity instanceof FunctionEntity && entity.Name === name)
        return entity;

    for (const name of this.#using()) {
      const result = ast.GetNamespace(name).Resolve(name, ast);
      if (result) return result;
    }
  }

  static Parse(token_group: TokenGroup): [TokenGroup, Namespace] {
    const start = token_group.CodeLocation;
    token_group.Expect("namespace");

    token_group = token_group.Next;

    let name = token_group.Text;
    token_group = token_group.Next;

    while (token_group.Text !== "{") {
      name += token_group.Text;
      token_group = token_group.Next;
      name += token_group.Text;
      token_group = token_group.Next;
    }

    let entities: Array<Entity> = [];
    while (token_group.Text !== "}") {
      let result: Entity;
      [token_group, result] = Entity.Parse(token_group);
      entities = [...entities, result];
    }

    return [token_group, new Namespace(start, name, entities)];
  }
}
