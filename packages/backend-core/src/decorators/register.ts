import "reflect-metadata"
import type { RouteDefinition } from "./http-methods"
import { type Schema, validate } from "../validate"
import type { Router } from "express"

const ROUTES_KEY = Symbol.for("nmx:routes")
const PREFIX_KEY = Symbol.for("nmx:prefix")
const VALIDATIONS_KEY = Symbol.for("nmx:validations")

type Constructor = new (...args: unknown[]) => object

export function registerController(
  router: Router,
  ControllerClass: Constructor,
): void {
  const instance = new ControllerClass() as Record<string, unknown>
  const prefix: string =
    (Reflect.getMetadata(PREFIX_KEY, ControllerClass) as string) || ""
  const routes: RouteDefinition[] =
    (Reflect.getMetadata(ROUTES_KEY, ControllerClass) as
      | RouteDefinition[]
      | undefined) ?? []
  const validations: Record<string, Schema> =
    (Reflect.getMetadata(VALIDATIONS_KEY, ControllerClass) as
      | Record<string, Schema>
      | undefined) ?? {}

  for (const route of routes) {
    const fullPath = prefix + route.path
    const method = instance[route.methodName]

    if (typeof method !== "function") {
      throw new Error(`Method ${route.methodName} not found controller`)
    }

    const handler = method.bind(instance) as (...args: unknown[]) => unknown
    const schema = validations[route.methodName]

    if (schema) {
      router[route.method](fullPath, validate(schema), handler)
    } else {
      router[route.method](fullPath, handler)
    }
  }
}
