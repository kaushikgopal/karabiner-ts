/**
 * kotlinx.serialization-compatible JSON pretty printer.
 *
 * karabiner-kt generates karabiner.json with
 * `Json { prettyPrint = true; encodeDefaults = true; explicitNulls = false }`:
 * 4-space indent, `": "` separators, no trailing newline, undefined fields omitted,
 * and Java `Double.toString` semantics for doubles (integral doubles keep a `.0`
 * suffix). `JSON.stringify` matches all of that except the double formatting,
 * hence the `JsonDouble` marker.
 */

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonDouble
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

/** Marks a number as a Kotlin `Double` so it prints with a decimal point (e.g. `1.0`). */
export class JsonDouble {
  constructor(public readonly value: number) {}
}

/** Shorthand for `new JsonDouble(value)`. */
export function d(value: number): JsonDouble {
  return new JsonDouble(value);
}

function doubleToString(value: number): string {
  if (Number.isInteger(value)) return value.toFixed(1);
  return String(value);
}

const INDENT = "    ";

export function stringifyJson(value: JsonValue): string {
  return print(value, 0);
}

function print(value: JsonValue, level: number): string {
  if (value === null) return "null";
  if (value instanceof JsonDouble) return doubleToString(value.value);
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);

  const indent = INDENT.repeat(level);
  const childIndent = INDENT.repeat(level + 1);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((item) => childIndent + print(item, level + 1));
    return "[\n" + items.join(",\n") + "\n" + indent + "]";
  }

  // undefined fields are dropped, mirroring kotlinx's explicitNulls = false
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return "{}";
  const items = entries.map(
    ([key, val]) =>
      childIndent + JSON.stringify(key) + ": " + print(val, level + 1),
  );
  return "{\n" + items.join(",\n") + "\n" + indent + "}";
}
