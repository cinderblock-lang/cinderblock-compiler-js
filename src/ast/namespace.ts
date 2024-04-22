import type { Ast } from ".";
import { CodeLocation } from "../location/code-location";
import { TokenGroup } from "../parser/token";
import {
  Component,
  IConcreteType,
  IDiscoverableType,
  IInstance,
} from "./component";
import { Entity } from "./entity/base";
import { FunctionEntity } from "./entity/function";
import { UsingEntity } from "./entity/using";

export class Namespace extends Component {
  readonly #name: string;
  readonly #contents: Array<Entity>;

  constructor(ctx: CodeLocation, name: string, content: Array<Entity>) {
    super(ctx);
    this.#name = name;
    this.#contents = content;
  }

  get Name() {
    return this.#name;
  }

  *#using() {
    for (const entity of this.#contents)
      if (entity instanceof UsingEntity) yield entity.Name;
  }

  Contains(func: FunctionEntity) {
    return !!this.#contents.find((c) => c === func);
  }

  ResolveType(name: string, ast: Ast): Array<IConcreteType> {
    return [
      ...this.#contents.filter(
        (entity) => entity.IsConcreteType() && entity.Name === name
      ),
      ...[...this.#using()].flatMap((namespace_name) => {
        const result = ast.GetNamespace(namespace_name).ResolveType(name, ast);
        return result.filter((r) => r instanceof Entity && r.Exported);
      }),
    ] as any as Array<IConcreteType>;
  }

  DiscoverType(name: string, ast: Ast): Array<IDiscoverableType> {
    return [
      ...this.#contents.filter(
        (entity) => entity.IsDiscoverableType() && entity.Name === name
      ),
      ...[...this.#using()].flatMap((namespace_name) => {
        const result = ast.GetNamespace(namespace_name).ResolveType(name, ast);
        return result.filter((r) => r instanceof Entity && r.Exported);
      }),
    ] as any as Array<IDiscoverableType>;
  }

  Resolve(name: string, ast: Ast): Array<IInstance> {
    return [
      ...this.#contents.filter(
        (entity) => entity instanceof FunctionEntity && entity.Name === name
      ),
      ...[...this.#using()].flatMap((namespace_name) => {
        const result = ast.GetNamespace(namespace_name).Resolve(name, ast);
        return result.filter((r) => r instanceof Entity && r.Exported);
      }),
    ] as any as Array<IInstance>;
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

    token_group = token_group.Next;
    let entities: Array<Entity> = [];
    while (token_group.Text !== "}") {
      let result: Entity;
      [token_group, result] = Entity.Parse(token_group);
      entities = [...entities, result];
    }

    return [token_group, new Namespace(start, name, entities)];
  }
}
