(* Port of electron.i18n — Tongue translations for the Electron main
   process. Dictionaries are the same src/resources/dicts/*.edn files
   the renderer embeds; here they are loaded at runtime (the build
   copies src/resources/dicts to static/dicts/ next to electron.js; in
   dev ../resources/dicts is tried too). *)

module Fs_extra = struct
  external existsSync : string -> bool = "existsSync"
    [@@mel.module "fs-extra"]
end

external __dirname : string = "__dirname"

(* frontend.dicts/dicts keys — file name is the lowercase locale. *)
let locales =
  [ "en"; "de"; "nl"; "fr"; "zh-CN"; "zh-Hant"; "af"; "ca"; "es"; "nb-NO"
  ; "pt-BR"; "pt-PT"; "ru"; "ja"; "it"; "tr"; "ko"; "pl"; "sk"; "vi"
  ; "uk"; "fa"; "id"; "cs"; "ar" ]

let dict_file locale = String.lowercase_ascii locale ^ ".edn"

let dict_paths locale =
  [ Node.Path.join [| __dirname; "dicts"; dict_file locale |]
  ; Node.Path.join [| __dirname; "../resources/dicts"; dict_file locale |]
  ]

let loaded : (string, Tongue.dict) Hashtbl.t = Hashtbl.create 8

let dict_for (locale : string) : Tongue.dict option =
  match Hashtbl.find_opt loaded locale with
  | Some d -> Some d
  | None ->
      if not (List.mem locale locales) then None
      else
        (match List.find_opt Fs_extra.existsSync (dict_paths locale) with
         | None -> None
         | Some path ->
             let d =
               Tongue.compile_dict
                 (Edn_util.read_string (Node.Fs.readFileAsUtf8Sync path))
             in
             Hashtbl.replace loaded locale d;
             Some d)

let locale = ref "en"
let on_locale_change : (unit -> unit) option ref = ref None

let set_on_locale_change (f : unit -> unit) : unit =
  on_locale_change := Some f

let update_locale (language : string) : unit =
  (* cljs (or (some-> language keyword) :en) *)
  locale := (if language = "" then "en" else language);
  match !on_locale_change with
  | Some f -> f ()
  | None -> ()

let translate (loc : string) (key : string) (args : 'a array) : string =
  Tongue.translate ~dict_for ~fallback:"en" ~locale:loc ~key ~args

(* t [& args] — first arg is the key; a failure retries in :en, and when
   already in :en returns nil ("" here, since callers need a string). *)
let t (key : string) (args : 'a array) : string =
  try translate !locale key args
  with e ->
    Electron_logger.error
      "failed-translation %s"
      (Electron_logger.js_str e);
    if !locale <> "en" then translate "en" key args else ""

(* --- derived sets from the EN dict (frontend.dicts categories /
   abbreviated-commands). Keys of a flat edn dict survive build-dict
   unchanged. *)

let english_dict () : Tongue.dict =
  match dict_for "en" with
  | Some d -> d
  | None -> Hashtbl.create 0

let dict_keys (d : Tongue.dict) : string list =
  Hashtbl.fold (fun k _ acc -> k :: acc) d []

let key_namespace (k : string) : string option =
  match String.rindex_opt k '/' with
  | Some i when i > 0 -> Some (String.sub k 0 i)
  | _ -> None

let key_name (k : string) : string =
  match String.rindex_opt k '/' with
  | Some i -> String.sub k (i + 1) (String.length k - i - 1)
  | None -> k

let categories () : string list =
  List.filter
    (fun k -> key_namespace k = Some "shortcut.category")
    (dict_keys (english_dict ()))

let abbreviated_commands () : string list =
  List.filter_map
    (fun k ->
      match key_namespace k with
      | Some ns when Common_util.str_starts_with ns "command." ->
          Some (String.sub ns 8 (String.length ns - 8) ^ "/" ^ key_name k)
      | _ -> None)
    (dict_keys (english_dict ()))
