(* Port of src/electron/electron/plugin.cljs — marketplace plugin
   install/update/uninstall: GitHub release fetch, zip download,
   extraction and package.json patching. *)

module Semver = struct
  type version

  external coerce : string -> version Js.Nullable.t = "coerce"
    [@@mel.module "semver"]
  external valid : version Js.Nullable.t -> string Js.Nullable.t = "valid"
    [@@mel.module "semver"]
  external lt : version -> version -> bool = "lt" [@@mel.module "semver"]
end

module Fs_extra = struct
  type write_stream

  external createWriteStream : string -> write_stream = "createWriteStream"
    [@@mel.module "fs-extra"]
  external stream_write : write_stream -> Node.Buffer.t -> bool = "write"
    [@@mel.send]
  external stream_close : write_stream -> unit = "close" [@@mel.send]

  type stat

  external statSync : string -> stat = "statSync" [@@mel.module "fs-extra"]
  external isDirectory : stat -> bool = "isDirectory" [@@mel.send]
  external pathExistsSync : string -> bool = "pathExistsSync"
    [@@mel.module "fs-extra"]
  external existsSync : string -> bool = "existsSync"
    [@@mel.module "fs-extra"]
  external removeSync : string -> unit = "removeSync"
    [@@mel.module "fs-extra"]
  external moveSync : string -> string -> unit = "moveSync"
    [@@mel.module "fs-extra"]
  external readJsonSync : string -> Js.Json.t = "readJsonSync"
    [@@mel.module "fs-extra"]
  external writeJsonSync : string -> Js.Json.t -> unit = "writeJsonSync"
    [@@mel.module "fs-extra"]
end

external buffer_length : Node.Buffer.t -> int = "length" [@@mel.get]

module Stream = struct
  type t

  external on : t -> string -> ('a -> unit [@u]) -> unit = "on"
    [@@mel.send]
end

external tmpdir : unit -> string = "tmpdir" [@@mel.module "os"]

external extract_zip : string -> Js.Json.t -> unit Js.Promise.t
  = "default"
[@@mel.module "extract-zip"]

external promise_finally :
  (unit -> unit [@u]) -> ('a Js.Promise.t[@mel.this]) -> 'a Js.Promise.t
  = "finally"
[@@mel.send]

external error_message : 'a -> Js.Json.t = "message" [@@mel.get]
external error_as_json : Js.Promise.error -> Js.Json.t = "%identity"
external js_to_exn : 'a -> exn = "%identity"
external make_error : Js.Json.t -> exn = "Error" [@@mel.new]

(* cljs `(js/Error. [:tag msg])` produces an Error whose .message is the
   cljs vector object (opaque JS value, never string-equal to the ":tag"
   strings compared later); a JS array of the rendered parts is the
   closest faithful shape. *)
let tagged_error tag (msg : Js.Json.t) : exn =
  make_error (Js.Json.array [| Js.Json.string tag; msg |])

let github_api_0 = "https://api.github.com"
let github_api_1 = "https://plugins.logseq.io/github/api"
let github_api = ref github_api_0
let last_valid_github_api : float option ref = ref None

(* (partial logger/debug "[Marketplace]") *)
let debug args =
  Electron_logger.debug_args
    (Array.append [| Js.Json.string "[Marketplace]" |] args)

let js_obj (kvs : (string * Js.Json.t) list) : Js.Json.t =
  let d = Js.Dict.empty () in
  List.iter (fun (k, v) -> Js.Dict.set d k v) kvs;
  Js.Json.object_ d

let fetch_opts ~(timeout : int) : Js.Json.t Js.Dict.t =
  let d = Js.Dict.empty () in
  Js.Dict.set d "timeout" (Js.Json.number (Float.of_int timeout));
  d

let json_get (j : Js.Json.t) (k : string) : Js.Json.t option =
  match Js.Json.decodeObject j with
  | Some d -> Js.Dict.get d k
  | None -> None

let json_get_string j k =
  match json_get j k with
  | Some v -> Js.Json.decodeString v
  | None -> None

(* clojure.string/replace with a string match replaces every occurrence *)
let replace_all ~sub ~by s =
  if String.equal sub "" then s
  else String.concat by (Array.to_list (Js.String.split ~sep:sub s))

(* bean/->js camelCases keyword keys *)
let camelize s =
  match String.split_on_char '-' s with
  | [] -> s
  | first :: rest ->
      first ^ String.concat "" (List.map String.capitalize_ascii rest)

let rec wire_to_js (w : Wire.t) : Js.Json.t =
  match w with
  | Wire.Nil -> Js.Json.null
  | Wire.Bool b -> Js.Json.boolean b
  | Wire.String s | Wire.Symbol s | Wire.Keyword s | Wire.Uuid s
  | Wire.Uri s -> Js.Json.string s
  | Wire.Int n -> Js.Json.number (Float.of_int n)
  | Wire.Int64 n -> Js.Json.number (Int64.to_float n)
  | Wire.Float f -> Js.Json.number f
  | Wire.Binary s -> Js.Json.string s
  | Wire.Big_decimal s | Wire.Big_int s -> Js.Json.string s
  | Wire.Date_ms ms ->
      Js.Json.string
        (Js.Date.toISOString (Js.Date.fromFloat (Int64.to_float ms)))
  | Wire.Tagged (_, rep) -> wire_to_js rep
  | Wire.Array xs | Wire.List xs | Wire.Set xs ->
      Js.Json.array (Array.of_list (List.map wire_to_js xs))
  | Wire.Map kvs ->
      js_obj (List.map (fun (k, v) -> (wire_key k, wire_to_js v)) kvs)

and wire_key (k : Wire.t) : string =
  match k with
  | Wire.Keyword s | Wire.String s | Wire.Symbol s -> camelize s
  | Wire.Int n -> string_of_int n
  | Wire.Int64 n -> Int64.to_string n
  | Wire.Float f -> Printf.sprintf "%.17g" f
  | _ -> Js.String.make (Json_codec.encode k)

let wire_string w = Wire.as_string w
let wire_field k w = match Wire.get k w with Some v -> v | None -> Wire.Nil

let wire_truthy (v : Wire.t) =
  match v with Wire.Nil | Wire.Bool false -> false | _ -> true

(* (doseq [win (get-all-windows)] (.send win.webContents (name type)
   (bean/->js payload))) *)
let emit (typ : string) (payload : Js.Json.t) : unit =
  Array.iter
    (fun win ->
      Electron_bindings.Web_contents.send_v
        (Electron_bindings.Browser_window.web_contents win)
        typ [| payload |])
    (Electron_bindings.Browser_window.get_all_windows ())

let res_status (res : Js.Json.t) : int =
  match json_get res "status" with
  | Some v ->
      (match Js.Json.decodeNumber v with
       | Some n -> int_of_float n
       | None -> 0)
  | None -> 0

let res_status_text res =
  Option.value (json_get_string res "statusText") ~default:""

external res_text : Js.Json.t -> Js.Json.t Js.Promise.t = "text"
  [@@mel.send]
external res_json : Js.Json.t -> Js.Json.t Js.Promise.t = "json"
  [@@mel.send]
external res_body : Js.Json.t -> Stream.t = "body" [@@mel.get]
external res_ok : Js.Json.t -> bool Js.Undefined.t = "ok" [@@mel.get]

let res_is_ok res =
  Js.Undefined.toOption (res_ok res) |> Option.value ~default:false

let strip_slashes_re = Js.Re.fromString "^/+(.+?)/+$"

let normalize_repo repo =
  match repo with
  | None -> None
  | Some r ->
      Some
        (r
        |> Js.String.trim
        |> Js.String.replaceByRe ~regexp:strip_slashes_re
             ~replacement:"$1")

let api_url repo suffix =
  Printf.sprintf "%s/repos/%s/%s" !github_api
    (Option.value repo ~default:"")
    suffix

let valid_github_api () : unit Js.Promise.t =
  let stale =
    match !last_valid_github_api with
    | None -> true
    | Some ts -> Js.Date.now () -. ts > 1000. *. 60.
  in
  if stale then
    let target = github_api_1 in
    Electron_utils.fetch (target ^ "/rate_limit")
      (Some (fetch_opts ~timeout:2000))
    |> Js.Promise.then_ (fun res ->
           if res_status res <> 200 then
             Js.Exn.raiseError (res_status_text res);
           Js.Promise.resolve ())
    |> Js.Promise.then_ (fun () ->
           github_api := target;
           debug
             [| Js.Json.string "INFO: use github api - "
              ; Js.Json.string target |];
           Js.Promise.resolve ())
    |> Js.Promise.catch (fun e ->
           github_api := github_api_0;
           debug
             [| Js.Json.string "ERR: valid github api - "
              ; error_as_json e |];
           Js.Promise.resolve ())
    |> promise_finally (fun [@u] () ->
           last_valid_github_api := Some (Js.Date.now ()))
  else Js.Promise.resolve ()

let dotdir_file (file : string option) : bool =
  match file with
  | Some f ->
      Js.String.startsWith ~prefix:Electron_configs.dot_root
        (Node.Path.normalize f)
  | None -> false

let assetsdir_file (file : string option) : bool =
  match file with
  | Some s -> Js.String.includes ~search:"assets/storages" s
  | None -> false

(* Get a release by tag name: /repos/{owner}/{repo}/releases/tags/{tag}
   Get the latest release: /repos/{owner}/{repo}/releases/latest
   Zipball https://api.github.com/repos/{owner}/{repo}/zipball
   Resolves to (asset, tag_name, body); asset is the .zip asset object,
   a zipball url string, or null. *)
let fetch_release_asset (item : Wire.t) (url_suffix : string)
    ?(response_transform = fun res -> Js.Promise.resolve res) () :
    (Js.Json.t * Js.Json.t * Js.Json.t) Js.Promise.t =
  let repo = wire_field "repo" item |> wire_string in
  let theme = wire_truthy (wire_field "theme" item) in
  valid_github_api ()
  |> Js.Promise.then_ (fun () ->
         let repo = normalize_repo repo in
         let endpoint = api_url repo url_suffix in
         Electron_utils.fetch endpoint
           (Some (fetch_opts ~timeout:(1000 * 5)))
         |> Js.Promise.then_ (fun res ->
                let status = res_status res in
                (if status <> 200 then res_text res
                 else Js.Promise.resolve Js.Json.null)
                |> Js.Promise.then_ (fun illegal_text ->
                       (match Js.Json.decodeString illegal_text with
                        | Some text
                          when not (String.equal (String.trim text) "")
                          ->
                            Js.Exn.raiseError
                              (Printf.sprintf "GitHub API Failed(%d) %s"
                                 status text)
                        | _ -> ());
                       debug
                         [| Js.Json.string "Release latest:"
                          ; Js.Json.string endpoint
                          ; Js.Json.string ":status"
                          ; Js.Json.number (Float.of_int status) |];
                       response_transform res))
                |> Js.Promise.then_ (fun res ->
                       res_json res
                       |> Js.Promise.then_ (fun json ->
                              let version =
                                Option.value (json_get json "tag_name")
                                  ~default:Js.Json.null
                              in
                              let asset =
                                match json_get json "assets" with
                                | Some assets ->
                                    (match Js.Json.decodeArray assets with
                                     | Some arr ->
                                         Option.value
                                           (Array.find_opt
                                              (fun a ->
                                                match
                                                  json_get_string a
                                                    "name"
                                                with
                                                | Some n ->
                                                    Js.String.endsWith
                                                      ~suffix:".zip" n
                                                | None -> false)
                                              arr)
                                           ~default:Js.Json.null
                                     | None -> Js.Json.null)
                                | None -> Js.Json.null
                              in
                              let asset =
                                if
                                  Option.is_some
                                    (Js.Json.decodeNull asset)
                                  && theme
                                then
                                  match json_get json "zipball_url" with
                                  | Some z -> z
                                  | None ->
                                      Js.Json.string
                                        (api_url repo "zipball")
                                else asset
                              in
                              let body =
                                Option.value (json_get json "body")
                                  ~default:Js.Json.null
                              in
                              Js.Promise.resolve (asset, version, body))))
  |> Js.Promise.catch (fun e ->
         debug [| error_as_json e |];
         Js.Promise.reject
           (tagged_error "release-channel-issue" (error_message e)))

(* Fetches latest release, normally when user clicks to install or
   update a plugin *)
let fetch_latest_release_asset (item : Wire.t) =
  fetch_release_asset item "releases/latest" ()

(* Fetches a specific release asset, normally when installing specific
   versions from plugins.edn. Falls back to the latest release when the
   tag is missing (plugins whose package.json version doesn't match the
   git tagged version, e.g. hkgnp/logseq-osmmaps-plugin). *)
let fetch_specific_release_asset (item : Wire.t) =
  let version = wire_field "version" item |> wire_string in
  let repo = wire_field "repo" item |> wire_string in
  fetch_release_asset item
    (Printf.sprintf "releases/tags/%s" (Option.value version ~default:""))
    ~response_transform:(fun res ->
      if res_status res = 404 then
        let repo = normalize_repo repo in
        Electron_utils.fetch (api_url repo "releases/latest") None
      else Js.Promise.resolve res)
    ()

let download_asset_zip (item : Wire.t) (dl_url : string)
    (dl_version : string option) (dot_extract_to : string)
    : unit Js.Promise.t =
  (Electron_utils.fetch dl_url (Some (fetch_opts ~timeout:30000))
   |> Js.Promise.then_ (fun res ->
          if not (res_is_ok res) then
            Js.Promise.reject
              (tagged_error "download-channel-issue"
                 (Js.Json.string (res_status_text res)))
          else
            Js.Promise.make (fun ~resolve ~reject ->
                let body = res_body res in
                let downloaded = ref 0 in
                let dest_basename = Node.Path.basename dl_url in
                let dest_basename =
                  if not (Js.String.endsWith ~suffix:".zip" dest_basename)
                  then
                    let id =
                      wire_field "id" item
                      |> wire_string
                      |> Option.value ~default:""
                    in
                    id ^ "_" ^ dest_basename ^ ".zip"
                  else dest_basename
                in
                let tmp_dest_file =
                  Node.Path.join [| tmpdir (); dest_basename ^ ".pending" |]
                in
                let dest_file = Fs_extra.createWriteStream tmp_dest_file in
                Stream.on body "data" (fun [@u] chunk ->
                    downloaded := !downloaded + buffer_length chunk;
                    ignore (Fs_extra.stream_write dest_file chunk));
                Stream.on body "error" (fun [@u] e -> reject (js_to_exn e) [@u]);
                Stream.on body "end" (fun [@u] _e ->
                    Fs_extra.stream_close dest_file;
                    let dest_file =
                      replace_all ~sub:".pending" ~by:"" tmp_dest_file
                    in
                    Node.Fs.renameSync tmp_dest_file dest_file;
                    resolve dest_file [@u])))
   |> Js.Promise.then_ (fun (frm_zip : string) ->
          (* sync extract *)
          let zip_extracted_path = replace_all ~sub:".zip" ~by:"" frm_zip in
          extract_zip frm_zip
            (js_obj [ ("dir", Js.Json.string zip_extracted_path) ])
          |> Js.Promise.then_ (fun () ->
                 let pkg root =
                   let stat = Fs_extra.statSync root in
                   Fs_extra.isDirectory stat
                   && Fs_extra.pathExistsSync
                        (Node.Path.join [| root; "package.json" |])
                 in
                 let tmp_extracted_root =
                   if pkg zip_extracted_path then Some "."
                   else
                     (* last of (take-while pkg? dirs) *)
                     let rec take acc = function
                       | [] -> acc
                       | d :: rest ->
                           if
                             pkg
                               (Node.Path.join [| zip_extracted_path; d |])
                           then take (Some d) rest
                           else acc
                     in
                     take None
                       (Array.to_list
                          (Node.Fs.readdirSync zip_extracted_path))
                 in
                 let tmp_extracted_root =
                   match tmp_extracted_root with
                   | Some r -> r
                   | None ->
                       raise
                         (make_error
                            (Js.Json.string "invalid-plugin-package"))
                 in
                 let tmp_extracted_root =
                   Node.Path.join [| zip_extracted_path; tmp_extracted_root |]
                 in
                 if Fs_extra.existsSync dot_extract_to then
                   Fs_extra.removeSync dot_extract_to;
                 Fs_extra.moveSync tmp_extracted_root dot_extract_to;
                 let src =
                   Node.Path.join [| dot_extract_to; "package.json" |]
                 in
                 let pkg_json = Fs_extra.readJsonSync src in
                 let pkg_dict =
                   match Js.Json.decodeObject pkg_json with
                   | Some d -> d
                   | None -> Js.Dict.empty ()
                 in
                 let set_field key field =
                   Js.Dict.set pkg_dict key
                     (wire_to_js (wire_field field item))
                 in
                 set_field "repo" "repo";
                 set_field "title" "title";
                 set_field "author" "author";
                 set_field "description" "description";
                 Js.Dict.set pkg_dict "effect"
                   (Js.Json.boolean
                      (wire_truthy (wire_field "effect" item)));
                 (* Force overwrite version — developers tend to forget
                    to update the version number of package.json *)
                 (match dl_version with
                  | Some v ->
                      Js.Dict.set pkg_dict "version" (Js.Json.string v)
                  | None -> ());
                 (let sponsors = wire_field "sponsors" item in
                  if wire_truthy sponsors then
                    Js.Dict.set pkg_dict "sponsors" (wire_to_js sponsors));
                 Fs_extra.writeJsonSync src (Js.Json.object_ pkg_dict);
                 Fs_extra.removeSync zip_extracted_path;
                 Fs_extra.removeSync frm_zip;
                 Js.Promise.resolve ())))
  |> Js.Promise.catch (fun e ->
         emit "lsp-updates"
           (js_obj
              [ ("status", Js.Json.string "error")
              ; ("payload", error_as_json e) ]);
         Js.Promise.reject (js_to_exn e))

(* (bean/->js (assoc item k v ...)) — merge extra camelCase keys into the
   item's JS representation *)
let item_payload (item : Wire.t) (extra : (string * Js.Json.t) list) :
    Js.Json.t =
  let d =
    match Js.Json.decodeObject (wire_to_js item) with
    | Some d -> d
    | None -> Js.Dict.empty ()
  in
  List.iter (fun (k, v) -> Js.Dict.set d k v) extra;
  Js.Json.object_ d

let install_or_update (item : Wire.t) : unit Js.Promise.t =
  let version = wire_field "version" item |> wire_string in
  let repo = wire_field "repo" item |> wire_string in
  let only_check = wire_truthy (wire_field "only-check" item) in
  let plugin_action = wire_field "plugin-action" item |> wire_string in
  match repo with
  | Some repo ->
      let action = Option.value plugin_action ~default:"" in
      let coerced_version =
        match version with
        | Some v -> Js.Nullable.toOption (Semver.coerce v)
        | None -> None
      in
      let updating =
        match version, coerced_version with
        | Some _, Some cv ->
            Option.is_some
              (Js.Nullable.toOption
                 (Semver.valid (Js.Nullable.return cv)))
            && not (String.equal action "install")
        | _ -> false
      in
      debug
        [| Js.Json.string "==="
         ; Js.Json.string (if updating then "Updating:" else "Installing:")
         ; Js.Json.string repo
         ; Js.Json.string "===" |];
      let pipeline =
        (if String.equal action "install" then
           fetch_specific_release_asset item
         else fetch_latest_release_asset item)
        |> Js.Promise.then_ (fun (asset, latest_version, notes) ->
               let latest_version_str = Js.Json.decodeString latest_version in
               debug
                 [| Js.Json.string "Release latest:"
                  ; latest_version
                  ; Js.Json.string " from"
                  ; Option.value (json_get asset "url")
                      ~default:Js.Json.null |];
               (* compare latest version *)
               (match coerced_version, latest_version_str with
                | Some cv, Some lv when updating ->
                    (match Js.Nullable.toOption (Semver.coerce lv) with
                     | Some clv ->
                         debug
                           [| Js.Json.string "Release compare:"
                            ; Js.Json.string
                                (Option.value version ~default:"")
                            ; Js.Json.string "(current) > "
                            ; Js.Json.string lv
                            ; Js.Json.string "(latest)" |];
                         if Semver.lt cv clv then
                           debug
                             [| Js.Json.string "Updating latest:"
                              ; Js.Json.string lv |]
                         else begin
                           debug
                             [| Js.Json.string "Update skip: no new version" |];
                           (* cljs `(js/Error. :no-new-version)` leaves a
                              keyword object in .message (never a string);
                              an opaque JS array keeps it non-string so the
                              `#{":no-new-version"}` check below stays
                              always-false, as in cljs. *)
                           raise
                             (tagged_error "no-new-version" Js.Json.null)
                         end
                     | None -> ())
                | _ -> ());
               let dl_url =
                 match Js.Json.decodeString asset with
                 | Some url -> Some url
                 | None ->
                     Option.bind (json_get asset "browser_download_url")
                       Js.Json.decodeString
               in
               let dl_url =
                 match dl_url with
                 | Some u -> u
                 | None ->
                     debug [| Js.Json.string "[Download URL Error]"; asset |];
                     raise
                       (tagged_error "release-asset-not-found"
                          (Js.Json.string (Js.Json.stringify asset)))
               in
               let dest =
                 Node.Path.join
                   [| Electron_configs.dot_root; "plugins"
                    ; Option.value
                        (wire_field "id" item |> wire_string)
                        ~default:"" |]
               in
               (if not only_check then
                  download_asset_zip item dl_url latest_version_str dest
                else Js.Promise.resolve ())
               |> Js.Promise.then_ (fun () ->
                      debug
                        [| Js.Json.string
                             (Printf.sprintf "[%s DONE]"
                                (if only_check then "Checked" else "Updated"))
                         ; latest_version |];
                      emit "lsp-updates"
                        (js_obj
                           [ ("status", Js.Json.string "completed")
                           ; ("onlyCheck", Js.Json.boolean only_check)
                           ; ( "payload"
                             , if only_check then
                                 item_payload item
                                   [ ("latestVersion", latest_version)
                                   ; ("latestNotes", notes) ]
                               else
                                 item_payload item
                                   [ ("zip", Js.Json.string dl_url)
                                   ; ("dst", Js.Json.string dest)
                                   ; ("installedVersion", latest_version) ]
                             ) ]);
                      Js.Promise.resolve ()))
        |> Js.Promise.catch (fun e ->
               emit "lsp-updates"
                 (js_obj
                    [ ("status", Js.Json.string "error")
                    ; ("onlyCheck", Js.Json.boolean only_check)
                    ; ( "payload"
                      , item_payload item
                          [ ("errorCode", error_message e) ] ) ]);
               Js.Promise.reject (js_to_exn e))
      in
      pipeline
      |> Js.Promise.catch (fun e ->
             (* contains? #{":no-new-version"} (.message e): in cljs the
                .message is a keyword object, never string-equal, so this
                check is always false — mirrored by the decode. *)
             let suppressed =
               match Js.Json.decodeString (error_message e) with
               | Some ":no-new-version" -> true
               | _ -> false
             in
             if not suppressed then debug [| error_as_json e |];
             Js.Promise.resolve ())
      |> promise_finally (fun [@u] () -> ())
  | None ->
      debug
        [| Js.Json.string "Skip install because no repo was given for: "
         ; wire_to_js item |];
      Js.Promise.resolve ()

let uninstall (id : string) =
  let id =
    Js.String.replaceByRe ~regexp:(Js.Re.fromString "^[./]+")
      ~replacement:"" id
  in
  let root = Option.get (Electron_utils.get_ls_dotdir_root ()) in
  let plugin_path = Node.Path.join [| root; "plugins"; id |] in
  let settings_path =
    Node.Path.join [| root; "settings"; id ^ ".json" |]
  in
  debug [| Js.Json.string "[Uninstall]"; Js.Json.string plugin_path |];
  if Fs_extra.pathExistsSync plugin_path then begin
    Fs_extra.removeSync plugin_path;
    Fs_extra.removeSync settings_path
  end
