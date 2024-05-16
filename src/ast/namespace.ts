import { LinkedExpression } from "../linked-ast/expression/base";
import { LinkedEntityExpression } from "../linked-ast/expression/entity";
import { LinkedType } from "../linked-ast/type/base";
import { LinkerError } from "../linker/error";
import { CodeLocation } from "../location/code-location";
import { TokenGroup } from "../parser/token-group";
import { TokenGroupResponse } from "../parser/token-group-response";
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
        try {
          const response = entity.Linked(context);
          return new ContextResponse(
            response.Context,
            new LinkedEntityExpression(this.CodeLocation, response.Response)
          );
        } catch {}
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

  static Parse(token_group: TokenGroup): TokenGroupResponse<Namespace> {
    return token_group.Build(
      {
        name: (token_group) => {
          token_group.Expect("namespace");
          return token_group.Next.Until(
            (token_group) => TokenGroupResponse.TextItem(token_group),
            "{"
          );
        },
        entities: (token_group) =>
          token_group.Until((token_group) => Entity.Parse(token_group), "}"),
      },
      ({ name, entities }) =>
        new Namespace(token_group.CodeLocation, name.join(""), entities)
    );
  }
}
