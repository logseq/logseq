(* Quick-add dialog state: the built-in "Quick add" page's block tree plus
   its page uuid, rendered editable inside the dialog (editing container
   "quick-add"). [latest] mirrors the signal so writes made before the
   dialog mounts (open flow fetches blocks first) still apply. *)

open Promise_ext
type t =
  { page_uuid : string option
  ; blocks : Model.block list
  }

let empty = { page_uuid = None; blocks = [] }
let latest = ref empty
let refresh_generation = ref 0
let refresh_task = ref (Js.Promise.resolve ())
include State_cell.Make (struct
  type nonrec t = t
  let name = "quick-add"
end)

let ensure ctx = mount ctx !latest

let value () = !latest

let set f =
  let next = f !latest in
  if next.page_uuid <> !latest.page_uuid then (
    incr refresh_generation;
    refresh_task := Js.Promise.resolve ());
  latest := next;
  match !st with
  | Some s ->
      Signal.update s (fun _ -> !latest);
      Runtime.flush ()
  | None -> ()

let reset () = set (fun _ -> empty)

(* re-pull the page's block tree after an outliner op — the dialog list is
   outside .page-blocks-inner, so refresh_page does not cover it *)
let rec await_refresh repo puuid =
  let generation = !refresh_generation and pending = !refresh_task in
  let* () = pending |> Js.Promise.catch (fun _ ->
      if generation = !refresh_generation then pending else Js.Promise.resolve ()) in
  if (Runtime.model ()).Model.repo = Some repo && !latest.page_uuid = Some puuid
     && generation <> !refresh_generation then await_refresh repo puuid
  else Js.Promise.resolve ()

let reload_result () =
  match (Runtime.model ()).Model.repo, !latest.page_uuid with
  | Some repo, Some puuid ->
      incr refresh_generation;
      let generation = !refresh_generation in
      let pending =
        let* w = Runtime.invoke3 "thread-api/get-page-blocks-tree"
            (Wire.String repo) (Wire.Uuid puuid) Wire.Nil in
        if (Runtime.model ()).Model.repo = Some repo && !latest.page_uuid = Some puuid
           && generation = !refresh_generation then
          set (fun state -> { state with blocks = Decode.blocks_of_wire w });
        Js.Promise.resolve () in
      refresh_task := pending;
      await_refresh repo puuid
  | _ -> Js.Promise.resolve ()

let reload () = ignore (reload_result ())
