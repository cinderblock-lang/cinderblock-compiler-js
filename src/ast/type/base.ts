import { IConcreteType, Scope } from "../../linker/closure";
import { ParserError } from "../../parser/error";
import { TokenGroup } from "../../parser/token";
import { WriterFile } from "../../writer/file";
import { WriterType } from "../../writer/type";
import { Component } from "../component";

export interface IBaseable {
  Priority: number;
  Is(token_group: TokenGroup): boolean;
  Extract(token_group: TokenGroup): [TokenGroup, Type];
}

export abstract class Type extends Component {
  abstract Build(file: WriterFile, scope: Scope): [WriterFile, WriterType];
  abstract ResolveConcrete(scope: Scope): IConcreteType;

  static #possible: Array<IBaseable> = [];

  static Register(instance: IBaseable): void {
    this.#possible = [...this.#possible, instance].sort(
      (a, b) => a.Priority - b.Priority
    );
  }

  static Parse(token_group: TokenGroup): [TokenGroup, Type] {
    for (const possible of this.#possible)
      if (possible.Is(token_group)) return possible.Extract(token_group);

    throw new ParserError(
      token_group.CodeLocation,
      "No type candidate for " + token_group.Text
    );
  }
}
