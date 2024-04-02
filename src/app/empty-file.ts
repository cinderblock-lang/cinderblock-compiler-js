import { ComponentGroup } from "../ast/component-group";
import File from "./file";

export default class EmptyFile extends File {
  async GetAst(): Promise<ComponentGroup> {
    return new ComponentGroup();
  }
}
