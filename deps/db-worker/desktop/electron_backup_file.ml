(* Port of src/electron/electron/backup_file.cljs — file-content backups
   under <repo>/logseq/bak (or an explicit backups dir) with hourly/daily
   version retention. *)

module Fs = struct
  type dirent

  external is_file : dirent -> bool = "isFile" [@@mel.send]
  external name : dirent -> string = "name" [@@mel.get]

  type readdir_options

  external readdir_options : withFileTypes:bool -> unit -> readdir_options
    = ""
  [@@mel.obj]

  external readdirSync : string -> readdir_options -> dirent array
    = "readdirSync"
  [@@mel.module "fs"]

  type stat

  external statSync : string -> stat = "statSync" [@@mel.module "fs"]
  external mtimeMs : stat -> float = "mtimeMs" [@@mel.get]
  external size : stat -> int = "size" [@@mel.get]
end

module Fs_extra = struct
  external ensureDirSync : string -> unit = "ensureDirSync"
    [@@mel.module "fs-extra"]
  external removeSync : string -> unit = "removeSync"
    [@@mel.module "fs-extra"]
end

let backup_dir = "backups"

(* clojure.string/replace with a string match replaces every occurrence;
   Js.String.replace only replaces the first. *)
let replace_all ~sub ~by s =
  if String.equal sub "" then s
  else String.concat by (Array.to_list (Js.String.split ~sep:sub s))

let strip_ext_re = Js.Re.fromString "\\.[^.]+$"

let get_backup_dir_with repo relative_path bak_dir =
  let relative_path = replace_all ~sub:repo ~by:"" relative_path in
  let bak_dir = Node.Path.join [| repo; bak_dir |] in
  let path = Node.Path.join [| bak_dir; relative_path |] in
  let parsed = Node.Path.parse path in
  Node.Path.join [| parsed##dir; parsed##name |]

let get_backup_dir repo relative_path =
  get_backup_dir_with repo relative_path backup_dir

(* Backup filenames look like 2025-12-25T01_23_45.678Z.ext: drop the last
   extension, turn '_' back into ':' and parse as ISO. *)
let parse_backup_ts filename =
  let base =
    filename
    |> Js.String.replaceByRe ~regexp:strip_ext_re ~replacement:""
    |> fun s -> replace_all ~sub:"_" ~by:":" s
  in
  let ms = Js.Date.parseAsFloat base in
  if Float.is_nan ms then None else Some ms

module String_set = Stdlib.Set.Make (String)

let hour_ms = 3600000.

(* Keep the latest keep-versions files: the first (min 6 keep-versions)
   kept are deduped per hour, the remainder per day. *)
let truncate_daily_versioned_files dir keep_versions =
  let keep_versions = max 0 (Option.value keep_versions ~default:0) in
  let keep_hourly = min 6 keep_versions in
  let dirents =
    Fs.readdirSync dir (Fs.readdir_options ~withFileTypes:true ())
  in
  let files =
    Array.to_list dirents
    |> List.filter Fs.is_file
    |> List.map Fs.name
  in
  let sorted =
    files
    |> List.map (fun n ->
           (n, Option.value (parse_backup_ts n) ~default:(-1.)))
    |> List.sort (fun (na, ta) (nb, tb) ->
           let c = Float.compare tb ta in
           if c <> 0 then c else String.compare na nb)
    |> List.map fst
  in
  let hour_key f ts =
    match ts with
    | Some ts ->
        Js.Date.toISOString
          (Js.Date.fromFloat (Float.floor ts -. mod_float ts hour_ms))
    | None -> "unparsable-hour:" ^ f
  in
  let day_key f ts =
    match ts with
    | Some ts ->
        Js.String.slice ~start:0 ~end_:10
          (Js.Date.toISOString (Js.Date.fromFloat ts))
    | None -> "unparsable-day:" ^ f
  in
  let rec loop xs kept kept_count hour_seen day_seen =
    match xs with
    | [] -> kept
    | f :: rest ->
        if kept_count >= keep_versions then kept
        else
          let ts = parse_backup_ts f in
          if String_set.cardinal hour_seen < keep_hourly then
            let hk = hour_key f ts in
            if String_set.mem hk hour_seen then
              loop rest kept kept_count hour_seen day_seen
            else
              loop rest (String_set.add f kept) (kept_count + 1)
                (String_set.add hk hour_seen) day_seen
          else
            let dk = day_key f ts in
            if String_set.mem dk day_seen then
              loop rest kept kept_count hour_seen day_seen
            else
              loop rest (String_set.add f kept) (kept_count + 1) hour_seen
                (String_set.add dk day_seen)
  in
  let keep_set = loop sorted String_set.empty 0 String_set.empty String_set.empty in
  List.iter
    (fun file ->
      if not (String_set.mem file keep_set) then
        Fs_extra.removeSync (Node.Path.join [| dir; file |]))
    files

(* {:name .. :ts .. :size ..} for the latest backup in dir, or None.
   Prefers the timestamp parsed from the filename; falls back to the
   file's mtimeMs. Clojure max-key keeps the last max on ties. *)
let latest_backup_info dir =
  let dirents =
    Fs.readdirSync dir (Fs.readdir_options ~withFileTypes:true ())
  in
  let files =
    Array.to_list dirents |> List.filter Fs.is_file |> List.map Fs.name
  in
  match files with
  | [] -> None
  | _ ->
      files
      |> List.map (fun name ->
             let p = Node.Path.join [| dir; name |] in
             let stat = Fs.statSync p in
             let ts =
               match parse_backup_ts name with
               | Some ts -> ts
               | None -> Fs.mtimeMs stat
             in
             (name, ts, Fs.size stat))
      |> List.fold_left
           (fun best (name, ts, size) ->
             match best with
             | Some (_, bts, _) when bts > ts -> best
             | _ -> Some (name, ts, size))
           None

let too_soon dir =
  let min_interval_ms = 3600000. in
  match latest_backup_info dir with
  | Some (_, ts, _) ->
      min_interval_ms > 0. && Js.Date.now () -. ts < min_interval_ms
  | None -> false

(* dir is the cljs :backup-dir selector; retained for callers mirroring
   the frontend.fs.node backupDbFile path. *)
let backup_file ~repo ~dir ~relative_path ~ext ~content
    ?(keep_versions = 6) ?backups_dir ?(force_backup = false) () =
  let dir =
    match backups_dir with
    | Some d -> d
    | None -> (match dir with `Backup_dir -> get_backup_dir repo relative_path)
  in
  Fs_extra.ensureDirSync dir;
  let new_path =
    Node.Path.join
      [| dir
       ; replace_all ~sub:":" ~by:"_"
           (Js.Date.toISOString (Js.Date.fromFloat (Js.Date.now ())))
         ^ ext |]
  in
  if force_backup || not (too_soon dir) then begin
    Node.Fs.writeFileAsUtf8Sync new_path content;
    ignore (Fs.statSync new_path : Fs.stat);
    truncate_daily_versioned_files dir (Some keep_versions)
  end
