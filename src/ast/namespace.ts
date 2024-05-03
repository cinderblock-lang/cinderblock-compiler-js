import { LinkedExpression } from "../linked-ast/expression/base";
import { LinkedEntityExpression } from "../linked-ast/expression/entity";
import { LinkedType } from "../linked-ast/type/base";
import { LinkerError } from "../linker/error";
import { CodeLocation } from "../location/code-location";
import { TokenGroup } from "../parser/token";
import { Component } from "./component";
import { Context } from "./context";
import { ContextResponse } from "./context-response";
import { Entity } from "./entity/base";
import { FunctionEntity } from "./entity/function";
import { TypeEntity } from "./entity/type-entity";
import { UsingEntity } from "./entity/using";

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

  IncludesFunction(func: Component) {
    return !!this.#contents.find((f) => f === func);
  }

  GetMain() {
    for (const entity of this.#contents) {
      if (entity instanceof FunctionEntity && entity.Name === "main") {
        return entity;
      }
    }

    throw new LinkerError(this.CodeLocation, "error", "Could not resolve main");
  }

  GetObject(
    name: string,
    context: Context
  ): ContextResponse<LinkedExpression> | undefined {
    for (const entity of this.#contents) {
      if (entity instanceof FunctionEntity && entity.Name === name) {
        const response = entity.Linked(context);
        return new ContextResponse(
          response.Context,
          new LinkedEntityExpression(this.CodeLocation, response.Response)
        );
      }
    }

    for (const namespace_name of this.#using()) {
      const result = context
        .GetNamespace(namespace_name)
        .GetObject(name, context);
      if (result) return result;
    }

    return undefined;
  }

  GetType(
    name: string,
    context: Context
  ): ContextResponse<LinkedType> | undefined {
    for (const entity of this.#contents) {
      if (entity instanceof TypeEntity && entity.Name === name) {
        return entity.Linked(context);
      }
    }

    for (const namespace_name of this.#using()) {
      const result = context
        .GetNamespace(namespace_name)
        .GetType(name, context);
      if (result) return result;
    }

    return undefined;
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

    token_group = token_group.Next;
    let entities: Array<Entity> = [];
    while (token_group.Text !== "}") {
      let result: Entity;
      [token_group, result] = Entity.Parse(token_group);
      entities = [...entities, result];
    }

    return [token_group, new Namespace(start, name, entities)];
  }
}
