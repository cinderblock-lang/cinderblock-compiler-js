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
        "get_char",
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
        "length",
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
        "c_buffer",
        new ComponentGroup(
          new FunctionParameter(
            EmptyLocation,
            "input",
            new PrimitiveType(EmptyLocation, "string"),
            false
          )
        ),
        new PrimitiveType(EmptyLocation, "c_string")
      ),
      new BuiltInFunction(
        EmptyLocation,
        "create_string",
        new ComponentGroup(
          new FunctionParameter(
            EmptyLocation,
            "input",
            new PrimitiveType(EmptyLocation, "c_string"),
            false
          ),
          new FunctionParameter(
            EmptyLocation,
            "length",
            new PrimitiveType(EmptyLocation, "int"),
            false
          )
        ),
        new PrimitiveType(EmptyLocation, "string")
      ),
      new BuiltInFunction(
        EmptyLocation,
        "c_size",
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
        "sys_print",
        new ComponentGroup(
          new FunctionParameter(
            EmptyLocation,
            "input",
            new PrimitiveType(EmptyLocation, "string"),
            false
          )
        ),
        new PrimitiveType(EmptyLocation, "int")
      )
    )
  )
);
