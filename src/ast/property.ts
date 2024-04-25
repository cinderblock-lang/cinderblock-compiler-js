import { LinkedProperty } from "../linked-ast/property";
import { LinkedType } from "../linked-ast/type/base";
import { CodeLocation } from "../location/code-location";
import { TokenGroup } from "../parser/token";
import { CallStack } from "./callstack";
import { Scope } from "./scope";
import { SubItem } from "./sub-item";
import { Type } from "./type/base";

export class Property extends SubItem {
  constructor(ctx: CodeLocation, name: string, type: Type, optional: boolean) {
    super(ctx, name, type, optional);
  }

  Linked(scope: Scope, callstack: CallStack): [Scope, LinkedProperty] {
    let type: LinkedType;
    [scope, type] = this.Type.Linked(scope, callstack);

    return [scope, new LinkedProperty(this.CodeLocation, this.Name, type)];
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
