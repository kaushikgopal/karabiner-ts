import { forDevice, karabinerRule } from "./builders";
import {
  DeviceIdentifiers,
  KeyCode,
  ModifierKeyCode,
  type KarabinerRule,
} from "./types";

// Note: The final karabinerConfig construction and JSON writing are in config.ts / main.ts

export function createSampleRules(): KarabinerRule[] {
  return [
    karabinerRule({
      description: "Right Cmd -> Ctrl Enter (alone)",
      mappings: [
        {
          fromKey: ModifierKeyCode.RightCommand,
          toKey: ModifierKeyCode.RightControl,
          toKeyIfAlone: KeyCode.ReturnOrEnter,
          conditions: [forDevice(DeviceIdentifiers.APPLE_KEYBOARDS)],
        },
      ],
    }),
  ];
}
