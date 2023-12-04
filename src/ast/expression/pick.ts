import { Expression } from "./base";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { Component } from "../component";
import { CodeLocation } from "../../location/code-location";
import { LinkerError } from "../../linker/error";
import { Namer } from "../../location/namer";
import { RequireType } from "../../location/require-type";
import { EnumEntity } from "../entity/enum";
import { ReturnStatement } from "../statement/return";

export class PickExpression extends Expression {
  readonly #enum: string;
  readonly #key: string;
  readonly #using: ComponentGroup;

  constructor(
    ctx: CodeLocation,
    target: string,
    key: string,
    using: ComponentGroup
  ) {
    super(ctx);
    this.#enum = target;
    this.#key = key;
    this.#using = using;
  }

  get Enum() {
    return this.#enum;
  }

  get Key() {
    return this.#key;
  }

  get Using() {
    return this.#using;
  }

  get type_name() {
    return "pick_expression";
  }

  c(ctx: WriterContext): string {
    const type = ctx.FindType(this.Enum);
    if (!type)
      throw new LinkerError(this.CodeLocation, "Could not resolve symbol");
    RequireType(EnumEntity, type);
    const name = Namer.GetName();
    ctx.AddDeclaration(`${type.c(ctx)} ${name};`);

    const ctx_new = ctx.WithBody(this.Using, "pick_" + this.Enum);

    const value = this.Using.find(ReturnStatement);

    const value_text = value.c(ctx_new);

    const line = `{
      ${ctx_new.Prefix}
      ${name}.type = ${type.GetKeyIndex(this.Key)};
      ${name}.data = &${value_text};
      ${ctx_new.Suffix}
    }`;

    ctx.AddPrefix(line, name, [name]);

    return name;
  }

  resolve_type(ctx: WriterContext): Component {
    const type = ctx.FindType(this.Enum);
    if (!type)
      throw new LinkerError(this.CodeLocation, "Could not resolve enum");

    return type;
  }
}
