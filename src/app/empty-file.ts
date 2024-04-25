import { Ast } from "../ast/code-base";
import File from "./file";

export default class EmptyFile extends File {
  async GetAst(input: Ast): Promise<Ast> {
    return input;
  }
}
