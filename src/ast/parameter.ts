import { IInstance, InstanceId } from "../linker/closure";
import { CodeLocation } from "../location/code-location";
import { ParserError } from "../parser/error";
import { TokenGroup } from "../parser/token";
import { SubItem } from "./sub-item";
import { Type } from "./type/base";

export class Parameter extends SubItem implements IInstance {
  constructor(ctx: CodeLocation, name: string, type: Type, optional: boolean) {
    super(ctx, name, type, optional);
  }

  readonly [InstanceId] = true;

  get Reference(): string {
    return this.CName;
  }

  static Parse(token_group: TokenGroup): [TokenGroup, Parameter] {
    const name = token_group.Text;

    let optional = false;
    token_group = token_group.Next;
    if (token_group.Text === "?") {
      token_group = token_group.Next;
      optional = true;
    }

    if (token_group.Text !== ":") {
      throw new ParserError(
        token_group.CodeLocation,
        "A parameter type must be supplied"
      );
      // return [
      //   token_group,
      //   new Parameter(token_group.CodeLocation, name, undefined, optional),
      // ];
    }

    let type: Type;
    [token_group, type] = Type.Parse(token_group.Next);

    return [
      token_group.Next,
      new Parameter(token_group.CodeLocation, name, type, optional),
    ];
  }
}
