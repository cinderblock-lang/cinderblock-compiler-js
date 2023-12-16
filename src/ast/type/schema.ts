import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { RequireType } from "../../location/require-type";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { SchemaEntity } from "../entity/schema";
import { StructEntity } from "../entity/struct";
import { Property } from "../property";
import { WriterContext } from "../writer";
import { Type } from "./base";

export class SchemaType extends Type {
  readonly #properties: ComponentGroup;

  constructor(ctx: CodeLocation, properties: ComponentGroup) {
    super(ctx);
    this.#properties = properties;
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

  IsCompatible(subject: StructEntity): boolean {
    throw new Error("Not yet implemented");
  }

  get type_name() {
    return "schema_type";
  }

  c(ctx: WriterContext): string {
    throw new LinkerError(
      this.CodeLocation,
      "May not have a schema in the compiled code"
    );
  }

  compatible(target: Component, ctx: WriterContext): boolean {
    return (
      target instanceof SchemaEntity &&
      target instanceof SchemaType &&
      target instanceof StructEntity &&
      ![...this.Properties.iterator()].find((p) => {
        RequireType(Property, p);
        return (
          !target.HasKey(p.Name) || !target.GetKey(p.Name)?.resolve_type(ctx).compatible(p.Type, ctx)
        );
      })
    );
  }

  resolve_type(ctx: WriterContext): Component {
    return this;
  }
}
