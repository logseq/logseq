(** Shared visual-design tokens — the single owner of Logseq's theme
    values across web and native renderers.

    CSS owns global mode and accent declarations. Web consumes those
    stylesheets directly; native consumes [css_palette], generated from
    the same declarations and evaluated in HTML/body/application inheritance order.

    A [snapshot] carries additional application tokens. Derived names
    resolve on body so they can see the selected accent's declarations.
    [colors]/[components]/[typography]/[levels] describe the classic
    application metadata. They do not replace the CSS palette.

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
  (* De-emphasized text. *)
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
  font_stack : string;
  (* Authored family followed by platform and missing-glyph fallbacks. *)
  root_text_size : string;
  (* 16px document-root baseline, independent of body text size. *)
  line_height : string;
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
  (* Derived application custom properties (see module doc). *)
}

val typography : typography

(** Whether a variable belongs to the shared stylesheet cascade.
    Native resolves it through [css_palette]; Web keeps its CSS declaration. *)
val stylesheet_owned_var : string -> bool

(** Renderer semantic color names use the same application custom properties. *)
val semantic_color_var : string -> string option

val faded_link_opacity : float

(** Global CSS palette declarations for a mode and built-in accent.
    Generated from the same stylesheets consumed by Web. *)
type css_palette = {
  root : (string * string) list;
  body : (string * string) list;
  application : (string * string) list;
}

val css_palette : mode -> accent:string -> css_palette

val snapshot : mode -> snapshot

val mode_of_string : string -> mode

(** Wire a snapshot into the services contract. *)
val to_service : snapshot -> Ui_services.theme_snapshot

(** Deliver the snapshot for the effective mode string ("dark"/"light")
    through [Ui_services.theme_apply_snapshot]. Unknown modes raise. *)
val apply : string -> unit
