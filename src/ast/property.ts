import { LinkedProperty } from "../linked-ast/property";
import { CodeLocation } from "../location/code-location";
import { TokenGroup } from "../parser/token-group";
import { TokenGroupResponse } from "../parser/token-group-response";
import { Context } from "./context";
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

  static Parse(token_group: TokenGroup) {
    return token_group.Build(
      {
        name: (token_group) => TokenGroupResponse.TextItem(token_group),
        optional: (token_group) => {
          if (token_group.Text === "?")
            return new TokenGroupResponse(token_group.Next, true);

          return new TokenGroupResponse(token_group, false);
        },
        type: (token_group) => {
          token_group.Expect(":");
          let type: Type;
          [token_group, type] = Type.Parse(token_group.Next).Destructured;

          token_group.Expect(";");
          return new TokenGroupResponse(token_group.Next, type);
        },
      },
      ({ name, optional, type }) =>
        new Property(token_group.CodeLocation, name, type, optional)
    );
  }
}
