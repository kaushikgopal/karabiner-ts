import { d, type JsonObject } from "./json";
import type {
  ComplexModifications,
  Condition,
  DeviceConfiguration,
  DeviceIdentifier,
  FnFunctionKey,
  From,
  FromFnKey,
  FromModifiers,
  GlobalSettings,
  InputSourceSpec,
  KarabinerConfig,
  KarabinerRule,
  Manipulator,
  MouseKey,
  OpenApplication,
  Parameters,
  Profile,
  SendUserCommand,
  SetVariable,
  SimpleModification,
  SimpleModificationKey,
  SimpleModificationValue,
  SimultaneousOptions,
  SoftwareFunction,
  To,
  VirtualHidKeyboard,
} from "./types";

/**
 * Model -> JSON conversion. Replaces kotlinx.serialization; each function emits
 * keys in the exact declaration order of the corresponding Kotlin data class in
 * karabiner-kt's Types.kt, so the output is byte-identical to `make kt`.
 * Undefined fields are omitted (explicitNulls = false); defaults are applied
 * where Kotlin has them (encodeDefaults = true).
 */

export function karabinerConfigToJson(config: KarabinerConfig): JsonObject {
  const o: JsonObject = {};
  if (config.global !== undefined)
    o.global = globalSettingsToJson(config.global);
  o.profiles = config.profiles.map(profileToJson);
  return o;
}

export function globalSettingsToJson(g: GlobalSettings): JsonObject {
  const o: JsonObject = {};
  if (g.checkForUpdatesOnStartup !== undefined)
    o.check_for_updates_on_startup = g.checkForUpdatesOnStartup;
  if (g.showInMenuBar !== undefined) o.show_in_menu_bar = g.showInMenuBar;
  if (g.showProfileNameInMenuBar !== undefined)
    o.show_profile_name_in_menu_bar = g.showProfileNameInMenuBar;
  if (g.unsafeUi !== undefined) o.unsafe_ui = g.unsafeUi;
  return o;
}

export function profileToJson(p: Profile): JsonObject {
  const o: JsonObject = { name: p.name };
  o.complex_modifications = complexModificationsToJson(p.complexModifications);
  if (p.fnFunctionKeys !== undefined)
    o.fn_function_keys = p.fnFunctionKeys.map(fnFunctionKeyToJson);
  if (p.selected !== undefined) o.selected = p.selected;
  // Kotlin default: VirtualHidKeyboard(), always encoded
  o.virtual_hid_keyboard = virtualHidKeyboardToJson(p.virtualHidKeyboard ?? {});
  if (p.devices !== undefined)
    o.devices = p.devices.map(deviceConfigurationToJson);
  if (p.parameters !== undefined) o.parameters = parametersToJson(p.parameters);
  return o;
}

export function complexModificationsToJson(
  c: ComplexModifications,
): JsonObject {
  const o: JsonObject = {};
  if (c.parameters !== undefined) o.parameters = parametersToJson(c.parameters);
  o.rules = c.rules.map(karabinerRuleToJson);
  return o;
}

export function virtualHidKeyboardToJson(v: VirtualHidKeyboard): JsonObject {
  const o: JsonObject = { country_code: v.countryCode ?? 0 };
  if (v.mouseKeyXyScale !== undefined)
    o.mouse_key_xy_scale = d(v.mouseKeyXyScale);
  if (v.indicateStickyModifierKeysState !== undefined)
    o.indicate_sticky_modifier_keys_state = v.indicateStickyModifierKeysState;
  // karabiner-kt has @SerialName("keyboard_type_v2") on this field
  o.keyboard_type_v2 = v.keyboardType ?? "ansi";
  return o;
}

export function karabinerRuleToJson(rule: KarabinerRule): JsonObject {
  const o: JsonObject = {};
  if (rule.description !== undefined) o.description = rule.description;
  if (rule.manipulators !== undefined)
    o.manipulators = rule.manipulators.map(manipulatorToJson);
  return o;
}

export function manipulatorToJson(m: Manipulator): JsonObject {
  const o: JsonObject = { type: m.type ?? "basic" };
  o.from = fromToJson(m.from);
  if (m.to !== undefined) o.to = m.to.map(toToJson);
  if (m.toIfAlone !== undefined) o.to_if_alone = m.toIfAlone.map(toToJson);
  if (m.toAfterKeyUp !== undefined)
    o.to_after_key_up = m.toAfterKeyUp.map(toToJson);
  if (m.toIfHeldDown !== undefined)
    o.to_if_held_down = m.toIfHeldDown.map(toToJson);
  if (m.parameters !== undefined) o.parameters = parametersToJson(m.parameters);
  // an empty list is meaningful here: Kotlin serializes it as "conditions": []
  if (m.conditions !== undefined)
    o.conditions = m.conditions.map(conditionToJson);
  if (m.description !== undefined) o.description = m.description;
  return o;
}

export function fromToJson(from: From): JsonObject {
  const o: JsonObject = {};
  if (from.keyCode !== undefined) o.key_code = from.keyCode;
  if (from.modifiers !== undefined)
    o.modifiers = fromModifiersToJson(from.modifiers);
  if (from.simultaneous !== undefined)
    o.simultaneous = from.simultaneous.map(
      (keyCode) => ({ key_code: keyCode }) as JsonObject,
    );
  if (from.simultaneousOptions !== undefined)
    o.simultaneous_options = simultaneousOptionsToJson(
      from.simultaneousOptions,
    );
  return o;
}

export function fromModifiersToJson(m: FromModifiers): JsonObject {
  const o: JsonObject = {};
  if (m.optional !== undefined) o.optional = m.optional;
  if (m.mandatory !== undefined) o.mandatory = m.mandatory;
  return o;
}

export function toToJson(to: To): JsonObject {
  const o: JsonObject = {};
  if (to.keyCode !== undefined) o.key_code = to.keyCode;
  if (to.modifiers !== undefined) o.modifiers = to.modifiers;
  if (to.consumerKeyCode !== undefined)
    o.consumer_key_code = to.consumerKeyCode;
  if (to.shellCommand !== undefined) o.shell_command = to.shellCommand;
  if (to.setVariable !== undefined)
    o.set_variable = setVariableToJson(to.setVariable);
  if (to.mouseKey !== undefined) o.mouse_key = mouseKeyToJson(to.mouseKey);
  if (to.pointingButton !== undefined) o.pointing_button = to.pointingButton;
  if (to.softwareFunction !== undefined)
    o.software_function = softwareFunctionToJson(to.softwareFunction);
  if (to.sendUserCommand !== undefined)
    o.send_user_command = sendUserCommandToJson(to.sendUserCommand);
  return o;
}

export function parametersToJson(p: Parameters): JsonObject {
  const o: JsonObject = {};
  if (p.simultaneousThresholdMilliseconds !== undefined)
    o["basic.simultaneous_threshold_milliseconds"] =
      p.simultaneousThresholdMilliseconds;
  if (p.toDelayedActionDelayMilliseconds !== undefined)
    o["basic.to_delayed_action_delay_milliseconds"] =
      p.toDelayedActionDelayMilliseconds;
  if (p.toIfAloneTimeoutMilliseconds !== undefined)
    o["basic.to_if_alone_timeout_milliseconds"] =
      p.toIfAloneTimeoutMilliseconds;
  if (p.toIfHeldDownThresholdMilliseconds !== undefined)
    o["basic.to_if_held_down_threshold_milliseconds"] =
      p.toIfHeldDownThresholdMilliseconds;
  return o;
}

export function simultaneousOptionsToJson(s: SimultaneousOptions): JsonObject {
  const o: JsonObject = {};
  if (s.keyDownOrder !== undefined) o.key_down_order = s.keyDownOrder;
  if (s.detectKeyDownUninterruptedly !== undefined)
    o.detect_key_down_uninterruptedly = s.detectKeyDownUninterruptedly;
  if (s.keyUpOrder !== undefined) o.key_up_order = s.keyUpOrder;
  if (s.keyUpWhen !== undefined) o.key_up_when = s.keyUpWhen;
  if (s.toAfterKeyUp !== undefined)
    o.to_after_key_up = s.toAfterKeyUp.map(toToJson);
  return o;
}

export function setVariableToJson(s: SetVariable): JsonObject {
  return { name: s.name, value: s.value };
}

export function sendUserCommandToJson(s: SendUserCommand): JsonObject {
  const o: JsonObject = {};
  if (s.endpoint !== undefined) o.endpoint = s.endpoint;
  o.payload = s.payload;
  return o;
}

export function mouseKeyToJson(m: MouseKey): JsonObject {
  const o: JsonObject = {};
  if (m.x !== undefined) o.x = m.x;
  if (m.y !== undefined) o.y = m.y;
  if (m.speedMultiplier !== undefined)
    o.speed_multiplier = d(m.speedMultiplier);
  if (m.verticalWheel !== undefined) o.vertical_wheel = m.verticalWheel;
  if (m.horizontalWheel !== undefined) o.horizontal_wheel = m.horizontalWheel;
  return o;
}

export function softwareFunctionToJson(s: SoftwareFunction): JsonObject {
  const o: JsonObject = {};
  if (s.openApplication !== undefined)
    o.open_application = openApplicationToJson(s.openApplication);
  if (s.iokitPowerManagementSleepSystem !== undefined)
    o.iokit_power_management_sleep_system = s.iokitPowerManagementSleepSystem;
  return o;
}

export function openApplicationToJson(o: OpenApplication): JsonObject {
  const out: JsonObject = {};
  if (o.bundleIdentifier !== undefined)
    out.bundle_identifier = o.bundleIdentifier;
  if (o.filePath !== undefined) out.file_path = o.filePath;
  return out;
}

export function conditionToJson(c: Condition): JsonObject {
  const o: JsonObject = { type: c.type };
  switch (c.type) {
    case "frontmost_application_if":
    case "frontmost_application_unless":
      if (c.bundleIds !== undefined) o.bundle_identifiers = c.bundleIds;
      if (c.filePaths !== undefined) o.file_paths = c.filePaths;
      break;
    case "device_if":
    case "device_unless":
      if (c.identifiers !== undefined)
        o.identifiers = c.identifiers.map(deviceIdentifierToJson);
      break;
    case "device_exists_if":
    case "device_exists_unless":
      o.identifiers = c.identifiers.map(deviceIdentifierToJson);
      break;
    case "keyboard_type_if":
    case "keyboard_type_unless":
      o.keyboard_types = c.keyboardTypes;
      break;
    case "input_source_if":
    case "input_source_unless":
      o.input_sources = c.inputSources.map(inputSourceSpecToJson);
      break;
    case "variable_if":
    case "variable_unless":
      o.name = c.name;
      o.value = c.value;
      break;
    case "event_changed_if":
    case "event_changed_unless":
      o.value = c.value;
      break;
  }
  return o;
}

export function inputSourceSpecToJson(s: InputSourceSpec): JsonObject {
  const o: JsonObject = {};
  if (s.language !== undefined) o.language = s.language;
  if (s.inputSourceId !== undefined) o.input_source_id = s.inputSourceId;
  if (s.inputModeId !== undefined) o.input_mode_id = s.inputModeId;
  return o;
}

export function deviceConfigurationToJson(d: DeviceConfiguration): JsonObject {
  const o: JsonObject = {};
  if (d.deviceId !== undefined) o.device_id = d.deviceId;
  o.identifiers = deviceIdentifierToJson(d.identifiers);
  if (d.isApple !== undefined) o.is_apple = d.isApple;
  if (d.isBuiltInPointingDevice !== undefined)
    o.is_built_in_pointing_device = d.isBuiltInPointingDevice;
  if (d.manufacturer !== undefined) o.manufacturer = d.manufacturer;
  if (d.product !== undefined) o.product = d.product;
  if (d.transport !== undefined) o.transport = d.transport;
  if (d.fnFunctionKeys !== undefined)
    o.fn_function_keys = d.fnFunctionKeys.map(fnFunctionKeyToJson);
  if (d.ignore !== undefined) o.ignore = d.ignore;
  if (d.ignoreVendorEvents !== undefined)
    o.ignore_vendor_events = d.ignoreVendorEvents;
  if (d.manipulateCapsLockLed !== undefined)
    o.manipulate_caps_lock_led = d.manipulateCapsLockLed;
  if (d.simpleModifications !== undefined)
    o.simple_modifications = d.simpleModifications.map(
      simpleModificationToJson,
    );
  if (d.treatAsBuiltInKeyboard !== undefined)
    o.treat_as_built_in_keyboard = d.treatAsBuiltInKeyboard;
  if (d.disableBuiltInKeyboardIfExists !== undefined)
    o.disable_built_in_keyboard_if_exists = d.disableBuiltInKeyboardIfExists;
  return o;
}

export function deviceIdentifierToJson(d: DeviceIdentifier): JsonObject {
  const o: JsonObject = {};
  if (d.description !== undefined) o.description = d.description;
  if (d.vendorId !== undefined) o.vendor_id = d.vendorId;
  if (d.productId !== undefined) o.product_id = d.productId;
  if (d.isBuiltInKeyboard !== undefined)
    o.is_built_in_keyboard = d.isBuiltInKeyboard;
  if (d.isKeyboard !== undefined) o.is_keyboard = d.isKeyboard;
  if (d.isPointingDevice !== undefined)
    o.is_pointing_device = d.isPointingDevice;
  if (d.isTouchBar !== undefined) o.is_touch_bar = d.isTouchBar;
  if (d.deviceAddress !== undefined) o.device_address = d.deviceAddress;
  if (d.locationId !== undefined) o.location_id = d.locationId;
  return o;
}

export function fnFunctionKeyToJson(f: FnFunctionKey): JsonObject {
  return { from: fromFnKeyToJson(f.from), to: f.to.map(toToJson) };
}

export function fromFnKeyToJson(f: FromFnKey): JsonObject {
  return { key_code: f.keyCode };
}

export function simpleModificationToJson(s: SimpleModification): JsonObject {
  return {
    from: simpleModificationKeyToJson(s.from),
    to: s.to.map(simpleModificationValueToJson),
  };
}

export function simpleModificationKeyToJson(
  s: SimpleModificationKey,
): JsonObject {
  return { key_code: s.keyCode };
}

export function simpleModificationValueToJson(
  s: SimpleModificationValue,
): JsonObject {
  return { key_code: s.keyCode };
}
