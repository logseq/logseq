(* Port of logseq.publishing.export
   (deps/publishing/src/logseq/publishing/export.cljs) — node-only Electron
   main-process ns that exports files from multiple locations to provide a
   complete publishing app.

   The cljs API is promesa-based but every fs call it makes is synchronous;
   the port sequences the same ops in [Db_worker_effect] in the same order. *)

module Eff = Db_worker_effect
module Fs = File_sys
module Path = Gp_node_path

let ( >>= ) = Eff.Infix.( >>= )

(* cljs js-files / static-dirs *)
let js_files = [ "main.js"; "code-editor.js" ]
let static_dirs = [ "css"; "icons"; "img"; "js" ]

(* cljs {:type "success"|"error" :payload s} passed to notification-fn *)
type notification = { ntype : string; payload : string }

let iter_eff (f : 'a -> unit Eff.t) (xs : 'a list) : unit Eff.t =
  List.fold_left (fun acc x -> acc >>= fun () -> f x) (Eff.pure ()) xs

(* remove-js-source-maps *)
let remove_js_source_maps (output_static_dir : string) : unit Eff.t =
  let js_dir = Path.join [ output_static_dir; "js" ] in
  Fs.readdir js_dir >>= fun files ->
  iter_eff
    (fun file ->
      if Filename.check_suffix file ".map" then
        Fs.remove (Path.join [ js_dir; file ])
      else Eff.pure ())
    files

(* default-notification *)
let default_notification (msg : notification) : unit =
  if msg.ntype = "success" then Node_console.log msg.payload
  else Node_console.error msg.payload

(* copy-file! *)
let copy_file_bang (from : string) (to_ : string) : unit Eff.t =
  Fs.mkdir_p (Path.dirname to_) >>= fun () -> Fs.copy_file from to_

(* copy-path! *)
let rec copy_path (from : string) (to_ : string) : unit Eff.t =
  Fs.is_directory from >>= fun is_dir ->
  if is_dir then
    Fs.mkdir_p to_ >>= fun () ->
    Fs.readdir from >>= fun entries ->
    iter_eff
      (fun entry ->
        copy_path (Path.join [ from; entry ]) (Path.join [ to_; entry ]))
      entries
  else
    Fs.is_file from >>= fun is_file ->
    if is_file then copy_file_bang from to_ else Eff.pure ()

(* cleanup-js-dir *)
let cleanup_js_dir (output_static_dir : string) (source_static_dir : string)
    (dev : bool) : unit Eff.t =
  let publishing_dir = Path.join [ output_static_dir; "js"; "publishing" ] in
  (if not dev then remove_js_source_maps output_static_dir else Eff.pure ())
  >>= fun () ->
  iter_eff
    (fun file ->
      Fs.remove (Path.join [ output_static_dir; "js"; file ]))
    js_files
  >>= fun () ->
  (if dev then
     Fs.remove (Path.join [ output_static_dir; "js"; "cljs-runtime" ])
   else Eff.pure ())
  >>= fun () ->
  iter_eff
    (fun file ->
      if dev then
        Fs.symlink
          ~target:(Path.join [ source_static_dir; "js"; "publishing"; file ])
          ~link:(Path.join [ output_static_dir; "js"; file ])
      else
        Fs.rename
          (Path.join [ publishing_dir; file ])
          (Path.join [ output_static_dir; "js"; file ]))
    js_files
  >>= fun () ->
  (if dev then
     Fs.symlink
       ~target:
         (Path.join [ source_static_dir; "js"; "publishing"; "cljs-runtime" ])
       ~link:(Path.join [ output_static_dir; "js"; "cljs-runtime" ])
   else Eff.pure ())
  >>= fun () ->
  if not dev then Fs.remove publishing_dir else Eff.pure ()

(* cljs fse/copy — recursive copy of a file or dir *)
let fse_copy (from : string) (to_ : string) : unit Eff.t = copy_path from to_

(* copy-static-files-and-assets *)
let copy_static_files_and_assets (static_dir : string) (repo_path : string)
    (output_dir : string)
    ~(log_error_fn : string -> string -> string -> unit)
    ~(asset_filenames : string list) : unit Eff.t =
  let assets_from_dir = Path.join [ repo_path; "assets" ] in
  let assets_to_dir = Path.join [ output_dir; "assets" ] in
  let output_static_dir = Path.join [ output_dir; "static" ] in
  Fs.mkdir_p assets_to_dir >>= fun () ->
  copy_path (Path.join [ static_dir; "404.html" ])
    (Path.join [ output_dir; "404.html" ])
  >>= fun () ->
  iter_eff
    (fun part ->
      copy_path (Path.join [ static_dir; part ])
        (Path.join [ output_static_dir; part ]))
    static_dirs
  >>= fun () ->
  iter_eff
    (fun filename ->
      let from = Path.join [ assets_from_dir; filename ] in
      let to_ = Path.join [ assets_to_dir; filename ] in
      Eff.catch (fse_copy from to_) (fun e ->
          log_error_fn "Failed to copy"
            (Printf.sprintf "{:from %s :to %s}" from to_)
            (Printexc.to_string e);
          Eff.pure ()))
    asset_filenames

let default_log_error_fn (msg : string) (detail : string) (err : string) : unit =
  Node_console.error (msg ^ " " ^ detail ^ " " ^ err)

let read_if_exists (path : string) : string Eff.t =
  Fs.exists path >>= fun e -> if e then Fs.read_text path else Eff.pure ""

(* create-export *)
let create_export (html : string) (static_dir : string) (repo_path : string)
    (output_dir : string)
    ?(notification_fn : notification -> unit = default_notification)
    ?(log_error_fn : string -> string -> string -> unit = default_log_error_fn)
    ?(asset_filenames : string list = []) ?(dev : bool = false) () : unit Eff.t =
  let custom_css_path = Path.join [ repo_path; "logseq"; "custom.css" ] in
  let export_css_path = Path.join [ repo_path; "logseq"; "export.css" ] in
  let custom_js_path = Path.join [ repo_path; "logseq"; "custom.js" ] in
  let output_static_dir = Path.join [ output_dir; "static" ] in
  let index_html_path = Path.join [ output_dir; "index.html" ] in
  Eff.catch
    (Fs.mkdir_p output_static_dir >>= fun () ->
     Fs.write_text index_html_path html >>= fun () ->
     copy_static_files_and_assets static_dir repo_path output_dir ~log_error_fn
       ~asset_filenames
     >>= fun () ->
     read_if_exists export_css_path >>= fun export_css ->
     Fs.write_text
       (Path.join [ output_static_dir; "css"; "export.css" ])
       export_css
     >>= fun () ->
     read_if_exists custom_css_path >>= fun custom_css ->
     Fs.write_text
       (Path.join [ output_static_dir; "css"; "custom.css" ])
       custom_css
     >>= fun () ->
     read_if_exists custom_js_path >>= fun custom_js ->
     Fs.write_text
       (Path.join [ output_static_dir; "js"; "custom.js" ])
       custom_js
     >>= fun () ->
     cleanup_js_dir output_static_dir static_dir dev >>= fun () ->
     notification_fn
       { ntype = "success"
       ; payload =
           "Export public pages and publish assets to " ^ output_dir
           ^ " successfully \xF0\x9F\x8E\x89" };
     Eff.pure ())
    (fun e ->
      notification_fn
        { ntype = "error"
        ; payload =
            "Export public pages unexpectedly failed with: "
            ^ Printexc.to_string e };
      Eff.pure ())
