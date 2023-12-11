import { CodeLocation } from "../../location/code-location";
import { RequireType } from "../../location/require-type";
import { ComponentGroup } from "../component-group";
import { FunctionParameter } from "../function-parameter";
import { Type } from "../type/base";
import { BuiltInFunction } from "./built-in-function";

export class ExternalFunctionDeclaration extends BuiltInFunction {
  constructor(
    ctx: CodeLocation,
    name: string,
    parameters: ComponentGroup,
    returns: Type
  ) {
    super(
      ctx,
      name,
      true,
      parameters,
      returns,
      `${name}(${parameters
        .map((p) => {
          RequireType(FunctionParameter, p);
          return p.Name;
        })
        .join(",")});`,
      [],
      false
    );
  }
  get type_name() {
    return "external_function_declaration";
  }
}
