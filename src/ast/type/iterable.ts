import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { Property } from "../property";
import { WriterContext } from "../writer";
import { Type } from "./base";
import { FunctionType } from "./function";
import { PrimitiveType } from "./primitive";
import { ReferenceType } from "./reference";
import { SchemaType } from "./schema";

export class IterableType extends Type {
  readonly #type: Type;

  constructor(ctx: CodeLocation, type: Type) {
    super(ctx);
    this.#type = type;
  }

  get Type() {
    return this.#type;
  }

  get type_name() {
    return "iterable_type";
  }

  c(ctx: WriterContext): string {
    return `Array`;
  }

  resolve_type(ctx: WriterContext): Component {
    return new SchemaType(
      this.CodeLocation,
      new ComponentGroup(
        new Property(
          this.CodeLocation,
          "done",
          new PrimitiveType(this.CodeLocation, "bool"),
          false
        ),
        new Property(this.CodeLocation, "result", this.Type, true),
        new Property(
          this.CodeLocation,
          "next",
          new FunctionType(
            this.CodeLocation,
            new ComponentGroup(),
            new ReferenceType(this.CodeLocation, "Array")
          ),
          false
        )
      )
    );
  }
}
