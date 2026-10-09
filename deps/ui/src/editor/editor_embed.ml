(* Node embeds — cljs commands.cljs db-based-embed-block +
   components/editor.cljs page-on-chosen-handler: picking a page inserts a
   sibling block on the current block, titled with the page name and
   carrying :block/link to the page entity; replace-empty-target turns the
   block the user was typing in into the embed. *)

open Promise_ext
module S = Editor_state
module Ops = Outliner_ops

(* db id of the page named [title], creating it when missing — cljs does
   create! for the "New page" row before embedding *)
let ensure_page_id repo (title : string) : int option Js.Promise.t =
  let fetch () =
    (let* w =
      Runtime.invoke2 "thread-api/get-case-page" (Wire.String repo)
        (Wire.String title)
    in
    Js.Promise.resolve (Wire.map_get_int w "db/id"))
    |> Js.Promise.catch (fun _ -> Js.Promise.resolve None)
  in
  let* v = fetch () in
  match v with Some _ as r -> Js.Promise.resolve r
| None ->
    let* () = Ops.apply [ Ops.create_page title ] in
    fetch ()

let insert title =
  match (String.trim title = "", (Runtime.model ()).Model.repo, S.editing_uuid ())
  with
  | true, _, _ | _, None, _ | _, _, None -> ()
  | false, Some repo, Some uuid ->
      ignore
        ((* cljs state/clear-edit!: the empty editing block is
                     replaced by the embed, drop edit mode without saving *) let* v = ensure_page_id repo title in
        match v with None -> Js.Promise.resolve ()
      | Some page_id ->
          (* cljs state/clear-edit!: the empty editing block is
             replaced by the embed, drop edit mode without saving *)
          S.set (fun st -> { st with S.editing = None });
          Ops.apply_and_refresh
            [ Ops.insert_blocks ~replace_empty_target:true
                [ Ops.block_map ~title ~link:page_id
                    (Ui_services.env_random_uuid ()) ]
                uuid ~sibling:true ])
