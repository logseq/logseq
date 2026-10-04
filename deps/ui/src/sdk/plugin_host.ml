(* LSPlugin host runtime for the web build. Installs window.apis
   (EventEmitter3), wires LSPluginCore listeners, persists installed
   plugins + per-plugin settings under localStorage keys mirroring the
   cljs idb paths (LSPUserDotRoot/ subtree), relays marketplace installs via
   the lsp-updates channel, and exposes the plugin-facing host api fns
   that the lsplugin dispatch resolves on window.logseq.api. *)

open Promise_ext
open Sdk_util

external window_ : Js.Json.t = "window"

external new_ee3 : unit -> Js.Json.t = "EventEmitter3"
  [@@mel.new] [@@mel.scope "window"]

external ls_remove : string -> unit = "removeItem"
  [@@mel.scope "localStorage"]

external getf : Js.Json.t -> string -> Js.Json.t = "" [@@mel.get_index]
external setf : Js.Json.t -> string -> Js.Json.t -> unit = ""
  [@@mel.set_index]
external reflect_apply :
  Js.Json.t -> Js.Json.t -> Js.Json.t array -> Js.Json.t = "apply"
  [@@mel.scope "Reflect"]

external reflect_apply_promise :
  Js.Json.t -> Js.Json.t -> Js.Json.t array -> 'a Js.Promise.t = "apply"
  [@@mel.scope "Reflect"]
external del_prop : Js.Json.t -> string -> bool = "deleteProperty"
  [@@mel.scope "Reflect"]

let jstr o k = Option.value ~default:"" (Js.Json.decodeString (getf o k))
let jbool o k = Option.value ~default:false (Js.Json.decodeBoolean (getf o k))
let meth o m args : Js.Json.t = reflect_apply (getf o m) o args

let meth_promise o m args =
  reflect_apply_promise (getf o m) o args
let lsplugin () = getf window_ "LSPlugin"
let core () = getf window_ "LSPluginCore"

let jobj pairs = Js.Json.object_ (Js.Dict.fromList pairs)
let jstr_ s = Js.Json.string s

(* ---------- persistent stores (localStorage mirrors cljs idb) *)

let store_key = "LSPUserDotRoot/installed-plugins-for-web/all.json"
let settings_key pid = "LSPUserDotRoot/settings/" ^ pid ^ ".json"
let prefs_key = "LSPUserDotRoot/preferences.json"

let read_json key =
  match Platform.local_storage_get key with
  | Some s -> (try Platform.json_parse s with _ -> Js.Json.null)
  | None -> Js.Json.null

let read_dict key =
  match Js.Json.decodeObject (read_json key) with
  | Some d -> d
  | None -> Js.Dict.empty ()

let write_dict key d =
  Platform.local_storage_set key
    (Js.Json.stringify (Js.Json.object_ d))

(* ---------- in-memory host state ---------- *)

type ui_item = { it_pid : string; it_type : string; it_opts : Js.Json.t }

let installed : Js.Json.t Js.Dict.t = Js.Dict.empty ()
let items : ui_item list ref = ref []
let dirty : int Signal.state option ref = ref None
let marketplace : Js.Json.t Js.Promise.t option ref = ref None

(* pid -> available update version (cljs :plugin/updates-coming, from
   lsp-updates onlyCheck payloads) — declared up here because
   on_lsp_update writes it *)
let updates : (string, string) Hashtbl.t = Hashtbl.create 4

let dirty_signal owner =
  match !dirty with
  | Some s -> s
  | None ->
      let s = Signal.state owner 0 in
      dirty := Some s;
      s

let dirty_value owner = Signal.value (dirty_signal owner)

let bump () =
  match !dirty with
  | Some s -> Runtime.signal_set s (Signal.get_state s + 1)
  | None -> ()

(* ---------- injected ui (toolbar slots) ---------- *)

let toolbar_items () =
  !items
  |> List.filter (fun it -> it.it_type = "toolbar")
  |> List.sort (fun x y ->
         String.compare (jstr x.it_opts "key") (jstr y.it_opts "key"))

(* disabled plugins keep their `installed` entry (only unregistered /
   unlink removes it), so the manager trigger can stay rendered to
   show an empty item list like the e2e plugins contract expects *)
let has_installed_plugins () = Array.length (Js.Dict.keys installed) > 0

let slot_id it =
  "pl-injected-ui-item-pl-" ^ jstr it.it_opts "key" ^ "-" ^ it.it_pid

let inject_toolbar_ui () =
  let setup =
    match Js.Json.classify (lsplugin ()) with
    | Js.Json.JSONObject _ ->
        getf (getf (lsplugin ()) "pluginHelpers") "setupInjectedUI"
    | _ -> Js.Json.null
  in
  List.iter
    (fun it ->
      match
        ( Js.Dict.get installed it.it_pid
        , Web_dom.get_element_by_id (slot_id it) )
      with
      | Some pl, Some _ ->
          let opts =
            jobj
              [ ("slot", jstr_ (slot_id it))
              ; ("key", jstr_ ("pl-" ^ jstr it.it_opts "key"))
              ; ("template", getf it.it_opts "template")
              ]
          in
          ignore (meth setup "call" [| pl; opts; jobj [] |])
      | _ -> ())
    (toolbar_items ())

(* after a dirty bump re-renders the open menu, slots are recreated
   empty — re-inject on the next tick *)
let schedule_inject () =
  ignore (Web_dom.set_timeout_id (fun () -> inject_toolbar_ui ()) 0)


(* ---------- installed-plugin tracking ---------- *)

let pid_of_event (e : Js.Json.t) =
  match Js.Json.decodeString e with
  | Some s -> s
  | None -> jstr e "id"

let save_plugin_json (pl : Js.Json.t) =
  let j = meth pl "toJSON" [| Js.Json.boolean false |] in
  let key = jstr j "key" in
  if key <> "" then (
    let m = read_dict store_key in
    Js.Dict.set m key j;
    write_dict store_key m)

let track pl =
  let pid = jstr pl "id" in
  if pid <> "" then (
    Js.Dict.set installed pid pl;
    if jbool pl "isWebPlugin" then save_plugin_json pl;
    bump ();
    schedule_inject ())

let clear_pid pid =
  items := List.filter (fun it -> it.it_pid <> pid) !items;
  bump ()

let unlink_pid pid =
  ignore (del_prop (Js.Json.object_ installed) pid);
  items := List.filter (fun it -> it.it_pid <> pid) !items;
  (let m = read_dict store_key in
   ignore (del_prop (Js.Json.object_ m) pid);
   write_dict store_key m);
  ls_remove (settings_key pid);
  bump ()

(* ---------- lsp-updates (marketplace install/update) ---------- *)

let on_lsp_update (e : Js.Json.t) =
  match jstr e "status" with
  | "completed" -> (
      let payload = getf e "payload" in
      let id = jstr payload "id" in
      if jbool e "onlyCheck" then (
        let v = jstr payload "latest-version" in
        if id <> "" && v <> "" then (
          Hashtbl.replace updates id v;
          bump ()))
      else if id <> "" then
        match Js.Dict.get installed id with
        | Some pl ->
            (* already installed -> update path (cljs): pl.reload(),
               then refresh the saved manifest's version/webPkg *)
            ignore (meth_promise pl "reload" [||]);
            (match Js.Json.classify (getf pl "options") with
             | Js.Json.JSONObject _ ->
                 setf (getf pl "options") "version"
                   (getf payload "version");
                 setf (getf pl "options") "webPkg"
                   (getf payload "webPkg");
                 save_plugin_json pl;
                 Hashtbl.remove updates id;
                 bump ()
             | _ -> ())
        | None ->
            let entry =
              jobj
                [ ("key", jstr_ id)
                ; ("url", getf payload "dst")
                ; ("webPkg", getf payload "webPkg")
                ]
            in
            ignore
              (meth_promise (core ()) "register" [| entry |]))
  | _ -> ()

(* ---------- boot ---------- *)

let boot_register () =
  let d = read_dict store_key in
  let plugins =
    Js.Dict.values d
    |> Array.to_list
    |> List.filter (fun p -> jstr p "url" <> "")
  in
  if plugins <> [] then
    ignore
      (meth_promise (core ()) "register"
         [| Js.Json.array (Array.of_list plugins)
          ; Js.Json.boolean true
         |])



(* ---------- pinned toolbar items (in user preferences) ---------- *)

let pinned () =
  match Js.Dict.get (read_dict prefs_key) "pinnedToolbarItems" with
  | Some j -> (
      match Js.Json.decodeArray j with
      | Some xs ->
          Array.to_list xs
          |> List.filter_map Js.Json.decodeString
      | None -> [])
  | None -> []

let toggle_pinned pkey =
  let cur = pinned () in
  let next =
    if List.mem pkey cur then List.filter (fun k -> k <> pkey) cur
    else cur @ [ pkey ]
  in
  let d = read_dict prefs_key in
  Js.Dict.set d "pinnedToolbarItems"
    (Js.Json.array
       (Array.of_list (List.map jstr_ next)));
  write_dict prefs_key d;
  bump ()

(* ---------- enable / disable ---------- *)

let set_plugin_disabled pid disabled =
  ignore
    (meth_promise (core ())
       (if disabled then "disable" else "enable")
       [| jstr_ pid |])

let plugin_disabled (pl : Js.Json.t) = jbool pl "disabled"

(* ---------- marketplace ---------- *)

let marketplace_url =
  "https://raw.githubusercontent.com/logseq/marketplace/master/plugins.json"

external resp_json : Js.Json.t -> Js.Json.t Js.Promise.t = "json" [@@mel.send]
external fetch_ : string -> Js.Json.t Js.Promise.t = "fetch" [@@mel.scope "window"]

let marketplace_pkgs owner =
  match !marketplace with
  | Some p -> p
  | None ->
      let p =
        (let* r = fetch_ marketplace_url in
        let* j = resp_json r in
        let pkgs =
          match Js.Json.decodeArray (getf j "packages") with
          | Some xs -> Array.to_list xs
          | None -> []
        in
        (* web platform filter: web:true or effect not true *)
        let web_ok p =
          jbool p "web" || not (jbool p "effect")
        in
        let pkgs = List.filter web_ok pkgs in
        bump ();
        Js.Promise.resolve
          (Js.Json.array (Array.of_list pkgs)))
      in
      marketplace := Some p;
      ignore (dirty_signal owner);
      p

let r2_entry_url repo version =
  "https://plugins.logseq.io/r2/" ^ repo ^ "/" ^ version

let install_marketplace pkg =
  let repo = jstr pkg "repo" in
  if repo <> "" && Js.Dict.get installed (jstr pkg "id") = None then (
    let apis = getf window_ "apis" in
    ignore
      (let* r = fetch_ (r2_entry_url repo "") in
       let* web_pkg = resp_json r in
      let version = jstr web_pkg "version" in
      let payload =
        jobj
          [ ("id", getf pkg "id")
          ; ("name", getf pkg "title")
          ; ("title", getf pkg "title")
          ; ("icon", getf pkg "icon")
          ; ("author", getf pkg "author")
          ; ("repo", jstr_ repo)
          ; ("dst", jstr_ repo)
          ; ("version", jstr_ version)
          ; ("webPkg", web_pkg)
          ]
      in
      let evt =
        jobj
          [ ("status", jstr_ "completed")
          ; ("payload", payload)
          ]
      in
      ignore (meth apis "emit" [| jstr_ "lsp-updates"; evt |]);
      Js.Promise.resolve Js.Json.null))

(* ---------- hooks / commands / themes registries ----------
   cljs :plugin/installed-hooks {hook {pid _}},
   :plugin/simple-commands {pid [[type cmd action pid]]} where action is
   ["editor/hook", eventKey], :plugin/slash-commands {pid [[tag actions]]},
   :plugin/installed-themes (flat list carrying :pid),
   :plugin/selected-theme (the selected theme's url), and
   :plugin/updates-coming (pid -> payload with :latest-version). *)

type simple_cmd =
  { sc_cmd : Js.Json.t (* {key, label, type, desc, keybinding, extras} *)
  ; sc_event : string (* editor/hook event key, e.g. SimpleCommandHookX1 *)
  ; sc_palette : bool
  }

let plugin_hooks : (string, (string, unit) Hashtbl.t) Hashtbl.t =
  Hashtbl.create 8

let simple_commands : (string, (string, simple_cmd) Hashtbl.t) Hashtbl.t =
  Hashtbl.create 4

let slash_commands : (string, (string, Js.Json.t list) Hashtbl.t) Hashtbl.t =
  Hashtbl.create 4

let global_keybinding_cmds : (string, (string, Js.Json.t) Hashtbl.t) Hashtbl.t =
  Hashtbl.create 2

let installed_themes : Js.Json.t list ref = ref []
let selected_theme : string option ref = ref None

(* pending plugin-settings target — cljs goto-plugins-dashboard! passes
   :open-pid; plugins_view reads and clears it when the dialog opens *)
let open_settings_pid : string option ref = ref None

let tbl_for t k =
  match Hashtbl.find_opt t k with
  | Some m -> m
  | None ->
      let m = Hashtbl.create 8 in
      Hashtbl.replace t k m;
      m

(* core-side bridge: LSPluginCore.hook{App,Editor,Db}(type, payload, pid?) —
   Json.null pid broadcasts (each plugin gated by should_exec_plugin_hook),
   a pid string targets that plugin directly *)
let hook_call : string -> string -> Js.Json.t -> Js.Json.t -> unit =
  [%mel.raw
    "function (m, t, p, pid) { \
       var c = window.LSPluginCore; \
       if (c && typeof c[m] === 'function') c[m](t, p, pid); \
     }"]

let hook_app t p pid = hook_call "hookApp" t p pid
let hook_editor t p pid = hook_call "hookEditor" t p pid
let hook_db t p pid = hook_call "hookDb" t p pid

(* LSPluginCore.hostMounted() — resolves the deferred every plugin's
   provideUI/ready handshake waits on; cljs calls it once the page mounts *)
let host_mounted : unit -> unit =
  [%mel.raw
    "function () { \
       var c = window.LSPluginCore; \
       if (c && typeof c.hostMounted === 'function') c.hostMounted(); \
     }"]

(* LSPluginCore.unregister(pid) — cljs handler/unregister-plugin *)
let core_unregister : string -> unit =
  [%mel.raw
    "function (pid) { \
       var c = window.LSPluginCore; \
       if (c && typeof c.unregister === 'function') c.unregister(pid); \
     }"]

(* LSPluginCore.selectTheme(theme) — cljs select-a-plugin-theme *)
let core_select_theme : Js.Json.t -> unit =
  [%mel.raw
    "function (t) { \
       var c = window.LSPluginCore; \
       if (c && typeof c.selectTheme === 'function') c.selectTheme(t); \
     }"]

(* pl.caller.callUserModelAsync(key, ...args) — cljs
   call-plugin-user-model! *)
let call_user_model_async : Js.Json.t -> string -> Js.Json.t array -> unit =
  [%mel.raw
    "function (c, k, a) { \
       c.callUserModelAsync(k, ...a); \
     }"]

(* pl.settings accessors used by the plugin-settings view *)
let settings_to_json : Js.Json.t -> Js.Json.t =
  [%mel.raw "function (s) { return s.toJSON(); }"]

let settings_set : Js.Json.t -> string -> Js.Json.t -> unit =
  [%mel.raw "function (s, k, v) { s.set(k, v); }"]

(* code-mode save: cljs does (set! (. pl -settings -settings) parsed) *)
let settings_assign : Js.Json.t -> Js.Json.t -> unit =
  [%mel.raw "function (s, v) { s.settings = v; }"]

let caller_of_pid pid =
  match Js.Dict.get installed pid with
  | Some p -> (
      match Js.Json.classify (getf p "caller") with
      | Js.Json.JSONObject _ -> Some (getf p "caller")
      | _ -> None)
  | None -> None

(* cljs invoke-button-action!: pl.caller.callUserModelAsync(action,
   [{type:"click", dataset:{key}}]) *)
let call_button_action pid action key =
  match caller_of_pid pid with
  | Some c ->
      call_user_model_async c action
        [| jobj
             [ ("type", jstr_ "click")
             ; ("dataset", jobj [ ("key", jstr_ key) ])
             ]
        |]
  | None -> ()

(* cljs register-plugin-simple-command normalizes the key: trim,
   ':' -> '-', leading digit -> '_N' *)
let normalize_cmd_key s =
  let s =
    String.trim s |> String.map (function ':' -> '-' | c -> c)
  in
  if String.length s > 0 && s.[0] >= '0' && s.[0] <= '9' then "_" ^ s
  else s

(* cljs clear-commands! on beforereload/disabled/unregistered: drops the
   plugin's hooks, slash/simple commands, ui items, keybinding cmds and
   themes *)
let clear_plugin_resources pid =
  Hashtbl.iter (fun _ m -> Hashtbl.remove m pid) plugin_hooks;
  Hashtbl.remove simple_commands pid;
  Hashtbl.remove slash_commands pid;
  Hashtbl.remove global_keybinding_cmds pid;
  installed_themes :=
    List.filter (fun th -> jstr th "pid" <> pid) !installed_themes;
  clear_pid pid

let hook_installed pid key =
  match Hashtbl.find_opt plugin_hooks key with
  | Some m -> Hashtbl.mem m pid
  | None -> false

(* hook key for a block-uuid subscription (LSPlugin.user onBlockChanged):
   hook:db:block_<uuid with '-' replaced by '_'> *)
let block_hook_key u =
  "hook:db:block_"
  ^ String.map (fun c -> if c = '-' then '_' else c) u

let block_hook_installed u =
  match Hashtbl.find_opt plugin_hooks (block_hook_key u) with
  | Some m -> Hashtbl.length m > 0
  | None -> false

(* exec-plugin-simple-command! — cljs merges {:args, :pid} into the cmd,
   adds {:format :uuid} from the current edit block, then fires
   LSPluginCore.hookEditor(eventKey, payload, pid) *)
let exec_simple_command ?args pid key =
  match Hashtbl.find_opt simple_commands pid with
  | None -> ()
  | Some t -> (
      match Hashtbl.find_opt t key with
      | None -> ()
      | Some sc -> (
          match Js.Json.decodeObject sc.sc_cmd with
          | None -> ()
          | Some cmd ->
              let payload = Js.Dict.empty () in
              Array.iter
                (fun (k, v) -> Js.Dict.set payload k v)
                (Js.Dict.entries cmd);
              Js.Dict.set payload "pid" (jstr_ pid);
              (match args with
               | Some a -> Js.Dict.set payload "args" a
               | None -> ());
              (match Editor_state.editing_uuid () with
               | Some u ->
                   Js.Dict.set payload "uuid" (jstr_ u);
                   Js.Dict.set payload "format" (jstr_ "markdown")
               | None -> ());
              hook_editor sc.sc_event (Js.Json.object_ payload) (jstr_ pid)))

(* palette id is "plugin.<pid>/<key>" — cljs plugin-command-id *)
let exec_palette_command (cid : string) =
  let rest = String.sub cid 7 (String.length cid - 7) in
  match String.rindex_opt rest '/' with
  | Some i ->
      exec_simple_command
        (String.sub rest 0 i)
        (String.sub rest (i + 1) (String.length rest - i - 1))
  | None -> ()

let palette_commands () : Commands_data.cmd list =
  Hashtbl.fold
    (fun pid t acc ->
      Hashtbl.fold
        (fun key sc acc ->
          if sc.sc_palette then
            let label =
              match Js.Json.decodeString (getf sc.sc_cmd "label") with
              | Some l when l <> "" -> l
              | _ -> key
            in
            { Commands_data.id = "plugin." ^ pid ^ "/" ^ key
            ; label
            ; i18n = false
            ; dev = false
            ; sc = Commands_data.Unbound
            }
            :: acc
          else acc)
        t acc)
    simple_commands []

(* plugin slash commands for the "/" menu (cljs :plugin/slash-commands
   entries merge into the command list); dispatch runs the stored action
   steps — the editor/hook step fires hookEditor with the edit context *)
let slash_cmd_tags () : (string * string) list =
  Hashtbl.fold
    (fun pid t acc -> Hashtbl.fold (fun tag _ acc -> (pid, tag) :: acc) t acc)
    slash_commands []

(* cljs handle-steps for plugin slash commands: editor/input steps
   insert text at the caret; editor/hook steps carry ["editor/hook",
   event, {pid, ...}] — hookEditor(event, payload+{format,uuid}, pid) *)
let exec_slash_command ?insert pid tag =
  match Hashtbl.find_opt slash_commands pid with
  | None -> ()
  | Some t -> (
      match Hashtbl.find_opt t tag with
      | None -> ()
      | Some steps ->
          let run_step step =
            match Js.Json.decodeArray step with
            | Some xs when Array.length xs >= 2 -> (
                match Js.Json.decodeString xs.(0) with
                | Some "editor/input" -> (
                    match insert, Js.Json.decodeString xs.(1) with
                    | Some ins, Some text -> ins text
                    | _ -> ())
                | Some "editor/hook" -> (
                    match Js.Json.decodeString xs.(1) with
                    | Some ev ->
                        let payload =
                          match
                            Js.Json.decodeObject
                              (if Array.length xs >= 3 then xs.(2)
                               else Js.Json.null)
                          with
                          | Some o -> o
                          | None -> Js.Dict.empty ()
                        in
                        Js.Dict.set payload "uuid"
                          (jstr_
                             (match Editor_state.editing_uuid () with
                              | Some u -> u
                              | None -> ""));
                        Js.Dict.set payload "format" (jstr_ "markdown");
                        hook_editor ev (Js.Json.object_ payload) (jstr_ pid)
                    | None -> ())
                | _ -> ())
            | _ -> ()
          in
          List.iter run_step steps)

(* cljs :plugin/hook-db-tx — publish-plugin-hook! on :db/sync-changes:
   {blocks, deletedBlockUuids, txData, txMeta} broadcast as db:changed,
   plus targeted block:<uuid> for each block with an installed hook *)
let fire_db_hooks (payload : Wire.t) =
  match
    ( Wire.map_get_string payload "repo"
    , Wire.get payload "delta"
    , Wire.get payload "tx-meta" )
  with
  | Some repo, Some delta, tx_meta when Runtime.repo () = repo -> (
      let blocks =
        match Wire.get delta "blocks" with
        | Some (Wire.Map kvs) -> kvs
        | _ -> []
      in
      (* cljs gates on (seq blocks) and (<= count 1000) *)
      if blocks <> [] && List.length blocks <= 1000 then (
        let tx_meta_j =
          Option.value
            (Option.map (Sdk_convert.json_of_wire ~camel:true) tx_meta)
            ~default:(Js.Json.object_ (Js.Dict.empty ()))
        in
        let blocks_j =
          Js.Json.array
            (Array.of_list
               (List.map
                  (fun (_, b) -> Sdk_convert.json_of_wire ~camel:true b)
                  blocks))
        in
        let deleted =
          match Wire.get delta "deleted" with
          | Some (Wire.Map kvs) ->
              List.filter_map
                (fun (k, _) ->
                  match k with Wire.Uuid u -> Some u | _ -> None)
                kvs
          | _ -> []
        in
        let p = Js.Dict.empty () in
        Js.Dict.set p "blocks" blocks_j;
        Js.Dict.set p "deletedBlockUuids"
          (Js.Json.array (Array.of_list (List.map jstr_ deleted)));
        Js.Dict.set p "txData" (Js.Json.array [||]);
        Js.Dict.set p "txMeta" tx_meta_j;
        hook_db "changed" (Js.Json.object_ p) Js.Json.null;
        List.iter
          (fun (k, b) ->
            match k with
            | Wire.Uuid u when block_hook_installed u ->
                let bp = Js.Dict.empty () in
                Js.Dict.set bp "block"
                  (Sdk_convert.json_of_wire ~camel:true b);
                Js.Dict.set bp "txData" (Js.Json.array [||]);
                Js.Dict.set bp "txMeta" tx_meta_j;
                hook_db ("block:" ^ u) (Js.Json.object_ bp) Js.Json.null
            | _ -> ())
          blocks))
  | _ -> ()

(* cljs hook-plugin-app :route-changed — payload mirrors the cljs route
   record keys it ships (template / path / parameters) *)
let fire_route_changed (route : Model.route) =
  let template =
    match route with
    | Model.Home -> "home"
    | Model.Page _ | Model.Block_zoom _ -> "page"
    | Model.Journals -> "journals"
    | Model.Library -> "library"
    | Model.All_pages -> "all-pages"
    | Model.All_graphs -> "graphs"
    | Model.Import -> "import"
    | Model.Settings -> "settings"
    | Model.Not_found _ -> "not-found"
  in
  let p = Js.Dict.empty () in
  Js.Dict.set p "template" (jstr_ template);
  Js.Dict.set p "path" (jstr_ (Platform.location_hash ()));
  Js.Dict.set p "parameters" (Js.Json.object_ (Js.Dict.empty ()));
  hook_app "route-changed" (Js.Json.object_ p) Js.Json.null

(* cljs theme-selected listener: apply the selected mode (document
   data-theme + localStorage ui/theme like set-theme-mode!) then
   broadcast theme-changed *)
let apply_theme_mode (theme : Js.Json.t) =
  (match Js.Json.decodeString (getf theme "mode") with
   | Some m when m <> "" ->
       Web_dom.doc_set_data "theme" m;
       Platform.local_storage_set "ui/theme" ("\"" ^ m ^ "\"");
       (* cljs state/set-custom-theme! — mode -> theme under one key *)
       Platform.local_storage_set "ui/custom-theme"
         (Js.Json.stringify theme)
   | _ -> ());
  (match Js.Json.decodeString (getf theme "url") with
   | Some u -> selected_theme := Some u
   | None -> ());
  hook_app "theme-changed" theme Js.Json.null

(* cljs select-a-plugin-theme: first theme of the pid -> selectTheme *)
let select_plugin_theme pid =
  match
    List.find_opt (fun th -> jstr th "pid" = pid) !installed_themes
  with
  | Some theme -> core_select_theme theme
  | None -> ()

(* cljs invoke-exported-api "invoke_external_plugin_cmd":
   :models -> caller.callUserModelAsync(key, ...args),
   :commands -> call-plugin-user-command! (finds the registered simple
   command and execs its action) *)
let invoke_external_plugin_cmd_fn a b c d =
  let pid = arg_string a |> Option.value ~default:"" in
  (match arg_string b with
   | Some "models" -> (
       match caller_of_pid pid with
       | Some caller ->
           call_user_model_async caller
             (arg_string c |> Option.value ~default:"")
             (match Js.Json.decodeArray d with
              | Some xs -> xs
              | None -> [||])
       | None -> ())
   | Some "commands" ->
       let key =
         normalize_cmd_key (arg_string c |> Option.value ~default:"")
       in
       exec_simple_command ~args:d pid key
   | _ -> ());
  resolved_nil

(* cljs __install_plugin requires {repo, id} and delegates to
   install-marketplace-plugin! *)
let __install_plugin_fn a _b _c _d =
  let repo = jstr a "repo" and id = jstr a "id" in
  if repo = "" || id = "" then resolved (jstr_ "[required] :repo :id")
  else (
    install_marketplace a;
    resolved_nil)

(* ---------- plugin files (localStorage mirrors of cljs fs fns) --------
   cljs storage-file-path normalizes root/file and asserts the result
   stays under root ("<action> file denied" otherwise). We store each
   file as a localStorage entry keyed "LSPUserDotRoot/<sub>/<file>";
   '..' segments that would escape the sub-root are denied. *)

let dotdir_norm sub file =
  let segs =
    String.split_on_char '/' (sub ^ "/" ^ file)
    |> List.filter (fun s -> s <> "" && s <> ".")
  in
  let rec go acc = function
    | [] -> Some acc
    | ".." :: rest -> (
        match acc with
        | [] -> None
        | _ :: tl -> go tl rest)
    | s :: rest -> go (s :: acc) rest
  in
  match go [] segs with
  | None -> None
  | Some parts -> Some ("LSPUserDotRoot/" ^ String.concat "/" (List.rev parts))

let json_text j =
  match Js.Json.decodeString j with
  | Some s -> s
  | None -> Js.Json.stringify j

let write_dotdir_file a b c _d =
  (* cljs write_dotdir_file(file, content, sub-root) *)
  match dotdir_norm (arg_string c |> Option.value ~default:"") (arg_string a |> Option.value ~default:"") with
  | Some key ->
      Platform.local_storage_set key (json_text b);
      resolved (jstr_ key)
  | None -> resolved_nil

let write_tmp_file a b _c _d =
  match dotdir_norm "tmp" (arg_string a |> Option.value ~default:"") with
  | Some key ->
      Platform.local_storage_set key (json_text b);
      resolved (jstr_ key)
  | None -> resolved_nil

let read_dotdir_file a b _c _d =
  match dotdir_norm (arg_string b |> Option.value ~default:"") (arg_string a |> Option.value ~default:"") with
  | Some key -> (
      match Platform.local_storage_get key with
      | Some s -> resolved (jstr_ s)
      | None -> resolved Js.Json.null)
  | None -> resolved_nil

let unlink_dotdir_file a b _c _d =
  (match
     dotdir_norm
       (arg_string b |> Option.value ~default:"")
       (arg_string a |> Option.value ~default:"")
   with
   | Some key -> Platform.local_storage_remove key
   | None -> ());
  resolved_nil

(* list localStorage keys under a "LSPUserDotRoot/<sub>/" prefix,
   returning paths relative to it (cljs listdir) *)
external ls_length : Js.Json.t -> int = "length" [@@mel.get]
external ls_key_at : Js.Json.t -> int -> string Js.Undefined.t = "key" [@@mel.send]

let dotdir_list sub =
  let prefix = "LSPUserDotRoot/" ^ sub ^ "/" in
  let plen = String.length prefix in
  match Platform.local_storage_obj with
  | None -> []
  | Some s ->
      let n = ls_length s in
      let rec collect i acc =
        if i >= n then acc
        else
          match Js.Undefined.toOption (ls_key_at s i) with
          | Some k
            when String.length k > plen
                 && String.sub k 0 plen = prefix ->
              collect (i + 1) (String.sub k plen (String.length k - plen) :: acc)
          | _ -> collect (i + 1) acc
      in
      collect 0 []

let list_dotdir_files a _b _c _d =
  let files = dotdir_list (arg_string a |> Option.value ~default:"") in
  resolved (Js.Json.array (Array.of_list (List.map jstr_ files)))

let exist_dotdir_file a b _c _d =
  resolved
    (Js.Json.boolean
       (match
          dotdir_norm
            (arg_string b |> Option.value ~default:"")
            (arg_string a |> Option.value ~default:"")
        with
        | Some key -> Option.is_some (Platform.local_storage_get key)
        | None -> false))

(* cljs plugin-storage-sub-root: "storages" / basename of the plugin id *)
let storage_sub_root pid =
  "storages/"
  ^
  match String.rindex_opt pid '/' with
  | Some i -> String.sub pid (i + 1) (String.length pid - i - 1)
  | None -> pid

let storage_root a b =
  dotdir_norm
    (storage_sub_root (arg_string a |> Option.value ~default:""))
    (arg_string b |> Option.value ~default:"")

let write_plugin_storage_file a b c _d =
  match storage_root a b with
  | Some key ->
      Platform.local_storage_set key (json_text c);
      resolved (jstr_ key)
  | None -> resolved_nil

let read_plugin_storage_file a b _c _d =
  match storage_root a b with
  | Some key -> (
      match Platform.local_storage_get key with
      | Some s -> resolved (jstr_ s)
      | None -> Js.Promise.reject (Failure "file not existed"))
  | None -> resolved_nil

let unlink_plugin_storage_file a b _c _d =
  (match storage_root a b with
   | Some key -> Platform.local_storage_remove key
   | None -> ());
  resolved_nil

let exist_plugin_storage_file a b _c _d =
  resolved
    (Js.Json.boolean
       (match storage_root a b with
        | Some key -> Option.is_some (Platform.local_storage_get key)
        | None -> false))

let ls_prefix_keys prefix f =
  match Platform.local_storage_obj with
  | None -> ()
  | Some s ->
      let n = ls_length s in
      let rec collect i acc =
        if i >= n then acc
        else
          match Js.Undefined.toOption (ls_key_at s i) with
          | Some k
            when String.length k > String.length prefix
                 && String.sub k 0 (String.length prefix) = prefix ->
              collect (i + 1) (k :: acc)
          | _ -> collect (i + 1) acc
      in
      f (collect 0 [])

let clear_plugin_storage_files a _b _c _d =
  (match arg_string a with
   | Some pid ->
       ls_prefix_keys
         ("LSPUserDotRoot/" ^ storage_sub_root pid ^ "/")
         (List.iter Platform.local_storage_remove)
   | None -> ());
  resolved_nil

let list_plugin_storage_files a _b _c _d =
  let files =
    match arg_string a with
    | Some pid -> dotdir_list (storage_sub_root pid)
    | None -> []
  in
  resolved (Js.Json.array (Array.of_list (List.map jstr_ files)))

(* ---------- settings surface (used by dialogs/plugins_view) ---------- *)

let plugin_settings_schema pid =
  match Js.Dict.get installed pid with
  | Some p -> (
      match Js.Json.decodeArray (getf p "settingsSchema") with
      | Some xs -> Array.to_list xs
      | None -> [])
  | None -> []

let plugin_settings_obj pid =
  match Js.Dict.get installed pid with
  | Some p -> (
      match Js.Json.classify (getf p "settings") with
      | Js.Json.JSONObject _ -> Some (getf p "settings")
      | _ -> None)
  | None -> None

(* pl.settings.toJSON() — current values incl. schema defaults *)
let plugin_settings_json pid =
  match plugin_settings_obj pid with
  | Some s -> settings_to_json s
  | None -> jobj []

(* pl.settings.set(k, v) — the settings EE persists via
   save_plugin_user_settings and emits settings-changed itself *)
let plugin_set_setting pid k v =
  match plugin_settings_obj pid with
  | Some s -> settings_set s k v
  | None -> ()

(* code-mode save replaces the whole settings object *)
let replace_plugin_settings pid j =
  match plugin_settings_obj pid with
  | Some s -> settings_assign s j
  | None -> ()

(* ---------- install / update / toast helpers ---------- *)

let unregister_plugin = core_unregister

(* cljs check-or-update-marketplace-plugin! — fetch the r2 entry and
   emit lsp-updates like async-install-or-update-for-web!; the
   onlyCheck payload carries latest-version (no webPkg) *)
let check_or_update id repo only_check =
  ignore
    ((let* r = fetch_ (r2_entry_url repo "") in
     let* web_pkg = resp_json r in
     let payload =
       if only_check then
         jobj
           [ ("id", jstr_ id)
           ; ("latest-version", getf web_pkg "version")
           ]
       else
         jobj
           [ ("id", jstr_ id)
           ; ("dst", jstr_ repo)
           ; ("version", getf web_pkg "version")
           ; ("webPkg", web_pkg)
           ]
     in
     ignore
       (meth (getf window_ "apis") "emit"
          [| jstr_ "lsp-updates"
           ; jobj
               [ ("status", jstr_ "completed")
               ; ("onlyCheck", Js.Json.boolean only_check)
               ; ("payload", payload)
               ]
          |]);
     Js.Promise.resolve Js.Json.null)
    |> Js.Promise.catch (fun _e -> Js.Promise.resolve Js.Json.null))

let update_version id = Hashtbl.find_opt updates id

let installed_version pid =
  match Js.Dict.get installed pid with
  | Some pl -> jstr (getf pl "options") "version"
  | None -> ""

let toast msg cls =
  Web_dom.dispatch_custom "ls:toast"
    (jobj [ ("msg", jstr_ msg); ("cls", jstr_ cls) ])

(* ---------- plugin host api fns ---------- *)

let nil_fn _a _b _c _d = resolved_nil
let false_fn _a _b _c _d = resolved (Js.Json.boolean false)
let install_plugin_hook_fn a b _c _d =
  (match arg_string a, arg_string b with
   | Some pid, Some key when pid <> "" && key <> "" ->
       Hashtbl.replace (tbl_for plugin_hooks key) pid ()
   | _ -> ());
  resolved_nil

(* cljs uninstall-plugin-hook: true drops every hook of the pid *)
let uninstall_plugin_hook_fn a b _c _d =
  let pid = arg_string a |> Option.value ~default:"" in
  (match Js.Json.decodeBoolean b with
   | Some true ->
       Hashtbl.iter (fun _ m -> Hashtbl.remove m pid) plugin_hooks
   | _ -> (
       match arg_string b with
       | Some "all" ->
           Hashtbl.iter (fun _ m -> Hashtbl.remove m pid) plugin_hooks
       | Some key -> (
           match Hashtbl.find_opt plugin_hooks key with
           | Some m -> Hashtbl.remove m pid
           | None -> ())
       | None -> ()));
  resolved_nil

(* the core's _hook compat path reads this synchronously via
   invokeHostExportedApi and tests its truthiness — must be a plain
   boolean, not a Promise (awaiting a plain value is still fine for
   every async caller) *)
let should_exec_plugin_hook_fn a b _c _d =
  Js.Promise.resolve
    (Js.Json.boolean
       (match arg_string a, arg_string b with
        | Some pid, Some key -> hook_installed pid key
        | _ -> false))

let register_plugin_simple_command_fn a b c _d =
  let pid = arg_string a |> Option.value ~default:"" in
  let ok =
    match Js.Json.decodeArray b with
    | Some [| cmd; action |] -> (
        match Js.Json.decodeArray action with
        | Some [| _step; event |] ->
            let key = normalize_cmd_key (jstr cmd "key") in
            let event =
              Js.Json.decodeString event |> Option.value ~default:""
            in
            if
              pid <> "" && key <> "" && event <> ""
              && Option.is_some (Js.Dict.get installed pid)
            then (
              Hashtbl.replace
                (tbl_for simple_commands pid)
                key
                { sc_cmd = cmd
                ; sc_event = event
                ; sc_palette =
                    (match Js.Json.decodeBoolean c with
                     | Some v -> v
                     | None -> false)
                };
              bump ();
              true)
            else false
        | _ -> false)
    | _ -> false
  in
  resolved (Js.Json.boolean ok)

let unregister_plugin_simple_command_fn a b _c _d =
  let pid = arg_string a |> Option.value ~default:"" in
  (match arg_string b with
   | Some key when key <> "" -> (
       match Hashtbl.find_opt simple_commands pid with
       | Some t -> Hashtbl.remove t (normalize_cmd_key key)
       | None -> ())
   | _ -> Hashtbl.remove simple_commands pid);
  bump ();
  resolved_nil

let register_plugin_slash_command_fn a b _c _d =
  let pid = arg_string a |> Option.value ~default:"" in
  (match Js.Json.decodeArray b with
   | Some [| tag; actions |] ->
       let tag = Js.Json.decodeString tag |> Option.value ~default:"" in
       let steps =
         Js.Json.decodeArray actions
         |> Option.map Array.to_list
         |> Option.value ~default:[]
       in
       if
         pid <> "" && tag <> ""
         && Option.is_some (Js.Dict.get installed pid)
       then (
         Hashtbl.replace (tbl_for slash_commands pid) tag steps;
         bump ())
   | _ -> ());
  resolved (Js.Json.boolean true)

let unregister_plugin_slash_command_fn a b _c _d =
  let pid = arg_string a |> Option.value ~default:"" in
  (match arg_string b with
   | Some tag when tag <> "" -> (
       match Hashtbl.find_opt slash_commands pid with
       | Some t -> Hashtbl.remove t tag
       | None -> ())
   | _ -> Hashtbl.remove slash_commands pid);
  resolved_nil

(* cljs register-plugin-global-keybinding-command — recorded so
   clear_plugin_resources drops it; no host keybinding dispatcher on
   web *)
let register_global_keybinding_cmd_fn a b c _d =
  (match arg_string a, arg_string b with
   | Some pid, Some key when pid <> "" && key <> "" ->
       Hashtbl.replace (tbl_for global_keybinding_cmds pid) key c
   | _ -> ());
  resolved (Js.Json.boolean true)

let unregister_global_keybinding_cmd_fn a b _c _d =
  let pid = arg_string a |> Option.value ~default:"" in
  (match arg_string b with
   | Some key when key <> "" -> (
       match Hashtbl.find_opt global_keybinding_cmds pid with
       | Some t -> Hashtbl.remove t key
       | None -> ())
   | _ -> Hashtbl.remove global_keybinding_cmds pid);
  resolved_nil

let unregister_ui_item a b c _d =
  (match arg_string a, arg_string b with
   | Some pid, Some ty ->
       let key = jstr c "key" in
       items :=
         List.filter
           (fun it ->
             not
               (it.it_pid = pid
                && it.it_type = ty
                && jstr it.it_opts "key" = key))
           !items;
       bump ()
   | _ -> ());
  resolved_nil

(* cljs update-plugin-info sets a field on the plugin's options *)
let update_plugin_info_fn a b c _d =
  (match arg_string a, arg_string b with
   | Some pid, Some k -> (
       match Js.Dict.get installed pid with
       | Some pl ->
           setf (getf pl "options") k c;
           bump ()
       | None -> ())
   | _ -> ());
  resolved_nil

let load_installed_plugins _a _b _c _d =
  resolved (Js.Json.object_ (read_dict store_key))

let save_installed_plugin a _b _c _d =
  let key = jstr a "key" in
  if key <> "" then (
    let m = read_dict store_key in
    Js.Dict.set m key a;
    write_dict store_key m);
  resolved_nil

let unlink_installed_plugin a _b _c _d =
  let key =
    match arg_string a with Some s -> s | None -> jstr a "key"
  in
  if key <> "" then (
    let m = read_dict store_key in
    ignore (del_prop (Js.Json.object_ m) key);
    write_dict store_key m);
  resolved_nil

let load_plugin_settings a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some pid ->
      let path = settings_key pid in
      let data =
        match Js.Json.classify (read_json path) with
        | Js.Json.JSONObject _ -> read_json path
        | _ -> jobj []
      in
      resolved
        (Js.Json.array [| jstr_ path; data |])

let save_plugin_settings a b _c _d =
  (match arg_string a with
   | Some pid ->
       Platform.local_storage_set (settings_key pid)
         (Js.Json.stringify b)
   | None -> ());
  resolved_nil

let unlink_plugin_settings a _b _c _d =
  (match arg_string a with
   | Some pid -> ls_remove (settings_key pid)
   | None -> ());
  resolved_nil

let load_user_preferences _a _b _c _d = resolved (read_json prefs_key)

let save_user_preferences a _b _c _d =
  Platform.local_storage_set prefs_key (Js.Json.stringify a);
  resolved_nil

let register_ui_item a b c _d =
  (match arg_string a, arg_string b with
   | Some pid, Some ty ->
       (* no installed-presence gate: on a fresh install the plugin's
          provideUI can reach us before the core 'registered' event
          fills `installed` — gating would drop the item and the
          toolbar trigger would never appear (cljs stores it
          unconditionally) *)
       let key = jstr c "key" in
       items :=
         List.filter
           (fun it ->
             not
               (it.it_pid = pid
                && it.it_type = ty
                && jstr it.it_opts "key" = key))
           !items
         @ [ { it_pid = pid; it_type = ty; it_opts = c } ];
       bump ()
   | _ -> ());
  resolved_nil

let unregister_ui_items a _b _c _d =
  (match arg_string a with
   | Some pid ->
       items := List.filter (fun it -> it.it_pid <> pid) !items;
       bump ()
   | None -> ());
  resolved_nil

let get_external_plugin a _b _c _d =
  match arg_string a with
  | Some pid -> (
      match Js.Dict.get installed pid with
      | Some pl -> resolved (meth pl "toJSON" [| Js.Json.boolean true |])
      | None -> resolved_nil)
  | None -> resolved_nil

let get_caller_plugin_id _a _b _c _d =
  let v = getf window_ "$$callerPluginID" in
  if Js.typeof v = "undefined" then resolved_nil else resolved v

let get_app_info _a _b _c _d =
  resolved (jobj [ ("version", jstr_ "0.0.0"); ("supportDb", Js.Json.boolean true) ])

let check_is_db_graph _a _b _c _d = resolved (Js.Json.boolean true)

(* cljs get_user_configs -> state/get-config surface;
   preferredDateFormat = :journal/page-title-format from config.edn,
   default "MMM do, yyyy" (cljs state/default-date-formatter) *)
let get_user_configs _a _b _c _d =
  let* cfg = Sdk_config.read_config (repo ()) in
  let fmt =
    match Wire.get cfg "journal/page-title-format" with
    | Some (Wire.String s) -> s
    | _ -> "MMM do, yyyy"
  in
  resolved
    (jobj
       [ ("preferredDateFormat", jstr_ fmt)
       ; ("preferredStartOfWeek", Js.Json.number 0.)
       ; ("currentGraph", jstr_ (repo ()))
       ])

(* LSPluginCore event wiring (cljs init-plugins! doto block). *)
let core_listeners (core : Js.Json.t) =
  let on name f = ignore (Web_dom.js_call2 core "on" (jstr_ name) f) in
  on "registered" (fun pl -> track pl);
  on "reloaded" (fun pl -> track pl);
  on "unregistered" (fun pid ->
      let pid = pid_of_event pid in
      clear_plugin_resources pid;
      unlink_pid pid);
  on "beforereload" (fun pl -> clear_plugin_resources (pid_of_event pl));
  on "disabled" (fun pid -> clear_plugin_resources (pid_of_event pid));
  on "unlink-plugin" (fun pid -> unlink_pid (pid_of_event pid));
  on "themes-changed" (fun themes _b ->
      installed_themes :=
        (match Js.Json.decodeObject themes with
         | Some o ->
             Js.Dict.entries o
             |> Array.to_list
             |> List.concat_map (fun (pid, vs) ->
                    match Js.Json.decodeArray vs with
                    | Some xs ->
                        Array.to_list xs
                        |> List.map (fun v ->
                               (match Js.Json.decodeObject v with
                                | Some vo ->
                                    Js.Dict.set vo "pid" (jstr_ pid)
                                | None -> ());
                               v)
                    | None -> [])
         | None -> []);
      bump ());
  on "theme-selected" (fun theme _b -> apply_theme_mode theme);
  (* the core's settings EE already persisted via
     save_plugin_user_settings — bump so an open settings view
     re-renders *)
  on "settings-changed" (fun _pid _s -> bump ());
  on "error" (fun e _b ->
      (* cljs only surfaces IllegalPluginPackageError *)
      if jstr e "name" = "IllegalPluginPackageError" then (
        let detail =
          match Js.Json.decodeString (getf e "packageJsonPath") with
          | Some p when p <> "" -> "\n" ^ p
          | _ -> ""
        in
        toast
          (I18n.t "plugin.package-config/parse-error" ^ detail)
          "error"))

(* cljs init-plugins!: LSPlugin.setupPluginCore {localUserConfigRoot:
   "LSPUserDotRoot/"}, listeners, LSPluginCore.register(saved, true),
   then LSPluginCore.hostMounted() once the host is mounted *)
let setup () =
  (match Js.typeof (getf window_ "apis") with
   | "undefined" -> setf window_ "apis" (new_ee3 ())
   | _ -> ());
  ignore
    (meth (lsplugin ()) "setupPluginCore"
       [| jobj
            [ ("localUserConfigRoot", jstr_ "LSPUserDotRoot/")
            ; ("dotConfigRoot", jstr_ "LSPUserDotRoot/")
            ]
       |]);
  core_listeners (core ());
  ignore
    (Web_dom.js_call2 (getf window_ "apis") "addListener"
       (jstr_ "lsp-updates") on_lsp_update);
  boot_register ();
  host_mounted ()

(* kept annotation-free to avoid a Plugin_host <-> Sdk_api module
   cycle; the shape must match Sdk_api.api_fn *)
let api_methods =
  [ "load_installed_web_plugins", load_installed_plugins
  ; "save_installed_web_plugin", save_installed_plugin
  ; "unlink_installed_web_plugin", unlink_installed_plugin
  ; "load_plugin_user_settings", load_plugin_settings
  ; "save_plugin_user_settings", save_plugin_settings
  ; "update_plugin_user_settings", save_plugin_settings
  ; "unlink_plugin_user_settings", unlink_plugin_settings
  ; "load_user_preferences", load_user_preferences
  ; "save_user_preferences", save_user_preferences
  ; "register_plugin_ui_item", register_ui_item
  ; "unregister_plugin_ui_items", unregister_ui_items
  ; "register_plugin_ui_items", register_ui_item
  ; "install_plugin_hook", install_plugin_hook_fn
  ; "uninstall_plugin_hook", uninstall_plugin_hook_fn
  ; "register_plugin_simple_command", register_plugin_simple_command_fn
  ; "unregister_plugin_simple_command", unregister_plugin_simple_command_fn
  ; "register_plugin_slash_command", register_plugin_slash_command_fn
  ; "unregister_plugin_slash_command", unregister_plugin_slash_command_fn
  ; "register_plugin_global_keybinding_cmd", register_global_keybinding_cmd_fn
  ; "unregister_plugin_global_keybinding_cmd", unregister_global_keybinding_cmd_fn
  ; "register_search_service", nil_fn
  ; "unregister_search_services", nil_fn
  ; "unregister_plugin_ui_item", unregister_ui_item
  ; "load_plugin_readme", nil_fn
  ; "load_plugin_config", nil_fn
  ; "write_dotdir_file", write_dotdir_file
  ; "write_plugin_dotdir_file", write_dotdir_file
  ; "write_user_tmp_file", write_tmp_file
  ; "read_dotdir_file", read_dotdir_file
  ; "unlink_dotdir_file", unlink_dotdir_file
  ; "list_dotdir_files", list_dotdir_files
  ; "exist_dotdir_file", exist_dotdir_file
  ; "save_plugin_package_json", nil_fn
  ; "read_plugin_storage_file", read_plugin_storage_file
  ; "write_plugin_storage_file", write_plugin_storage_file
  ; "unlink_plugin_storage_file", unlink_plugin_storage_file
  ; "exist_plugin_storage_file", exist_plugin_storage_file
  ; "clear_plugin_storage_files", clear_plugin_storage_files
  ; "list_plugin_storage_files", list_plugin_storage_files
  ; "update_plugin_info", update_plugin_info_fn
  ; "get_external_plugin", get_external_plugin
  ; "invoke_external_plugin_cmd", invoke_external_plugin_cmd_fn
  ; "validate_external_plugins", false_fn
  ; "__install_plugin", __install_plugin_fn
  ; "get_caller_plugin_id", get_caller_plugin_id
  ; "should_exec_plugin_hook", should_exec_plugin_hook_fn
  ; "get_app_info", get_app_info
  ; "check_current_is_db_graph", check_is_db_graph
  ; "get_user_configs", get_user_configs
  (* main-ui visibility — plugins own no main UI surface yet, so these
     are no-ops that must still resolve (a missing method aborts the
     plugin's promise chain before e.g. push_state runs) *)
  ; "show_main_ui", nil_fn
  ; "hide_main_ui", nil_fn
  ; "toggle_main_ui", nil_fn
  ; "set_main_ui_inline_style", nil_fn
  ; "set_main_ui_attrs", nil_fn
  ]
