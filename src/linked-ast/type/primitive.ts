import { CodeLocation } from "../../location/code-location";
import { LinkedType } from "./base";
import { WriterFile } from "../../writer/file";
import { WriterPrimitiveType, WriterType } from "../../writer/type";
import { PrimitiveName } from "../../parser/types";

export class LinkedPrimitiveType extends LinkedType {
  readonly #name: PrimitiveName;

  constructor(ctx: CodeLocation, name: PrimitiveName) {
    super(ctx);
    this.#name = name;
  }

  get Name() {
    return this.#name;
  }

  get CName(): string {
    switch (this.#name) {
      case "any":
        return "void*";
      case "bool":
        return "_Bool";
      case "char":
        return "char";
      case "float":
        return "float";
      case "ufloat":
        return "unsigned float";
      case "double":
        return "double";
      case "udouble":
        return "unsigned double";
      case "int":
        return "int";
      case "uint":
        return "unsigned int";
      case "short":
        return "short";
      case "ushort":
        return "unsigned short";
      case "long":
        return "long";
      case "ulong":
        return "unsigned long";
      case "string":
        return "char*";
      case "null":
        return "void*";
    }
  }

  Build(file: WriterFile): [WriterFile, WriterType] {
    return [file, new WriterPrimitiveType(this.CName)];
  }
}
