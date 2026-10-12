(* Native stub of sdk/plugin_host.ml — the JS plugin runtime
   (LSPluginCore sandbox) does not exist on native, so every surface
   reports "no plugins". api_methods stays empty so Sdk_api installs
   cleanly. *)

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

let dirty : int Signal.state option ref = ref None

let dirty_signal (owner : Signal.scheduler) : int Signal.signal =
  let st = Signal.state owner 0 in
  dirty := Some st;
  Signal.value st

let dirty_value (owner : Signal.scheduler) : int Signal.signal =
  match !dirty with
  | Some st -> Signal.value st
  | None ->
      let st = Signal.state owner 0 in
      dirty := Some st;
      Signal.value st
let toolbar_items () : ui_item list = []
let has_installed_plugins () = false
let slot_id it = "pl-injected-ui-item-pl-" ^ jstr it.it_opts "key" ^ "-" ^ it.it_pid
let inject_toolbar_ui () = ()
let pinned () : string list = []
let toggle_pinned (_ : string) = ()
let slash_cmd_tags () : (string * string) list = []
let exec_slash_command ?insert:_ _pid _tag = ()
let fire_db_hooks (_ : Wire.t) = ()
let fire_route_changed (_ : Model.route) = ()

(* kept annotation-free to avoid a Plugin_host <-> Sdk_api module
   cycle; the shape must match Sdk_api.api_fn *)
let api_methods = []

let setup () = ()

let palette_commands () : Commands_data.cmd list = []

let exec_palette_command (_cid : string) : unit = ()

let jobj pairs = Js.Json.object_ (Js.Dict.fromList pairs)
let jstr_ s = Js.Json.string s
let meth _o _m _args : Js.Json.t = Js.Json.null
let installed : Js.Json.t Js.Dict.t = Js.Dict.empty ()

let bump () =
  match !dirty with
  | Some s -> Runtime.signal_set s (Runtime.signal_get s + 1)
  | None -> ()

(* Minimal HTTPS fetch through the platform curl binary — the daemon's
   HTTP client is localhost-only and the switch has no TLS stack, so
   marketplace JSON arrives via a background curl process whose result
   is enqueued back onto the app thread (the daemon_client ipc
   pattern). *)
let https_get (url : string) : string option =
  match
    (try
       Some
         (Unix.open_process_args_in "curl"
            [| "curl"; "-sfL"; "--max-time"; "15"; url |])
     with _ -> None)
  with
  | None -> None
  | Some ic -> (
      let b = Buffer.create 16384 in
      (try
         while true do
           Buffer.add_channel b ic 4096
         done
       with End_of_file -> ());
      match Unix.close_process_in ic with
      | Unix.WEXITED 0 ->
          let s = Buffer.contents b in
          if s = "" then None else Some s
      | _ -> None)

(* background curl -> parse -> enqueue the callback on the app thread *)
let https_json (url : string) (k : Js.Json.t -> unit) : unit =
  ignore
    (Thread.create
       (fun () ->
         let j =
           match https_get url with
           | Some body -> (
               try Js.Json.parseExn body with _ -> Js.Json.null)
           | None -> Js.Json.null
         in
         Host.enqueue (fun () -> k j))
       ())

let marketplace_url =
  "https://raw.githubusercontent.com/logseq/marketplace/master/plugins.json"

let marketplace : Js.Json.t Js.Promise.t option ref = ref None

(* cljs plugin-handler/load-marketplace-plugins: packages list, kept on
   the web platform filter; the fetch lands async while the view already
   renders its loading state *)
let marketplace_pkgs (owner : Signal.scheduler) : Js.Json.t Js.Promise.t =
  match !marketplace with
  | Some p -> p
  | None -> (
      let p, resolve, _reject = Js.Promise.pending () in
      marketplace := Some p;
      https_json marketplace_url (fun j ->
          let pkgs =
            match Js.Json.decodeArray (getf j "packages") with
            | Some xs ->
                Array.of_list
                  (List.filter
                     (fun pkg ->
                       jbool pkg "web" || not (jbool pkg "effect"))
                     (Array.to_list xs))
            | None -> [||]
          in
          bump ();
          resolve (Js.Json.array pkgs));
      ignore (dirty_signal owner);
      p)

(* cljs plugin-handler/load-marketplace-stats *)
let stats_url =
  "https://raw.githubusercontent.com/logseq/marketplace/master/stats.json"

let marketplace_stats : Js.Json.t Js.Promise.t option ref = ref None

let fetch_stats () : Js.Json.t Js.Promise.t =
  match !marketplace_stats with
  | Some p -> p
  | None ->
      let p, resolve, _reject = Js.Promise.pending () in
      marketplace_stats := Some p;
      https_json stats_url (fun j ->
          bump ();
          resolve j);
      p
let call_button_action _pid _action _key = ()
let check_or_update _id _repo _only_check = ()
let update_version _id = None
let plugin_settings_schema _pid : Js.Json.t list = []
let plugin_settings_json _pid : Js.Json.t = jobj []
let plugin_set_setting _pid _k _v = ()
let replace_plugin_settings _pid _j = ()
let json_pretty (j : Js.Json.t) : string = Js.Json.stringify j

(* cljs plugin-handler/pkg-asset: http(s) urls pass through; relative
   assets resolve under the marketplace packages/ dir *)
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
    if a = "" then "" else
      "https://raw.githubusercontent.com/logseq/marketplace/master/packages/"
      ^ id ^ "/" ^ a

(* cljs plugin-handler/gh-repo-url *)
let gh_repo_url repo = "https://github.com/" ^ repo

type pkg_stat = { stars : int; downloads : int }

(* stats.json is keyed by package id; total downloads is summed from
   the release triples *)
let package_stat stats id =
  match Js.Json.decodeObject stats with
  | None -> None
  | Some _ -> (
      let s = getf stats id in
      match Js.Json.decodeObject s with
      | None -> None
      | Some _ ->
          let stars =
            Option.value ~default:0.
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
          Some { stars; downloads })
let install_marketplace _pkg = ()
let unregister_plugin _pid = ()
let set_plugin_disabled _pid _on = ()

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
