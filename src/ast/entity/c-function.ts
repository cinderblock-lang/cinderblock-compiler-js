import { IInstance, Scope } from "../../linker/closure";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { WriterFunction, WriterProperty } from "../../writer/entity";
import { WriterFile } from "../../writer/file";
import { WriterRawStatement } from "../../writer/statement";
import { WriterType } from "../../writer/type";
import { Closure } from "../closure";
import { ParameterCollection } from "../parameter-collection";
import { PrimitiveName, PrimitiveType } from "../type/primitive";
import { Entity, EntityOptions } from "./base";
import { FunctionEntity } from "./function";

export class CFunction extends FunctionEntity implements IInstance {
  readonly #includes: Array<string>;
  readonly #parameters: ParameterCollection;
  readonly #content: string;
  readonly #returns: PrimitiveType;

  constructor(
    ctx: CodeLocation,
    options: EntityOptions,
    includes: Array<string>,
    name: string,
    parameters: ParameterCollection,
    content: string,
    returns: PrimitiveType
  ) {
    super(
      ctx,
      { ...options, unsafe: true },
      name,
      parameters,
      new Closure(),
      returns
    );

    this.#includes = includes;
    this.#parameters = parameters;
    this.#content = content;
    this.#returns = returns;
  }

  Declare(file: WriterFile, scope: Scope): [WriterFile, WriterFunction] {
    for (const include of this.#includes) file = file.WithInclude(include);

    let parameters: Array<WriterProperty>;
    [file, parameters] = this.#parameters.Build(file, scope, true);
    let returns: WriterType;
    [file, returns] = this.#returns.Build(file, scope);

    let result = new WriterFunction(this.CName, parameters, returns, []);

    result = result.WithStatement(new WriterRawStatement(this.#content));
    return [file.WithEntity(result), result];
  }
}

Entity.Register({
  Is(token_group) {
    return token_group.Text === "cfn";
  },
  Extract(token_group, options) {
    token_group = token_group.Next;
    token_group.Expect("[");

    let includes: Array<string> = [];
    if (token_group.Next.Text !== "]") {
      while (token_group.Text !== "]") {
        token_group = token_group.Next;
        const candidate = token_group.Text;
        if (candidate.startsWith('"<'))
          includes = [
            ...includes,
            candidate.substring(1, candidate.length - 1),
          ];
        else includes = [...includes, candidate];
        token_group = token_group.Next;
      }
    } else {
      token_group = token_group.Next;
    }

    token_group = token_group.Next;
    const name = token_group.Text;
    token_group = token_group.Next;

    token_group.Expect("(");
    token_group = token_group.Next;

    let parameters: ParameterCollection;
    [token_group, parameters] = ParameterCollection.Parse(token_group);

    token_group.Expect(":");
    token_group = token_group.Next;
    const type_name = token_group.Text;

    const returns = new PrimitiveType(
      token_group.CodeLocation,
      PrimitiveName.parse(type_name)
    );
    token_group = token_group.Next;

    let body: string = token_group.Text;
    if (!body.startsWith("`") || !body.endsWith("`"))
      throw new ParserError(
        token_group.CodeLocation,
        "Expected a back-tick string"
      );

    token_group = token_group.Next;

    return [
      token_group,
      new CFunction(
        token_group.CodeLocation,
        options,
        includes,
        name,
        parameters,
        body.substring(1, body.length - 1),
        returns
      ),
    ];
  },
});
