(* Port of src/electron/electron/utils.js — plain JS helpers used by
   handler.cljs and core.cljs: disableXFrameOptions, getAllFiles,
   deepReadDir. *)

open Electron_bindings

module Fs_extra = struct
  type dirent = <
    name : string [@mel.get];
    isDirectory : unit -> bool [@mel.meth]
  > Js.t

  external readdir_dirents :
    string -> < withFileTypes : bool > Js.t -> dirent array Js.Promise.t
    = "readdir" [@@mel.module "fs-extra"]

  external readdir : string -> string array Js.Promise.t = "readdir"
    [@@mel.module "fs-extra"]

  type stats = <
    size : float [@mel.get];
    atimeMs : float [@mel.get];
    mtimeMs : float [@mel.get];
    ctimeMs : float [@mel.get];
    birthtimeMs : float [@mel.get];
    isDirectory : unit -> bool [@mel.meth]
  > Js.t

  external lstat : string -> stats Js.Promise.t = "lstat"
    [@@mel.module "fs-extra"]
end

module Node_path = struct
  external resolve : string -> string -> string = "resolve"
    [@@mel.module "node:path"]

  external join : string -> string -> string = "join"
    [@@mel.module "node:path"]

  external extname : string -> string = "extname"
    [@@mel.module "node:path"]
end

external delete_property : Js.Json.t Js.Dict.t -> string -> bool
  = "deleteProperty" [@@mel.scope "Reflect"]

(* workaround from https://github.com/electron-userland/electron/issues/426 —
   strip x-frame-options / CSP headers on incoming responses so embedded
   pages can be framed. *)
let disable_x_frame_options (win : Browser_window.t) : unit =
  let session = Web_contents.session (Browser_window.web_contents win) in
  Web_request.on_headers_received (Session.web_request session)
    (fun [@u] details callback ->
      let headers = details##responseHeaders in
      List.iter
        (fun key -> ignore (delete_property headers key))
        [ "X-Frame-Options"; "x-frame-options"; "Content-Security-Policy"
        ; "content-security-policy" ];
      let payload = Js.Dict.empty () in
      Js.Dict.set payload "cancel" (Js.Json.boolean false);
      Js.Dict.set payload "responseHeaders" (Js.Json.object_ headers);
      callback (Js.Json.object_ payload) [@u])

(* getAllFiles dir exts — recursive walk; returns file records
   {path,size,accessTime,modifiedTime,changeTime,birthTime} filtered by
   extension (lowercased, dot-prefixed) when exts is Some. *)
type file_stat = <
  path : string [@mel.get];
  size : float [@mel.get];
  accessTime : float [@mel.get];
  modifiedTime : float [@mel.get];
  changeTime : float [@mel.get];
  birthTime : float [@mel.get]
> Js.t

let rec get_all_files dir (exts : string array option) :
    file_stat array Js.Promise.t =
  let exts =
    Option.map
      (Array.map (fun it ->
           let it =
             if it <> "" && not (Js.String.startsWith ~prefix:"." it) then
               "." ^ it
             else it
           in
           Js.String.toLowerCase it))
      exts
  in
  let open Js.Promise in
  Fs_extra.readdir_dirents dir [%mel.obj { withFileTypes = true }]
  |> then_ (fun dirents ->
         let stat_one dirent =
           let name = dirent##name in
           let file_path = Node_path.resolve dir name in
           if dirent##isDirectory () then get_all_files file_path exts
           else
             let ext_ok =
               match exts with
               | None -> true
               | Some exts ->
                   let ext =
                     Js.String.toLowerCase (Node_path.extname name)
                   in
                   Array.exists (String.equal ext) exts
             in
             if not ext_ok then resolve [||]
             else
               Fs_extra.lstat file_path
               |> then_ (fun stat ->
                      resolve
                        [| [%mel.obj
                             { path = file_path
                             ; size = stat##size
                             ; accessTime = stat##atimeMs
                             ; modifiedTime = stat##mtimeMs
                             ; changeTime = stat##ctimeMs
                             ; birthTime = stat##birthtimeMs }] |])
         in
         all (Array.map stat_one dirents)
         |> then_ (fun nested ->
                resolve (Array.concat (Array.to_list nested))))

(* deepReadDir dirPath flat — recursive readdir; returns string leaves,
   nested arrays preserved unless flat. Result is Json (string | array). *)
let rec deep_read_dir ~(flat : bool) dir : Js.Json.t Js.Promise.t =
  Js.Promise.(
    Fs_extra.readdir dir
    |> then_ (fun names ->
           all
             (Array.map
                (fun name ->
                  let root = Node_path.join dir name in
                  Fs_extra.lstat root
                  |> then_ (fun stat ->
                         if stat##isDirectory () then
                           deep_read_dir ~flat root
                         else resolve (Js.Json.string root)))
                names)
           |> then_ (fun children ->
                  if flat then
                    (* children may be strings or flattened arrays *)
                    let out = ref [] in
                    Array.iter
                      (fun c ->
                        match Js.Json.classify c with
                        | Js.Json.JSONArray xs ->
                            Array.iter
                              (fun x -> out := x :: !out)
                              xs
                        | _ -> out := c :: !out)
                      children;
                    resolve (Js.Json.array (Array.of_list (List.rev !out)))
                  else resolve (Js.Json.array children))))
