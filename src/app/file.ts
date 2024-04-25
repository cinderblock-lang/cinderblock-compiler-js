import { Ast } from "../ast/code-base";

export default abstract class File {
  abstract GetAst(input: Ast): Promise<Ast>;
}
