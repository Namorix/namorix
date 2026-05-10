import "reflect-metadata"

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete"

export interface RouteDefinition {
  path: string
  method: HttpMethod
  methodName: string
}

const ROUTES_KEY = Symbol.for("nmx:routes")

function createMethodDecorator(method: HttpMethod) {
  return function (path: string): MethodDecorator {
    return function (target, propertyKey) {
      const ctor = target.constructor
      const routes: RouteDefinition[] =
        (Reflect.getMetadata(ROUTES_KEY, ctor) as
          | RouteDefinition[]
          | undefined) ?? []
      routes.push({ path, method, methodName: propertyKey as string })
      Reflect.defineMetadata(ROUTES_KEY, routes, ctor)
    }
  }
}

export const Get = createMethodDecorator("get")
export const Post = createMethodDecorator("post")
export const Put = createMethodDecorator("put")
export const Patch = createMethodDecorator("patch")
export const Delete = createMethodDecorator("delete")
