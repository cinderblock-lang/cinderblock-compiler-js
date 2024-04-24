import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { LinkedBlock } from "../block";
import { LinkedStructType } from "../type/struct";
import { LinkedType } from "../type/base";
import { WriterFunction } from "../../writer/entity";
import {
  WriterExpression,
  WriterAllocateExpression,
  WriterReferenceExpression,
  WriterInvokationExpression,
  WriterGlobalReferenceExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import {
  WriterVariableStatement,
  WriterStatement,
  WriterReturnStatement,
} from "../../writer/statement";
import { WriterType } from "../../writer/type";

export class LinkedMakeExpression extends LinkedExpression {
  readonly #struct: LinkedStructType;
  readonly #using: LinkedBlock;

  constructor(ctx: CodeLocation, struct: LinkedStructType, using: LinkedBlock) {
    super(ctx);
    this.#struct = struct;
    this.#using = using;
  }

  get Type(): LinkedType {
    return this.#struct;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterExpression] {
    let type: WriterType;
    [file, type] = this.#struct.Build(file);

    let main_func = new WriterFunction(
      this.CName,
      [],
      type,
      [],
      func
    ).WithStatement(
      new WriterVariableStatement(
        this.CName,
        type,
        new WriterAllocateExpression(type)
      )
    );
    let main_statements: Array<WriterStatement>;
    [file, main_func, main_statements] = this.#using.Build(file, main_func);

    main_statements = [
      ...main_statements,
      new WriterReturnStatement(new WriterReferenceExpression(this)),
    ];
    main_func = main_func.WithStatements(main_statements);
    file = file.WithEntity(main_func);

    return [
      file,
      func,
      new WriterInvokationExpression(
        new WriterGlobalReferenceExpression(main_func),
        []
      ),
    ];
  }
}
