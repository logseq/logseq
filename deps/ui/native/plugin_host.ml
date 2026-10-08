(* Native twin of sdk/plugin_host.ml. The JS plugin runtime
   (LSPluginCore sandbox) does not exist on native — plugins never
   execute code here — but the registry, install metadata and settings
   ARE supported: installed plugins persist in localStorage under the
   same LSPUserDotRoot keys as web, marketplace browsing/install
   metadata comes through Fetch's http-get host channel, and
   enable/disable + settings edits round-trip locally.

   Documented deferral vs web (docs/gpui-gaps.md): plugin-provided UI
   (toolbar items, slash commands, hooks, themes) stays empty — those
   all evaluate plugin JS. *)

type ui_item = { it_pid : string; it_type : string; it_opts : Js.Json.t }

let getf (o : Js.Json.t) (k : string) : Js.Json.t =
  match o with
  | Js.Json.JObject kvs -> (
      match List.assoc_opt k kvs with
      | Some v -> v
      | None -> Js.Json.JNull)
  | _ -> Js.Json.JNull

let jstr o k = Option.value ~default:"" (Js.Json.decodeString (getf o k))
let jbool o k = Option.value ~default:false (Js.Json.decodeBoolean (getf o k))
let jobj pairs = Js.Json.object_list pairs
let jstr_ s = Js.Json.string s

(* plugin records are plain JSON on native — toJSON is the identity *)
let meth (o : Js.Json.t) (m : string) (_args : Js.Json.t array)
    : Js.Json.t =
  if m = "toJSON" then o else Js.Json.JNull

(* ---------- persistence (localStorage, web key shape) ---------- *)

let store_key = "LSPUserDotRoot/installed-plugins-for-web/all.json"
let settings_key pid = "LSPUserDotRoot/settings/" ^ pid ^ ".json"
let prefs_key = "LSPUserDotRoot/preferences.json"

let read_json key =
  match Platform.local_storage_get key with
  | Some s -> (
      try Js.Json.parseExn s with _ -> Js.Json.JNull)
  | None -> Js.Json.JNull

let read_dict key =
  match read_json key with
  | Js.Json.JObject kvs -> (
      let d = Js.Dict.empty () in
      List.iter (fun (k, v) -> Js.Dict.set d k v) kvs;
      d)
  | _ -> Js.Dict.empty ()

let write_dict key (d : Js.Json.t Js.Dict.t) =
  Platform.local_storage_set key (Js.Json.stringify (Js.Json.object_ d))

let read_obj key : Js.Json.t =
  match read_json key with
  | Js.Json.JObject _ as o -> o
  | _ -> Js.Json.JObject []

(* ---------- installed registry ---------- *)

let installed : Js.Json.t Js.Dict.t = Js.Dict.empty ()
let updates : (string, string) Hashtbl.t = Hashtbl.create 4

(* dirty bumps repaint the dialogs — same pattern as the web host *)
module Dirty = struct
  let st : int Signal.state option ref = ref None

  let get_or_init (owner : Signal.scheduler) : int Signal.signal =
    let s = Signal.state owner 0 in
    (match !st with None -> st := Some s | Some _ -> ());
    Signal.value s
end

let dirty_signal (owner : Signal.scheduler) : int Signal.signal =
  Dirty.get_or_init owner

let dirty_value (owner : Signal.scheduler) : int Signal.signal =
  Dirty.get_or_init owner

let bump () =
  match !Dirty.st with
  | Some s -> Signal.update s succ
  | None -> ()

let key_of_pid pid = "lsp." ^ pid

let persist_all () =
  let d = read_dict store_key in
  Js.Dict.keys installed
  |> Array.iter (fun pid ->
         match Js.Dict.get installed pid with
         | Some pl -> (
             let j = meth pl "toJSON" [||] in
             let k =
               let v = jstr j "key" in
               if v = "" then key_of_pid pid else v
             in
             Js.Dict.set d k
               (jobj
                  [ ("key", jstr_ k)
                  ; ("dst", jstr_ (jstr j "dst"))
                  ; ("version", jstr_ (jstr j "version"))
                  ; ("payload", j) ]))
         | None -> ());
  write_dict store_key d

let track (pl : Js.Json.t) =
  let j = meth pl "toJSON" [||] in
  let pid = jstr j "id" in
  if pid <> "" then begin
    Js.Dict.set installed pid pl;
    bump ()
  end

let clear_pid pid =
  Js.Dict.delete installed pid;
  let d = read_dict store_key in
  d |> Js.Dict.keys
  |> Array.iter (fun k ->
         let e = Js.Dict.unsafeGet d k in
         if jstr (getf e "payload") "id" = pid then Js.Dict.delete d k);
  write_dict store_key d

let unlink_pid = clear_pid
let update_version id = Hashtbl.find_opt updates id

(* boot: load persisted installs *)
let boot_register () =
  let d = read_dict store_key in
  d |> Js.Dict.keys
  |> Array.iter (fun k ->
         let e = Js.Dict.unsafeGet d k in
         let payload = getf e "payload" in
         let pid = jstr payload "id" in
         if pid <> "" then Js.Dict.set installed pid payload)

(* ---------- pinned / prefs ---------- *)

let pinned () : string list =
  match Js.Json.decodeArray (getf (read_obj prefs_key) "pinned") with
  | Some xs ->
      Array.to_list xs |> List.filter_map Js.Json.decodeString
  | None -> []

let toggle_pinned pkey =
  let cur = pinned () in
  let next =
    if List.mem pkey cur then List.filter (fun p -> p <> pkey) cur
    else cur @ [ pkey ]
  in
  Platform.local_storage_set prefs_key
    (Js.Json.stringify
       (jobj [ ("pinned", Js.Json.array (Array.of_list (List.map jstr_ next))) ]));
  bump ()

(* ---------- marketplace ---------- *)

let marketplace_url =
  "https://raw.githubusercontent.com/logseq/marketplace/master/plugins.json"

let stats_url =
  "https://raw.githubusercontent.com/logseq/marketplace/master/stats.json"

let marketplace : Js.Json.t Js.Promise.t option ref = ref None
let marketplace_stats : Js.Json.t Js.Promise.t option ref = ref None

let ( let* ) p f = Js.Promise.then_ f p

let fetch_json url =
  let* r = Fetch.fetch url in
  Fetch.Response.json r

let marketplace_pkgs (owner : Signal.scheduler) =
  match !marketplace with
  | Some p -> p
  | None ->
      let p =
        let* j = fetch_json marketplace_url in
        let pkgs =
          match Js.Json.decodeArray (getf j "packages") with
          | Some xs -> Array.to_list xs
          | None -> []
        in
        (* web platform filter: web:true or effect not true — on the
           native host plugins still can't execute JS, so this filter
           selects the same set web shows *)
        let pkgs =
          List.filter
            (fun p -> jbool p "web" || not (jbool p "effect"))
            pkgs
        in
        bump ();
        Js.Promise.resolve (Js.Json.array (Array.of_list pkgs))
      in
      marketplace := Some p;
      ignore (dirty_signal owner);
      p

let fetch_stats () =
  match !marketplace_stats with
  | Some p -> p
  | None ->
      let p =
        (let* j = fetch_json stats_url in
         bump ();
         Js.Promise.resolve j)
        |> Js.Promise.catch (fun _ -> Js.Promise.resolve Js.Json.null)
      in
      marketplace_stats := Some p;
      p

type pkg_stat = { stars : int; downloads : int }

let package_stat stats id =
  match Js.Json.classify stats with
  | Js.Json.JSONObject _ -> (
      let s = getf stats id in
      match Js.Json.classify s with
      | Js.Json.JSONObject _ ->
          let stars =
            Option.value
              ~default:0.
              (Js.Json.decodeNumber (getf s "stargazers_count"))
            |> int_of_float
          in
          let downloads =
            match Js.Json.decodeArray (getf s "releases") with
            | Some rels ->
                Array.fold_left
                  (fun acc rel ->
                    match Js.Json.decodeArray rel with
                    | Some r when Array.length r > 2 -> (
                        match Js.Json.decodeNumber r.(2) with
                        | Some n -> acc + int_of_float n
                        | None -> acc)
                    | _ -> acc)
                  0 rels
            | None -> 0
          in
          Some { stars; downloads }
      | _ -> None)
  | _ -> None

(* cljs plugin-handler/pkg-asset *)
let pkg_asset id asset =
  if asset = "" then ""
  else if String.length asset >= 4 && String.sub asset 0 4 = "http"
  then asset
  else
    let rec strip s =
      if String.length s > 0 && (s.[0] = '.' || s.[0] = '/') then
        strip (String.sub s 1 (String.length s - 1))
      else s
    in
    let a = strip asset in
    if a = "" then ""
    else
      "https://raw.githubusercontent.com/logseq/marketplace/master/packages/"
      ^ id ^ "/" ^ a

let gh_repo_url repo = "https://github.com/" ^ repo

let r2_entry_url repo version =
  "https://plugins.logseq.io/r2/" ^ repo ^ "/" ^ version

(* cljs async-install-or-update-for-web! minus the apis.emit hop —
   registers the payload directly into the local registry *)
let install_marketplace pkg =
  let repo = jstr pkg "repo" in
  if
    repo <> ""
    && Js.Dict.get installed (jstr pkg "id") = None
  then
    ignore
      ((let* web_pkg = fetch_json (r2_entry_url repo "") in
        let version = jstr web_pkg "version" in
        track
          (jobj
             [ ("id", getf pkg "id")
             ; ("name", getf pkg "title")
             ; ("title", getf pkg "title")
             ; ("icon", getf pkg "icon")
             ; ("author", getf pkg "author")
             ; ("repo", jstr_ repo)
             ; ("dst", jstr_ repo)
             ; ("version", jstr_ version)
             ; ("webPkg", web_pkg)
             ; ("disabled", Js.Json.boolean false) ]);
        persist_all ();
        Js.Promise.resolve Js.Json.null)
       |> Js.Promise.catch (fun _ -> Js.Promise.resolve Js.Json.null))

let check_or_update id repo only_check =
  ignore
    ((let* web_pkg = fetch_json (r2_entry_url repo "") in
      let version = jstr web_pkg "version" in
      if only_check then begin
        if version <> "" then Hashtbl.replace updates id version;
        bump ()
      end
      else (
        match Js.Dict.get installed id with
        | Some pl -> (
            let j = meth pl "toJSON" [||] in
            match j with
            | Js.Json.JObject kvs ->
                let kvs =
                  List.filter
                    (fun (k, _) -> k <> "version" && k <> "webPkg") kvs
                in
                Js.Dict.set installed id
                  (Js.Json.JObject
                     ( kvs
                     @ [ ("version", jstr_ version)
                       ; ("webPkg", web_pkg) ] ));
                persist_all ();
                Hashtbl.remove updates id;
                bump ()
            | _ -> ())
        | None -> ());
      Js.Promise.resolve Js.Json.null)
     |> Js.Promise.catch (fun _ -> Js.Promise.resolve Js.Json.null))

let unregister_plugin pid =
  clear_pid pid;
  bump ()

let set_plugin_disabled pid disabled =
  match Js.Dict.get installed pid with
  | Some pl -> (
      match meth pl "toJSON" [||] with
      | Js.Json.JObject kvs ->
          Js.Dict.set installed pid
            (Js.Json.JObject
               (( "disabled", Js.Json.boolean disabled )
                :: List.filter (fun (k, _) -> k <> "disabled") kvs));
          persist_all ();
          bump ()
      | _ -> ())
  | None -> ()

let has_installed_plugins () = Array.length (Js.Dict.keys installed) > 0

(* ---------- settings ---------- *)

let plugin_settings_schema pid =
  match Js.Dict.get installed pid with
  | Some p -> (
      match Js.Json.decodeArray (getf p "settingsSchema") with
      | Some xs -> Array.to_list xs
      | None -> [])
  | None -> []

let read_settings pid =
  match read_json (settings_key pid) with
  | Js.Json.JObject _ as o -> o
  | _ -> Js.Json.JObject []

let write_settings pid j =
  Platform.local_storage_set (settings_key pid)
    (Js.Json.stringify j)

(* pl.settings.toJSON() — current values; schema defaults are applied
   by the view via `default` fields when a key is absent *)
let plugin_settings_json pid = read_settings pid

let setf j k v =
  match j with
  | Js.Json.JObject kvs ->
      Js.Json.JObject
        ((k, v) :: List.filter (fun (k', _) -> k' <> k) kvs)
  | _ -> jobj [ (k, v) ]

let plugin_set_setting pid k v =
  write_settings pid (setf (read_settings pid) k v)

let replace_plugin_settings pid j = write_settings pid j

(* button actions call into plugin JS — no runtime on native *)
let call_button_action _pid _action _key = ()
let load_plugin_readme (_a : Js.Json.t) (_b : Js.Json.t)
    (_c : Js.Json.t) (_d : Js.Json.t) : Js.Json.t Js.Promise.t =
  Js.Promise.resolve Js.Json.null

(* ---------- JS-runtime surfaces: empty on native ---------- *)

let toolbar_items () : ui_item list = []
let slot_id it =
  "pl-injected-ui-item-pl-" ^ jstr it.it_opts "key" ^ "-" ^ it.it_pid

let inject_toolbar_ui () = ()
let slash_cmd_tags () : (string * string) list = []
let exec_slash_command ?insert:_ _pid _tag = ()
let fire_db_hooks (_ : Wire.t) = ()
let fire_route_changed (_ : Model.route) = ()

(* kept annotation-free to avoid a Plugin_host <-> Sdk_api module
   cycle; the shape must match Sdk_api.api_fn *)
let api_methods = []

let setup () = boot_register ()

let palette_commands () : Commands_data.cmd list = []
let exec_palette_command (_cid : string) : unit = ()

let open_settings_pid : string option ref = ref None
let pending_dialog_tab : string option ref = ref None
let hook_app (_ : string) (_ : Js.Json.t) (_ : Js.Json.t) = ()
let fire_theme_mode_changed (_ : string) = ()
let fire_sidebar_visible_changed (_ : bool) = ()
let fire_current_graph_changed () = ()
let simple_commands_of_type (_ : string) : (string * string * string) list = []
let exec_simple_command ?args:_ ?ctx:_ (_ : string) (_ : string) = ()
let item_slot (_ : ui_item) : string = ""
let ui_items_of_type (_ : string) : ui_item list = []
let make_asset_url (_ : Js.Json.t) (_ : Js.Json.t) (_ : Js.Json.t)
    (_ : Js.Json.t) : Js.Json.t Js.Promise.t = Js.Promise.resolve Js.Json.null
let open_pdf_viewer (_ : Js.Json.t) (_ : Js.Json.t) (_ : Js.Json.t)
    (_ : Js.Json.t) : Js.Json.t Js.Promise.t = Js.Promise.resolve Js.Json.null
