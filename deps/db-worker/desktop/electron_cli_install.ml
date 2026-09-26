(* Port of electron.cli-install — writes the `logseq` CLI launcher
   script next to the app. All IO is dependency-injected like the cljs
   version, so the module stays pure and testable. *)

let cli_launcher_marker = "logseq-cli-managed"

(* deps record — mirrors the destructured deps map of the cljs fns. *)
type deps =
  { windows : bool
  ; cli_path : string
  ; cli_dir : string option
  ; cli_dir_fn : (unit -> string option) option
        (* :cli-dir! — lazy dir selector *)
  ; exe_path : string
  ; appimage_path : string option
  ; home_dir : string
  ; path_join : string list -> string
  ; exists : string -> bool
  ; read_file : string -> string
  ; write_file : string -> string -> unit
  ; chmod : string -> string -> unit
  ; ensure_dir : string -> unit
  ; writable_dir : string -> bool
  ; show_error_box : string -> string -> unit
  ; t : 'a. string -> 'a array -> string
  ; log_info : string -> string -> unit
  ; log_warn : 'a. string -> string -> 'a -> unit
  }

let split_path_env ?(windows = false) (path_env : string) : string list =
  let separator = if windows then ';' else ':' in
  String.split_on_char separator path_env
  |> List.filter (fun s -> String.trim s <> "")
  |> List.fold_left
       (fun acc x -> if List.mem x acc then acc else acc @ [ x ])
       []

let preferred_unix_cli_dir (d : deps) : string option =
  let user_bin = d.path_join [ d.home_dir; ".local"; "bin" ] in
  d.ensure_dir user_bin;
  if d.writable_dir user_bin then Some user_bin else None

let render_unix_cli_launcher ~exe_path ~cli_path : string =
  "#!/usr/bin/env sh\n# " ^ cli_launcher_marker ^ "\nset -eu\n"
  ^ "ELECTRON_RUN_AS_NODE=1 exec \"" ^ exe_path ^ "\" \"" ^ cli_path
  ^ "\" \"$@\"\n"

let render_win_cli_launcher ~exe_path ~cli_path : string =
  "@echo off\r\nREM " ^ cli_launcher_marker ^ "\r\n"
  ^ "set ELECTRON_RUN_AS_NODE=1\r\n" ^ "\"" ^ exe_path ^ "\" \""
  ^ cli_path ^ "\" %*\r\n"

let launcher_exe_path (d : deps) : string =
  if d.windows then d.exe_path
  else
    match d.appimage_path with
    | Some p when String.trim p <> "" -> p
    | _ -> d.exe_path

(* returns whether the launcher was (re)written *)
let write_cli_launcher (d : deps) ~target_path ~content : bool =
  let should_write =
    if d.exists target_path then
      let existing = d.read_file target_path in
      Common_util.str_includes existing cli_launcher_marker
      && existing <> content
    else true
  in
  if should_write then begin
    d.write_file target_path content;
    if not d.windows then d.chmod target_path "755";
    true
  end else false

let error_message (e : exn) : string =
  match Js.Exn.asJsExn e with
  | Some je ->
      (match Js.Exn.message je with
       | Some m -> m
       | None -> Js.String.make je)
  | None -> Printexc.to_string e

let install_cli_launcher (d : deps) : unit =
  try
    let cli_dir =
      match d.cli_dir_fn with
      | Some f -> f ()
      | None -> d.cli_dir
    in
    if not (d.exists d.cli_path) then
      Js.Exn.raiseError ("Missing CLI script at " ^ d.cli_path)
    else
      match cli_dir with
      | None ->
          Js.Exn.raiseError
            (if d.windows then
               "No CLI install directory found. The configured install directory could not be selected or is not writable."
             else
               "No CLI install directory found. Expected to install the launcher in ~/.local/bin, but that directory could not be created or is not writable.")
      | Some cli_dir ->
          let target_path =
            d.path_join
              [ cli_dir; if d.windows then "logseq.cmd" else "logseq" ]
          in
          let exe_path = launcher_exe_path d in
          let content =
            if d.windows then
              render_win_cli_launcher ~exe_path ~cli_path:d.cli_path
            else render_unix_cli_launcher ~exe_path ~cli_path:d.cli_path
          in
          if write_cli_launcher d ~target_path ~content then
            d.log_info "cli/install" ("Installed launcher at " ^ target_path)
  with error ->
    let message = error_message error in
    d.log_warn "cli/install" "Failed to install logseq launcher" error;
    d.show_error_box "Logseq"
      (d.t "electron/cli-install-failed" [| message |])

