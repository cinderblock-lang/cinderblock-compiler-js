import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { Property } from "../property";
import { WriterContext } from "../writer";
import { Entity } from "./base";

export class EnumEntity extends Entity {
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

  GetKeyIndex(key: string) {
    let i = 0;
    for (const property of this.#properties.iterator()) {
      if (property instanceof Property) if (property.Name === key) return i;

      i++;
    }

    return undefined;
  }

  get type_name() {
    return (this.#namespace + "__" + this.Name).replace(/\./gm, "__");
  }

  static #already_made: boolean = false;

  c(ctx: WriterContext): string {
    if (!EnumEntity.#already_made) {
      EnumEntity.#already_made = true;
      ctx.AddGlobalDeclaration(`typedef struct _ENUM {
        int type;
        void* data;
      } _ENUM;`);
    }

    return "_ENUM";
  }

  compatible(target: Component): boolean {
    return target instanceof EnumEntity && target.type_name === this.type_name;
  }

  resolve_type(ctx: WriterContext): Component {
    return this;
  }

  default(ctx: WriterContext): string {
    const name = Namer.GetName();
    ctx.AddPrefix(`${this.c(ctx)} ${name} = { -1, 0 };`, name, []);

    return name;
  }
}
