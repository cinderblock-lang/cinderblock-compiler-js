import { Ast } from "../ast";

export default abstract class File {
  abstract GetAst(input: Ast): Promise<Ast>;
}
