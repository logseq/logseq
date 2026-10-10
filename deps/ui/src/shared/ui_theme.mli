(** Shared visual-design tokens — the single owner of Logseq's theme
    values across web and native (GPUI) renderers.

    A [snapshot] is the fully resolved theme for one mode.
    [colors]/[components]/[typography]/[levels] are the typed semantic
    values that shared views and adapters consume; [vars] and [kit] are
    the derived delivery tables:

    - [vars] is the CSS custom-property table the web adapter applies to
      [document.documentElement.style] verbatim. Canonical [--lx-*]
      names carry the token; every emitted [--ls-*] name is a legacy
      alias for un-migrated CSS (only accent-invariant names are emitted
      as literals — see {!accent_bound}; accent-bound tokens ship as
      canonical [--lx-*] names holding a [var(--ls-<name>)] reference so the
      stylesheet's per-accent bindings keep resolving). [--lui-*]
      entries feed LUI's semantic color names.
    - [kit] maps gpui-kit theme slot names ([ThemeConfig.colors] keys
      such as ["muted.background"] or ["list.active.background"]) to
      literal values. The native host installs them as the mode's theme
      — never as unparsed CSS-var strings.

    Dark-mode ownership: the shared layer owns the effective mode —
    [apply] resolves it and stamps it on the delivered
    [Ui_services.theme_snapshot]. Web's [.dark]/[data-theme] toggles and
    the native ui-state theme flag are emissions of that decision (kept
    working for legacy selectors), never independent sources of truth. *)

type mode =
  | Light
  | Dark

(** Semantic color roles for one mode. Values are CSS color literals. *)
type colors = {
  background : string;
  (* Primary canvas / --ls-primary-background-color. *)
  background_raised : string;
  (* Secondary background: panels, cards, sidebar. *)
  background_sunken : string;
  (* Tertiary background: muted/inset surfaces. *)
  background_selected : string;
  (* Quaternary background: a-chosen-bg, chosen rows. *)
  surface_elevated : string;
  (* Floating surfaces: dialogs, popovers, menus. *)
  foreground : string;
  (* Primary text. *)
  foreground_strong : string;
  (* Secondary text (higher contrast than primary on classic). *)
  foreground_muted : string;
  (* De-emphasized text (kit muted.foreground). *)
  foreground_faint : string;
  (* Titles / tertiary text. *)
  border : string;
  border_soft : string;
  (* Secondary border: hairlines, sidebar. *)
  border_faint : string;
  (* Tertiary border / guidelines. *)
  accent : string;
  (* Link/primary accent. *)
  accent_hover : string;
  on_accent : string;
  (* Text on accent-filled controls. *)
  active : string;
  (* Active-primary surface (selected controls). *)
  on_active : string;
  selection : string;
  on_selection : string;
  focus_ring : string;
  danger : string;
  success : string;
  warning : string;
  overlay : string;
  (* Modal scrim. *)
}

(** Per-component token slots: surface/text/border plus the row-state
    backgrounds menus and lists need. *)
type component = {
  surface : string;
  foreground : string;
  border : string;
  hover : string;
  selected : string;
}

type components = {
  dialog : component;
  panel : component;
  popup : component;
  menu : component;
  item_row : component;
}

(** Typography scale — the sizes/weights the cmdk and page chrome use. *)
type typography = {
  font_family : string;
  page_text_size : string;
  (* 1em — body text. *)
  page_title_size : string;
  (* 36px page titles. *)
  text_header : string;
  (* 0.75rem/12px — cmdk group headers, badges. *)
  text_row : string;
  (* 0.875rem — menu/cmdk rows. *)
  text_input : string;
  (* 1.25rem — cmdk input. *)
  weight_light : int;
  (* 300 *)
  weight_regular : int;
  (* 400 *)
  weight_medium : int;
  (* 500 *)
  weight_bold : int;
  (* 700 *)
}

type snapshot = {
  mode : mode;
  colors : colors;
  components : components;
  typography : typography;
  levels : string array;
  (* Six color levels (--color-level-1..6) — raised surface ladder. *)
  vars : (string * string) list;
  (* Resolved CSS custom-property table (see module doc). *)
  kit : (string * string) list;
  (* gpui-kit theme slot -> literal color. *)
}

(** The built-in classic Logseq theme (the only palette today).
    [accent_bound] lists the [--ls-*] names [vars] deliberately does not
    emit as literals: colors.css rebinds them per [data-color] accent
    theme, so inline literals would break every accent but logseq. They
    appear only as canonical [--lx-*] names holding [var(--ls-<name>)]
    references. *)
val accent_bound : string list

val snapshot : mode -> snapshot

val mode_of_string : string -> mode

(** Wire a snapshot into the services contract. *)
val to_service : snapshot -> Ui_services.theme_snapshot

(** Deliver the snapshot for the effective mode string ("dark"/"light")
    through [Ui_services.theme_apply_snapshot]. Unknown modes raise. *)
val apply : string -> unit
