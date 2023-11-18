import {
  BuiltInFunction,
  ComponentGroup,
  FunctionParameter,
  Namespace,
  PrimitiveType,
} from "#compiler/ast";
import { Location } from "#compiler/location";

const EmptyLocation = new Location("generated", -1, -1, -1, -1);

export const CreateString = new BuiltInFunction(
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
  new PrimitiveType(EmptyLocation, "string"),
  `string result;
    result.data = input;
    result.length = length;
    return result;`,
  [],
  `typedef struct string
    {
      char *data;
      int length;
    } string;`
);

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
        new PrimitiveType(EmptyLocation, "char"),
        `if (input.length < index)
          {
            return 0;
          }
        
          char *blob_data = input.data;
        
          return blob_data[index];`,
        []
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
        new PrimitiveType(EmptyLocation, "int"),
        `return input.length;`,
        []
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
        new PrimitiveType(EmptyLocation, "c_string"),
        `return input.data;`,
        []
      ),
      CreateString,
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
        new PrimitiveType(EmptyLocation, "int"),
        "return sizeof(input.data);",
        []
      ),
      new BuiltInFunction(
        EmptyLocation,
        "sys_print",
        new ComponentGroup(
          new FunctionParameter(
            EmptyLocation,
            "text",
            new PrimitiveType(EmptyLocation, "string"),
            false
          )
        ),
        new PrimitiveType(EmptyLocation, "int"),
        `int result;

        result = syscall(SYS_write, 1, text.data, text.length);
      
        return result;`,
        ["<sys/syscall.h>"]
      )
    )
  )
);
