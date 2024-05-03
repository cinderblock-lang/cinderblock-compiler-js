import { LinkedPropertyCollection } from "../linked-ast/property-collection";
import { TokenGroup } from "../parser/token";
import { Context } from "./context";
import { Property } from "./property";

export class PropertyCollection {
  readonly #components: Array<Property>;

  constructor(...components: Array<Property>) {
    this.#components = components;
  }

  Resolve(name: string) {
    return this.#components.find((c) => c.Name === name);
  }

  get Keys() {
    return this.#components.map((c) => c.Name);
  }

  Linked(context: Context) {
    return context.Build(
      {
        params: (context) =>
          context.Map(this.#components, (ctx, n) => n.Linked(ctx)),
      },
      ({ params }) => new LinkedPropertyCollection(...params)
    );
  }

  static Parse(token_group: TokenGroup): [TokenGroup, PropertyCollection] {
    const result: Array<Property> = [];

    while (token_group.Text !== "}") {
      const [t, r] = Property.Parse(token_group);
      token_group = t.Next;
      result.push(r);
    }

    return [token_group.Next, new PropertyCollection(...result)];
  }
}
