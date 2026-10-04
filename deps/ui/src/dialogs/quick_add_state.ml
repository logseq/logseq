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
let st : t Signal.state option ref = ref None

let ensure (ctx : Lui_ui.ui_context) =
  match !st with
  | Some _ -> ()
  | None -> st := Some (Signal.state ctx.ui_scheduler !latest)

let value () = !latest

let signal () =
  match !st with
  | Some s -> s.Signal.state_signal
  | None -> failwith "quick-add state not mounted"

let set f =
  latest := f !latest;
  match !st with
  | Some s ->
      Signal.update s (fun _ -> !latest);
      Runtime.flush ()
  | None -> ()

let reset () = set (fun _ -> empty)

(* re-pull the page's block tree after an outliner op — the dialog list is
   outside .page-blocks-inner, so refresh_page does not cover it *)
let reload () =
  match (Runtime.model ()).Model.repo, !latest.page_uuid with
  | Some repo, Some puuid ->
      ignore
        (let* w =
          Runtime.invoke3 "thread-api/get-page-blocks-tree"
            (Wire.String repo) (Wire.Uuid puuid) Wire.Nil
        in
        set (fun s ->
            { s with blocks = Decode.blocks_of_wire w });
        Js.Promise.resolve ())
  | _ -> ()
