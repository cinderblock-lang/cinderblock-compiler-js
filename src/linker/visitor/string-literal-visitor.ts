import {
  Component,
  ComponentGroup,
  InvokationExpression,
  LiteralExpression,
  ReferenceExpression,
  Visitor,
} from "#compiler/ast";
import { Location } from "#compiler/location";
import { CreateString } from "../built-in-functions";
import { LinkerError } from "../error";

export class StringLiteralVisitor extends Visitor {
  get OperatesOn() {
    return [LiteralExpression];
  }

  Visit(target: Component): {
    result: Component | undefined;
    cleanup: () => void;
  } {
    if (target instanceof LiteralExpression) {
      if (target.Type !== "string")
        return { result: undefined, cleanup: () => {} };

      return {
        result: new InvokationExpression(
          target.Location,
          new ReferenceExpression(
            target.Location,
            "create_string",
            CreateString
          ),
          new ComponentGroup(
            target.copy(),
            new LiteralExpression(
              target.Location,
              "int",
              target.Value.length + "i"
            )
          )
        ),
        cleanup: () => {},
      };
    }

    throw new LinkerError(target.Location, "No matching handler");
  }
}
