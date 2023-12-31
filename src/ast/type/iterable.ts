import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { StructEntity } from "../entity/struct";
import { FunctionParameter } from "../function-parameter";
import { Property } from "../property";
import { WriterContext } from "../writer";
import { Type } from "./base";
import { FunctionType } from "./function";
import { PrimitiveType } from "./primitive";
import { SchemaType } from "./schema";
import { UseType } from "./use";

export class IterableType extends Type {
  readonly #type: Type;
  readonly #result: StructEntity;

  constructor(ctx: CodeLocation, type: Type) {
    super(ctx);
    this.#type = type;

    this.#result = new StructEntity(
      this.CodeLocation,
      true,
      Namer.GetName(),
      new ComponentGroup(
        new Property(this.CodeLocation, "result", type, true),
        new Property(
          this.CodeLocation,
          "done",
          new PrimitiveType(this.CodeLocation, "bool"),
          false
        ),
        new Property(
          this.CodeLocation,
          "next",
          new PrimitiveType(this.CodeLocation, "any"),
          false
        )
      ),
      "",
      []
    );
  }

  get Type() {
    return this.#type;
  }

  get Result() {
    return this.#result;
  }

  get type_name() {
    return `iterable_${this.Type.type_name}`;
  }

  c(ctx: WriterContext): string {
    return this.resolve_type(ctx).c(ctx);
  }

  get #result_schema() {
    return new SchemaType(
      this.CodeLocation,
      new ComponentGroup(
        new Property(this.CodeLocation, "result", this.Type, true),
        new Property(
          this.CodeLocation,
          "done",
          new PrimitiveType(this.CodeLocation, "bool"),
          false
        ),
        new Property(
          this.CodeLocation,
          "next",
          new PrimitiveType(this.CodeLocation, "any"),
          false
        )
      )
    );
  }

  compatible(target: Component, ctx: WriterContext): boolean {
    return (
      (target instanceof IterableType &&
        target.#type.compatible(this.#type, ctx)) ||
      (target instanceof FunctionType &&
        new ComponentGroup(
          ...target.Parameters.map((p) => p.resolve_type(ctx))
        ).compatible(
          new ComponentGroup(new PrimitiveType(this.CodeLocation, "any")),
          ctx,
          false
        ) &&
        this.#result_schema.compatible(target.Returns, ctx))
    );
  }

  resolve_type(ctx: WriterContext): Component {
    ctx.AddGlobalStruct(this.Result.Name, this.Result);
    return new FunctionType(
      this.CodeLocation,
      new ComponentGroup(
        new FunctionParameter(
          this.CodeLocation,
          "index",
          new UseType(
            this.CodeLocation,
            "I",
            new ComponentGroup(new PrimitiveType(this.CodeLocation, "any"))
          ),
          false
        )
      ),
      this.Result
    );
  }

  default(ctx: WriterContext): string {
    const name = Namer.GetName();
    ctx.AddPrefix(`${this.c(ctx)} ${name} = { 0, 0 };`, name, []);

    return name;
  }
}
