import { CodeLocation } from "../../location/code-location";
import { TokeniserContext } from "../../parser/context";
import { ParserError } from "../../parser/error";
import { TokenGroup } from "../../parser/token-group";
import { TokenGroupResponse } from "../../parser/token-group-response";
import { Component } from "../component";

export type EntityOptions = {
  exported: boolean;
  unsafe: boolean;
};

export interface IBaseable {
  Is(token_group: TokenGroup): boolean;
  Extract(
    token_group: TokenGroup,
    options: EntityOptions,
    ctx: TokeniserContext
  ): TokenGroupResponse<Entity>;
}

export abstract class Entity extends Component {
  readonly #options: EntityOptions;
  static #possible: Array<IBaseable> = [];

  constructor(ctx: CodeLocation, options: EntityOptions) {
    super(ctx);
    this.#options = options;
  }

  abstract get Name(): string;

  get Exported() {
    return this.#options.exported;
  }

  get Unsafe() {
    return this.#options.unsafe;
  }

  static Register(instance: IBaseable): void {
    this.#possible = [...this.#possible, instance];
  }

  static Parse(
    token_group: TokenGroup,
    ctx: TokeniserContext,
    options?: EntityOptions
  ): TokenGroupResponse<Entity> {
    if (token_group.Text === "export")
      return this.Parse(token_group.Next, ctx, {
        exported: true,
        unsafe: options?.unsafe ?? false,
      });

    if (token_group.Text === "unsafe")
      return this.Parse(token_group.Next, ctx.WithUnsafety(true), {
        exported: options?.exported ?? false,
        unsafe: true,
      });

    for (const possible of this.#possible)
      if (possible.Is(token_group))
        return possible.Extract(token_group, {
          exported: options?.exported ?? false,
          unsafe: options?.unsafe ?? false,
        }, ctx);

    throw new ParserError(
      token_group.CodeLocation,
      "No statement candidate for " + token_group.Text
    );
  }
}
