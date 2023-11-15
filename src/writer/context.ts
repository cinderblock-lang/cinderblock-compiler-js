// import {
//   AccessExpression,
//   BracketsExpression,
//   Component,
//   CountExpression,
//   Expression,
//   IfExpression,
//   InvokationExpression,
//   IsExpression,
//   IterateExpression,
//   LiteralExpression,
//   MakeExpression,
//   OperatorExpression,
//   ReferenceExpression,
// } from "#compiler/ast";
// import { Namer } from "#compiler/location";
// import { PatternMatch } from "../location/pattern-match";
// import { WriterError } from "./error";

// export abstract class Variable {
//   #owners: number = 0;

//   abstract Create(alias: string): string;

//   abstract Free(alias: string): string;

//   abstract TypeName(): string;

//   Pass() {
//     this.#owners += 1;
//   }

//   Done(alias: string) {
//     this.#owners -= 1;
//     if (this.#owners === 0) {
//       return this.Free(alias);
//     }

//     return "";
//   }
// }

// class PrimitiveVariable extends Variable {
//   readonly #type: string;

//   constructor(type: string) {
//     super();
//     this.#type = type;
//   }

//   Create(alias: string): string {
//     return `${this.#type} ${alias};`;
//   }

//   Free(alias: string): string {
//     return ``;
//   }

//   TypeName(): string {
//     return this.#type;
//   }
// }

// export abstract class Closure {
//   readonly #variables: Array<[Variable, string]> = [];

//   add(input: Variable, name: string) {
//     this.#variables.push([input, name]);
//   }

//   close() {
//     return this.#variables
//       .map(([v, n]) => v.Done(n))
//       .filter((v) => v)
//       .map((v) => v + ";");
//   }
// }

// export class ExpressionClosure extends Closure {
//   readonly #input: Expression;
//   readonly #target: string;

//   constructor(input: Component, target: string) {
//     super();
//     if (!(input instanceof Expression))
//       throw new WriterError(input.Location, "Invalid expression type");
//     this.#input = input;
//     this.#target = target;
//   }

//   #render(input: Expression, target: string) {
//     return PatternMatch(
//       LiteralExpression,
//       OperatorExpression,
//       IfExpression,
//       CountExpression,
//       IterateExpression,
//       MakeExpression,
//       IsExpression,
//       ReferenceExpression,
//       BracketsExpression,
//       InvokationExpression,
//       AccessExpression
//     )(
//       (literal) => {
//         const name = Namer.GetName();
//         if (literal.Type === "string") {
//           const variable = new PrimitiveVariable("struct String");
//           this.add(variable, name);
//           let result = variable.Create(name);

//           result += `${name}.text = "${literal.Value}";`;
//           result += `${name}.length = ${literal.Value.length};`;
//           result += `${target} = ${name}`;

//           return { text: result, variable };
//         }

//         const variable = new PrimitiveVariable(literal.Type);
//         this.add(variable, name);
//         let result = variable.Create(name);

//         switch (literal.Type) {
//           case "bool": {
//             result += `${name} = ${literal.Value};`;
//             break;
//           }
//           case "char": {
//             result += `${name} = '${literal.Value}';`;
//             break;
//           }
//           case "double": {
//             result += `${name} = ${literal.Value.replace("d", "")};`;
//             break;
//           }
//           case "float": {
//             result += `${name} = ${literal.Value.replace("f", "")};`;
//             break;
//           }
//           case "int": {
//             result += `${name} = ${literal.Value.replace("i", "")};`;
//             break;
//           }
//           case "long": {
//             result += `${name} = ${literal.Value.replace("l", "")};`;
//             break;
//           }
//         }

//         result += `${target} = ${name}`;

//         return { text: result, variable };
//       },
//       (operator) => {
//         const left_name = Namer.GetName();
//         const left = this.#render(operator.Left, left_name);
//         const right_name = Namer.GetName();
//         const right = this.#render(operator.Left, left_name);
//         const result_name = Namer.GetName();
//       },
//       (if_) => {},
//       (count) => {},
//       (iterate) => {},
//       (make) => {},
//       (is) => {},
//       (ref) => {},
//       (brackets) => {},
//       (invokation) => {},
//       (access) => {}
//     )(input);
//   }

//   render() {
//     const result = this.#render(this.#input, this.#target);

//     result.variable.Pass();
//     this.close();

//     return result;
//   }
// }
