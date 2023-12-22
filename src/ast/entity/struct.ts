import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { RequireType } from "../../location/require-type";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { Property } from "../property";
import { WriterContext } from "../writer";
import { Entity } from "./base";

export class StructEntity extends Entity {
  readonly #name: string;
  readonly #properties: ComponentGroup;
  readonly #namespace: string;
  readonly #using: Array<string>;

  constructor(
    ctx: CodeLocation,
    exported: boolean,
    name: string,
    properties: ComponentGroup,
    namespace: string,
    using: Array<string>
  ) {
    super(ctx, exported);
    this.#name = name;
    this.#properties = properties;
    this.#namespace = namespace;
    this.#using = using;
  }

  get Name() {
    return this.#name;
  }

  get Properties() {
    return this.#properties;
  }

  HasKey(key: string) {
    for (const property of this.#properties.iterator())
      if (property instanceof Property) if (property.Name === key) return true;

    return false;
  }

  GetKey(key: string) {
    for (const property of this.#properties.iterator())
      if (property instanceof Property)
        if (property.Name === key) return property;

    return undefined;
  }

  get type_name() {
    return this.#full_name;
  }

  get #full_name() {
    return this.#namespace.replace(/\./gm, "__") + "__" + this.Name;
  }

  static #already_made: Record<string, string> = {};

  c(ctx: WriterContext): string {
    if (!StructEntity.#already_made[this.#full_name]) {
      const name = Namer.GetName();
      StructEntity.#already_made[this.#full_name] = name;
      ctx.AddGlobalDeclaration(`typedef struct ${name} {
        ${this.Properties.map((p) =>
          p.c(ctx.StartContext(this.CodeLocation, this.#namespace, this.#using))
        ).join("\n")}
      } ${name};`);
    }

    return StructEntity.#already_made[this.#full_name];
  }

  compatible(target: Component): boolean {
    return (
      target instanceof StructEntity && target.type_name === this.type_name
    );
  }

  resolve_type(ctx: WriterContext): Component {
    return this;
  }

  get Namespace() {
    return this.#namespace;
  }

  get Using() {
    return this.#using;
  }

  default(ctx: WriterContext): string {
    const name = Namer.GetName();
    ctx.AddPrefix(
      `${this.c(ctx)} ${name} = { ${this.#properties
        .map((p) => {
          RequireType(Property, p);

          return p.Type.default(ctx);
        })
        .join(", ")} };`,
      name,
      []
    );

    return name;
  }
}
