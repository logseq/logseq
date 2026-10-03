(* Settings page/dialog area state — mirrors cljs components/settings.cljs
   *active* tab atom + the repo :config subscription (logseq/config.edn),
   plus localStorage-backed prefs. Storage keys use cljs storage.cljs
   `(name key)` semantics (namespace stripped). *)

open Promise_ext
type t =
  { tab : string
  ; config : Wire.t
  ; journal_uuid : string option
  ; date_format : string
  ; tick : int
  }

let initial =
  { tab = "general"
  ; config = Wire.Map []
  ; journal_uuid = None
  ; date_format = "MMM do, yyyy"
  ; tick = 0
  }

let st : t Signal.state option ref = ref None

(* tab requested before the pane mounts (menubar "menu-open-settings"
   {tab}) — consumed by the next activate (the mount-time settings
   effect), which otherwise defaults the tab to "general". The plain
   set_tab path cannot run before mount because the state signal does
   not exist yet. *)
let pending_tab : string option ref = ref None

let request_tab tab = pending_tab := Some tab

let clear_pending_tab () = pending_tab := None

let ensure (ctx : Lui_ui.ui_context) =
  match !st with
  | Some _ -> ()
  | None -> st := Some (Signal.state ctx.ui_scheduler initial)

let ready () = Option.is_some !st

let state () =
  match !st with Some s -> s | None -> failwith "settings state not mounted"

let value () = Signal.get_state (state ())
let signal () = (state ()).Signal.state_signal

let set f =
  Signal.update (state ()) f;
  Runtime.flush ()

(* storage-backed toggles don't touch `config` — bump tick so the pane
   dyn re-renders. Toggles are reachable without the pane mounted (cmdk
   "ui/toggle-wide-mode"), where there is nothing to re-render *)
let poke () =
  if ready () then set (fun s -> { s with tick = s.tick + 1 })

let repo = Runtime.repo

let set_tab tab =
  Platform.body_set_data "settingsTab" tab;
  set (fun s -> { s with tab })

(* common-util/page-name-sanity-lc approximation: lowercase + strip boundary
   slashes (path normalization is not needed for the settings lookups) *)
let page_name_lc s =
  let s = String.trim s in
  let n = String.length s in
  let i = ref 0 and j = ref n in
  while !i < !j && s.[!i] = '/' do
    incr i
  done;
  while !j > !i && s.[!j - 1] = '/' do
    decr j
  done;
  String.lowercase_ascii (String.sub s !i (!j - !i))

let pull repo q lookup =
  Runtime.invoke3 "thread-api/pull" (Wire.String repo) (Wire.String q)
    lookup

let pull_journal repo =
  let* w =
    pull repo "[:block/uuid :logseq.property.journal/title-format]"
      (Wire.Keyword "logseq.class/Journal")
  in
  Js.Promise.resolve
    (match w with
     | Wire.Map _ -> (
         match Wire.map_get_uuid w "block/uuid" with
         | Some u ->
             let fmt =
               match
                 Wire.get w "logseq.property.journal/title-format"
               with
               | Some (Wire.String s) -> Some s
               | _ -> None
             in
             Some (u, fmt)
         | None -> None)
     | _ -> None)

let load () =
  let r = repo () in
  let cfg_p = Sdk_config.read_config r in
  let jour_p = pull_journal r in
  ignore
    (let* cfg = cfg_p in
    let* journal = jour_p in
    let uuid, fmt =
      match journal with
      | Some (u, f) ->
          (Some u, Option.value f ~default:"MMM do, yyyy")
      | None -> (None, "MMM do, yyyy")
    in
    Runtime.signal_set (state ())
      { (value ()) with
        config = cfg
      ; journal_uuid = uuid
      ; date_format = fmt
      };
    Js.Promise.resolve ())

(* cljs settings-effect: body[data-settings-tab] + config refresh.
   Uses Signal.set (no flush) — called during mount, the pending render
   picks up the fresh value. *)
let activate () =
  let tab =
    match !pending_tab with
    | Some t ->
        pending_tab := None;
        t
    | None -> "general"
  in
  Platform.body_set_data "settingsTab" tab;
  if ready () then (
    Signal.set (state ()) { (value ()) with tab };
    load ())

let deactivate () = Platform.body_rm_data "settingsTab"

(* ---- config.edn accessors ---- *)

let config_get key = Wire.get (value ()).config key

let config_bool key ~default =
  match config_get key with Some (Wire.Bool b) -> b | _ -> default

let map_assoc key v kvs =
  let rec go acc = function
    | [] -> List.rev ((Wire.Keyword key, v) :: acc)
    | ((k, _) as kv) :: rest -> (
        match k with
        | Wire.Keyword s when s = key ->
            List.rev_append acc ((k, v) :: rest)
        | _ -> go (kv :: acc) rest)
  in
  go [] kvs

let map_dissoc key kvs =
  List.filter
    (fun (k, _) ->
      match k with Wire.Keyword s -> s <> key | _ -> true)
    kvs

let set_config key v =
  let cfg' =
    match (value ()).config with
    | Wire.Map kvs -> Wire.Map (map_assoc key v kvs)
    | _ -> Wire.Map [ (Wire.Keyword key, v) ]
  in
  set (fun s -> { s with config = cfg' });
  ignore (Sdk_config.write_config (repo ()) cfg')

let config_toggle key ~default =
  set_config key (Wire.Bool (not (config_bool key ~default)))

(* cljs update-home-page: blank clears :default-home/:page; a name is only
   stored when a :block/name match exists *)
type home_result =
  | Home_ok
  | Home_missing

let set_home_page name k =
  let write page_opt =
    let home =
      match config_get "default-home" with
      | Some (Wire.Map kvs) -> kvs
      | _ -> []
    in
    let home' =
      match page_opt with
      | Some n -> map_assoc "page" (Wire.String n) home
      | None -> map_dissoc "page" home
    in
    set_config "default-home" (Wire.Map home');
    k Home_ok
  in
  if String.trim name = "" then write None
  else
    ignore
      (let* w =
        pull (repo ()) "[:db/id]"
          (Wire.Array
             [ Wire.Keyword "block/name"; Wire.String (page_name_lc name) ])
      in
      Js.Promise.resolve
        (match w with
        | Wire.Map _ -> write (Some name)
        | _ -> k Home_missing))

(* ---- storage-backed prefs ---- *)

(* cljs storage/get reads values with reader/read-string and storage/set
   writes pr-str, so cljs-written booleans appear quoted ("true"/"false");
   accept both quoted and raw forms. *)
let storage_bool key ~default =
  match Platform.local_storage_get key with
  | Some "true" | Some "\"true\"" -> true
  | Some "false" | Some "\"false\"" -> false
  | Some _ -> default
  | None -> default

let storage_set_bool key b =
  Platform.local_storage_set key (if b then "\"true\"" else "\"false\"")

(* cljs ui-handler/toggle-wide-mode!: storage + ls-wide-mode on
   main#app-container-wrapper *)
let toggle_wide_mode () =
  let v = not (storage_bool "wide-mode" ~default:false) in
  storage_set_bool "wide-mode" v;
  poke ();
  match Browser_ui.qs "#app-container-wrapper" with
  | Some el -> (if v then Browser_ui.add_class else Browser_ui.rm_class) el "ls-wide-mode"
  | None -> ()

let toggle_shortcut_tooltip () =
  storage_set_bool "shortcut-tooltip?"
    (not (storage_bool "shortcut-tooltip?" ~default:true));
  poke ()

(* developer-mode storage read is inverted: stored flag disables instrumentation *)
let instrument_disabled () =
  storage_bool "instrument-disabled" ~default:false

let toggle_usage_diagnostics () =
  storage_set_bool "instrument-disabled" (not (instrument_disabled ()));
  poke ()

let developer_mode () = storage_bool "developer-mode" ~default:false
let toggle_developer_mode () =
  storage_set_bool "developer-mode" (not (developer_mode ()));
  poke ()

let plugin_system () = storage_bool "lsp-core-enabled" ~default:true
let toggle_plugin_system () =
  storage_set_bool "lsp-core-enabled" (not (plugin_system ()));
  poke ()

(* ---- accent color (theme.cljs accent-color effect) ---- *)

let current_accent () =
  (* cljs storage key is (name :ui/radix-color) = "radix-color";
     unset = no active swatch *)
  match Platform.local_storage_get "radix-color" with
  | Some v -> (
      let v = Settings_view.unquote v in
      if String.length v > 0 && v.[0] = ':' then
        String.sub v 1 (String.length v - 1)
      else v)
  | None -> ""

let set_accent name =
  Platform.local_storage_set "radix-color" (Settings_view.quoted (":" ^ name));
  Platform.document_set_data "color" name;
  poke ()

(* ---- editor font (state/set-editor-font! + theme.cljs effect) ---- *)

type font_cfg =
  { ftype : string
  ; fglobal : bool
  }

let default_font_cfg = { ftype = "default"; fglobal = false }

let current_editor_font () =
  match Platform.local_storage_get "editor-font" with
  | Some v -> (
      match Edn.parse (Settings_view.unquote v) with
      | Wire.Map kvs ->
          let m = Wire.Map kvs in
          { ftype =
              (match Wire.get m "type" with
              | Some (Wire.String s) -> s
              | _ -> "default")
          ; fglobal =
              (match Wire.get m "global" with
              | Some (Wire.Bool b) -> b
              | _ -> false)
          }
      | _ -> default_font_cfg)
  | None -> default_font_cfg

let write_editor_font cfg =
  Platform.local_storage_set "editor-font"
    (Settings_view.quoted
       (Edn.to_string
          (Wire.Map
             [ (Wire.Keyword "type", Wire.String cfg.ftype)
             ; (Wire.Keyword "global", Wire.Bool cfg.fglobal)
             ])));
  Platform.document_set_data "font" cfg.ftype;
  Platform.document_set_data "font-global"
    (if cfg.fglobal then "true" else "false");
  poke ()

let set_editor_font_type t =
  let cur = current_editor_font () in
  write_editor_font { cur with ftype = t }

let set_editor_font_global b =
  let cur = current_editor_font () in
  write_editor_font { cur with fglobal = b }

(* ---- date format (Journal class title-format property) ---- *)

let set_date_format fmt =
  match (value ()).journal_uuid with
  | Some uuid ->
      set (fun s -> { s with date_format = fmt });
      ignore
        (Sdk_util.apply_op "set-block-property"
           [ Wire.Uuid uuid
           ; Wire.Keyword "logseq.property.journal/title-format"
           ; Wire.String fmt
           ])
  | None -> ()
