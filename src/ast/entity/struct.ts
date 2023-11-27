import { CodeLocation } from "../../location/code-location";
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
    return "struct_entity";
  }

  get #full_name() {
    return this.#namespace.replace(/\./gm, "__") + "__" + this.Name;
  }

  static #already_made: Array<string> = [];

  c(ctx: WriterContext): string {
    if (!StructEntity.#already_made.includes(this.#full_name)) {
      StructEntity.#already_made.push(this.#full_name);
      ctx.AddGlobalDeclaration(`typedef struct ${this.#full_name} {
        ${this.Properties.map((p) =>
          p.c(ctx.StartContext(this.CodeLocation, this.#namespace, this.#using))
        ).join("\n")}
      } ${this.#full_name};`);
    }

    return this.#full_name;
  }

  resolve_type(ctx: WriterContext): Component {
    return this;
  }
}
