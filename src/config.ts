import { stringifyJson } from "./json";
import { karabinerConfigToJson } from "./serialize";
import { createMainRules } from "./rules";
import {
  KeyCode,
  ModifierKeyCode,
  type DeviceConfiguration,
  type FnFunctionKey,
  type KarabinerConfig,
  type Profile,
} from "./types";

export function buildKarabinerConfig(): KarabinerConfig {
  const mainRules = createMainRules();

  const defaultProfile: Profile = {
    name: "Default",
    selected: true,
    // fnFunctionKeys: functionKeys(),
    complexModifications: { rules: mainRules },
    virtualHidKeyboard: { countryCode: 0, keyboardType: "ansi" },
    devices: deviceSpecificConfigs(),
    parameters: {
      simultaneousThresholdMilliseconds: 250,
      toDelayedActionDelayMilliseconds: 10,
      toIfAloneTimeoutMilliseconds: 250,
      toIfHeldDownThresholdMilliseconds: 500,
    },
  };

  return {
    global: { showInMenuBar: false },
    profiles: [defaultProfile],
  };
}

export function buildKarabinerJson(): string {
  return stringifyJson(karabinerConfigToJson(buildKarabinerConfig()));
}

function deviceSpecificConfigs(): DeviceConfiguration[] {
  return [
    {
      identifiers: {
        isKeyboard: true,
        isPointingDevice: true,
        productId: 45919,
        vendorId: 1133,
      },
      ignore: false,
      manipulateCapsLockLed: false,
    },
    {
      identifiers: { isPointingDevice: true },
      simpleModifications: [
        {
          from: { keyCode: ModifierKeyCode.RightCommand },
          to: [{ keyCode: ModifierKeyCode.RightControl }],
        },
      ],
    },
    {
      identifiers: { isKeyboard: true, productId: 50475, vendorId: 1133 },
      ignore: true,
    },
    // Kinesis mWave keyboard - enabled by default
    {
      identifiers: {
        isKeyboard: true,
        isPointingDevice: true,
        productId: 4097,
        vendorId: 10730,
      },
      ignore: false,
      ignoreVendorEvents: true,
    },
  ];
}

// Create fn function keys
function functionKeys(): FnFunctionKey[] {
  return [
    {
      from: { keyCode: KeyCode.F3 },
      to: [{ keyCode: KeyCode.MissionControl }],
    },
    { from: { keyCode: KeyCode.F4 }, to: [{ keyCode: KeyCode.Launchpad }] },
    {
      from: { keyCode: KeyCode.F5 },
      to: [{ keyCode: KeyCode.IlluminationDecrement }],
    },
    {
      from: { keyCode: KeyCode.F6 },
      to: [{ keyCode: KeyCode.IlluminationIncrement }],
    },
    { from: { keyCode: KeyCode.F9 }, to: [{ consumerKeyCode: "fastforward" }] },
  ];
}
