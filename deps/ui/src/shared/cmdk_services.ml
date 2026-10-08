(* Command-palette platform/app seam — the portable cmdk_state/cmdk_view
   modules depend only on lui + contracts, so every host capability they
   need (worker invokes, navigation effects, document access, editor and
   sidebar commands, pickers, dialogs) arrives through this record. Each
   runtime supplies one implementation: src/cmdk/cmdk_host.ml for the
   browser, native/cmdk_host.ml for gpui.

   Storage and the raw navigation hash come from Ui_services directly;
   the ops here are the ones that need app modules the shared slice
   cannot link (Runtime, Editor_*, Sidebar_state, Router, Plugin_host,
   Properties_*, Icon_picker, Outliner_ops, Rtc_ops, Exporter).

   Element handles never cross the boundary: document ops are
   selector-based or named semantic effects, so the record is
   non-parametric and can be installed once per runtime. *)

type key_ev =
  { key : string
  ; meta : bool
  ; ctrl : bool
  ; shift : bool
  ; alt : bool
  }

type key_answer = { prevent : bool; stop : bool }

(* document events reach the shared handlers as precomputed facts — the
   host adapter runs the closest()/attr lookups *)
type click_ev =
  { search_button : bool (* target inside #search-button *)
  ; inside_modal : bool (* target inside .cp__cmdk__modal *)
  ; item_key : string option (* closest [data-item-key] value *)
  }

type move_ev =
  { inside_cmdk : bool (* target inside .cp__cmdk *)
  ; item_index : int option (* closest [data-item-index] value *)
  ; moved : bool (* nonzero movementX/Y *)
  }

type handlers =
  { key : key_ev -> key_answer
  ; click : click_ev -> unit
  ; mousemove : move_ev -> unit
  }

(* Portable Commands_data.cmd — labels arrive already host-decorated
   (shortcut display string, mac glyphs); i18n keys are translated on
   the shared side. *)
type cmd =
  { id : string
  ; label : string
  ; i18n : bool (* label is an i18n key, translate via i18n *)
  ; sc : string (* decorated display string, "" = none *)
  ; dev : bool
  }

type icon_choice =
  | Icon_remove
  | Icon_emoji of string
  | Icon_tabler of string * string option

type nav_target =
  | Nav_home
  | Nav_journals
  | Nav_all_graphs
  | Nav_graph_view
  | Nav_all_pages

type t =
  {
    (* -- host facts -------------------------------------------------- *)
    publishing : unit -> bool
  ; is_mac : unit -> bool
  ; dev_build : unit -> bool
  ; random : unit -> float
  ; now_ms : unit -> float
  ; console_error : string -> exn -> unit
  ; i18n : string -> string
  ; i18nf : string -> string list -> string
  ; normalize : string -> string
    (* -- dates -------------------------------------------------------- *)
  ; today_journal_day : unit -> int (* yyyymmdd *)
  ; rel_journal_day : int -> int (* today + delta days *)
  ; journal_title_of_day : int -> string (* page title for a yyyymmdd day *)
    (* -- model reads --------------------------------------------------- *)
  ; repo : unit -> string option
  ; route_is_page : unit -> bool (* Page | Block_zoom route *)
  ; route_page_uuid : unit -> string option
  ; route_page_journal_day : unit -> int option
    (* -- worker -------------------------------------------------------- *)
  ; invoke : string -> Wire.t list -> Wire.t Ui_task.t
    (* -- navigation ------------------------------------------------------ *)
  ; mark_nav : unit -> unit
  ; nav_hash : string -> string
  ; on_page_loaded : string -> (unit -> unit) -> unit
  ; journals_target : unit -> (string * nav_target) Ui_task.t
  ; send_navigate : nav_target -> unit
  ; resolve_route : unit -> unit
  ; scroll_to_top : unit -> unit
    (* -- document ------------------------------------------------------ *)
  ; set_input_value : string -> unit (* .cp__cmdk-search-input *)
  ; focus_search_input : unit -> unit
  ; focus_input_init : string -> unit (* focus+fill+select-all, retrying
                                         until the modal input mounts *)
  ; scroll_row_index : int -> unit (* scroll [data-item-index=n] inside
                                      the scroller into view *)
  ; set_timeout : (unit -> unit) -> int -> unit
  ; install_listeners : handlers -> unit
  ; toast : string -> string -> unit
    (* -- commands/fuzzy --------------------------------------------------- *)
  ; fuzzy_search : 'a. extract:('a -> string) -> limit:int -> 'a list
      -> string -> 'a list
  ; fuzzy_search_multi : 'a. extract_fns:('a -> string) list -> limit:int
      -> 'a list -> string -> 'a list
  ; commands : unit -> cmd list
  ; plugin_commands : unit -> cmd list
  ; exec_palette_command : string -> unit
  ; hook_app : string -> unit
    (* -- editor state ----------------------------------------------------- *)
  ; editor_ready : unit -> bool
  ; editing_uuid : unit -> string option
  ; editing : unit -> bool
  ; selected_uuids : unit -> string list (* document order *)
  ; selected_set : unit -> string list (* unordered selection *)
  ; find_parent_uuid : string -> string option
    (* -- outliner --------------------------------------------------------- *)
  ; mk_op : string -> Wire.t list -> Wire.t
  ; create_page_op : string -> Wire.t
  ; create_class_op : string -> Wire.t
  ; move_blocks_bottom_op : string list -> string -> Wire.t
  ; apply_ops : Wire.t list -> unit Ui_task.t (* apply_and_refresh *)
  ; refresh_page : unit -> unit
    (* -- properties --------------------------------------------------------- *)
  ; entity_has_prop : uuid:string -> prop:string -> bool Ui_task.t
  ; open_property_dialog : string option -> unit
  ; open_named_property : uuids:string list -> ident:string -> unit
  ; toggle_hidden_props : unit -> unit
    (* -- pickers ------------------------------------------------------------ *)
  ; pick_emoji : block_uuid:string -> on_chosen:(string -> unit) -> unit
      (* emoji-only picker anchored on the first target's row *)
  ; pick_icon : block_uuid:string -> del:bool
      -> on_chosen:(icon_choice -> unit) -> unit
  ; appearance_popup : unit -> unit (* anchored on the toolbar dots *)
    (* -- dialogs/settings ---------------------------------------------------- *)
  ; dialogs_open : string -> unit
  ; dialogs_close : string -> unit
  ; dialogs_is_open : string -> bool
  ; settings_open_at : string -> unit
  ; settings_toggle_wide : unit -> unit
  ; settings_toggle_theme : unit -> unit
  ; config_toggle : string -> bool -> unit
    (* -- sidebar --------------------------------------------------------------- *)
  ; sidebar_add_search : string -> unit
  ; sidebar_open_uuid : string -> unit
  ; sidebar_open_uuids : string list -> unit (* right-open + open each *)
  ; sidebar_clear : unit -> unit
  ; sidebar_close_top : unit -> unit
  ; sidebar_ensure_contents : unit -> unit
  ; sidebar_open_cards : unit -> unit
  ; sidebar_toggle_favorite : unit -> unit
  ; sidebar_recent_ids : string -> int list (* repo *)
    (* -- editor actions -------------------------------------------------------- *)
  ; exit_edit : unit -> unit
  ; append_block : unit -> unit
  ; clear_selection : unit -> unit
  ; select_all : unit -> unit
  ; copy_selection : unit -> unit
  ; delete_selection : unit -> unit
  ; extend_selection : bool -> unit
  ; move_selection_focus : bool -> unit
  ; indent : bool -> unit
  ; move_blocks_vert : bool -> unit
  ; select_single : string -> unit
  ; enter_edit : string -> int -> unit
  ; toggle_collapse : string -> unit
  ; set_collapsed : string -> bool -> unit
  ; toggle_open_blocks : unit -> unit
  ; cycle_todo : string list -> unit
  ; undo : unit -> unit
  ; redo : unit -> unit
  ; quick_add : unit -> unit
  ; toggle_own_list : string list -> unit
  ; ensure_comments : repo:string -> uuids:string list -> unit
    (* -- misc app effects -------------------------------------------------------- *)
  ; toggle_left_sidebar : unit -> unit
  ; toggle_right_sidebar : unit -> unit
  ; toggle_help : unit -> unit
  ; rtc_start : string -> unit
  ; rtc_stop : unit -> unit
  ; export_graph_html : unit -> unit
  }
