import { Component, ComponentGroup } from "./base";
import { Type } from "./type";
import { Location } from "#compiler/location";

export abstract class Expression extends Component {}

export type LiteralType =
  | "string"
  | "int"
  | "char"
  | "float"
  | "double"
  | "long"
  | "bool";

export class LiteralExpression extends Expression {
  readonly #type: LiteralType;
  readonly #value: string;

  constructor(ctx: Location, type: LiteralType, value: string) {
    super(ctx);
    this.#type = type;
    this.#value = value;
  }

  copy() {
    return new LiteralExpression(this.Location, this.#type, this.#value);
  }

  get Type() {
    return this.#type;
  }

  get Value() {
    return this.#value;
  }

  get type_name() {
    return "literal_expression";
  }
}

export const Operators = [
  "+",
  "-",
  "/",
  "*",
  "==",
  "!=",
  "<",
  ">",
  "<=",
  ">=",
  "++",
  "&&",
  "||",
  "%",
] as const;
export type Operator = (typeof Operators)[number];

export class OperatorExpression extends Expression {
  readonly #left: Component;
  readonly #operator: Operator;
  readonly #right: Component;

  constructor(
    ctx: Location,
    left: Expression,
    operator: Operator,
    right: Expression
  ) {
    super(ctx);
    this.#left = left;
    this.#operator = operator;
    this.#right = right;
  }

  get Left() {
    return this.#left;
  }

  get Operator() {
    return this.#operator;
  }

  get Right() {
    return this.#right;
  }

  get type_name() {
    return "operator_expression";
  }
}

export class IfExpression extends Expression {
  readonly #check: Component;
  readonly #if: ComponentGroup;
  readonly #else: ComponentGroup;

  constructor(
    ctx: Location,
    check: Expression,
    on_if: ComponentGroup,
    on_else: ComponentGroup
  ) {
    super(ctx);
    this.#check = check;
    this.#if = on_if;
    this.#else = on_else;
  }

  get Check() {
    return this.#check;
  }

  get If() {
    return this.#if;
  }

  get Else() {
    return this.#else;
  }

  get type_name() {
    return "if_expression";
  }
}

export class EmptyExpression extends Expression {
  readonly #of: Component;

  constructor(ctx: Location, of: Type) {
    super(ctx);
    this.#of = of;
  }

  get Of() {
    return this.#of;
  }

  get type_name() {
    return "empty_expression";
  }
}

export class IterateExpression extends Expression {
  readonly #over: Component;
  readonly #as: string;
  readonly #using: ComponentGroup;

  constructor(
    ctx: Location,
    over: Expression,
    as: string,
    using: ComponentGroup
  ) {
    super(ctx);
    this.#over = over;
    this.#as = as;
    this.#using = using;
  }

  get Over() {
    return this.#over;
  }

  get As() {
    return this.#as;
  }

  get Body() {
    return this.#using;
  }

  get type_name() {
    return "iterate_expression";
  }
}

export class MakeExpression extends Expression {
  readonly #struct: string;
  readonly #using: ComponentGroup;

  constructor(ctx: Location, struct: string, using: ComponentGroup) {
    super(ctx);
    this.#struct = struct;
    this.#using = using;
  }

  get Struct() {
    return this.#struct;
  }

  get Using() {
    return this.#using;
  }

  get type_name() {
    return "make_expression";
  }
}

export class IsExpression extends Expression {
  readonly #left: Component;
  readonly #right: Component;

  constructor(ctx: Location, left: Expression, right: Type) {
    super(ctx);
    this.#left = left;
    this.#right = right;
  }

  get Left() {
    return this.#left;
  }

  get Right() {
    return this.#right;
  }

  get type_name() {
    return "is_expression";
  }
}

export class ReferenceExpression extends Expression {
  readonly #name: string;

  constructor(ctx: Location, name: string) {
    super(ctx);
    this.#name = name;
  }
  get Name() {
    return this.#name;
  }

  get type_name() {
    return "reference_expression";
  }
}

export class BracketsExpression extends Expression {
  readonly #expression: Component;

  constructor(ctx: Location, expression: Expression) {
    super(ctx);
    this.#expression = expression;
  }

  get Expression() {
    return this.#expression;
  }

  get type_name() {
    return "brackets_expression";
  }
}

export class LambdaExpression extends Expression {
  readonly #parameters: ComponentGroup;
  readonly #body: ComponentGroup;

  constructor(ctx: Location, parameters: ComponentGroup, body: ComponentGroup) {
    super(ctx);
    this.#parameters = parameters;
    this.#body = body;
  }

  get Parameters() {
    return this.#parameters;
  }

  get Body() {
    return this.#body;
  }

  get type_name() {
    return "lambda_expression";
  }
}

export class InvokationExpression extends Expression {
  readonly #subject: Component;
  readonly #parameters: ComponentGroup;

  constructor(ctx: Location, subject: Expression, parameters: ComponentGroup) {
    super(ctx);
    this.#subject = subject;
    this.#parameters = parameters;
  }

  get Subject() {
    return this.#subject;
  }

  get Parameters() {
    return this.#parameters;
  }

  get type_name() {
    return "invokation_expression";
  }
}

export class AccessExpression extends Expression {
  readonly #subject: Component;
  readonly #target: string;

  constructor(ctx: Location, subject: Expression, target: string) {
    super(ctx);
    this.#subject = subject;
    this.#target = target;
  }

  get Subject() {
    return this.#subject;
  }

  get Target() {
    return this.#target;
  }

  get type_name() {
    return "access_expression";
  }
}
