# Recurring Tasks

Logseq supports recurring tasks with three scheduling semantics, modeled
on org-mode's three repeater cookies. Picking the right one lets you
say exactly how the next occurrence should be computed when you mark
a task DONE.

This document is the reference for contributors working on the
scheduler and for users who want the full behavior specification. The
short, user-facing version lives in
[logseq/docs `Tasks.md`](https://github.com/logseq/docs/blob/master/pages/Tasks.md).

## The three semantics

### `.+` — Advance from completion

> *Repeats from the last time you marked the block done.*

The next occurrence is one interval after the moment you marked the
task DONE, regardless of what the original scheduled date was.

**Best for:** habits and cadence-driven recurrences — things where the
clock restarts the moment you finish.

**Example:** A weekly task scheduled for 2026-04-01, completed on
2026-04-05, will next appear on 2026-04-12. If you'd forgotten and
completed it on 2026-04-20, it would next appear on 2026-04-27. The
interval is anchored to your completion, not to the calendar.

### `++` — Advance from scheduled, skip to future

> *Keeps it on the same day of the week.*

The next occurrence starts at *original + one interval* and keeps
advancing in whole intervals until the result is strictly in the
future. Because the arithmetic is in UTC and advances by whole weeks
(or months, or years), weekly recurrences naturally land on the same
day-of-week as the original.

**Best for:** calendar-anchored recurrences where completion is a side
event and the anchor matters — "every Monday standup," "monthly review
on the first of the month."

**Example:** A weekly standup scheduled for Monday, 2026-04-06:
- Completed Wednesday, 2026-04-08 → next occurrence Monday, 2026-04-13.
- Completed Friday, 2026-04-17 → next occurrence Monday, 2026-04-20.

**This is the default** when a recurring task has no explicit cookie.

### `+` — Advance from scheduled, stacking

> *Repeats in X y/m/w/d/h from when you originally scheduled it.*

The next occurrence is exactly *original + one interval*. If
completion was much later than the original date, the next occurrence
may land in the past — which causes the task to appear overdue
immediately. Org-mode calls this "stacking."

**Best for:** obligations tied to an exact calendar date that should
not shift when you're late — monthly rent, annual renewals, fixed
billing cycles.

**Example:** Rent due 2026-04-01, paid 2026-04-05 → next reminder
2026-05-01. Paid 2026-04-25 → next reminder still 2026-05-01.

## Choosing the right cookie

A decision table for picking the right semantic:

| Intent | Cookie |
|---|---|
| "Every 7 days from when I last did it" | `.+` |
| "Every Monday" | `++` |
| "The 1st of every month" | `+` |

## Default and backward compatibility

Recurring tasks without an explicit `repeat-type` default to `++`.
This preserves the behavior that existed before the three cookies were
honored independently; no existing task changes on upgrade. Users who
want `.+` or `+` semantics can pick them via the repeat-setting
popover on the task.

## Implementation reference

### Scheduler

The scheduler lives in `src/main/frontend/worker/commands.cljs`. It
dispatches on `repeat-type` via `repeat-next-timestamp`:

- `advance-from-completion` implements `.+`
- `advance-from-scheduled` implements `+`
- `advance-until-future` implements `++`

The dispatch falls back to `++` for `nil` or unknown values, so the
scheduler is safe against missing or future-added cookie types.
Frequencies of zero or less short-circuit to `nil` before dispatch to
avoid infinite loops.

### Property

`:logseq.property.repeat/repeat-type` is a closed-values property
declared in `deps/db/src/logseq/db/frontend/property.cljs`. Its closed
values are:

- `:logseq.property.repeat/repeat-type.dotted-plus` — `.+`
- `:logseq.property.repeat/repeat-type.plus` — `+`
- `:logseq.property.repeat/repeat-type.double-plus` — `++` (default)

### UI

The repeat-setting popover in
`src/main/frontend/components/property/value.cljs` exposes a "Next date"
selector bound to the `repeat-type` property. It appears whenever the
task's repeat checkbox is enabled.

### Tests

Scheduler tests live in
`src/test/frontend/worker/commands_test.cljs`. Each of the three
semantics has a dedicated `deftest`; the preexisting
`get-next-time-test` exercises the default (`++`) path. Time is pinned
via `with-redefs [t/now ...]` for determinism.

## Related reading

- End-user docs: [logseq/docs `Tasks.md`](https://github.com/logseq/docs/blob/master/pages/Tasks.md)
- Org-mode spec: [Repeated tasks](https://orgmode.org/manual/Repeated-tasks.html)
- Tracking issues: [#7731](https://github.com/logseq/logseq/issues/7731), [#11260](https://github.com/logseq/logseq/issues/11260), [#6715](https://github.com/logseq/logseq/issues/6715), [#8531](https://github.com/logseq/logseq/issues/8531)
