import "reflect-metadata"

const PREFIX_KEY = Symbol.for("nmx:prefix")

export function Controller(prefix = ""): ClassDecorator {
  return function (target: object): void {
    Reflect.defineMetadata(PREFIX_KEY, prefix, target)
  }
}
