import type { TokenGroup } from "./token-group";

export class TokenGroupResponse<T> {
  readonly #context: TokenGroup;
  readonly #response: T;

  constructor(context: TokenGroup, response: T) {
    this.#context = context;
    this.#response = response;
  }

  get Context() {
    return this.#context;
  }

  get Response() {
    return this.#response;
  }
}
