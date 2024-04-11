import { IClosure } from "../linker/closure";
import { TokenGroup } from "../parser/token";
import { Property } from "./property";

export class PropertyCollection implements IClosure {
  readonly #components: Array<Property>;

  constructor(...components: Array<Property>) {
    this.#components = components;
  }

  Resolve(name: string): Property | undefined {
    return this.#components.find((c) => c.Name === name);
  }

  static Parse(token_group: TokenGroup): [TokenGroup, PropertyCollection] {
    const result: Array<Property> = [];

    while (token_group.Text !== "}") {
      const [t, r] = Property.Parse(token_group);
      token_group = t;
      result.push(r);
    }

    return [token_group.Next, new PropertyCollection(...result)];
  }
}
