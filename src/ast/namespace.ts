import { CodeLocation } from "../location/code-location";
import { TokenGroup } from "../parser/token";
import { Component } from "./component";
import { ComponentGroup } from "./component-group";
import { Entity } from "./entity/base";

export class Namespace extends Component {
  readonly #name: string;
  readonly #contents: ComponentGroup;

  constructor(ctx: CodeLocation, name: string, content: ComponentGroup) {
    super(ctx);
    this.#name = name;
    this.#contents = content;
  }

  static Parse(token_group: TokenGroup): [TokenGroup, Namespace] {
    const start = token_group.CodeLocation;
    token_group.Expect("namespace");

    token_group = token_group.Next;

    let name = token_group.Text;
    token_group = token_group.Next;

    while (token_group.Text !== "{") {
      name += token_group.Text;
      token_group = token_group.Next;
      name += token_group.Text;
      token_group = token_group.Next;
    }

    let content: ComponentGroup;
    [token_group, content] = ComponentGroup.ParseWhile(
      token_group,
      Entity.Parse,
      ["}"]
    );

    return [token_group, new Namespace(start, name, content)];
  }
}
