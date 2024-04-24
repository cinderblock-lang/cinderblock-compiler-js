import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { LinkedBlock } from "../block";
import { WriterFunction } from "../../writer/entity";
import {
  WriterExpression,
  WriterTernayExpression,
  WriterInvokationExpression,
  WriterGlobalReferenceExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { WriterStatement } from "../../writer/statement";
import { WriterType } from "../../writer/type";

export class LinkedIfExpression extends LinkedExpression {
  readonly #check: LinkedExpression;
  readonly #if: LinkedBlock;
  readonly #else: LinkedBlock;

  constructor(
    ctx: CodeLocation,
    check: LinkedExpression,
    on_if: LinkedBlock,
    on_else: LinkedBlock
  ) {
    super(ctx);
    this.#check = check;
    this.#if = on_if;
    this.#else = on_else;
  }

  get Type() {
    return this.#if.Returns;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterExpression] {
    let type: WriterType;
    [file, type] = this.Type.Build(file);

    let check_expression: WriterExpression;
    [file, func, check_expression] = this.#check.Build(file, func);

    let if_func = new WriterFunction(this.CName + "_true", [], type, [], func);
    let if_statements: Array<WriterStatement>;
    [file, if_func, if_statements] = this.#if.Build(file, if_func);
    if_func = if_func.WithStatements(if_statements);
    file = file.WithEntity(if_func);

    let else_func = new WriterFunction(
      this.CName + "_false",
      [],
      type,
      [],
      func
    );
    let else_statements: Array<WriterStatement>;
    [file, else_func, else_statements] = this.#else.Build(file, else_func);
    else_func = else_func.WithStatements(else_statements);
    file = file.WithEntity(else_func);

    return [
      file,
      func,
      new WriterTernayExpression(
        check_expression,
        new WriterInvokationExpression(
          new WriterGlobalReferenceExpression(if_func),
          []
        ),
        new WriterInvokationExpression(
          new WriterGlobalReferenceExpression(else_func),
          []
        )
      ),
    ];
  }
}
