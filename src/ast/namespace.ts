import { CodeLocation } from "../location/code-location";
import { TokenGroup } from "../parser/token";
import { Component } from "./component";
import { Entity } from "./entity/base";

export class Namespace extends Component {
  readonly #name: string;
  readonly #contents: Array<Entity>;

  constructor(ctx: CodeLocation, name: string, content: Array<Entity>) {
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

    let entities: Array<Entity> = [];
    while (token_group.Text !== "}") {
      let result: Entity;
      [token_group, result] = Entity.Parse(token_group);
      entities = [...entities, result];
    }

    return [token_group, new Namespace(start, name, entities)];
  }
}
