import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { StructEntity } from "./struct";

export class ExternalStructEntity extends StructEntity {
  constructor(ctx: CodeLocation, name: string, properties: ComponentGroup) {
    super(ctx, false, name, properties, "___BUILT_IN_CODE___", []);
  }

  get type_name() {
    return "external_struct";
  }

  c(ctx: WriterContext): string {
    return `struct ${this.Name}`;
  }

  resolve_type(ctx: WriterContext): Component {
    return this;
  }
}
