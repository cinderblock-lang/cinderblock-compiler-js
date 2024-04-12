import { IInstance } from "../linker/closure";
import { CodeLocation } from "../location/code-location";
import { TokenGroup } from "../parser/token";
import { Component } from "./component";
import { Type } from "./type/base";

export class Property extends Component implements IInstance {
  readonly #name: string;
  readonly #type: Type;
  readonly #optional: boolean;

  constructor(ctx: CodeLocation, name: string, type: Type, optional: boolean) {
    super(ctx);
    this.#name = name;
    this.#type = type;
    this.#optional = optional;
  }

  get Reference(): string {
    throw new Error("Method not implemented.");
  }

  get Name() {
    return this.#name;
  }

  get Type() {
    return this.#type;
  }

  get Optional() {
    return this.#optional;
  }

  static Parse(token_group: TokenGroup): [TokenGroup, Property] {
    const name = token_group.Text;

    let optional = false;
    token_group = token_group.Next;
    if (token_group.Text === "?") {
      token_group = token_group.Next;
      optional = true;
    }

    token_group.Expect(":");

    const [after_type, type] = Type.Parse(token_group.Next);

    return [
      after_type,
      new Property(token_group.CodeLocation, name, type, optional),
    ];
  }
}
