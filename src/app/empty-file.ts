import { Ast } from "../ast";
import File from "./file";

export default class EmptyFile extends File {
  async GetAst(input: Ast): Promise<Ast> {
    return input;
  }
}
