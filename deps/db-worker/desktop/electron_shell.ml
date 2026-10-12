(* Port of electron.shell — allowlisted shell commands spawned through
   a shell (e.g. the :runCli IPC handler). *)

open Datascript

module Child_process = struct
  type job

  external spawn : string -> string array -> 'a -> job = "spawn"
    [@@mel.module "child_process"]
  external stdout : job -> 'a = "stdout" [@@mel.get]
  external stderr : job -> 'a = "stderr" [@@mel.get]
  external on : 'a -> string -> ('b -> unit [@u]) -> unit = "on"
    [@@mel.send]
end

external command_exists_sync : string -> bool = "sync"
  [@@mel.module "command-exists"]

let commands_allowlist_builtin = [ "git"; "pandoc"; "ag"; "grep"; "alda" ]

(* set/union of the builtin set and [:config :commands-allowlist] entries
   normalized with trim + lower-case. *)
let get_commands_allowlist () : string list =
  let extra =
    Electron_configs.get_item "commands-allowlist"
    |> Clj_value.coll_items
    |> List.filter_map (fun v ->
           match v with
           | String s -> Some (Unicode.lowercase (Unicode.trim s))
           | _ -> None)
  in
  List.sort_uniq String.compare (commands_allowlist_builtin @ extra)

let run_command ~(on_data : 'a -> unit) ~(on_exit : 'a -> unit)
    (command : string) (args : string) : Child_process.job =
  Electron_logger.debug "Shell: %s" (command ^ " " ^ args);
  let job =
    Child_process.spawn (command ^ " " ^ args) [||]
      [%mel.obj { shell = true; detached = false }]
  in
  Child_process.on (Child_process.stderr job) "data"
    (fun [@u] x -> on_data x);
  Child_process.on (Child_process.stdout job) "data"
    (fun [@u] x -> on_data x);
  Child_process.on job "close" (fun [@u] x -> on_exit x);
  job

let ensure_command_exists (command : string) : string =
  if not (command_exists_sync command) then
    Js.Exn.raiseError ("Shell: " ^ command ^ " does not exist!");
  command

let ensure_command_in_allowlist (command : string) : string =
  if not (List.mem command (get_commands_allowlist ())) then
    Js.Exn.raiseError ("Shell: " ^ command ^ " is not allowed!");
  command

let run_command_safely ~(on_data : 'a -> unit) ~(on_exit : 'a -> unit)
    (command : string) (args : string) : Child_process.job option =
  (* the allowlist check runs on the normalized command; the spawned
     command string is the original, like the cljs version *)
  ignore
    (ensure_command_in_allowlist
       (ensure_command_exists (Unicode.lowercase (Unicode.trim command))));
  Some (run_command ~on_data ~on_exit command args)
