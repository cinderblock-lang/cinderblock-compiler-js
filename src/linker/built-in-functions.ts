import {
  BuiltInFunction,
  ComponentGroup,
  FunctionParameter,
  Namespace,
  PrimitiveType,
} from "#compiler/ast";
import { Location } from "#compiler/location";

const EmptyLocation = new Location("generated", -1, -1, -1, -1);

export const BuiltInFunctions = new ComponentGroup(
  new Namespace(
    EmptyLocation,
    false,
    "__GENERATED_CODE__",
    new ComponentGroup(
      new BuiltInFunction(
        EmptyLocation,
        "GetChar",
        new ComponentGroup(
          new FunctionParameter(
            EmptyLocation,
            "input",
            new PrimitiveType(EmptyLocation, "string"),
            false
          ),
          new FunctionParameter(
            EmptyLocation,
            "index",
            new PrimitiveType(EmptyLocation, "int"),
            false
          )
        ),
        new PrimitiveType(EmptyLocation, "char")
      ),
      new BuiltInFunction(
        EmptyLocation,
        "Length",
        new ComponentGroup(
          new FunctionParameter(
            EmptyLocation,
            "input",
            new PrimitiveType(EmptyLocation, "string"),
            false
          )
        ),
        new PrimitiveType(EmptyLocation, "int")
      ),
      new BuiltInFunction(
        EmptyLocation,
        "CBuffer",
        new ComponentGroup(
          new FunctionParameter(
            EmptyLocation,
            "input",
            new PrimitiveType(EmptyLocation, "string"),
            false
          )
        ),
        new PrimitiveType(EmptyLocation, "any")
      ),
      new BuiltInFunction(
        EmptyLocation,
        "CSize",
        new ComponentGroup(
          new FunctionParameter(
            EmptyLocation,
            "input",
            new PrimitiveType(EmptyLocation, "string"),
            false
          )
        ),
        new PrimitiveType(EmptyLocation, "any")
      )
    )
  )
);
