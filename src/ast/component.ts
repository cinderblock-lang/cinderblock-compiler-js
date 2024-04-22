import { LinkerError } from "../linker/error";
import { CodeLocation } from "../location/code-location";
import { Namer } from "../location/namer";

export const InstanceId = Symbol();
export const ConcreteId = Symbol();
export const DiscoverableTypeId = Symbol();

export interface IInstance extends Component {
  readonly [InstanceId]: true;
}

export interface IConcreteType extends Component {
  get Name(): string;
  readonly [ConcreteId]: true;
}

export interface IDiscoverableType extends Component {
  get Name(): string;
  readonly [DiscoverableTypeId]: true;
}

export abstract class Component {
  readonly #location: CodeLocation;
  readonly #c_name: string;

  constructor(location: CodeLocation) {
    this.#location = location;
    this.#c_name = Namer.GetName();
  }

  IsInstance(): this is IInstance {
    return InstanceId in this;
  }

  AsInstance(): IInstance {
    if (!this.IsInstance())
      throw new LinkerError(this.CodeLocation, "error", "Expected an instanec");

    return this;
  }

  IsConcreteType(): this is IConcreteType {
    return ConcreteId in this;
  }

  AsConcreteType(): IConcreteType {
    if (!this.IsConcreteType())
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Expected an concrete type"
      );

    return this;
  }

  IsDiscoverableType(): this is IDiscoverableType {
    return DiscoverableTypeId in this;
  }

  AsDiscoverableType(): IDiscoverableType {
    if (!this.IsDiscoverableType())
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Expected a discoverable type"
      );

    return this;
  }

  get CodeLocation() {
    return this.#location;
  }

  get CName() {
    return this.#c_name;
  }
}
