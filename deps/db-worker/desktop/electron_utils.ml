(* Port of electron.utils — platform flags, open/fetch with proxy
   support, dotdir helpers, window helpers. *)

open Electron_bindings
open Datascript

(* fs-extra (CJS) externals — live in the module that uses them. *)
module Fs_extra = struct
  external existsSync : string -> bool = "existsSync"
    [@@mel.module "fs-extra"]
  external mkdirSync : string -> unit = "mkdirSync"
    [@@mel.module "fs-extra"]
  external readFileSync : string -> Node.Buffer.t = "readFileSync"
    [@@mel.module "fs-extra"]
  external readdirSync : string -> 'a -> 'b array = "readdirSync"
    [@@mel.module "fs-extra"]
  external statSync :
    string
    -> < size : float
       ; birthtime : Js.Date.t
       ; mtime : Js.Date.t
       ; ctime : Js.Date.t >
       Js.t
    = "statSync" [@@mel.module "fs-extra"]
end

type dirent =
  < name : string
  ; isDirectory : unit -> bool [@mel.meth]
  ; isSymbolicLink : unit -> bool [@mel.meth] >
  Js.t

(* node-fetch / open — go through interop/default-function-or-module so
   both CJS and ESM-module shapes work under require(). *)
external node_fetch_mod : 'a = "node-fetch" [@@mel.module]
external open_mod : 'a = "open" [@@mel.module]

let node_fetch (url : string) (options : 'a) : Js.Json.t Js.Promise.t =
  Electron_interop.default_function_or_module node_fetch_mod url options

let open_external_fn (target : string) (options : 'a Js.Undefined.t)
    : unit Js.Promise.t =
  Electron_interop.default_function_or_module open_mod target options

external https_proxy_agent : string -> Js.Json.t = "HttpsProxyAgent"
  [@@mel.new] [@@mel.module "https-proxy-agent"]
external socks_proxy_agent : string -> Js.Json.t = "SocksProxyAgent"
  [@@mel.new] [@@mel.module "socks-proxy-agent"]

external get_index : 'a -> string -> 'b Js.Undefined.t = ""
  [@@mel.get_index]
external set_index : 'a -> string -> 'b -> unit = "" [@@mel.set_index]
external has_own : 'a -> string -> bool = "hasOwnProperty" [@@mel.send]
external object_assign : 'a -> 'b -> 'a = "assign"
  [@@mel.scope "Object"]
external delete_prop : 'a -> string -> bool = "deleteProperty"
  [@@mel.scope "Reflect"]
external object_from_entries : 'a -> 'b = "fromEntries"
  [@@mel.scope "Object"]

(* --- state aliases ------------------------------------------------------ *)

let main_window = Electron_state.main_window
let mac = Electron_state.mac
let win32 = Electron_state.win32
let linux = Electron_state.linux
let prod = Electron_state.prod
let dev = Electron_state.dev

(* --- open ---------------------------------------------------------------- *)

let open_external (target : string) (options : string Js.Dict.t option)
    : unit Js.Promise.t =
  match options with
  | Some opts -> open_external_fn target (Js.Undefined.return opts)
  | None -> open_external_fn target Js.Undefined.empty

(* --- proxy plumbing -------------------------------------------------------- *)

(* Decoded :type/:protocol/:host/:port proxy option object. *)
type proxy =
  { typ : string option
  ; protocol : string option
  ; host : string option
  ; port : string option
  ; test : value
  }

let get_opt_str (o : 'a) (k : string) : string option =
  Js.Undefined.toOption (get_index o k)

let decode_proxy (o : 'a) : proxy =
  { typ = get_opt_str o "type"
  ; protocol = get_opt_str o "protocol"
  ; host = get_opt_str o "host"
  ; port = get_opt_str o "port"
  ; test =
      (match Js.Undefined.toOption (get_index o "test") with
       | Some t ->
           (match Js.typeof t with
            | "boolean" -> Bool (Js.String.make t = "true")
            | _ -> String (Js.String.make t))
       | None -> Nil)
  }

let value_to_opt_str (v : value) : string option =
  match v with
  | String s -> Some s
  | Int64 n -> Some (Int64.to_string n)
  | Float f -> Some (Common_util.js_string_of_float f)
  | _ -> None

let proxy_of_value (v : value) : proxy =
  { typ = Clj_value.map_get_str v "type"
  ; protocol = Clj_value.map_get_str v "protocol"
  ; host = Clj_value.map_get_str v "host"
  ; port = value_to_opt_str (Clj_value.map_get v "port")
  ; test = Clj_value.map_get v "test"
  }

(* ->proxy-config *)
let proxy_rules (typ : string) (host : string option)
    (port : string option) : string option =
  let hp () =
    match host, port with
    | Some h, Some p -> Some (h ^ ":" ^ p)
    | _ -> None
  in
  match typ with
  | "http" ->
      Option.map (fun hp -> "http=" ^ hp ^ ";https=" ^ hp) (hp ())
  | "socks5" ->
      Option.map
        (fun hp -> "http=socks5://" ^ hp ^ ";https=socks5://" ^ hp)
        (hp ())
  | "socks" | "socks4" ->
      Option.map
        (fun hp -> "http=socks://" ^ hp ^ ";https=socks://" ^ hp)
        (hp ())
  | "direct" -> Some "direct://"
  | _ -> None

(* {mode, proxyRules, proxyBypassRules} — fields are Js.Json.t so a
   missing rule becomes null like cljs #js {proxyRules nil}. *)
let proxy_config_of (typ : string) (host : string option)
    (port : string option) : Js.Json.t Js.Dict.t =
  let d = Js.Dict.empty () in
  (match typ with
   | "direct" -> Js.Dict.set d "mode" (Js.Json.string "direct")
   | "socks5" | "http" ->
       Js.Dict.set d "mode" (Js.Json.string "fixed_servers");
       Js.Dict.set d "proxyRules"
         (match proxy_rules typ host port with
          | Some r -> Js.Json.string r
          | None -> Js.Json.null);
       Js.Dict.set d "proxyBypassRules" (Js.Json.string "<local>")
   | _ -> Js.Dict.set d "mode" (Js.Json.string "system"));
  d

(* <build-fetch-agent {:keys [protocol host port]} *)
let build_fetch_agent (p : proxy) : Js.Json.t option =
  match p.protocol, p.host, p.port with
  | Some protocol, Some host, Some port
    when protocol = "http" || protocol = "socks5" ->
      let proxy_url = protocol ^ "://" ^ host ^ ":" ^ port in
      Some
        (if protocol = "http" then https_proxy_agent proxy_url
         else socks_proxy_agent proxy_url)
  | Some protocol, _, _ ->
      Electron_logger.error "Unknown proxy protocol: %s" protocol;
      None
  | _ -> None

(* parse-pac-rule "PROXY host:port" etc. *)
let parse_pac_rule (line : string) : proxy option =
  let parts =
    String.split_on_char ' ' line
    |> List.concat_map (String.split_on_char ':')
  in
  (* cljs string/split drops trailing empties *)
  let rec drop_trailing = function
    | "" :: rest when drop_trailing rest = [] -> []
    | x :: tl -> x :: drop_trailing tl
    | [] -> []
  in
  let parts = drop_trailing parts in
  match parts with
  | "DIRECT" :: _ -> None
  | (("PROXY" | "HTTP" | "SOCKS") as typ) :: host :: port :: _ ->
      Some
        { typ = None
        ; protocol = Some (if typ = "SOCKS" then "socks5" else "http")
        ; host = Some host
        ; port = Some port
        ; test = Nil
        }
  | _ ->
      Electron_logger.warn_args
        [| Electron_logger.js_str "Unknown PAC rule:"
         ; Electron_logger.js_str line |];
      None

let session_of_main_window () : Session.t option =
  match !main_window with
  | Some w -> Some (web_contents_session (Browser_window.web_contents w))
  | None -> None

let resolve_session_proxy (sess : Session.t) (for_url : string)
    : proxy option Js.Promise.t =
  Js.Promise.then_
    (fun proxy ->
      let parts = String.split_on_char ';' proxy in
      Js.Promise.resolve
        (List.find_map parse_pac_rule
           (List.filter (fun s -> s <> "") parts)))
    (Session.resolve_proxy sess for_url)

let get_system_proxy ?(for_url = "https://www.google.com") ()
    : proxy option Js.Promise.t =
  match session_of_main_window () with
  | Some sess -> resolve_session_proxy sess for_url
  | None -> Js.Promise.resolve None

let resolve_temporary_system_proxy (for_url : string)
    : proxy option Js.Promise.t =
  let partition = "logseq-system-proxy-" ^ Uuid_gen.uuid () in
  let sess = Session.from_partition partition in
  Js.Promise.then_
    (fun () ->
      Js.Promise.then_
        (fun () -> resolve_session_proxy sess for_url)
        (Session.force_reload_proxy_config sess))
    (Session.set_proxy sess (proxy_config_of "system" None None))

let resolve_fetch_proxy (url : string) (p : proxy)
    : proxy option Js.Promise.t =
  let typ = match p.typ with Some t -> Some t | None -> p.protocol in
  match typ with
  | None | Some "" -> Js.Promise.resolve None
  | Some "system" -> resolve_temporary_system_proxy url
  | Some "direct" -> Js.Promise.resolve None
  | Some (("http" | "socks5") as t) ->
      Js.Promise.resolve
        (Some { p with typ = None; protocol = Some t })
  | Some t ->
      Electron_logger.warn_args
        [| Electron_logger.js_str "Unknown fetch proxy type:"
         ; Electron_logger.js_str t |];
      Js.Promise.resolve None

let fetch_agent : Js.Json.t option ref = ref None

let resolve_fetch_agent (url : string) (options : 'a)
    : Js.Json.t option Js.Promise.t =
  if has_own options "agent" then
    Js.Promise.resolve
      (Js.Undefined.toOption (get_index options "agent"))
  else if has_own options "proxy" then
    let proxy =
      match Js.Undefined.toOption (get_index options "proxy") with
      | Some p -> decode_proxy p
      | None ->
          { typ = None; protocol = None; host = None; port = None
          ; test = Nil }
    in
    Js.Promise.then_
      (fun p -> Js.Promise.resolve (Option.bind p build_fetch_agent))
      (resolve_fetch_proxy url proxy)
  else Js.Promise.resolve !fetch_agent

let fetch (url : string) (options : 'a option) : Js.Json.t Js.Promise.t =
  let options =
    match options with
    | Some o -> o
    | None -> Js.Dict.empty ()
  in
  Js.Promise.then_
    (fun agent ->
      let opts = object_assign (Js.Dict.empty ()) options in
      ignore (delete_prop opts "proxy");
      (match agent with
       | Some a -> set_index opts "agent" a
       | None -> ());
      node_fetch url opts)
    (resolve_fetch_agent url options)

let set_fetch_agent_proxy (p : proxy option) : unit =
  fetch_agent := Option.bind p build_fetch_agent

let set_electron_proxy ?(typ = "system") (host : string option)
    (port : string option) () : unit Js.Promise.t =
  match session_of_main_window () with
  | Some sess ->
      Js.Promise.then_
        (fun () -> Session.force_reload_proxy_config sess)
        (Session.set_proxy sess (proxy_config_of typ host port))
  | None -> Js.Promise.resolve ()

let set_proxy (p : proxy) : unit Js.Promise.t =
  Electron_logger.info_args
    [| Electron_logger.js_str "set proxy to"; Electron_logger.js_str p |];
  let typ = match p.typ with Some t -> t | None -> "system" in
  match typ with
  | "system" ->
      Js.Promise.then_
        (fun () ->
          Js.Promise.then_
            (fun proxy -> Js.Promise.resolve (set_fetch_agent_proxy proxy))
            (get_system_proxy ()))
        (set_electron_proxy ~typ:"system" None None ())
  | "direct" ->
      Js.Promise.then_
        (fun () -> Js.Promise.resolve (set_fetch_agent_proxy None))
        (set_electron_proxy ~typ:"direct" None None ())
  | ("socks5" | "http") as t ->
      Js.Promise.then_
        (fun () ->
          Js.Promise.resolve
            (set_fetch_agent_proxy
               (Some
                  { p with
                    typ = None
                  ; protocol = Some t
                  })))
        (set_electron_proxy ~typ:t p.host p.port ())
  | t ->
      Electron_logger.error "Unknown proxy type: %s" t;
      Js.Promise.resolve ()

let restore_proxy_settings () : unit Js.Promise.t =
  let settings = Electron_configs.get_item "settings/agent" in
  let p = proxy_of_value settings in
  let p =
    if p.typ <> None then p
    else
      match p.protocol with
      | Some proto when proto <> "" -> { p with typ = Some proto }
      | _ -> { p with typ = Some "system" }
  in
  Electron_logger.info_args
    [| Electron_logger.js_str "restore proxy settings"
     ; Electron_logger.js_str p |];
  set_proxy p

let save_proxy_settings (p : proxy) : unit =
  let typ = match p.typ with Some t -> t | None -> "system" in
  let str_opt = Option.map (fun s -> String s) in
  if typ = "system" || typ = "direct" then
    Electron_configs.set_item "settings/agent"
      (Map [ Keyword "type", String typ; Keyword "test", p.test ])
  else
    Electron_configs.set_item "settings/agent"
      (Map
         [ Keyword "type", String typ
         ; Keyword "protocol", String typ
         ; Keyword "host", Option.value ~default:Nil (str_opt p.host)
         ; Keyword "port", Option.value ~default:Nil (str_opt p.port)
         ; Keyword "test", p.test
         ])

(* --- paths ---------------------------------------------------------------- *)

let fix_win_path (path : string) : string option =
  if path = "" then None
  else if win32 then Some (Common_util.str_replace_all path "\\" "/")
  else Some path

let to_native_win_path (path : string) : string option =
  if path = "" then None
  else if win32 then Some (Common_util.str_replace_all path "/" "\\")
  else Some path

let get_ls_dotdir_root () : string option =
  let lg_dir = Node.Path.join [| App.get_path App.t "home"; ".logseq" |] in
  if not (Fs_extra.existsSync lg_dir) then Fs_extra.mkdirSync lg_dir;
  fix_win_path lg_dir

let get_ls_default_plugins () : string list =
  match get_ls_dotdir_root () with
  | None -> []
  | Some root ->
      let plugins_root = Node.Path.join [| root; "plugins" |] in
      if not (Fs_extra.existsSync plugins_root) then
        Fs_extra.mkdirSync plugins_root;
      let dirents : dirent array =
        Fs_extra.readdirSync plugins_root
          [%mel.obj { withFileTypes = true }]
      in
      Array.to_list dirents
      |> List.filter (fun (d : dirent) -> d##isDirectory ())
      |> List.filter (fun (d : dirent) ->
             not
               (Common_util.str_starts_with d##name "_"
                || Common_util.str_starts_with d##name "."))
      |> List.map (fun (d : dirent) ->
             Node.Path.join [| plugins_root; d##name |])

(* --- files ---------------------------------------------------------------- *)

let read_file_raw (path : string) : string =
  Node.Buffer.toString (Fs_extra.readFileSync path)

let read_file (path : string) : string Js.Null.t Js.Promise.t =
  Js.Promise.resolve
    (try
       if Fs_extra.existsSync path then
         Js.Null.return (read_file_raw path)
       else Js.Null.empty
     with e ->
       Electron_logger.error "Read file: %s"
         (Electron_configs.exn_message e);
       Js.Null.empty)

(* --- windows ---------------------------------------------------------------- *)

let get_focused_window () : Browser_window.t Js.Null.t =
  browser_window_get_focused_window ()

external evt_sender : 'a -> Web_contents.t = "sender" [@@mel.get]

let get_win_from_sender (evt : 'a) : Browser_window.t option =
  try Js.Null.toOption (browser_window_from_web_contents (evt_sender evt))
  with _ -> None

let send_to_window (win : Browser_window.t) (kind : string)
    (payload : 'a array) : unit =
  Web_contents.send_v (Browser_window.web_contents win) kind payload

let send_to_renderer ?window kind payload =
  match window, Js.Null.toOption (get_focused_window ()) with
  | Some w, _ -> send_to_window w kind [| payload |]
  | None, Some w -> send_to_window w kind [| payload |]
  | None, None -> ()

let send_to_focused_renderer kind payload fallback_win =
  match Js.Null.toOption (get_focused_window ()) with
  | Some w -> send_to_window w kind [| payload |]
  | None ->
      (match Js.Null.toOption fallback_win with
       | Some w -> send_to_window w kind [| payload |]
       | None -> ())

(* --- graphs / paths --------------------------------------------------------- *)

let get_graph_dir (graph_name : string) : string option =
  let trimmed = String.trim graph_name in
  if
    Common_util.str_starts_with trimmed Common_config.db_version_prefix
  then
    match Common_config.canonicalize_db_version_repo trimmed with
    | Some repo ->
        Option.map
          (fun dir ->
            Node.Path.join [| Common_graph.get_db_graphs_dir (); dir |])
          (Graph_dir.repo_to_encoded_graph_dir_name repo)
    | None -> None
  else None

let decode_protected_assets_schema_path (schema_path : string) : string =
  Common_util.str_replace_all schema_path "/logseq__colon/" ":/"

let normalize = Unicode.nfc
let normalize_lc s = normalize (Unicode.lowercase s)
let safe_decode_uri_component = Common_util.safe_decode_uri_component

let fs_stat_to_js (path : string)
    : < size : float
      ; birthtime : Js.Date.t
      ; mtime : Js.Date.t
      ; ctime : Js.Date.t >
      Js.t =
  let s = Fs_extra.statSync path in
  [%mel.obj
    { size = s##size
    ; birthtime = s##birthtime
    ; mtime = s##mtime
    ; ctime = s##ctime
    }]
