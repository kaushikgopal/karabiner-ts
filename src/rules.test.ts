import { describe, expect, test } from "bun:test";
import { JsonDouble, type JsonObject, type JsonValue } from "./json";
import { createMainRules } from "./rules";
import {
  KeyCode,
  ModifierKeyCode,
  type KarabinerRule,
  type Manipulator,
  type SendUserCommand,
} from "./types";

const { RightCommand, RightControl, RightOption, RightShift } = ModifierKeyCode;

// payload accessors (JsonDouble marks values the Kotlin model types as Double)
function obj(v: JsonValue | undefined): JsonObject {
  expect(v).toBeDefined();
  return v as JsonObject;
}
function arr(v: JsonValue | undefined): JsonValue[] {
  expect(v).toBeDefined();
  return v as JsonValue[];
}
function str(v: JsonValue | undefined): string {
  return v as string;
}
function num(v: JsonValue | undefined): number {
  return v instanceof JsonDouble ? v.value : (v as number);
}

function manipulatorsFor(description: string): Manipulator[] {
  const rule: KarabinerRule | undefined = createMainRules().find(
    (r) => r.description === description,
  );
  expect(rule).toBeDefined();
  expect(rule!.manipulators).toBeDefined();
  return rule!.manipulators!;
}

function sendUserCommandsOf(manipulators: Manipulator[]): SendUserCommand[] {
  return manipulators.map((m) => {
    const command = m.to?.[0]?.sendUserCommand;
    expect(command).toBeDefined();
    return command!;
  });
}

function assertSharedPolicyGroups(command: SendUserCommand) {
  const payload = command.payload;

  const windowFilter = obj(payload.window_filter);
  expect(windowFilter.standard_only).toBe(true);
  expect(windowFilter.reject_minimized).toBe(true);
  expect(windowFilter.reject_fullscreen).toBe(true);

  const focusAfterLayout = obj(payload.focus_after_layout);
  expect(focusAfterLayout.raise_window).toBe(true);
  expect(focusAfterLayout.refocus_window).toBe(true);

  const timeouts = obj(payload.timeouts);
  expect(num(timeouts.ax_messaging_timeout_seconds)).toBe(1.0);
  expect(timeouts.application_wait_timeout_milliseconds).toBe(5000);
  expect(timeouts.focused_window_wait_timeout_milliseconds).toBe(5000);
  expect(timeouts.poll_interval_milliseconds).toBe(25);
}

function assertCyclePolicy(
  command: SendUserCommand,
  resetWhenTargetNotFrontmost: boolean,
) {
  const cyclePolicy = obj(command.payload.cycle_policy);
  expect(cyclePolicy.reset_on_application_change).toBe(true);
  expect(cyclePolicy.reset_on_focused_window_change).toBe(true);
  expect(cyclePolicy.reset_when_target_not_frontmost).toBe(
    resetWhenTargetNotFrontmost,
  );
}

function assertHyperModifiers(manipulators: Manipulator[]) {
  const hyperModifiers = [RightControl, RightCommand, RightOption, RightShift];
  expect(manipulators.map((m) => m.from.modifiers?.mandatory)).toEqual(
    manipulators.map(() => hyperModifiers),
  );
}

describe("window layout rules", () => {
  test("hyper app launchers send cycling layout commands", () => {
    const launchers = manipulatorsFor(
      "Hyper app launchers with cycling window layouts",
    );
    const commands = sendUserCommandsOf(launchers);

    expect(launchers.map((m) => m.from.keyCode)).toEqual([
      KeyCode.Num1,
      KeyCode.M,
      KeyCode.W,
      KeyCode.O,
      KeyCode.S,
      KeyCode.Num0,
      KeyCode.B,
      KeyCode.T,
    ]);
    assertHyperModifiers(launchers);
    expect(commands.map((c) => c.payload.version)).toEqual(Array(8).fill(3));
    expect(commands.map((c) => c.payload.command)).toEqual(
      Array(8).fill("cycle_window_layout"),
    );
    expect(
      commands.map((c) => obj(c.payload.target).bundle_identifier),
    ).toEqual([
      "com.1password.1password",
      "com.apple.MobileSMS",
      "net.whatsapp.WhatsApp",
      "md.obsidian",
      "com.tinyspeck.slackmacgap",
      "com.spotify.client",
      "net.imput.helium",
      "com.mitchellh.ghostty",
    ]);
    expect(commands.map((c) => arr(c.payload.layouts).length)).toEqual([
      1, 2, 2, 2, 2, 1, 2, 2,
    ]);
    expect(commands.map((c) => c.payload.screen_strategy)).toEqual(
      Array(8).fill("existing"),
    );
    const appTarget = obj(commands[0].payload.target);
    expect(appTarget.open_if_needed).toBe(true);
    expect(appTarget.activate).toBe(true);
    expect(appTarget.activate_all_windows).toBe(true);

    commands.forEach(assertSharedPolicyGroups);
    commands.forEach((c) => assertCyclePolicy(c, true));

    const browserCommand = commands[6];
    expect(browserCommand.payload.window_scope).toBe("all");
    expect(num(obj(browserCommand.payload.cascade_offset).x)).toBe(48);
    const browserFocusedLayout = obj(arr(browserCommand.payload.layouts)[0]);
    expect(num(obj(obj(browserFocusedLayout.insets).left).fraction)).toBe(0.28);
    expect(num(obj(obj(browserFocusedLayout.insets).top).fraction)).toBe(0.03);
    expect(num(obj(obj(browserFocusedLayout.insets).left).points)).toBe(240);
    expect(
      num(
        obj(obj(obj(arr(browserCommand.payload.layouts)[1]).insets).top).points,
      ),
    ).toBe(96);
    expect(
      commands
        .filter((_, index) => index !== 6)
        .map((c) => c.payload.window_scope),
    ).toEqual(Array(7).fill("focused"));

    const onePasswordLayout = obj(arr(commands[0].payload.layouts)[0]);
    expect(arr(commands[0].payload.layouts).length).toBe(1);
    expect(num(obj(obj(onePasswordLayout.insets).left).fraction)).toBe(
      2.0 / 3.0,
    );
    expect(str(obj(onePasswordLayout.resize_anchor).horizontal)).toBe("right");
    expect(str(obj(onePasswordLayout.resize_anchor).vertical)).toBe("bottom");

    const spotifyLayouts = arr(commands[5].payload.layouts);
    expect(spotifyLayouts.length).toBe(1);
    const spotifyLayout = obj(spotifyLayouts[0]);
    expect(spotifyLayout.minimum_width).toBe(800);
    expect(spotifyLayout.maximum_width).toBe(800);
    expect(str(obj(spotifyLayout.resize_anchor).horizontal)).toBe("left");

    expect(
      commands
        .slice(1, 5)
        .map((c) =>
          num(obj(obj(obj(arr(c.payload.layouts)[0]).insets).left).points),
        ),
    ).toEqual([-60, 60, 120, -180]);
    expect(
      commands
        .slice(1, 5)
        .map((c) =>
          num(obj(obj(obj(arr(c.payload.layouts)[1]).insets).top).points),
        ),
    ).toEqual([-24, 24, 48, -72]);

    const terminalLayouts = arr(commands[7].payload.layouts);
    expect(num(obj(obj(obj(terminalLayouts[0]).insets).left).fraction)).toBe(
      0.12,
    );
  });

  test("hyper arrows send directional cycle commands", () => {
    const launchers = manipulatorsFor(
      "Hyper arrows cycle frontmost window layouts",
    );
    const commands = sendUserCommandsOf(launchers);

    expect(launchers.map((m) => m.from.keyCode)).toEqual([
      KeyCode.UpArrow,
      KeyCode.DownArrow,
      KeyCode.LeftArrow,
      KeyCode.RightArrow,
    ]);
    assertHyperModifiers(launchers);
    expect(commands.map((c) => c.payload.version)).toEqual(Array(4).fill(3));
    expect(commands.map((c) => c.payload.command)).toEqual(
      Array(4).fill("cycle_window_layout"),
    );
    expect(commands.map((c) => c.payload.cycle_id)).toEqual([
      "direction:up",
      "direction:down",
      "direction:left",
      "direction:right",
    ]);
    expect(commands.map((c) => arr(c.payload.layouts).length)).toEqual([
      2, 2, 3, 3,
    ]);
    expect(
      num(
        obj(obj(obj(arr(commands[0].payload.layouts)[0]).insets).bottom)
          .fraction,
      ),
    ).toBe(0.5);
    expect(
      num(
        obj(obj(obj(arr(commands[3].payload.layouts)[0]).insets).left).fraction,
      ),
    ).toBe(0.5);

    commands.forEach(assertSharedPolicyGroups);
    commands.forEach((c) => assertCyclePolicy(c, false));
  });
});
