import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { LinkedBlock } from "../block";
import { LinkedEnumType } from "../type/enum";
import { LinkerError } from "../../linker/error";
import { WriterFunction } from "../../writer/entity";
import {
  WriterExpression,
  WriterAllocateExpression,
  WriterInvokationExpression,
  WriterGlobalReferenceExpression,
  WriterReferenceExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import {
  WriterStatement,
  WriterVariableStatement,
  WriterAssignStatement,
} from "../../writer/statement";
import { WriterType } from "../../writer/type";

export class LinkedPickExpression extends LinkedExpression {
  readonly #enum: LinkedEnumType;
  readonly #key: string;
  readonly #using: LinkedBlock;

  constructor(
    ctx: CodeLocation,
    target: LinkedEnumType,
    key: string,
    using: LinkedBlock
  ) {
    super(ctx);
    this.#enum = target;
    this.#key = key;
    this.#using = using;
  }

  get Type() {
    return this.#enum;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterExpression] {
    let type: WriterType;
    [file, type] = this.#enum.Build(file);

    let main_func = new WriterFunction(this.CName, [], type, [], func);
    let main_statements: Array<WriterStatement>;
    [file, main_func, main_statements] = this.#using.Build(file, main_func);
    main_func = main_func.WithStatements(main_statements);
    file = file.WithEntity(main_func);

    const property = this.#enum.GetKey(this.#key);
    if (!property)
      throw new LinkerError(this.CodeLocation, "error", "Could not find key");

    return [
      file,
      func
        .WithStatement(
          new WriterVariableStatement(
            this.CName,
            type,
            new WriterAllocateExpression(type)
          )
        )
        .WithStatement(
          new WriterAssignStatement(
            this.CName,
            property.CName,
            new WriterInvokationExpression(
              new WriterGlobalReferenceExpression(main_func),
              []
            )
          )
        ),
      new WriterReferenceExpression(this),
    ];
  }
}
