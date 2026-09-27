(* Render-scoped access to the current repo for worker lookups
   (e.g. resolving ((uuid)) block references).

   TODO(render): [Render.title]'s signature carries no repo argument, so
   the repo is discovered lazily through thread-api/list-db (first
   graph, matching Boot.pick_graph).  When a proper "current repo"
   channel exists in the app layer, replace this with it. *)

let repo : string option ref = ref None
let loading = ref false
let waiters : (string -> unit) list ref = ref []

let first_repo = function
  | Wire.Array (m :: _) -> Wire.map_get_string m "name"
  | _ -> None

let drain () =
  let fs = List.rev !waiters in
  waiters := [];
  match !repo with
  | Some r -> List.iter (fun f -> f r) fs
  | None -> ()

let with_repo f =
  match !repo with
  | Some r -> f r
  | None ->
      waiters := f :: !waiters;
      if not !loading then (
        loading := true;
        Runtime.invoke "thread-api/list-db" []
        |> Js.Promise.then_ (fun w ->
               repo := first_repo w;
               drain ();
               Js.Promise.resolve ())
        |> ignore)
