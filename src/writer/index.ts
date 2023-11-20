import {
  AccessExpression,
  AssignStatement,
  Ast,
  BracketsExpression,
  BuiltInFunction,
  ComponentGroup,
  Expression,
  ExternalFunctionDeclaration,
  FunctionEntity,
  FunctionParameter,
  FunctionType,
  IfExpression,
  InvokationExpression,
  LibEntity,
  LiteralExpression,
  MakeExpression,
  Namespace,
  OperatorExpression,
  PanicStatement,
  PrimitiveType,
  Property,
  ReferenceExpression,
  ReferenceType,
  ReturnStatement,
  StoreStatement,
  StructEntity,
  SystemEntity,
  Type,
} from "#compiler/ast";
import { Namer } from "#compiler/location";
import { ResolveBlock, ResolveExpression } from "../linker/visitor/resolve";
import { PatternMatch, RequireType } from "../location/pattern-match";
import { WriterError } from "./error";

class CinderblockWriter {
  readonly #written: Array<number> = [];
  readonly #includes: Array<string> = ["<stdlib.h>", "<dlfcn.h>"];
  readonly #globals: Array<string> = [];

  StructToString(struct: StructEntity): string {
    let result = [`struct ${struct.Name} {`];

    for (const property of struct.Properties.iterator()) {
      if (!(property instanceof Property))
        throw new WriterError(property.Location, "Expected a property");
      result.push(`  ${this.WriteType(property.Type, property.Name)};`);
    }

    return [...result, "};"].join("\n");
  }

  WriteType(type: Type, alias: string, reference?: boolean): string {
    if (reference) alias = "*" + alias;
    return (
      PatternMatch(
        ReferenceType,
        PrimitiveType,
        FunctionType,
        StructEntity,
        FunctionParameter
      )(
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
              return "_Bool " + alias;
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
            case "string":
              return "char* " + alias;
          }
        },
        (func) => {
          return `${this.WriteType(func.Returns, "")} (*${alias})(${[
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
        },
        (param) => {
          const type = param.Type;
          if (!type)
            throw new WriterError(param.Location, "Untyped function parameter");
          return this.WriteType(type, alias, reference);
        }
      )(type) ?? ""
    );
  }

  WriteExpression(
    item: Expression,
    level: number
  ): {
    result: Array<string>;
    stored: Array<string>;
    final: string;
  } {
    const result: Array<string> = [];
    const stored: Array<string> = [];

    const final = PatternMatch(
      LiteralExpression,
      OperatorExpression,
      IfExpression,
      MakeExpression,
      ReferenceExpression,
      BracketsExpression,
      InvokationExpression,
      AccessExpression
    )(
      (literal) => {
        switch (literal.Type) {
          case "bool":
            return literal.Value === "true" ? "1" : "0";
          case "char":
            return `'${literal.Value}'`;
          case "double":
            return literal.Value.replace("d", "");
          case "float":
            return literal.Value;
          case "int":
            return literal.Value.replace("i", "");
          case "long":
            return literal.Value;
          case "string":
            return `"${literal.Value}"`;
        }
      },
      (operator) => {
        const {
          result: left_res,
          stored: left_store,
          final: left_final,
        } = this.WriteExpression(operator.Left, level);
        result.push(...left_res);
        stored.push(...left_store);
        const {
          result: right_res,
          stored: right_store,
          final: right_final,
        } = this.WriteExpression(operator.Right, level);
        result.push(...right_res);
        stored.push(...right_store);

        return `${left_final} ${operator.Operator} ${right_final}`;
      },
      (ife) => {
        const checker = this.WriteExpression(ife.Check, level);
        result.push(...checker.result);
        result.push(...checker.stored);

        const name = Namer.GetName();

        const type = ResolveBlock(ife.If);
        result.push(this.WriteType(type, name));
        result.push(`if (${checker.final}) {`);
        result.push(
          this.WriteBlock(ife.If, level + 2, type, undefined, `${name} = `)
        );

        result.push("} else {");
        result.push(
          this.WriteBlock(ife.Else, level + 2, type, undefined, `${name} = `)
        );
        result.push("}");

        return name;
      },
      (make) => {
        const name = Namer.GetName();
        const target = make.StructEntity;
        if (!target) throw new WriterError(make.Location, "Make has no struct");

        result.push(`${this.WriteType(make.StructEntity, name, true)};`);

        result.push("{");

        result.push(this.WriteBlock(make.Using, level + 2, undefined, name));
        result.push("}");

        return name;
      },
      (reference) => {
        const target = reference.References;
        if (!target)
          throw new WriterError(reference.Location, "Unresolved reference");

        return PatternMatch(FunctionEntity, StoreStatement, FunctionParameter)(
          (fn) => fn.Name,
          (st) => "*" + st.Name,
          (pr) => pr.Name
        )(target);
      },
      (bracket) => {
        const type = ResolveExpression(bracket.Expression);
        const name = Namer.GetName();

        result.push(
          `${this.WriteType(type, name)} = ${this.WriteExpression(
            bracket.Expression,
            level
          )};`
        );

        return name;
      },
      (invokation) => {
        const subject = invokation.Subject;
        RequireType(ReferenceExpression, subject);

        const target = subject.References;
        if (!target)
          throw new WriterError(subject.Location, "Unresolved reference");

        if (target instanceof FunctionEntity) {
          this.#globals.push(this.WriteFunction(target));
        }

        if (target instanceof BuiltInFunction) {
          this.#globals.push(this.WriteBuiltInFunction(target));
        }

        if (
          !(target instanceof FunctionEntity) &&
          !(target instanceof BuiltInFunction) &&
          !(target instanceof ExternalFunctionDeclaration)
        )
          throw new WriterError(
            target.Location,
            "Attempting to invoke a none function"
          );

        const parameters = [...invokation.Parameters.iterator()];

        if (target instanceof BuiltInFunction && target.Allocates) {
          const temp = Namer.GetName();
          result.push(
            `${this.WriteType(target.Returns, temp)} = ${
              target.Name
            }(${parameters
              .map((p) => {
                RequireType(Expression, p);

                const {
                  result: res,
                  stored: sto,
                  final,
                } = this.WriteExpression(p, level);

                result.push(...res);
                stored.push(...sto);

                return final;
              })
              .join(",")});`
          );
          stored.push(temp);

          return temp;
        }

        return `${target.Name}(${parameters
          .map((p) => {
            RequireType(Expression, p);

            const {
              result: res,
              stored: sto,
              final,
            } = this.WriteExpression(p, level);

            result.push(...res);
            stored.push(...sto);

            return final;
          })
          .join(",")})`;
      },
      (access) => {
        const subject = access.Subject;
        RequireType(Expression, subject);

        const {
          result: res,
          stored: sto,
          final,
        } = this.WriteExpression(subject, level);

        result.push(...res);
        stored.push(...sto);

        return `${final}->${access.Target}`;
      }
    )(item);

    return { result, stored, final };
  }

  WriteBlock(
    block: ComponentGroup,
    level: number,
    returns?: Type,
    struct?: string,
    resolve: string = "return"
  ) {
    const result: Array<string> = [];

    const stored: Array<string> = [];

    for (const statement of block.iterator()) {
      PatternMatch(
        StoreStatement,
        ReturnStatement,
        AssignStatement,
        PanicStatement
      )(
        (store) => {
          if (!store.Type)
            throw new WriterError(
              store.Location,
              "No type for store statement"
            );
          stored.push(store.Name);
          result.push(
            `${this.WriteType(
              store.Type,
              store.Name,
              true
            )} = malloc(sizeof(${this.WriteType(store.Type, "")}));`
          );

          const {
            result: res,
            stored: sto,
            final,
          } = this.WriteExpression(store.Equals, level);
          result.push(...res);
          stored.push(...sto);

          result.push(`*${store.Name} = ${final};`);
        },
        (ret) => {
          if (!returns)
            throw new WriterError(
              ret.Location,
              "Attempting to return when not in a returning context"
            );
          result.push(`${this.WriteType(returns, "result", false)};`);

          const {
            result: res,
            stored: sto,
            final,
          } = this.WriteExpression(ret.Value, level);
          result.push(...res);
          stored.push(...sto);
          result.push(`result = ${final};`);

          result.push(...stored.map((s) => `free(${s});`));

          result.push(`${resolve} result;`);
        },
        (assign) => {
          if (!struct)
            throw new WriterError(
              assign.Location,
              "May only assign in a make expression"
            );

          const {
            result: res,
            stored: sto,
            final,
          } = this.WriteExpression(assign.Equals, level);
          result.push(...res);
          stored.push(...sto);
          result.push(`${struct}->${assign.Name} = ${final}`);
        },
        (panic) => {
          result.push(`int code;`);
          const {
            result: res,
            stored: sto,
            final,
          } = this.WriteExpression(panic.Value, level);
          result.push(...res);
          stored.push(...sto);
          result.push(`code = ${final};`);
          result.push(`exit(code);`);
        }
      )(statement);
    }

    if (struct) {
      result.push(...stored.map((s) => `free(${s});`));
    }

    return result.map((r) => " ".repeat(level) + r).join("\n");
  }

  WriteFunction(func: FunctionEntity): string {
    const result: Array<string> = [];

    const returns = func.Returns;

    if (!returns)
      throw new WriterError(func.Location, "Function has no return type");

    result.push(
      `${this.WriteType(func.Returns, func.Name)} (${[
        ...func.Parameters.iterator(),
      ]
        .map((p) => {
          RequireType(FunctionParameter, p);

          const type = p.Type;
          if (!type) throw new WriterError(p.Location, "Parameter has no type");

          return this.WriteType(type, p.Name);
        })
        .join(", ")}) {`
    );

    result.push(this.WriteBlock(func.Content, 2, returns));

    return result.concat("}").join("\n");
  }

  WriteBuiltInFunction(func: BuiltInFunction): string {
    const result: Array<string> = [];

    this.#includes.push(...func.Requires);

    const returns = func.Returns;

    if (!returns)
      throw new WriterError(func.Location, "Function has no return type");

    result.push(
      `${this.WriteType(func.Returns, func.Name)} (${[
        ...func.Parameters.iterator(),
      ]
        .map((p) => {
          RequireType(FunctionParameter, p);

          const type = p.Type;
          if (!type) throw new WriterError(p.Location, "Parameter has no type");

          return this.WriteType(type, p.Name);
        })
        .join(", ")}) {`
    );

    result.push(func.Source);

    return result.concat("}").join("\n");
  }

  WriteExternalLib(lib: LibEntity) {
    const var_name = Namer.GetName();

    const functions = [...lib.Content.iterator()].map((c) => {
      RequireType(ExternalFunctionDeclaration, c);

      const params = [...c.Parameters.iterator()]
        .map((p) => {
          RequireType(FunctionParameter, p);

          const type = p.Type;
          if (!type) throw new WriterError(p.Location, "Parameter has no type");

          return this.WriteType(type, p.Name);
        })
        .join(", ");

      const params_refs = [...c.Parameters.iterator()]
        .map((p) => {
          RequireType(FunctionParameter, p);

          const type = p.Type;
          if (!type) throw new WriterError(p.Location, "Parameter has no type");

          return p.Name;
        })
        .join(", ");
      return `
${this.WriteType(c.Returns, c.Name, true)}(${params}) {
  ${this.WriteType(c.Returns, "")} (*instance)(params) = dlsym(${var_name}, "${
        c.Name
      }");

  ${this.WriteType(
    c.Returns,
    "result",
    true
  )} =  malloc(sizeof(${this.WriteType(c.Returns, "")}));

  *result = (*instance)(${params_refs})

  return result;
}`;
    });

    return `
void* ${var_name};

void init_${var_name}() {
  if (${var_name} == NULL) {
    ${var_name} = dlopen("${lib.Name}", RTLD_NOW|RTLD_GLOBAL);
  }
}

${functions.join("\n\n")}`;
  }

  WriteSystemLib(lib: SystemEntity) {
    const var_name = Namer.GetName();

    const functions = [...lib.Content.iterator()].map((c) => {
      RequireType(ExternalFunctionDeclaration, c);

      const params = [...c.Parameters.iterator()]
        .map((p) => {
          RequireType(FunctionParameter, p);

          const type = p.Type;
          if (!type) throw new WriterError(p.Location, "Parameter has no type");

          return this.WriteType(type, p.Name);
        })
        .join(", ");

      const params_refs = [...c.Parameters.iterator()]
        .map((p) => {
          RequireType(FunctionParameter, p);

          const type = p.Type;
          if (!type) throw new WriterError(p.Location, "Parameter has no type");

          return p.Name;
        })
        .join(", ");
      return `
${this.WriteType(c.Returns, c.Name, true)}(${params}) {
  ${this.WriteType(c.Returns, "")} (*instance)(params) = dlsym(${var_name}, "${
        c.Name
      }");

  ${this.WriteType(
    c.Returns,
    "result",
    true
  )} =  malloc(sizeof(${this.WriteType(c.Returns, "")}));

  *result = (*instance)(${params_refs})

  return result;
}`;
    });

    return `
${functions.join("\n\n")}`;
  }

  Globals() {
    return [
      ...this.#includes.map((i) => "#include " + i),
      ...this.#globals,
    ].join("\n\n");
  }
}

export function WriteCinderblock(ast: Ast) {
  const writer = new CinderblockWriter();
  for (const namespace of ast.iterator()) {
    if (!(namespace instanceof Namespace))
      throw new WriterError(
        namespace.Location,
        "Somehow we got to writing with a top level item that is not a namespace. Definitely a compiler bug."
      );

    if (namespace.Name !== "App") continue;

    for (const entity of namespace.Contents.iterator()) {
      if (entity instanceof FunctionEntity && entity.Name === "main") {
        const result = writer.WriteFunction(entity);

        return `
${writer.Globals()}

${result}`;
      }
    }
  }

  throw new Error(
    "Could not find the main function. Currently, only simple apps with a main function are supported"
  );
}
