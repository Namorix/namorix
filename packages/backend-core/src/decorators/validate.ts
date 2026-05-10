import "reflect-metadata"
import type { Schema } from "../validate"

const VALIDATIONS_KEY = Symbol.for("nmx:validations")

export function Validate(schema: Schema): MethodDecorator {
  return function (_target: object, propertyKey: string | symbol) {
    const ctor = _target.constructor
    const validations: Record<string, Schema> =
      (Reflect.getMetadata(VALIDATIONS_KEY, ctor) as
        | Record<string, Schema>
        | undefined) ?? {}
    validations[propertyKey as string] = schema
    Reflect.defineMetadata(VALIDATIONS_KEY, validations, ctor)
  }
}
