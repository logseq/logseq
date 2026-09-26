(* Port of electron.url — logseq:// URL handlers.

   Electron_window / Electron_handler do not exist on this branch yet, so
   the pieces local-url-handler needs are implemented here against
   Electron_state / Electron_configs directly:
   - get-graph-name        (electron.handler/get-graph-name)
   - get-graph-all-windows (electron.window/get-graph-all-windows)
   - switch-to-window      (electron.window/switch-to-window!)
   Those functions should eventually be owned by their canonical
   modules and removed from here. *)

open Electron_bindings

(* js/URL — spec/platform/node_url.mli hides host/searchParams, so the
   pieces this module needs are bound here directly. *)
type url = Js.Json.t

external url_parse : string -> string -> url = "URL" [@@mel.new]
external url_host : url -> string = "host" [@@mel.get]
external url_pathname : url -> string = "pathname" [@@mel.get]
external url_search_params : url -> Js.Json.t = "searchParams"
  [@@mel.get]
external search_param_get : Js.Json.t -> string -> string Js.Null.t
  = "get" [@@mel.send]
external decode_uri : string -> string = "decodeURI"
external object_from_entries : 'a -> 'b = "fromEntries"
  [@@mel.scope "Object"]

let decode = decode_uri

let get_url_decoded_params (parsed_url : url) (keys : string list)
    : string option list =
  let params = url_search_params parsed_url in
  List.map
    (fun k -> Js.Null.toOption (search_param_get params k))
    keys

(* --- payload helpers ----------------------------------------------------- *)

let json_dict (entries : (string * Js.Json.t) list) : Js.Json.t Js.Dict.t =
  let d = Js.Dict.empty () in
  List.iter (fun (k, v) -> Js.Dict.set d k v) entries;
  d

let jstr_opt (v : string option) : Js.Json.t =
  match v with Some s -> Js.Json.string s | None -> Js.Json.null

let notification ~i18n_key ~payload ~i18n_args : Js.Json.t Js.Dict.t =
  json_dict
    [ "type", Js.Json.string "error"
    ; "payload", Js.Json.string payload
    ; "i18n-key", Js.Json.string i18n_key
    ; "i18n-args", Js.Json.stringArray i18n_args
    ]

(* --- graph resolution (electron.handler/get-graph-name) ------------------- *)

module Fs_extra = struct
  external mkdirSync : string -> 'a -> unit = "mkdirSync"
    [@@mel.module "fs-extra"]
  external readdirSync : string -> 'a -> 'b array = "readdirSync"
    [@@mel.module "fs-extra"]
end

type dirent =
  < name : string
  ; isDirectory : unit -> bool [@mel.meth]
  ; isSymbolicLink : unit -> bool [@mel.meth] >
  Js.t

(* common-graph/read-directories *)
let read_directories (dir : string) : string list =
  Array.to_list
    (Fs_extra.readdirSync dir [%mel.obj { withFileTypes = true }]
     : dirent array)
  |> List.filter_map (fun (d : dirent) ->
         if
           d##isSymbolicLink () || Common_util.str_starts_with d##name "."
         then None
         else if d##isDirectory () then Some d##name
         else None)

(* common-graph/get-db-based-graphs *)
let get_db_based_graphs () : string list =
  let dir = Common_graph.get_db_graphs_dir () in
  Fs_extra.mkdirSync dir [%mel.obj { recursive = true }];
  read_directories dir
  |> List.filter (fun s -> s <> Common_config.unlinked_graphs_dir)
  |> List.filter_map Graph_dir.decode_graph_dir_name
  |> List.filter (fun s ->
         not (Common_util.str_starts_with s
                Common_config.file_version_prefix))
  |> List.filter_map Common_config.canonicalize_db_version_repo

let distinct (xs : 'a list) : 'a list =
  List.rev
    (List.fold_left
       (fun acc x -> if List.mem x acc then acc else x :: acc)
       [] xs)

let get_graphs () : string list = distinct (get_db_based_graphs ())

let get_graph_name (graph_identifier : string) : string option =
  let registry = Electron_configs.read_graph_registry () in
  let repo =
    match
      Graph_registry.resolve_target registry ~graph_id:None
        ~graph_identifier:(Some graph_identifier)
    with
    | Some entry -> Option.bind (Wire.get "repo" entry) Wire.as_string
    | None -> None
  in
  match repo with
  | Some repo -> Some repo
  | None ->
      (match Common_config.canonicalize_db_version_repo graph_identifier
       with
       | Some repo ->
           let graph_name =
             Common_config.strip_leading_db_version_prefix repo
           in
           List.find_opt
             (fun g ->
               let g = Electron_utils.normalize_lc g in
               g = Electron_utils.normalize_lc repo
               || Common_util.str_ends_with g
                    ("/" ^ Electron_utils.normalize_lc graph_name))
             (get_graphs ())
       | None -> None)

(* --- window helpers (electron.window) -------------------------------------- *)

(* get-graph-all-windows: windows whose :window/graph dir matches. *)
let get_graph_all_windows (dir : string) : Browser_window.t list =
  Hashtbl.fold
    (fun win_id graph_dir acc ->
      if graph_dir = dir then win_id :: acc else acc)
    Electron_state.window_graph []
  |> List.filter_map (fun id -> Js.Null.toOption (Browser_window.from_id id))

let switch_to_window (win : Browser_window.t) : unit =
  if Browser_window.is_minimized win then Browser_window.restore win;
  browser_window_set_visible_on_all_workspaces win true;
  Browser_window.focus win;
  browser_window_set_visible_on_all_workspaces win false

(* --- handlers ---------------------------------------------------------------- *)

let graph_identifier_error_handler (graph_identifier : string) : unit =
  if graph_identifier <> "" then
    Electron_utils.send_to_renderer "notification"
      (notification ~i18n_key:"electron/link-open-failed-no-graph"
         ~payload:
           ("Failed to open link. Cannot match graph identifier `"
           ^ graph_identifier ^ "` to any linked graph.")
         ~i18n_args:[| graph_identifier |])
  else
    Electron_utils.send_to_renderer "notification"
      (notification ~i18n_key:"electron/link-open-failed-missing-graph"
         ~payload:
           "Failed to open link. Missing graph identifier after `logseq://graph/`."
         ~i18n_args:[||])

let local_url_handler (win : Browser_window.t) (parsed_url : url)
    (force_new_window : bool) : unit =
  let graph_identifier =
    decode
      (Common_util.str_replace_all (url_pathname parsed_url) "/" "")
  in
  match get_url_decoded_params parsed_url [ "page"; "block-id"; "file" ]
  with
  | [ page_name; block_id; file ] ->
      let graph_name =
        if graph_identifier <> "" then get_graph_name graph_identifier
        else None
      in
      (match graph_name with
       | Some graph_name ->
           let graph_dir = Electron_utils.get_graph_dir graph_name in
           let window_on_graph =
             match graph_dir with
             | Some dir -> List.nth_opt (get_graph_all_windows dir) 0
             | None -> None
           in
           let open_new_window =
             force_new_window || window_on_graph = None
           in
           (match page_name, block_id, file with
            | None, None, None -> ()
            | _ ->
                let payload =
                  json_dict
                    [ "page-name", jstr_opt page_name
                    ; "block-id", jstr_opt block_id
                    ; "file", jstr_opt file
                    ]
                in
                let redirect (w : Browser_window.t) : unit =
                  Electron_utils.send_to_window w "redirectWhenExists"
                    [| payload |]
                in
                if open_new_window then
                  (* redirect-f fires once the new window's graph is
                     ready; the thunk re-finds the window that has
                     registered itself on this graph's dir. *)
                  Electron_state.once_graph_ready :=
                    Some
                      (fun () ->
                        match graph_dir with
                        | Some dir ->
                            (match get_graph_all_windows dir with
                             | w :: _ -> redirect w
                             | [] -> ())
                        | None -> ())
                else
                  (match window_on_graph with
                   | Some w ->
                       switch_to_window w;
                       redirect w
                   | None -> ()));
           if open_new_window then
             Electron_utils.send_to_window win "openNewWindowOfGraph"
               [| Js.Json.string graph_name |]
       | None -> graph_identifier_error_handler graph_identifier)
  | _ -> ()

let x_callback_url_handler (win : Browser_window.t)
    (parsed_url : url) : unit =
  match url_pathname parsed_url with
  | "/quickCapture" ->
      (match
         get_url_decoded_params parsed_url
           [ "url"; "title"; "content"; "page"; "append" ]
       with
       | [ url; title; content; page; append ] ->
           Electron_utils.send_to_focused_renderer "quickCapture"
             (json_dict
                [ "url", jstr_opt url
                ; "title", jstr_opt title
                ; "content", jstr_opt content
                ; "page", jstr_opt page
                ; "append",
                  (match append with
                   | None -> Js.Json.null
                   | Some a -> Js.Json.boolean (a = "true"))
                ])
             (Js.Null.return win)
       | _ -> ())
  | "/invokeCommand" ->
      (match
         get_url_decoded_params parsed_url [ "action"; "payload" ]
       with
       | [ action; payload ] ->
           Electron_utils.send_to_focused_renderer "invokeCommand"
             (json_dict
                [ "action", jstr_opt action; "payload", jstr_opt payload ])
             (Js.Null.return win)
       | _ -> ())
  | action ->
      Electron_utils.send_to_focused_renderer "notification"
        (notification ~i18n_key:"electron/unimplemented-callback"
           ~payload:("Unimplemented x-callback-url action: `" ^ action ^ "`.")
           ~i18n_args:[| action |])
        (Js.Null.return win)

let logseq_url_handler (win : Browser_window.t) (parsed_url : url)
    : unit =
  match url_host parsed_url with
  | "x-callback-url" -> x_callback_url_handler win parsed_url
  | "graph" -> local_url_handler win parsed_url false
  | "new-window" -> local_url_handler win parsed_url true
  | "handbook" ->
      let key =
        Regexp.replace
          (Regexp.compile "^[/]+")
          (url_pathname parsed_url)
          ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> "")
      in
      Electron_utils.send_to_renderer "handbook"
        (json_dict
           [ "key", Js.Json.string key
           ; "args",
             object_from_entries (url_search_params parsed_url)
           ])
  | url_host ->
      Electron_utils.send_to_renderer "notification"
        (notification ~i18n_key:"electron/link-open-failed-no-target"
           ~payload:
             ("Failed to open link. Cannot match `" ^ url_host
            ^ "` to any target.")
           ~i18n_args:[| url_host |])
