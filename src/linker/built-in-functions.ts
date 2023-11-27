import { ComponentGroup } from "../ast/component-group";
import { BuiltInFunction } from "../ast/entity/built-in-function";
import { StructEntity } from "../ast/entity/struct";
import { FunctionParameter } from "../ast/function-parameter";
import { Namespace } from "../ast/namespace";
import { Property } from "../ast/property";
import { FunctionType } from "../ast/type/function";
import { PrimitiveType } from "../ast/type/primitive";
import { ReferenceType } from "../ast/type/reference";
import { CodeLocation } from "../location/code-location";

const EmptyCodeLocation = new CodeLocation("generated", -1, -1, -1, -1);

export const BuiltInFunctions = new ComponentGroup(
  new Namespace(
    EmptyCodeLocation,
    false,
    "___BUILT_IN_CODE___",
    new ComponentGroup(
      new BuiltInFunction(
        EmptyCodeLocation,
        "get_char",
        new ComponentGroup(
          new FunctionParameter(
            EmptyCodeLocation,
            "input",
            new PrimitiveType(EmptyCodeLocation, "string"),
            false
          ),
          new FunctionParameter(
            EmptyCodeLocation,
            "index",
            new PrimitiveType(EmptyCodeLocation, "int"),
            false
          )
        ),
        new PrimitiveType(EmptyCodeLocation, "char"),
        `return input[index];`,
        []
      ),
      new BuiltInFunction(
        EmptyCodeLocation,
        "length",
        new ComponentGroup(
          new FunctionParameter(
            EmptyCodeLocation,
            "input",
            new PrimitiveType(EmptyCodeLocation, "string"),
            false
          )
        ),
        new PrimitiveType(EmptyCodeLocation, "int"),
        ` int index = 0;
        
          while (input[index] != 0) {
            index = index + 1;
          }
          
          return index;`,
        []
      ),
      new BuiltInFunction(
        EmptyCodeLocation,
        "concat",
        new ComponentGroup(
          new FunctionParameter(
            EmptyCodeLocation,
            "first",
            new PrimitiveType(EmptyCodeLocation, "string"),
            false
          ),
          new FunctionParameter(
            EmptyCodeLocation,
            "second",
            new PrimitiveType(EmptyCodeLocation, "string"),
            false
          )
        ),
        new PrimitiveType(EmptyCodeLocation, "string"),
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
        EmptyCodeLocation,
        "c_size",
        new ComponentGroup(
          new FunctionParameter(
            EmptyCodeLocation,
            "input",
            new PrimitiveType(EmptyCodeLocation, "string"),
            false
          )
        ),
        new PrimitiveType(EmptyCodeLocation, "int"),
        "return sizeof(input.data);",
        []
      ),
      new BuiltInFunction(
        EmptyCodeLocation,
        "sys_print",
        new ComponentGroup(
          new FunctionParameter(
            EmptyCodeLocation,
            "text",
            new PrimitiveType(EmptyCodeLocation, "string"),
            false
          ),
          new FunctionParameter(
            EmptyCodeLocation,
            "length",
            new PrimitiveType(EmptyCodeLocation, "int"),
            false
          )
        ),
        new PrimitiveType(EmptyCodeLocation, "int"),
        `return syscall(SYS_write, 1, text, length);`,
        ["<sys/syscall.h>"]
      )
    )
  )
);
