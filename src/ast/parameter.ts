import { LinkedParameterExpression } from "../linked-ast/expression/parameter";
import { LinkedParameter } from "../linked-ast/parameter";
import { CodeLocation } from "../location/code-location";
import { ParserError } from "../parser/error";
import { TokenGroup } from "../parser/token-group";
import { TokenGroupResponse } from "../parser/token-group-response";
import { Context } from "./context";
import { ContextResponse } from "./context-response";
import { SubItem } from "./sub-item";
import { Type } from "./type/base";

export class Parameter extends SubItem {
  constructor(ctx: CodeLocation, name: string, type: Type, optional: boolean) {
    super(ctx, name, type, optional);
  }

  Linked(context: Context) {
    return context.Build(
      {
        type: (c) => this.Type.Linked(c),
      },
      ({ type }, ctx) => {
        const parameter = new LinkedParameter(
          this.CodeLocation,
          this.Name,
          type,
          this.Optional
        );

        return new ContextResponse(
          ctx.WithObject(
            this.Name,
            new LinkedParameterExpression(this.CodeLocation, parameter)
          ),
          parameter
        );
      }
    );
  }

  static Parse(token_group: TokenGroup): TokenGroupResponse<Parameter> {
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
          return Type.Parse(token_group.Next);
        },
      },
      ({ name, optional, type }) =>
        new Parameter(token_group.CodeLocation, name, type, optional)
    );
  }
}
