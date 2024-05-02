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
import { LinkedAllocateStatement } from "../statement/allocate";

export class LinkedMakeExpression extends LinkedExpression {
  readonly #allocation: LinkedAllocateStatement;
  readonly #using: LinkedBlock;

  constructor(
    ctx: CodeLocation,
    allocation: LinkedAllocateStatement,
    using: LinkedBlock
  ) {
    super(ctx);
    this.#allocation = allocation;
    this.#using = using;
  }

  get Type(): LinkedType {
    return this.#allocation.Type;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterExpression] {
    let creation: WriterStatement;
    [file, func, creation] = this.#allocation.Build(file, func);

    let type: WriterType;
    [file, type] = this.#allocation.Type.Build(file);

    let main_func = new WriterFunction(
      this.CName,
      [],
      type,
      [],
      func
    ).WithStatement(creation);
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
