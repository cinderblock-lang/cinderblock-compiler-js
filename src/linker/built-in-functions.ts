import {
  BuiltInFunction,
  ComponentGroup,
  FunctionParameter,
  FunctionType,
  Namespace,
  PrimitiveType,
  Property,
  ReferenceType,
  StructEntity,
} from "#compiler/ast";
import { Location } from "#compiler/location";

const EmptyLocation = new Location("generated", -1, -1, -1, -1);

export const BuiltInFunctions = new ComponentGroup(
  new Namespace(
    EmptyLocation,
    false,
    "__GENERATED_CODE__",
    new ComponentGroup(
      new StructEntity(
        EmptyLocation,
        true,
        "Array",
        new ComponentGroup(
          new Property(
            EmptyLocation,
            "next",
            new FunctionType(
              EmptyLocation,
              new ComponentGroup(
                new FunctionParameter(
                  EmptyLocation,
                  "ctx",
                  new ReferenceType(EmptyLocation, "Array"),
                  false
                )
              ),
              new ReferenceType(EmptyLocation, "Array")
            ),
            false
          ),
          new Property(
            EmptyLocation,
            "result",
            new PrimitiveType(EmptyLocation, "any"),
            true
          ),
          new Property(
            EmptyLocation,
            "done",
            new PrimitiveType(EmptyLocation, "bool"),
            true
          )
        ),
        "__GENERATED_CODE__",
        []
      ),
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
        `return input[index];`,
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
        ` int index = 0;
        
          while (input[index] != 0) {
            index = index + 1;
          }
          
          return index;`,
        []
      ),
      new BuiltInFunction(
        EmptyLocation,
        "concat",
        new ComponentGroup(
          new FunctionParameter(
            EmptyLocation,
            "first",
            new PrimitiveType(EmptyLocation, "string"),
            false
          ),
          new FunctionParameter(
            EmptyLocation,
            "second",
            new PrimitiveType(EmptyLocation, "string"),
            false
          )
        ),
        new PrimitiveType(EmptyLocation, "string"),
        ` int first_length = 0;
        
          while (first[first_length] != 0) {
            first_length = first_length + 1;
          }
          
          int second_length = 0;
        
          while (second[second_length] != 0) {
            second_length = second_length + 1;
          }

          char *result = malloc(sizeof(char) * (first_length + second_length + 1));

          for (int i = 0 ; i < first_length ; i++) {
            result[i] = first[i];
          }

          for (int i = 0 ; i < second_length ; i++) {
            result[first_length + i] = second[i];
          }
          
          return result;`,
        [],
        true
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
          ),
          new FunctionParameter(
            EmptyLocation,
            "length",
            new PrimitiveType(EmptyLocation, "int"),
            false
          )
        ),
        new PrimitiveType(EmptyLocation, "int"),
        `return syscall(SYS_write, 1, text, length);`,
        ["<sys/syscall.h>"]
      )
    )
  )
);
