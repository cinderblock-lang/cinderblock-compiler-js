export class TokeniserContext {
  readonly #namespace: string;
  readonly #unsafe: boolean;

  constructor(namespace: string, unsafe: boolean) {
    this.#namespace = namespace;
    this.#unsafe = unsafe;
  }

  get Namespace() {
    return this.#namespace;
  }

  get Unsafe() {
    return this.#unsafe;
  }

  WithNamespace(name: string) {
    return new TokeniserContext(name, this.#unsafe);
  }

  WithUnsafety(unsafe: boolean) {
    return new TokeniserContext(this.#namespace, unsafe);
  }
}
