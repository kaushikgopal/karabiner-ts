import {
  karabinerRule,
  karabinerRuleSingle,
  forApp,
  unlessApp,
} from "./builders";
import { d, type JsonObject } from "./json";
import {
  KeyCode,
  ModifierKeyCode,
  keyCodeName,
  type KarabinerRule,
  type ModifierKeyCode as ModifierKeyCodeType,
  type SendUserCommand,
} from "./types";

const { UpArrow, DownArrow, LeftArrow, RightArrow } = KeyCode;
const {
  LeftCommand,
  LeftControl,
  LeftOption,
  LeftShift,
  RightCommand,
  RightControl,
  RightOption,
  RightShift,
} = ModifierKeyCode;

interface RelativeInset {
  fraction: number;
  points: number;
}

interface WindowLayout {
  left: RelativeInset;
  top: RelativeInset;
  right: RelativeInset;
  bottom: RelativeInset;
  horizontalAnchor: string;
  verticalAnchor: string;
  minimumWidth?: number;
  minimumHeight?: number;
  maximumWidth?: number;
  maximumHeight?: number;
  restoreOriginal?: boolean;
}

interface AppWindowShortcut {
  key: KeyCode;
  bundleIdentifier: string;
  layouts: WindowLayout[];
  windowScope: string;
  cascadeOffset: number;
}

interface DirectionalWindowShortcut {
  key: KeyCode;
  direction: string;
  layouts: WindowLayout[];
}

interface FrontmostWindowShortcut {
  key: KeyCode;
  cycleID: string;
  layouts: WindowLayout[];
}

interface WindowFilterPolicy {
  standardOnly: boolean;
  rejectMinimized: boolean;
  rejectFullscreen: boolean;
}

interface FocusAfterLayoutPolicy {
  raiseWindow: boolean;
  refocusWindow: boolean;
}

interface CyclePolicy {
  resetOnApplicationChange: boolean;
  resetOnFocusedWindowChange: boolean;
  resetWhenTargetNotFrontmost: boolean;
}

interface TimeoutsPolicy {
  axMessagingTimeoutSeconds: number;
  applicationWaitTimeoutMilliseconds: number;
  focusedWindowWaitTimeoutMilliseconds: number;
  pollIntervalMilliseconds: number;
}

// Shared across all cycle_window_layout commands.
const windowFilterPolicy: WindowFilterPolicy = {
  standardOnly: true,
  rejectMinimized: true,
  rejectFullscreen: true,
};
const focusAfterLayoutPolicy: FocusAfterLayoutPolicy = {
  raiseWindow: true,
  refocusWindow: true,
};
const timeoutsPolicy: TimeoutsPolicy = {
  axMessagingTimeoutSeconds: 1.0,
  applicationWaitTimeoutMilliseconds: 5000,
  focusedWindowWaitTimeoutMilliseconds: 5000,
  pollIntervalMilliseconds: 25,
};

// Only the cycle policy varies by target kind.
const appCyclePolicy: CyclePolicy = {
  resetOnApplicationChange: true,
  resetOnFocusedWindowChange: true,
  resetWhenTargetNotFrontmost: true,
};
const frontmostCyclePolicy: CyclePolicy = {
  resetOnApplicationChange: true,
  resetOnFocusedWindowChange: true,
  resetWhenTargetNotFrontmost: false,
};

function windowFilterPolicyToJson(p: WindowFilterPolicy): JsonObject {
  return {
    standard_only: p.standardOnly,
    reject_minimized: p.rejectMinimized,
    reject_fullscreen: p.rejectFullscreen,
  };
}

function focusAfterLayoutPolicyToJson(p: FocusAfterLayoutPolicy): JsonObject {
  return { raise_window: p.raiseWindow, refocus_window: p.refocusWindow };
}

function cyclePolicyToJson(p: CyclePolicy): JsonObject {
  return {
    reset_on_application_change: p.resetOnApplicationChange,
    reset_on_focused_window_change: p.resetOnFocusedWindowChange,
    reset_when_target_not_frontmost: p.resetWhenTargetNotFrontmost,
  };
}

function timeoutsPolicyToJson(p: TimeoutsPolicy): JsonObject {
  return {
    ax_messaging_timeout_seconds: d(p.axMessagingTimeoutSeconds),
    application_wait_timeout_milliseconds: p.applicationWaitTimeoutMilliseconds,
    focused_window_wait_timeout_milliseconds:
      p.focusedWindowWaitTimeoutMilliseconds,
    poll_interval_milliseconds: p.pollIntervalMilliseconds,
  };
}

function policyGroups(cyclePolicy: CyclePolicy): JsonObject {
  return {
    window_filter: windowFilterPolicyToJson(windowFilterPolicy),
    focus_after_layout: focusAfterLayoutPolicyToJson(focusAfterLayoutPolicy),
    cycle_policy: cyclePolicyToJson(cyclePolicy),
    timeouts: timeoutsPolicyToJson(timeoutsPolicy),
  };
}

function makeWindowLayout(overrides: Partial<WindowLayout> = {}): WindowLayout {
  return {
    left: { fraction: 0, points: 0 },
    top: { fraction: 0, points: 0 },
    right: { fraction: 0, points: 0 },
    bottom: { fraction: 0, points: 0 },
    horizontalAnchor: "center",
    verticalAnchor: "center",
    ...overrides,
  };
}

function centeredLayout(
  horizontalGap: number,
  verticalGap: number,
  horizontalOffset = 0,
  verticalOffset = 0,
): WindowLayout {
  return makeWindowLayout({
    left: { fraction: horizontalGap, points: horizontalOffset },
    top: { fraction: verticalGap, points: verticalOffset },
    right: { fraction: horizontalGap, points: -horizontalOffset },
    bottom: { fraction: verticalGap, points: -verticalOffset },
  });
}

const focusedLayout = centeredLayout(0.25, 0.05);

const wideLayout = centeredLayout(0.05, 0.1);

const terminalFocusedLayout = centeredLayout(0.12, 0.05);

const browserFocusedLayout = centeredLayout(0.28, 0.03);

const onePasswordLayout = makeWindowLayout({
  left: { fraction: 2.0 / 3.0, points: -12 },
  top: { fraction: 0.6, points: -12 },
  right: { fraction: 0, points: 12 },
  bottom: { fraction: 0, points: 12 },
  horizontalAnchor: "right",
  verticalAnchor: "bottom",
});

const spotifyLayout = makeWindowLayout({
  horizontalAnchor: "left",
  verticalAnchor: "top",
  minimumWidth: 800,
  maximumWidth: 800,
});

// Hyper+F cycle: maximized fills the visible frame (not macOS fullscreen);
// "almost" centers 90%×90% (5% margins scale across displays); the last step
// replays the frame captured when the cycle started.
const maximizedLayout = makeWindowLayout({
  horizontalAnchor: "left",
  verticalAnchor: "top",
});

const almostFullScreenLayout = centeredLayout(0.05, 0.05);

const restoreOriginalLayout = makeWindowLayout({ restoreOriginal: true });

function offsetLayouts(
  horizontalOffset: number,
  verticalOffset: number,
  focused: WindowLayout = focusedLayout,
): WindowLayout[] {
  return [
    withOffset(focused, horizontalOffset, 0),
    withOffset(wideLayout, 0, verticalOffset),
  ];
}

function withOffset(
  layout: WindowLayout,
  horizontal = 0,
  vertical = 0,
): WindowLayout {
  return {
    ...layout,
    left: { ...layout.left, points: layout.left.points + horizontal },
    top: { ...layout.top, points: layout.top.points + vertical },
    right: { ...layout.right, points: layout.right.points - horizontal },
    bottom: { ...layout.bottom, points: layout.bottom.points - vertical },
  };
}

function appWindowShortcut(
  key: KeyCode,
  bundleIdentifier: string,
  layouts: WindowLayout[] = [focusedLayout, wideLayout],
  windowScope = "focused",
  cascadeOffset = 0,
): AppWindowShortcut {
  return { key, bundleIdentifier, layouts, windowScope, cascadeOffset };
}

const appWindowShortcuts: AppWindowShortcut[] = [
  appWindowShortcut(KeyCode.Num1, "com.1password.1password", [
    onePasswordLayout,
  ]),
  appWindowShortcut(KeyCode.M, "com.apple.MobileSMS", offsetLayouts(-60, -24)),
  appWindowShortcut(KeyCode.W, "net.whatsapp.WhatsApp", offsetLayouts(60, 24)),
  appWindowShortcut(KeyCode.O, "md.obsidian", offsetLayouts(120, 48)),
  appWindowShortcut(
    KeyCode.S,
    "com.tinyspeck.slackmacgap",
    offsetLayouts(-180, -72),
  ),
  appWindowShortcut(KeyCode.Num0, "com.spotify.client", [spotifyLayout]),
  {
    ...appWindowShortcut(
      KeyCode.B,
      "net.imput.helium",
      offsetLayouts(240, 96, browserFocusedLayout),
    ),
    windowScope: "all",
    cascadeOffset: 48,
  },
  appWindowShortcut(KeyCode.T, "com.mitchellh.ghostty", [
    terminalFocusedLayout,
    wideLayout,
  ]),
];

const directionalWindowShortcuts: DirectionalWindowShortcut[] = [
  {
    key: UpArrow,
    direction: "up",
    layouts: [
      makeWindowLayout({
        bottom: { fraction: 0.5, points: 0 },
        horizontalAnchor: "left",
        verticalAnchor: "top",
      }),
      makeWindowLayout({
        bottom: { fraction: 1.0 / 3.0, points: 0 },
        horizontalAnchor: "left",
        verticalAnchor: "top",
      }),
    ],
  },
  {
    key: DownArrow,
    direction: "down",
    layouts: [
      makeWindowLayout({
        top: { fraction: 0.5, points: 0 },
        horizontalAnchor: "left",
        verticalAnchor: "bottom",
      }),
      makeWindowLayout({
        top: { fraction: 1.0 / 3.0, points: 0 },
        horizontalAnchor: "left",
        verticalAnchor: "bottom",
      }),
    ],
  },
  {
    key: LeftArrow,
    direction: "left",
    layouts: [
      makeWindowLayout({
        right: { fraction: 0.5, points: 0 },
        horizontalAnchor: "left",
        verticalAnchor: "top",
      }),
      makeWindowLayout({
        right: { fraction: 2.0 / 3.0, points: 0 },
        horizontalAnchor: "left",
        verticalAnchor: "top",
      }),
      makeWindowLayout({
        right: { fraction: 1.0 / 3.0, points: 0 },
        horizontalAnchor: "left",
        verticalAnchor: "top",
      }),
    ],
  },
  {
    key: RightArrow,
    direction: "right",
    layouts: [
      makeWindowLayout({
        left: { fraction: 0.5, points: 0 },
        horizontalAnchor: "right",
        verticalAnchor: "top",
      }),
      makeWindowLayout({
        left: { fraction: 2.0 / 3.0, points: 0 },
        horizontalAnchor: "right",
        verticalAnchor: "top",
      }),
      makeWindowLayout({
        left: { fraction: 1.0 / 3.0, points: 0 },
        horizontalAnchor: "right",
        verticalAnchor: "top",
      }),
    ],
  },
];

const fillWindowShortcuts: FrontmostWindowShortcut[] = [
  {
    key: KeyCode.F,
    cycleID: "fill",
    layouts: [maximizedLayout, almostFullScreenLayout, restoreOriginalLayout],
  },
];

function appWindowShortcutToUserCommand(s: AppWindowShortcut): SendUserCommand {
  return {
    payload: {
      version: 3,
      command: "cycle_window_layout",
      cycle_id: `app:${s.bundleIdentifier}`,
      target: {
        type: "application",
        bundle_identifier: s.bundleIdentifier,
        open_if_needed: true,
        activate: true,
        activate_all_windows: true,
      },
      screen_strategy: "existing",
      screen_frame: "visible",
      window_scope: s.windowScope,
      cascade_offset: { x: s.cascadeOffset, y: s.cascadeOffset },
      ...policyGroups(appCyclePolicy),
      layouts: s.layouts.map(windowLayoutToJson),
    },
  };
}

function frontmostWindowUserCommand(
  cycleID: string,
  layouts: WindowLayout[],
): SendUserCommand {
  return {
    payload: {
      version: 3,
      command: "cycle_window_layout",
      cycle_id: cycleID,
      target: { type: "frontmost" },
      screen_strategy: "existing",
      screen_frame: "visible",
      window_scope: "focused",
      cascade_offset: { x: 0, y: 0 },
      ...policyGroups(frontmostCyclePolicy),
      layouts: layouts.map(windowLayoutToJson),
    },
  };
}

function directionalWindowShortcutToUserCommand(
  s: DirectionalWindowShortcut,
): SendUserCommand {
  return frontmostWindowUserCommand(`direction:${s.direction}`, s.layouts);
}

// Raycast-style "move window to next display": the server keeps the window's
// size and relative position, so no layout or cycle state is needed here.
function moveWindowToDisplayUserCommand(): SendUserCommand {
  return {
    payload: {
      version: 3,
      command: "move_window_to_display",
      screen_frame: "visible",
      window_filter: windowFilterPolicyToJson(windowFilterPolicy),
      focus_after_layout: focusAfterLayoutPolicyToJson(focusAfterLayoutPolicy),
      timeouts: timeoutsPolicyToJson(timeoutsPolicy),
    },
  };
}

function windowLayoutToJson(layout: WindowLayout): JsonObject {
  const o: JsonObject = {
    insets: {
      left: relativeInsetToJson(layout.left),
      top: relativeInsetToJson(layout.top),
      right: relativeInsetToJson(layout.right),
      bottom: relativeInsetToJson(layout.bottom),
    },
    resize_anchor: {
      horizontal: layout.horizontalAnchor,
      vertical: layout.verticalAnchor,
    },
  };
  if (layout.minimumWidth !== undefined) o.minimum_width = layout.minimumWidth;
  if (layout.minimumHeight !== undefined)
    o.minimum_height = layout.minimumHeight;
  if (layout.maximumWidth !== undefined) o.maximum_width = layout.maximumWidth;
  if (layout.maximumHeight !== undefined)
    o.maximum_height = layout.maximumHeight;
  if (layout.restoreOriginal === true) o.restore_original = true;
  return o;
}

function relativeInsetToJson(inset: RelativeInset): JsonObject {
  return { fraction: d(inset.fraction), points: inset.points };
}

// Note: The final karabinerConfig construction and JSON writing are in config.ts / main.ts

export function createMainRules(): KarabinerRule[] {
  // hyper = right-side cmd+ctrl+opt+shift (keeps left-side modifiers free for combining).
  // expressed as 4 explicit modifiers (not the virtual "hyper" key code) so that
  // to_if_alone (escape) fires reliably on tap — the virtual key code leaks the
  // original caps_lock event and toggles the LED instead.
  const newCapsLockModifiers: ModifierKeyCodeType[] = [
    RightControl,
    RightCommand,
    RightOption,
    RightShift,
  ];

  return [
    // right command -> right control (global, straight remap)
    karabinerRuleSingle({
      description: "Right Command -> Right Control (global)",
      fromKey: RightCommand,
      toKey: RightControl,
    }),

    // Kinesis keyboards
    // karabinerRule({
    //   description: "Kinesis keyboard specific mappings",
    //   mappings: [
    //     {
    //       fromKey: KeyCode.EqualSign,
    //       toKey: KeyCode.GraveAccentAndTilde,
    //       conditions: [forDevice([DeviceIdentifiers.KINESIS])],
    //     },
    //   ],
    // }),

    karabinerRule({
      description: "Hyper app launchers with cycling window layouts",
      mappings: appWindowShortcuts.map((shortcut) => ({
        fromKey: shortcut.key,
        fromModifiers: { mandatory: newCapsLockModifiers },
        sendUserCommand: appWindowShortcutToUserCommand(shortcut),
      })),
    }),
    karabinerRule({
      description: "Hyper arrows cycle frontmost window layouts",
      mappings: directionalWindowShortcuts.map((shortcut) => ({
        fromKey: shortcut.key,
        fromModifiers: { mandatory: newCapsLockModifiers },
        sendUserCommand: directionalWindowShortcutToUserCommand(shortcut),
      })),
    }),
    karabinerRule({
      description:
        "Hyper F cycles frontmost window maximize / centered 90% / restore",
      mappings: fillWindowShortcuts.map((shortcut) => ({
        fromKey: shortcut.key,
        fromModifiers: { mandatory: newCapsLockModifiers },
        sendUserCommand: frontmostWindowUserCommand(
          shortcut.cycleID,
          shortcut.layouts,
        ),
      })),
    }),

    karabinerRule({
      description: "Hyper D moves frontmost window to next display",
      mappings: [
        {
          fromKey: KeyCode.D,
          fromModifiers: { mandatory: newCapsLockModifiers },
          sendUserCommand: moveWindowToDisplayUserCommand(),
        },
      ],
    }),

    // hyper + vim movements (jklp) ~= quick arrow keys (tries to accommodate modifiers)
    ...createVimNavigationRules(newCapsLockModifiers),

    // capslock (hyper) + shift + arrow = ctrl + shift + arrow
    // (hyper swallows shift into a 5-modifier event, so we remap explicitly)
    karabinerRule({
      description:
        "Caps Lock + Left Shift + Arrow = Ctrl + Left Shift + Arrows",
      mappings: [
        {
          fromKey: UpArrow,
          fromModifiers: { mandatory: [...newCapsLockModifiers, LeftShift] },
          toKey: UpArrow,
          toModifiers: [LeftShift, LeftControl],
        },
        {
          fromKey: DownArrow,
          fromModifiers: { mandatory: [...newCapsLockModifiers, LeftShift] },
          toKey: DownArrow,
          toModifiers: [LeftShift, LeftControl],
        },
        {
          fromKey: LeftArrow,
          fromModifiers: { mandatory: [...newCapsLockModifiers, LeftShift] },
          toKey: LeftArrow,
          toModifiers: [LeftShift, LeftControl],
        },
        {
          fromKey: RightArrow,
          fromModifiers: { mandatory: [...newCapsLockModifiers, LeftShift] },
          toKey: RightArrow,
          toModifiers: [LeftShift, LeftControl],
        },
      ],
    }),

    // capslock (hyper) key is different and can't be added as simple layer key rules
    karabinerRuleSingle({
      description: "Caps Lock alone -> Escape, held -> Hyper",
      fromKey: KeyCode.CapsLock,
      toKey: newCapsLockModifiers[0],
      toModifiers: newCapsLockModifiers.slice(1),
      toKeyIfAlone: KeyCode.Escape,
      conditions: [unlessApp({ bundleIds: ["^md\\.obsidian"] })],
    }),
    karabinerRuleSingle({
      description: "Caps Lock alone -> Escape * 2, held -> Hyper (Obsidian)",
      fromKey: KeyCode.CapsLock,
      toKey: newCapsLockModifiers[0],
      toModifiers: newCapsLockModifiers.slice(1),
      toKeysIfAlone: [KeyCode.Escape, KeyCode.Escape],
      conditions: [forApp({ bundleIds: ["^md\\.obsidian"] })],
    }),

    // delete sequences
    karabinerRule({
      description: "(J layer) delete sequences",
      layerKey: KeyCode.J,

      // ---------------------
      // DELETE sequences
      mappings: [
        // delete word
        {
          fromKey: KeyCode.D,
          toKey: KeyCode.W,
          toModifiers: [LeftControl],
          conditions: [
            forApp({
              bundleIds: [
                "^com\\.apple\\.Terminal$",
                "^com\\.googlecode\\.iterm2$",
                "^com\\.mitchellh\\.ghostty$",
                "^com\\.cmuxterm\\.app$",
              ],
            }),
          ],
        },
        {
          fromKey: KeyCode.D,
          toKey: KeyCode.DeleteOrBackspace,
          toModifiers: [LeftOption],
          conditions: [
            unlessApp({
              bundleIds: [
                "^com\\.apple\\.Terminal$",
                "^com\\.googlecode\\.iterm2$",
                "^com\\.mitchellh\\.ghostty$",
                "^com\\.cmuxterm\\.app$",
              ],
            }),
          ],
        },

        // delete character
        {
          fromKey: KeyCode.F,
          toKey: KeyCode.DeleteOrBackspace,
        },
      ],
    }),

    // bracket sequences
    karabinerRule({
      description: "(F layer) bracket sequences",
      layerKey: KeyCode.F,

      mappings: [
        // U I
        // ( )
        { fromKey: KeyCode.U, toKey: KeyCode.Num9, toModifiers: [LeftShift] },
        { fromKey: KeyCode.I, toKey: KeyCode.Num0, toModifiers: [LeftShift] },

        // J K
        // [ ]
        { fromKey: KeyCode.J, toKey: KeyCode.OpenBracket },
        { fromKey: KeyCode.K, toKey: KeyCode.CloseBracket },

        // M ,
        // { }
        {
          fromKey: KeyCode.M,
          toKey: KeyCode.OpenBracket,
          toModifiers: [LeftShift],
        },
        {
          fromKey: KeyCode.Comma,
          toKey: KeyCode.CloseBracket,
          toModifiers: [LeftShift],
        },

        // . /
        // < >
        {
          fromKey: KeyCode.Period,
          toKey: KeyCode.Comma,
          toModifiers: [LeftShift],
        },
        {
          fromKey: KeyCode.Slash,
          toKey: KeyCode.Period,
          toModifiers: [LeftShift],
        },
      ],
    }),

    // ring finger sequences: (s) -> #, (a) -> *
    karabinerRuleSingle({
      description: "J + S -> #",
      layerKey: KeyCode.J,
      fromKey: KeyCode.S,
      toKey: KeyCode.Num3,
      toModifiers: [LeftShift],
    }),
    karabinerRuleSingle({
      description: "J + A -> *",
      layerKey: KeyCode.J,
      fromKey: KeyCode.A,
      toKey: KeyCode.Num8,
      toModifiers: [LeftShift],
    }),

    // J layer - special characters (vim sequences)
    // E - $
    // R - %
    // T - ^
    karabinerRule({
      description: "(J layer) special character sequences (vim sequences)",
      layerKey: KeyCode.J,
      mappings: [
        { fromKey: KeyCode.E, toKey: KeyCode.Num4, toModifiers: [LeftShift] },
        { fromKey: KeyCode.R, toKey: KeyCode.Num5, toModifiers: [LeftShift] },
        { fromKey: KeyCode.T, toKey: KeyCode.Num6, toModifiers: [LeftShift] },
      ],
    }),
    karabinerRule({
      description: "(J layer) misc special characters",
      layerKey: KeyCode.J,
      mappings: [
        // Q
        // @
        { fromKey: KeyCode.Q, toKey: KeyCode.Num2, toModifiers: [LeftShift] },

        // 1
        // !
        {
          fromKey: KeyCode.Num1,
          toKey: KeyCode.Num1,
          toModifiers: [LeftShift],
        },
        // 2
        // @
        {
          fromKey: KeyCode.Num2,
          toKey: KeyCode.Num2,
          toModifiers: [RightShift],
        },

        // J + C - cmd shift [
        // J + V - cmd shift ]
        // cmd shift [ + ] - for quick tab switching
        {
          fromKey: KeyCode.C,
          toKey: KeyCode.OpenBracket,
          toModifiers: [LeftCommand, LeftShift],
        },
        {
          fromKey: KeyCode.V,
          toKey: KeyCode.CloseBracket,
          toModifiers: [LeftCommand, LeftShift],
        },
      ],
    }),

    // f layer - special character sequences
    karabinerRule({
      description: "(F layer) special character sequences",
      layerKey: KeyCode.F,
      mappings: [
        // F + Y = &
        { fromKey: KeyCode.Y, toKey: KeyCode.Num7, toModifiers: [LeftShift] },

        //  O     L   ;   '
        //  =     +   -   \
        { fromKey: KeyCode.O, toKey: KeyCode.EqualSign },

        {
          fromKey: KeyCode.L,
          toKey: KeyCode.EqualSign,
          toModifiers: [LeftShift],
        },
        { fromKey: KeyCode.Semicolon, toKey: KeyCode.Hyphen },
        { fromKey: KeyCode.Quote, toKey: KeyCode.Backslash },
      ],
    }),
  ];
}

/** Creates manipulators for vim-style navigation with various modifier combinations */
export function createVimNavigationRules(
  newCapsLockModifiers: ModifierKeyCodeType[],
): KarabinerRule[] {
  const rules: KarabinerRule[] = [];

  // important for position in list between the two
  const arrowKeys: KeyCode[] = [LeftArrow, DownArrow, UpArrow, RightArrow];
  const vimNavKeys: KeyCode[] = [KeyCode.H, KeyCode.J, KeyCode.K, KeyCode.L];

  // map capsLock + (below list of modifier combo) + vim keys
  //     capsLock + (below list of modifier combo) + arrow keys
  const modifierCombos: (ModifierKeyCodeType[] | undefined)[] = [
    undefined,
    [LeftCommand],
    [LeftOption],
    [LeftShift],
    [LeftCommand, LeftOption],
    [LeftCommand, LeftShift],
  ];

  for (const modifiers of modifierCombos) {
    vimNavKeys.forEach((vimKey, index) => {
      const fromModifierList = [...newCapsLockModifiers, ...(modifiers ?? [])];
      const fromModifierListDesc = fromModifierList
        .map(keyCodeName)
        .join(" + ");
      const desc = `CapsLock + ${fromModifierListDesc} + ${keyCodeName(vimKey)} -> ${keyCodeName(arrowKeys[index])}`;

      rules.push(
        karabinerRuleSingle({
          description: desc,
          fromKey: vimKey,
          fromModifiers: { mandatory: fromModifierList },
          toKey: arrowKeys[index],
          toModifiers: modifiers,
        }),
      );
    });
  }

  return rules;
}

/**
 * temporarily disabled as i don't use it as much and would rather use it for more prevalent
 * commands
 */
export function capsLockMouseRules(
  newCapsLockModifiers: ModifierKeyCodeType[],
): KarabinerRule[] {
  const rules: KarabinerRule[] = [];

  // Mouse control with arrow keys
  const mouseMoves: [KeyCode, { x?: number; y?: number }][] = [
    [DownArrow, { y: 1536 }],
    [UpArrow, { y: -1536 }],
    [LeftArrow, { x: -1536 }],
    [RightArrow, { x: 1536 }],
  ];
  for (const [fromKey, mouseKeyValue] of mouseMoves) {
    rules.push(
      karabinerRuleSingle({
        description: `CapsLock + ${keyCodeName(fromKey)} -> Move Mouse Cursor`,
        fromKey,
        fromModifiers: { mandatory: newCapsLockModifiers },
        mouseKey: mouseKeyValue,
      }),
    );
  }

  rules.push(
    karabinerRule({
      description:
        "CapsLock (+ Command) +  Enter -> Mouse (Secondary) Click Buttons",
      mappings: [
        {
          fromKey: KeyCode.ReturnOrEnter,
          fromModifiers: { mandatory: newCapsLockModifiers },
          pointingButton: "button1",
        },
        {
          fromKey: KeyCode.ReturnOrEnter,
          fromModifiers: { mandatory: [LeftCommand, ...newCapsLockModifiers] },
          pointingButton: "button2",
        },
      ],
    }),
  );

  return rules;
}
