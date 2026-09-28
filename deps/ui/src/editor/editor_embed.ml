(* Node embeds — cljs commands.cljs db-based-embed-block +
   components/editor.cljs page-on-chosen-handler: picking a page inserts a
   sibling block on the current block, titled with the page name and
   carrying :block/link to the page entity; replace-empty-target turns the
   block the user was typing in into the embed. *)

module S = Editor_state
module Ops = Outliner_ops

(* db id of the page named [title], creating it when missing — cljs does
   create! for the "New page" row before embedding *)
let ensure_page_id repo (title : string) : int option Js.Promise.t =
  let fetch () =
    Runtime.invoke2 "thread-api/get-case-page" (Wire.String repo)
      (Wire.String title)
    |> Js.Promise.then_ (fun w ->
           Js.Promise.resolve (Wire.map_get_int w "db/id"))
    |> Js.Promise.catch (fun _ -> Js.Promise.resolve None)
  in
  fetch ()
  |> Js.Promise.then_ (function
       | Some _ as r -> Js.Promise.resolve r
       | None ->
           Ops.apply [ Ops.create_page title ]
           |> Js.Promise.then_ (fun () -> fetch ()))

let insert title =
  match (String.trim title = "", !Runtime.current_repo, S.editing_uuid ())
  with
  | true, _, _ | _, None, _ | _, _, None -> ()
  | false, Some repo, Some uuid ->
      ignore
        (ensure_page_id repo title
         |> Js.Promise.then_ (function
              | None -> Js.Promise.resolve ()
              | Some page_id ->
                  (* cljs state/clear-edit!: the empty editing block is
                     replaced by the embed, drop edit mode without saving *)
                  S.set_silent
                    (fun st -> { st with S.editing = None });
                  Ops.apply_and_refresh
                    [ Ops.insert_blocks ~replace_empty_target:true
                        [ Ops.block_map ~title ~link:page_id
                            (Platform.random_uuid ()) ]
                        uuid ~sibling:true ]))
