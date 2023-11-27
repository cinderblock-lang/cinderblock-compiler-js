import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { FunctionParameter } from "../function-parameter";
import { WriterContext } from "../writer";
import { Type } from "./base";
import { FunctionType } from "./function";
import { PrimitiveType } from "./primitive";

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
    return new FunctionType(
      this.CodeLocation,
      new ComponentGroup(
        new FunctionParameter(
          this.CodeLocation,
          "index",
          new PrimitiveType(this.CodeLocation, "int"),
          false
        )
      ),
      new PrimitiveType(this.CodeLocation, "any")
    );
  }
}
