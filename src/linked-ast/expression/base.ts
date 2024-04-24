import { WriterFunction } from "../../writer/entity";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { LinkedComponent } from "../component";
import { LinkedType } from "../type/base";

export abstract class LinkedExpression extends LinkedComponent {
  abstract get Type(): LinkedType;

  abstract Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterExpression];
}
