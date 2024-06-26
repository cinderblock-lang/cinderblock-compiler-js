import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { LinkedBlock } from "../block";
import { LinkedSubStatement } from "../statement/sub";
import { LinkedType } from "../type/base";
import { LinkerError } from "../../linker/error";
import { WriterFunction, WriterProperty } from "../../writer/entity";
import {
  WriterExpression,
  WriterTernayExpression,
  WriterOperatorExpression,
  WriterAccessExpression,
  WriterReferenceExpression,
  WriterLiteralExpression,
  WriterInvokationExpression,
  WriterGlobalReferenceExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { WriterStatement } from "../../writer/statement";
import { WriterType } from "../../writer/type";
import { LinkedEnumType } from "../type/enum";

export class LinkedMatchExpression extends LinkedExpression {
  readonly #subject: LinkedExpression;
  readonly #parameter_name: string;
  readonly #using: Record<string, LinkedBlock>;

  constructor(
    ctx: CodeLocation,
    subject: LinkedExpression,
    parameter_name: string,
    using: Record<string, LinkedBlock>
  ) {
    super(ctx);
    this.#subject = subject;
    this.#parameter_name = parameter_name;
    this.#using = using;
  }

  get Type(): LinkedType {
    const [key] = Object.keys(this.#using);

    return this.#using[key].Returns;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterExpression] {
    let type: WriterType;
    [file, type] = this.Type.Build(file);

    const subject_type_instance = this.#subject.Type;
    let subject_type: WriterType;
    [file, subject_type] = subject_type_instance.Build(file);
    if (!(subject_type_instance instanceof LinkedEnumType))
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "May only match on an enum"
      );

    let subject: WriterExpression;
    [file, func, subject] = this.#subject.Build(file, func);

    const first = subject_type_instance.GetKey(subject_type_instance.Keys[0]);
    if (!first)
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Could not resolve key"
      );

    let parameter_type: WriterType;
    [file, parameter_type] = first.Type.Build(file);
    let first_func = new WriterFunction(
      first.CName,
      [new WriterProperty(this.#parameter_name, parameter_type)],
      type,
      [],
      func
    );
    let first_statements: Array<WriterStatement>;
    [file, first_func, first_statements] = this.#using[first.Name].Build(
      file,
      first_func
    );
    first_func = first_func.WithStatements(first_statements);
    file = file.WithEntity(first_func);

    return subject_type_instance.Keys.slice(1)
      .map((k) => subject_type_instance.GetKey(k))
      .reduce(
        ([ci, cf, e], n) => {
          if (!n)
            throw new LinkerError(
              this.CodeLocation,
              "error",
              "Could not resolve key"
            );

          let parameter_type: WriterType;
          [file, parameter_type] = n.Type.Build(file);
          let n_func = new WriterFunction(
            n.CName,
            [new WriterProperty(this.#parameter_name, parameter_type)],
            type,
            [],
            func
          );
          let n_statements: Array<WriterStatement>;
          [ci, n_func, n_statements] = this.#using[n.Name].Build(file, n_func);
          n_func = n_func.WithStatements(n_statements);
          ci = ci.WithEntity(n_func);

          return [
            ci,
            cf,
            new WriterTernayExpression(
              new WriterOperatorExpression(
                new WriterAccessExpression(
                  new WriterReferenceExpression(this.#subject),
                  n.CName
                ),
                new WriterLiteralExpression("NULL"),
                "!="
              ),
              new WriterInvokationExpression(
                new WriterGlobalReferenceExpression(n_func),
                [
                  new WriterAccessExpression(
                    new WriterReferenceExpression(this.#subject),
                    n.CName
                  ),
                ]
              ),
              e
            ),
          ];
        },
        [
          file,
          func,
          new WriterInvokationExpression(
            new WriterGlobalReferenceExpression(first_func),
            [
              new WriterAccessExpression(
                new WriterReferenceExpression(this.#subject),
                first.CName
              ),
            ]
          ),
        ] as [WriterFile, WriterFunction, WriterExpression]
      );
  }
}
