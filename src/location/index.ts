export class Location {
  readonly #file_name: string;
  readonly #start_line: number;
  readonly #start_column: number;
  readonly #end_line: number;
  readonly #end_column: number;

  constructor(
    file_name: string,
    start_line: number,
    start_column: number,
    end_line: number,
    end_column: number
  ) {
    this.#file_name = file_name;
    this.#start_line = start_line;
    this.#start_column = start_column;
    this.#end_line = end_line;
    this.#end_column = end_column;
  }

  get FileName() {
    return this.#file_name;
  }

  get StartLine() {
    return this.#start_line;
  }

  get StartColumn() {
    return this.#start_column;
  }

  get EndLine() {
    return this.#end_line;
  }

  get EndColumn() {
    return this.#end_column;
  }

  get json() {
    return {
      file_name: this.#file_name,
      start: { line: this.StartLine, column: this.StartColumn },
      last: { line: this.EndLine, column: this.EndColumn },
    };
  }

  toString() {
    return `\nFile: ${this.FileName}\nLine: ${this.StartLine + 1}\nColumn: ${
      this.StartColumn + 1
    }`;
  }
}

const name_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
export class Namer {
  static #index: number = 0;

  static GetName() {
    let name = "";
    let current = this.#index;

    do {
      name += name_chars[current % name_chars.length];
      current = Math.floor(current / name_chars.length);
    } while (current > 0);

    this.#index += 1;
    return name;
  }

  static Reset() {
    this.#index = -1;
  }
}

export { PatternMatch } from "./pattern-match";
