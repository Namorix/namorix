type CxInput = string | undefined | null | false | Record<string, boolean>

export function cx(...classes: CxInput[]): string {
  return classes
    .flatMap((cls) => {
      if (!cls) return []
      if (typeof cls === "string") return [cls]
      return Object.entries(cls)
        .filter(([, value]) => value)
        .map(([key]) => key)
    })
    .join(" ")
}
