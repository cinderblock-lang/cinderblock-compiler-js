import { CodeLocation } from "../location/code-location";
import { TokenGroup } from "../parser/token";
import { Component } from "./component";
import { Type } from "./type/base";

export class FunctionParameter extends Component {
  readonly #name: string;
  readonly #type?: Type;
  readonly #optional: boolean;

  constructor(
    ctx: CodeLocation,
    name: string,
    type: Type | undefined,
    optional: boolean
  ) {
    super(ctx);
    this.#name = name;
    this.#type = type;
    this.#optional = optional;
  }

  static Parse(token_group: TokenGroup): [TokenGroup, FunctionParameter] {
    const name = token_group.Text;

    let optional = false;
    token_group = token_group.Next;
    if (token_group.Text === "?") {
      token_group = token_group.Next;
      optional = true;
    }

    if (token_group.Text !== ":") {
      return [
        token_group,
        new FunctionParameter(
          token_group.CodeLocation,
          name,
          undefined,
          optional
        ),
      ];
    }

    const [after_type, type] = Type.Parse(token_group.Next);

    return [
      after_type,
      new FunctionParameter(token_group.CodeLocation, name, type, optional),
    ];
  }
}
