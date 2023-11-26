import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { RequireType } from "../../location/require-type";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { FunctionParameter } from "../function-parameter";
import { Type } from "../type/base";
import { FunctionType } from "../type/function";
import { PrimitiveType } from "../type/primitive";
import { WriterContext } from "../writer";

export class BuiltInFunction extends Component {
  readonly #name: string;
  readonly #parameters: ComponentGroup;
  readonly #returns: Component;
  readonly #source: string;
  readonly #requires: Array<string>;
  readonly #allocates: boolean;

  constructor(
    ctx: CodeLocation,
    name: string,
    parameters: ComponentGroup,
    returns: Component,
    source: string,
    requires: Array<string>,
    allocates?: boolean
  ) {
    super(ctx);
    this.#name = name;
    this.#parameters = parameters;
    this.#returns = returns;
    this.#source = source;
    this.#requires = requires;
    this.#allocates = allocates ?? false;
  }

  get Name() {
    return this.#name;
  }

  get Parameters() {
    return this.#parameters;
  }

  get Returns() {
    return this.#returns;
  }

  get Source() {
    return this.#source;
  }

  get Requires() {
    return this.#requires;
  }

  get Allocates() {
    return this.#allocates;
  }

  get type_name() {
    return "built_in_function";
  }

  static #already_made: Array<string> = [];

  c(ctx: WriterContext): string {
    const name = Namer.GetName();

    const params = new ComponentGroup(
      new FunctionParameter(
        this.CodeLocation,
        "ctx",
        new PrimitiveType(this.CodeLocation, "null"),
        false
      ),
      ...this.Parameters.iterator()
    );

    if (!BuiltInFunction.#already_made.includes(this.Name)) {
      BuiltInFunction.#already_made.push(this.Name);

      for (const requirement of this.Requires) ctx.AddInclude(requirement);
      ctx.AddGlobal(`${this.Returns.c(ctx)} ${this.Name}(${params
        .map((p) => {
          RequireType(FunctionParameter, p);
          const type = p.Type;
          if (!type)
            throw new LinkerError(p.CodeLocation, "Could not resolve type");

          RequireType(Type, type);
          return `${type.c(ctx)} ${p.Name}`;
        })
        .join(", ")}) {
        ${this.Source}
      }`);
    }

    const struct = new FunctionType(this.CodeLocation, params, this.Returns).c(
      ctx
    );

    ctx.AddPrefix(`${struct} ${name} = { &${this.Name}, NULL };`);

    return name;
  }

  resolve_type(ctx: WriterContext): Component {
    return new FunctionType(this.CodeLocation, this.Parameters, this.Returns);
  }
}
