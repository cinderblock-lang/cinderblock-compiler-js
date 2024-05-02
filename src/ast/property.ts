import { LinkedProperty } from "../linked-ast/property";
import { CodeLocation } from "../location/code-location";
import { TokenGroup } from "../parser/token";
import { Context } from "./context";
import { ContextResponse } from "./context-response";
import { SubItem } from "./sub-item";
import { Type } from "./type/base";

export class Property extends SubItem {
  constructor(ctx: CodeLocation, name: string, type: Type, optional: boolean) {
    super(ctx, name, type, optional);
  }

  Linked(context: Context) {
    return context.Build(
      {
        type: (c) => this.Type.Linked(c),
      },
      ({ type }) => new LinkedProperty(this.CodeLocation, this.Name, type)
    );
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
