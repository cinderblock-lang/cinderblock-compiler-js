import { Dto } from "./dtos";
import Child from "child_process";

export default class Gcc {
  readonly #dir: string;
  readonly #target: Dto.Target;

  #exec(command: string, cwd: string) {
    return new Promise<void>(async (res, rej) => {
      Child.exec(command, { cwd }, (err) => (err ? rej(err) : res()));
    });
  }

  constructor(dir: string, target: Dto.Target) {
    this.#dir = dir;
    this.#target = target;
  }

  async Compile(c_file: string, output: string, debug: boolean) {
    switch (this.#target) {
      case "linux":
      case "darwin":
        await this.#exec(
          `gcc ${c_file} ${debug ? "-g" : ""} -o ${output}`,
          this.#dir
        );
        break;
      default:
        console.warn("Operating system not supported.");
    }
  }
}
