import { Expression } from "./base";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { Component } from "../component";
import { AssignStatement } from "../statement/assign";
import { CodeLocation } from "../../location/code-location";
import { LinkerError } from "../../linker/error";
import { Namer } from "../../location/namer";
import { StructEntity } from "../entity/struct";

export class MakeExpression extends Expression {
  readonly #struct: string;
  readonly #using: ComponentGroup;

  constructor(ctx: CodeLocation, struct: string, using: ComponentGroup) {
    super(ctx);
    this.#struct = struct;
    this.#using = using;
  }

  get Struct() {
    return this.#struct;
  }

  get Using() {
    return this.#using;
  }

  get type_name() {
    return "make_expression";
  }

  c(ctx: WriterContext): string {
    const type = ctx.FindType(this.Struct);
    if (!type)
      throw new LinkerError(this.CodeLocation, "Could not resolve symbol");
    const name = Namer.GetName();
    ctx.AddPrefix(
      `${type.c(ctx)}* ${name} = malloc(sizeof(${type.c(ctx)}));`,
      name
    );

    ctx.AddSuffix(`free(${name});`);

    ctx = ctx.WithBody(this.Using, "make_" + this.Struct);

    const inputs = this.Using.find_all(AssignStatement).map(
      (a) => `${name}->${a.Name} = ${a.c(ctx)};`
    );

    ctx.AddPrefix(
      `{
      ${ctx.Prefix}
      ${inputs.join("\n")}
      ${ctx.Suffix}
    }`,
      name
    );

    return `*${name}`;
  }

  resolve_type(ctx: WriterContext): Component {
    const entity = ctx.FindType(this.Struct);
    if (!entity || !(entity instanceof StructEntity))
      throw new LinkerError(this.CodeLocation, "Could not resolve struct");
    return entity;
  }
}
