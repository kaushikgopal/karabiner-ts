import type { JsonObject } from "./json";

// region Key codes
// ----------------
// Values are the Karabiner serial names; keys mirror the Kotlin class names so
// `keyCodeName()` can reproduce description strings built from `::class.simpleName`.

export const KeyCode = {
  CapsLock: "caps_lock",
  ReturnOrEnter: "return_or_enter",
  Escape: "escape",
  DeleteOrBackspace: "delete_or_backspace",
  DeleteForward: "delete_forward",
  Tab: "tab",
  Spacebar: "spacebar",
  Hyphen: "hyphen",
  EqualSign: "equal_sign",
  OpenBracket: "open_bracket",
  CloseBracket: "close_bracket",
  Backslash: "backslash",
  NonUsPound: "non_us_pound",
  Semicolon: "semicolon",
  Quote: "quote",
  GraveAccentAndTilde: "grave_accent_and_tilde",
  Comma: "comma",
  Period: "period",
  Slash: "slash",
  NonUsBackslash: "non_us_backslash",
  UpArrow: "up_arrow",
  DownArrow: "down_arrow",
  LeftArrow: "left_arrow",
  RightArrow: "right_arrow",
  PageUp: "page_up",
  PageDown: "page_down",
  Home: "home",
  End: "end",
  A: "a",
  B: "b",
  C: "c",
  D: "d",
  E: "e",
  F: "f",
  G: "g",
  H: "h",
  I: "i",
  J: "j",
  K: "k",
  L: "l",
  M: "m",
  N: "n",
  O: "o",
  P: "p",
  Q: "q",
  R: "r",
  S: "s",
  T: "t",
  U: "u",
  V: "v",
  W: "w",
  X: "x",
  Y: "y",
  Z: "z",
  Num1: "1",
  Num2: "2",
  Num3: "3",
  Num4: "4",
  Num5: "5",
  Num6: "6",
  Num7: "7",
  Num8: "8",
  Num9: "9",
  Num0: "0",
  F1: "f1",
  F2: "f2",
  F3: "f3",
  F4: "f4",
  F5: "f5",
  F6: "f6",
  F7: "f7",
  F8: "f8",
  F9: "f9",
  F10: "f10",
  F11: "f11",
  F12: "f12",
  F13: "f13",
  F14: "f14",
  F15: "f15",
  F16: "f16",
  F17: "f17",
  F18: "f18",
  F19: "f19",
  F20: "f20",
  F21: "f21",
  F22: "f22",
  F23: "f23",
  F24: "f24",
  DisplayBrightnessDecrement: "display_brightness_decrement",
  DisplayBrightnessIncrement: "display_brightness_increment",
  MissionControl: "mission_control",
  Launchpad: "launchpad",
  Dashboard: "dashboard",
  IlluminationDecrement: "illumination_decrement",
  IlluminationIncrement: "illumination_increment",
  Rewind: "rewind",
  PlayOrPause: "play_or_pause",
  Fastforward: "fastforward",
  Mute: "mute",
  VolumeDecrement: "volume_decrement",
  VolumeIncrement: "volume_increment",
  Eject: "eject",
  AppleDisplayBrightnessDecrement: "apple_display_brightness_decrement",
  AppleDisplayBrightnessIncrement: "apple_display_brightness_increment",
  AppleTopCaseDisplayBrightnessDecrement:
    "apple_top_case_display_brightness_decrement",
  AppleTopCaseDisplayBrightnessIncrement:
    "apple_top_case_display_brightness_increment",
  KeypadNumLock: "keypad_num_lock",
  KeypadSlash: "keypad_slash",
  KeypadAsterisk: "keypad_asterisk",
  KeypadHyphen: "keypad_hyphen",
  KeypadPlus: "keypad_plus",
  KeypadEnter: "keypad_enter",
  Keypad1: "keypad_1",
  Keypad2: "keypad_2",
  Keypad3: "keypad_3",
  Keypad4: "keypad_4",
  Keypad5: "keypad_5",
  Keypad6: "keypad_6",
  Keypad7: "keypad_7",
  Keypad8: "keypad_8",
  Keypad9: "keypad_9",
  Keypad0: "keypad_0",
  KeypadPeriod: "keypad_period",
  KeypadEqualSign: "keypad_equal_sign",
  KeypadComma: "keypad_comma",
  KeypadEqualSignAs400: "keypad_equal_sign_as400",
  LockingCapsLock: "locking_caps_lock",
  LockingNumLock: "locking_num_lock",
  LockingScrollLock: "locking_scroll_lock",
  AlternateErase: "alternate_erase",
  SysReqOrAttention: "sys_req_or_attention",
  Cancel: "cancel",
  Clear: "clear",
  Prior: "prior",
  Return: "return",
  Separator: "separator",
  Out: "out",
  Oper: "oper",
  ClearOrAgain: "clear_or_again",
  CrSelOrProps: "cr_sel_or_props",
  ExSel: "ex_sel",
  VkConsumerBrightnessDown: "vk_consumer_brightness_down",
  VkConsumerBrightnessUp: "vk_consumer_brightness_up",
  VkMissionControl: "vk_mission_control",
  VkLaunchpad: "vk_launchpad",
  VkDashboard: "vk_dashboard",
  VkConsumerIlluminationDown: "vk_consumer_illumination_down",
  VkConsumerIlluminationUp: "vk_consumer_illumination_up",
  VkConsumerPrevious: "vk_consumer_previous",
  VkConsumerPlay: "vk_consumer_play",
  VkConsumerNext: "vk_consumer_next",
} as const;

export const ModifierKeyCode = {
  Hyper: "hyper",
  LeftControl: "left_control",
  LeftShift: "left_shift",
  LeftOption: "left_option",
  LeftCommand: "left_command",
  RightControl: "right_control",
  RightShift: "right_shift",
  RightOption: "right_option",
  RightCommand: "right_command",
  Fn: "fn",
  Command: "command",
  Control: "control",
  Option: "option",
  Shift: "shift",
  LeftAlt: "left_alt",
  LeftGui: "left_gui",
  RightAlt: "right_alt",
  RightGui: "right_gui",
  Any: "any",
} as const;

export type ModifierKeyCode =
  (typeof ModifierKeyCode)[keyof typeof ModifierKeyCode];
export type KeyCode = (typeof KeyCode)[keyof typeof KeyCode] | ModifierKeyCode;

const NAME_BY_CODE: Record<string, string> = {};
for (const [name, code] of Object.entries(KeyCode)) NAME_BY_CODE[code] = name;
for (const [name, code] of Object.entries(ModifierKeyCode))
  NAME_BY_CODE[code] = name;

/** Equivalent of Kotlin's `keyCode::class.simpleName` (used in generated descriptions). */
export function keyCodeName(code: KeyCode): string {
  const name = NAME_BY_CODE[code];
  if (name === undefined) throw new Error(`Unknown KeyCode: ${code}`);
  return name;
}

// endregion

// region Karabiner model (camelCase; serialize.ts maps to the snake_case JSON)
// ----------------------------------------------------------------------------

export interface KarabinerRule {
  description?: string;
  manipulators?: Manipulator[];
}

export interface Manipulator {
  type?: string; // typically "basic"
  from: From;
  to?: To[];
  toIfAlone?: To[];
  toAfterKeyUp?: To[];
  toIfHeldDown?: To[];
  parameters?: Parameters;
  conditions?: Condition[];
  description?: string;
}

export interface From {
  keyCode?: KeyCode;
  modifiers?: FromModifiers;
  simultaneous?: KeyCode[];
  simultaneousOptions?: SimultaneousOptions;
}

export interface FromModifiers {
  optional?: ModifierKeyCode[];
  mandatory?: ModifierKeyCode[];
}

export interface To {
  keyCode?: KeyCode;
  modifiers?: ModifierKeyCode[];
  consumerKeyCode?: string;
  shellCommand?: string;
  setVariable?: SetVariable;
  mouseKey?: MouseKey;
  pointingButton?: string;
  softwareFunction?: SoftwareFunction;
  sendUserCommand?: SendUserCommand;
  // `hold_down_milliseconds` is sometimes seen with `to` events. Add if needed.
}

export interface Parameters {
  simultaneousThresholdMilliseconds?: number;
  toDelayedActionDelayMilliseconds?: number;
  toIfAloneTimeoutMilliseconds?: number;
  toIfHeldDownThresholdMilliseconds?: number;
}

export interface SimultaneousOptions {
  keyDownOrder?: string; // "insensitive" | "strict" | "strict_inverse"
  detectKeyDownUninterruptedly?: boolean;
  keyUpOrder?: string; // "insensitive" | "strict" | "strict_inverse"
  keyUpWhen?: string; // "any" | "all"
  toAfterKeyUp?: To[];
}

export interface SetVariable {
  name: string;
  value: number | string | boolean;
}

export interface SendUserCommand {
  endpoint?: string;
  payload: JsonObject;
}

export interface MouseKey {
  x?: number;
  y?: number;
  speedMultiplier?: number;
  verticalWheel?: number;
  horizontalWheel?: number;
}

export interface SoftwareFunction {
  openApplication?: OpenApplication;
  iokitPowerManagementSleepSystem?: JsonObject; // an empty object {}
}

export interface OpenApplication {
  bundleIdentifier?: string;
  filePath?: string;
}

export interface InputSourceSpec {
  language?: string;
  inputSourceId?: string;
  inputModeId?: string;
}

export type Condition =
  | {
      type: "frontmost_application_if";
      bundleIds?: string[];
      filePaths?: string[];
    }
  | {
      type: "frontmost_application_unless";
      bundleIds?: string[];
      filePaths?: string[];
    }
  | { type: "device_if"; identifiers?: DeviceIdentifier[] }
  | { type: "device_unless"; identifiers?: DeviceIdentifier[] }
  | { type: "device_exists_if"; identifiers: DeviceIdentifier[] }
  | { type: "device_exists_unless"; identifiers: DeviceIdentifier[] }
  | { type: "keyboard_type_if"; keyboardTypes: string[] }
  | { type: "keyboard_type_unless"; keyboardTypes: string[] }
  | { type: "input_source_if"; inputSources: InputSourceSpec[] }
  | { type: "input_source_unless"; inputSources: InputSourceSpec[] }
  | { type: "variable_if"; name: string; value: number | string | boolean }
  | { type: "variable_unless"; name: string; value: number | string | boolean }
  | { type: "event_changed_if"; value: boolean }
  | { type: "event_changed_unless"; value: boolean };

export interface DeviceConfiguration {
  deviceId?: number;
  identifiers: DeviceIdentifier; // not the same as above
  isApple?: boolean;
  isBuiltInPointingDevice?: boolean;
  manufacturer?: string;
  product?: string;
  transport?: string;
  //
  fnFunctionKeys?: FnFunctionKey[];
  ignore?: boolean;
  ignoreVendorEvents?: boolean;
  manipulateCapsLockLed?: boolean;
  simpleModifications?: SimpleModification[];
  treatAsBuiltInKeyboard?: boolean;
  disableBuiltInKeyboardIfExists?: boolean;
}

// karabiner docs are not great here
// https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/conditions/device/
// confirmed the below to work from experience
export interface DeviceIdentifier {
  description?: string;
  vendorId?: number;
  productId?: number;
  isBuiltInKeyboard?: boolean;
  isKeyboard?: boolean;
  isPointingDevice?: boolean;
  isTouchBar?: boolean;
  /** device_address will change when you replace the hardware */
  deviceAddress?: string;
  /** location_id will change when you change USB port */
  locationId?: number;
}

export const DeviceIdentifiers = {
  APPLE_KEYBOARDS: [
    { vendorId: 1452, isKeyboard: true },
    { vendorId: 76, isKeyboard: true },
    { isBuiltInKeyboard: true },
  ] as DeviceIdentifier[],
  ANNE_PRO_2: { vendorId: 1241, productId: 41618 } as DeviceIdentifier,
  MS_SCULPT: { vendorId: 1118, productId: 1957 } as DeviceIdentifier,
  TADA68: { vendorId: 65261, productId: 4611 } as DeviceIdentifier,
  KINESIS: { vendorId: 10730, isKeyboard: true } as DeviceIdentifier,
  LOGITECH_G915: { vendorId: 1133 } as DeviceIdentifier,
  KEYCHRON: { vendorId: 76 } as DeviceIdentifier,
};

// Root structure for the final JSON (approximated from karabiner.json)
export interface KarabinerConfig {
  global?: GlobalSettings;
  profiles: Profile[];
}

export interface GlobalSettings {
  checkForUpdatesOnStartup?: boolean;
  showInMenuBar?: boolean;
  showProfileNameInMenuBar?: boolean;
  unsafeUi?: boolean;
}

export interface Profile {
  name: string;
  complexModifications: ComplexModifications;
  fnFunctionKeys?: FnFunctionKey[];
  selected?: boolean;
  virtualHidKeyboard?: VirtualHidKeyboard;
  devices?: DeviceConfiguration[];
  parameters?: Parameters;
}

export interface ComplexModifications {
  parameters?: Parameters;
  rules: KarabinerRule[];
}

export interface VirtualHidKeyboard {
  countryCode?: number;
  mouseKeyXyScale?: number;
  indicateStickyModifierKeysState?: boolean;
  // karabiner-kt serializes this as `keyboard_type_v2` (see serialize.ts)
  keyboardType?: string; // e.g. "ansi"
}

export interface FromFnKey {
  keyCode: KeyCode;
}

export interface FnFunctionKey {
  from: FromFnKey;
  to: To[];
}

export interface SimpleModification {
  from: SimpleModificationKey;
  to: SimpleModificationValue[];
}

export interface SimpleModificationKey {
  keyCode: KeyCode;
}

export interface SimpleModificationValue {
  keyCode: KeyCode;
}

// endregion
