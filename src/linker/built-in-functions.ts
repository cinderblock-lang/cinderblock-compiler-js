import { ComponentGroup } from "../ast/component-group";
import { BuiltInFunction } from "../ast/entity/built-in-function";
import { FunctionParameter } from "../ast/function-parameter";
import { Namespace } from "../ast/namespace";
import { PrimitiveType } from "../ast/type/primitive";
import { EmptyCodeLocation } from "../location/empty";

export const BuiltInFunctions = new ComponentGroup(
  new Namespace(
    EmptyCodeLocation,
    false,
    "___BUILT_IN_CODE___",
    new ComponentGroup(
      new BuiltInFunction(
        EmptyCodeLocation,
        "get_char",
        false,
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
        `char result = input[index];`,
        []
      ),
      new BuiltInFunction(
        EmptyCodeLocation,
        "length",
        false,
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
          
          int result = index;`,
        []
      ),
      new BuiltInFunction(
        EmptyCodeLocation,
        "concat",
        false,
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

          result[first_length + second_length] = 0;`,
        [],
        true
      ),
      new BuiltInFunction(
        EmptyCodeLocation,
        "add_char",
        false,
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
            new PrimitiveType(EmptyCodeLocation, "char"),
            false
          )
        ),
        new PrimitiveType(EmptyCodeLocation, "string"),
        ` int length = 0;
        
          while (first[length] != 0) {
            length = length + 1;
          }

          char *result = malloc(sizeof(char) * (length + 2));

          for (int i = 0 ; i < length ; i++) {
            result[i] = first[i];
          }

          result[length] = second;
          result[length + 1] = 0;
          
          return result;`,
        [],
        true
      ),
      new BuiltInFunction(
        EmptyCodeLocation,
        "c_size",
        false,
        new ComponentGroup(
          new FunctionParameter(
            EmptyCodeLocation,
            "input",
            new PrimitiveType(EmptyCodeLocation, "string"),
            false
          )
        ),
        new PrimitiveType(EmptyCodeLocation, "ulong"),
        "unsigned long result = sizeof(input.data);",
        []
      ),
    )
  )
);
