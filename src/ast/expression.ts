import { AstItem, Component, ComponentGroup, ComponentStore } from "./base";
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

@AstItem
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

  get extra_json() {
    return {
      type_name: this.#type,
      value: this.#value,
    };
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
] as const;
export type Operator = (typeof Operators)[number];

@AstItem
export class OperatorExpression extends Expression {
  readonly #left: number;
  readonly #operator: Operator;
  readonly #right: number;

  constructor(
    ctx: Location,
    left: Expression,
    operator: Operator,
    right: Expression
  ) {
    super(ctx);
    this.#left = left.Index;
    this.#operator = operator;
    this.#right = right.Index;
  }

  copy() {
    return new OperatorExpression(
      this.Location,
      this.Left.copy(),
      this.#operator,
      this.Right.copy()
    );
  }

  get Left() {
    return ComponentStore.Get(this.#left);
  }

  get Operator() {
    return this.#operator;
  }

  get Right() {
    return ComponentStore.Get(this.#right);
  }

  get type_name() {
    return "operator_expression";
  }

  get extra_json() {
    return {
      left: this.#left,
      operator: this.#operator,
      right: this.#right,
    };
  }
}

@AstItem
export class IfExpression extends Expression {
  readonly #check: number;
  readonly #if: ComponentGroup;
  readonly #else: ComponentGroup;

  constructor(
    ctx: Location,
    check: Expression,
    on_if: ComponentGroup,
    on_else: ComponentGroup
  ) {
    super(ctx);
    this.#check = check.Index;
    this.#if = on_if;
    this.#else = on_else;
  }

  copy() {
    return new IfExpression(
      this.Location,
      this.Check.copy(),
      this.#if.copy(),
      this.#else.copy()
    );
  }

  get Check() {
    return ComponentStore.Get(this.#check);
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

  get extra_json() {
    return {
      check: this.#check,
      if: this.#if.json,
      else: this.#else.json,
    };
  }
}

@AstItem
export class EmptyExpression extends Expression {
  readonly #of: number;

  constructor(ctx: Location, of: Type) {
    super(ctx);
    this.#of = of.Index;
  }

  copy() {
    return new EmptyExpression(this.Location, this.Of.copy());
  }

  get Of() {
    return ComponentStore.Get(this.#of);
  }

  get type_name() {
    return "empty_expression";
  }

  get extra_json() {
    return {
      of: this.#of,
    };
  }
}

@AstItem
export class IterateExpression extends Expression {
  readonly #over: number;
  readonly #as: string;
  readonly #using: ComponentGroup;

  constructor(
    ctx: Location,
    over: Expression,
    as: string,
    using: ComponentGroup
  ) {
    super(ctx);
    this.#over = over.Index;
    this.#as = as;
    this.#using = using;
  }

  copy() {
    return new IterateExpression(
      this.Location,
      this.Over.copy(),
      this.#as,
      this.#using.copy()
    );
  }

  get Over() {
    return ComponentStore.Get(this.#over);
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

  get extra_json() {
    return {
      over: this.#over,
      as: this.#as,
      using: this.#using.json,
    };
  }
}

@AstItem
export class MakeExpression extends Expression {
  readonly #struct: string;
  readonly #using: ComponentGroup;
  readonly #struct_entity?: number;

  constructor(
    ctx: Location,
    struct: string,
    using: ComponentGroup,
    struct_entity?: Component
  ) {
    super(ctx);
    this.#struct = struct;
    this.#using = using;
    this.#struct_entity = struct_entity?.Index;
  }

  copy() {
    return new MakeExpression(
      this.Location,
      this.#struct,
      this.Using.copy(),
      this.StructEntity?.copy()
    );
  }

  get Struct() {
    return this.#struct;
  }

  get Using() {
    return this.#using;
  }

  get StructEntity() {
    return this.#struct_entity
      ? ComponentStore.Get(this.#struct_entity)
      : undefined;
  }

  get type_name() {
    return "make_expression";
  }

  get extra_json() {
    return {
      struct: this.#struct,
      using: this.#using.json,
    };
  }
}

@AstItem
export class IsExpression extends Expression {
  readonly #left: number;
  readonly #right: number;

  constructor(ctx: Location, left: Expression, right: Type) {
    super(ctx);
    this.#left = left.Index;
    this.#right = right.Index;
  }

  copy() {
    return new IsExpression(this.Location, this.Left.copy(), this.Right.copy());
  }

  get Left() {
    return ComponentStore.Get(this.#left);
  }

  get Right() {
    return ComponentStore.Get(this.#right);
  }

  get type_name() {
    return "is_expression";
  }

  get extra_json() {
    return {
      left: this.#left,
      right: this.#right,
    };
  }
}

@AstItem
export class ReferenceExpression extends Expression {
  readonly #name: string;
  readonly #references?: number;

  constructor(ctx: Location, name: string, references?: Component) {
    super(ctx);
    this.#name = name;
    this.#references = references?.Index;
  }

  copy() {
    return new ReferenceExpression(this.Location, this.Name, this.References);
  }

  get Name() {
    return this.#name;
  }

  get References() {
    return this.#references ? ComponentStore.Get(this.#references) : undefined;
  }

  get type_name() {
    return "reference_expression";
  }

  get extra_json() {
    return {
      name: this.#name,
      references: this.#references,
    };
  }
}

@AstItem
export class BracketsExpression extends Expression {
  readonly #expression: number;

  constructor(ctx: Location, expression: Expression) {
    super(ctx);
    this.#expression = expression.Index;
  }

  copy() {
    return new BracketsExpression(this.Location, this.Expression.copy());
  }

  get Expression() {
    return ComponentStore.Get(this.#expression);
  }

  get type_name() {
    return "brackets_expression";
  }

  get extra_json() {
    return {
      expression: this.#expression,
    };
  }
}

@AstItem
export class LambdaExpression extends Expression {
  readonly #parameters: ComponentGroup;
  readonly #body: ComponentGroup;

  constructor(ctx: Location, parameters: ComponentGroup, body: ComponentGroup) {
    super(ctx);
    this.#parameters = parameters;
    this.#body = body;
  }

  copy() {
    return new LambdaExpression(
      this.Location,
      this.Parameters.copy(),
      this.#body.copy()
    );
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

  get extra_json() {
    return {
      parameters: this.#parameters.json,
      body: this.#body.json,
    };
  }
}

@AstItem
export class InvokationExpression extends Expression {
  readonly #subject: number;
  readonly #parameters: ComponentGroup;

  constructor(ctx: Location, subject: Expression, parameters: ComponentGroup) {
    super(ctx);
    this.#subject = subject.Index;
    this.#parameters = parameters;
  }

  copy() {
    return new InvokationExpression(
      this.Location,
      this.Subject.copy(),
      this.Parameters.copy()
    );
  }

  get Subject() {
    return ComponentStore.Get(this.#subject);
  }

  get Parameters() {
    return this.#parameters;
  }

  get type_name() {
    return "invokation_expression";
  }

  get extra_json() {
    return {
      subject: this.#subject,
      parameters: this.#parameters.json,
    };
  }
}

@AstItem
export class AccessExpression extends Expression {
  readonly #subject: number;
  readonly #target: string;

  constructor(ctx: Location, subject: Expression, target: string) {
    super(ctx);
    this.#subject = subject.Index;
    this.#target = target;
  }

  copy() {
    return new AccessExpression(
      this.Location,
      this.Subject.copy(),
      this.Target
    );
  }

  get Subject() {
    return ComponentStore.Get(this.#subject);
  }

  get Target() {
    return this.#target;
  }

  get type_name() {
    return "access_expression";
  }

  get extra_json() {
    return {
      subject: this.#subject,
      target: this.#target,
    };
  }
}
