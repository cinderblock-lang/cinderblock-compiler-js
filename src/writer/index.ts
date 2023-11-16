import {
  Ast,
  FunctionEntity,
  FunctionParameter,
  FunctionType,
  Namespace,
  PrimitiveType,
  Property,
  ReferenceType,
  StructEntity,
  Type,
} from "#compiler/ast";
import { PatternMatch, RequireType } from "../location/pattern-match";
import { WriterError } from "./error";

class CinderblockWriter {
  readonly #written: Array<number> = [];
  readonly #globals: Array<string> = [];

  StructToString(struct: StructEntity): string {
    let result = [`struct ${struct.Name} {`];

    for (const property of struct.Properties.iterator()) {
      if (!(property instanceof Property))
        throw new WriterError(property.Location, "Expected a property");
      result.push(`  ${this.WriteType(property.Type, property.Name)};`);
    }

    return [...result, "}"].join("\n");
  }

  WriteType(type: Type, alias: string): string {
    return (
      PatternMatch(ReferenceType, PrimitiveType, FunctionType, StructEntity)(
        (reference) => {
          const target = reference.References;
          if (!target)
            throw new WriterError(
              reference.Location,
              `Unfound reference ${reference.Name}`
            );

          return this.WriteType(target, alias);
        },
        (primitive) => {
          switch (primitive.Name) {
            case "bool":
              return "bool " + alias;
            case "char":
              return "char " + alias;
            case "float":
              return "float " + alias;
            case "double":
              return "double " + alias;
            case "int":
              return "int " + alias;
            case "long":
              return "long " + alias;
          }
        },
        (func) => {
          return `${this.WriteType(func.Returns, alias)} (*${alias})(${[
            ...func.Parameters.iterator(),
          ]
            .map((p) => {
              RequireType(FunctionParameter, p);
              const type = p.Type;
              if (!type)
                throw new WriterError(
                  p.Location,
                  "unfound type for function parameter"
                );

              return this.WriteType(type, p.Name);
            })
            .join(", ")})`;
        },
        (struct) => {
          if (!this.#written.includes(struct.Index)) {
            this.#globals.push(this.StructToString(struct));
            this.#written.push(struct.Index);
          }

          return `struct ${struct.Name} ${alias}`;
        }
      )(type) ?? ""
    );
  }

  WriteFunction(func: FunctionEntity): string {
    let result = "";

    return result;
  }
}

export function WriteCinderblock(ast: Ast) {
  for (const namespace of ast.iterator()) {
    if (!(namespace instanceof Namespace))
      throw new WriterError(
        namespace.Location,
        "Somehow we got to writing with a top level item that is not a namespace. Definitely a compiler bug."
      );

    if (namespace.Name !== "App") continue;

    for (const entity of namespace.Contents.iterator()) {
      if (entity instanceof FunctionEntity && entity.Name === "main")
        return WriteFunction(entity);
    }
  }

  throw new Error(
    "Could not find the main function. Currently, only simple apps with a main function are supported"
  );
}
