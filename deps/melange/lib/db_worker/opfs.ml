type navigator
type storage_manager
type directory_handle
type file_handle
type file
type writable
type file_handle_options
type handle
type values_iterator
type iterator_result

external navigator : navigator = "navigator"
external storage : navigator -> storage_manager = "storage" [@@mel.get]

external get_directory : storage_manager -> directory_handle Js.Promise.t
  = "getDirectory"
[@@mel.send]

external file_handle_options : create:bool -> unit -> file_handle_options = ""
[@@mel.obj]

external get_file_handle_read :
  directory_handle -> string -> file_handle Js.Promise.t = "getFileHandle"
[@@mel.send]

external get_file_handle_write :
  directory_handle -> string -> file_handle_options -> file_handle Js.Promise.t
  = "getFileHandle"
[@@mel.send]

external get_directory_handle :
  directory_handle -> string -> directory_handle Js.Promise.t
  = "getDirectoryHandle"
[@@mel.send]

external values : directory_handle -> values_iterator = "values" [@@mel.send]

external next : values_iterator -> iterator_result Js.Promise.t = "next"
[@@mel.send]

external done_ : iterator_result -> bool = "done" [@@mel.get]

external value : iterator_result -> handle option = "value"
[@@mel.get] [@@mel.return { undefined_to_opt }]

external kind : handle -> string = "kind" [@@mel.get]
external name : handle -> string = "name" [@@mel.get]

external create_writable : file_handle -> writable Js.Promise.t
  = "createWritable"
[@@mel.send]

external write : writable -> string -> unit Js.Promise.t = "write" [@@mel.send]
external close : writable -> unit Js.Promise.t = "close" [@@mel.send]
external get_file : file_handle -> file Js.Promise.t = "getFile" [@@mel.send]
external text : file -> string Js.Promise.t = "text" [@@mel.send]

let root () = get_directory (storage navigator)

let read_text path =
  root ()
  |> Js.Promise.then_ (fun root -> get_file_handle_read root path)
  |> Js.Promise.then_ get_file |> Js.Promise.then_ text

let write_text path payload =
  root ()
  |> Js.Promise.then_ (fun root ->
      get_file_handle_write root path (file_handle_options ~create:true ()))
  |> Js.Promise.then_ create_writable
  |> Js.Promise.then_ (fun writable ->
      write writable payload |> Js.Promise.then_ (fun () -> close writable))

let list_directory_names () =
  root ()
  |> Js.Promise.then_ (fun root ->
      let iter = values root in
      let rec loop acc =
        next iter
        |> Js.Promise.then_ (fun item ->
            if done_ item then Js.Promise.resolve (List.rev acc)
            else
              let acc =
                match value item with
                | Some handle when kind handle = "directory" ->
                    name handle :: acc
                | _ -> acc
              in
              loop acc)
      in
      loop [])

let directory_exists path =
  root ()
  |> Js.Promise.then_ (fun root ->
      get_directory_handle root path
      |> Js.Promise.then_ (fun _ -> Js.Promise.resolve true))
  |> Js.Promise.catch (fun _ -> Js.Promise.resolve false)
