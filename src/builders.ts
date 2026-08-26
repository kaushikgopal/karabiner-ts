import {
  ModifierKeyCode,
  keyCodeName,
  type Condition,
  type DeviceIdentifier,
  type From,
  type FromModifiers,
  type KarabinerRule,
  type KeyCode,
  type Manipulator,
  type MouseKey,
  type OpenApplication,
  type SendUserCommand,
  type SimultaneousOptions,
  type To,
} from "./types";

export type ShellCmd = string;

// region Rule Datastructures
// -----------------------------------------

export interface MappingSpec {
  fromKey?: KeyCode;
  fromModifiers?: FromModifiers;
  toKey?: KeyCode;
  toKeys?: KeyCode[];
  toKeyIfAlone?: KeyCode;
  toKeysIfAlone?: KeyCode[];
  shellCommand?: ShellCmd;
  openApplication?: OpenApplication;
  toModifiers?: ModifierKeyCode[];
  mouseKey?: MouseKey;
  pointingButton?: string;
  sendUserCommand?: SendUserCommand;
  conditions?: Condition[];
}

/** A rule with nested [mappings]; without [layerKey] each mapping is a plain manipulator. */
export interface LayerKeyRuleSpec {
  description: string;
  layerKey?: KeyCode;
  mappings: MappingSpec[];
}

/** Nicer API (without mapping nesting) for single mappings. */
export interface SingleRuleSpec extends MappingSpec {
  description: string;
  layerKey?: KeyCode;
}

// endregion

// region condition helpers
// ------------------------

export function forApp(c: {
  bundleIds?: string[];
  filePaths?: string[];
}): Condition {
  return {
    type: "frontmost_application_if",
    bundleIds: c.bundleIds,
    filePaths: c.filePaths,
  };
}

export function unlessApp(c: {
  bundleIds?: string[];
  filePaths?: string[];
}): Condition {
  return {
    type: "frontmost_application_unless",
    bundleIds: c.bundleIds,
    filePaths: c.filePaths,
  };
}

export function forDevice(identifiers: DeviceIdentifier[]): Condition {
  return { type: "device_if", identifiers };
}

// endregion

// region Karabiner Rule DSL
// --------------------------

export function karabinerRuleSingle(spec: SingleRuleSpec): KarabinerRule {
  const { description, layerKey, ...mapping } = spec;
  return karabinerRule({ description, layerKey, mappings: [mapping] });
}

export function karabinerRule(spec: LayerKeyRuleSpec): KarabinerRule {
  const manipulators: Manipulator[] = [];

  for (const keyMapping of spec.mappings) {
    if (keyMapping.fromKey === undefined)
      throw new Error("fromKey is required");
    const from = fromWith(keyMapping.fromKey, keyMapping.fromModifiers);

    const toModifier =
      keyMapping.toKeys !== undefined && keyMapping.toKeys.length > 0
        ? // one To instruction per key in toKeys
          keyMapping.toKeys.flatMap((singleToKey) =>
            toWith({
              toKey: singleToKey,
              toKeyModifiers: keyMapping.toModifiers,
            }),
          )
        : toWith({
            toKey: keyMapping.toKey,
            toKeyModifiers: keyMapping.toModifiers,
            cmd: keyMapping.shellCommand,
            openApplication: keyMapping.openApplication,
            mouseKey: keyMapping.mouseKey,
            pointingButton: keyMapping.pointingButton,
            sendUserCommand: keyMapping.sendUserCommand,
          });

    if (spec.layerKey === undefined) {
      const toIfAlone =
        keyMapping.toKeysIfAlone !== undefined &&
        keyMapping.toKeysIfAlone.length > 0
          ? keyMapping.toKeysIfAlone.flatMap((k) => toWith({ toKey: k }))
          : keyMapping.toKeyIfAlone !== undefined
            ? toWith({ toKey: keyMapping.toKeyIfAlone })
            : undefined;

      manipulators.push({
        from,
        to: toModifier,
        toIfAlone,
        conditions: keyMapping.conditions?.length
          ? keyMapping.conditions
          : undefined,
      });
    } else {
      const variableName = `${keyCodeName(spec.layerKey).toLowerCase()}-layer`;
      // Layer Keys need an onPress manipulator and an onRelease manipulator
      manipulators.push({
        from,
        to: toModifier,
        conditions: [ifVarSet(variableName), ...(keyMapping.conditions ?? [])],
      });
      manipulators.push({
        from: {
          simultaneous: [spec.layerKey, keyMapping.fromKey],
          simultaneousOptions: buildSimultaneousOptionsVar(variableName),
        },
        to: setVarOn(toModifier, variableName),
        parameters: { simultaneousThresholdMilliseconds: 250 },
        // Karabiner-kt passes the mapping's conditions through verbatim here, so an
        // absent list serializes as "conditions": [] (unlike the null-if-empty above).
        conditions: keyMapping.conditions ?? [],
      });
    }
  }

  return { description: spec.description, manipulators };
}

// endregion

// region builder instructions
// ---------------------------

/** Kotlin's `From.with`: defaults modifiers to `{ optional: ["any"] }`. */
export function fromWith(
  fromKeyCode: KeyCode,
  modifiers?: FromModifiers,
): From {
  return {
    keyCode: fromKeyCode,
    modifiers: modifiers ?? { optional: [ModifierKeyCode.Any] },
  };
}

export interface ToSpec {
  toKey?: KeyCode;
  toKeyModifiers?: ModifierKeyCode[];
  cmd?: ShellCmd;
  openApplication?: OpenApplication;
  mouseKey?: MouseKey;
  pointingButton?: string;
  sendUserCommand?: SendUserCommand;
}

/** Kotlin's `To.with`: exactly one instruction kind may be set. */
export function toWith(spec: ToSpec): To[] {
  const configured = [
    spec.cmd,
    spec.toKey,
    spec.openApplication,
    spec.mouseKey,
    spec.pointingButton,
    spec.sendUserCommand,
  ].filter((it) => it !== undefined);
  if (configured.length > 1) {
    throw new Error("Cannot have multiple to instructions set simultaneously");
  }

  if (spec.cmd !== undefined) return [{ shellCommand: spec.cmd }];
  if (spec.openApplication !== undefined)
    return [{ softwareFunction: { openApplication: spec.openApplication } }];
  if (spec.toKey !== undefined)
    return [{ keyCode: spec.toKey, modifiers: spec.toKeyModifiers }];
  if (spec.mouseKey !== undefined) return [{ mouseKey: spec.mouseKey }];
  if (spec.pointingButton !== undefined)
    return [{ pointingButton: spec.pointingButton }];
  if (spec.sendUserCommand !== undefined)
    return [{ sendUserCommand: spec.sendUserCommand }];

  throw new Error("Could not build To instruction");
}

export function buildSimultaneousOptionsVar(
  variableName: string,
): SimultaneousOptions {
  return {
    keyDownOrder: "strict",
    detectKeyDownUninterruptedly: true,
    keyUpOrder: "strict_inverse",
    keyUpWhen: "any",
    toAfterKeyUp: unsetVar(variableName),
  };
}

export function setVarOn(to: To[], variableName: string): To[] {
  return [{ setVariable: { name: variableName, value: 1 } }, ...to];
}

export function unsetVar(variableName: string): To[] {
  return [{ setVariable: { name: variableName, value: 0 } }];
}

export function ifVarSet(variableName: string): Condition {
  return { type: "variable_if", name: variableName, value: 1 };
}

// endregion
