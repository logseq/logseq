(* Node embeds — cljs commands.cljs db-based-embed-block +
   components/editor.cljs block-on-chosen-handler: picking an entity inserts a
   sibling block on the current block carrying :block/link to the selected
   entity; replace-empty-target turns the
   block the user was typing in into the embed. *)

open Promise_ext
module S = Editor_state
module Ops = Outliner_ops

(* db id of the page named [title], creating it when missing — cljs does
   create! for the "New page" row before embedding *)
let ensure_page_id ~context ~current repo (title : string) : int option Js.Promise.t =
  let fetch () =
    (let* w =
      Runtime.invoke2 "thread-api/get-case-page" (Wire.String repo)
        (Wire.String title)
    in
    Js.Promise.resolve (Wire.map_get_int w "db/id"))
    |> Js.Promise.catch (fun _ -> Js.Promise.resolve None)
  in
  let* v = fetch () in
  if not (current ()) then Js.Promise.resolve None else
  match v with Some _ as r -> Js.Promise.resolve r
| None ->
    let* result = Ops.apply_result_for ~current context [ Ops.create_page title ] in
    if Option.is_none result || not (current ()) then Js.Promise.resolve None
    else fetch ()

let insert ?target_id title =
  let context = Runtime.model () in
  match (String.trim title = "" && Option.is_none target_id,
         context.Model.repo, S.editing ())
  with
  | true, _, _ | _, None, _ | _, _, None -> ()
  | false, Some repo, Some editor ->
      let uuid = editor.S.uuid in
      let buffer = Editor_actions.live_buffer uuid in
      let epoch = !(editor.S.epoch) in
      let current () =
        Ops.context_current context
        && match S.editing () with
           | Some e -> e.S.uuid = uuid && e.epoch == editor.epoch
               && !(e.epoch) = epoch && Editor_actions.live_buffer uuid = buffer
           | None -> false
      in
      (* Erasing autocomplete changes the live buffer, not a query that
         autosave has already persisted. Await its replacement before insert. *)
      let save = Ops.accept_save uuid buffer in
      ignore
        (let* saved = Ops.save_pending_result save in
         if Option.is_none saved || not (current ()) then Js.Promise.resolve () else
         let* v = match target_id with
           | Some id -> Js.Promise.resolve (Some id)
           | None -> ensure_page_id ~context ~current repo title
         in
         match v with
         | Some link_id when current () ->
          let owner = Ops.refresh_owner_for None in
          let* result = Ops.apply_result_for ~current context
            [ Ops.insert_blocks ~replace_empty_target:true
                [ Ops.block_map ~title ~link:link_id
                    (Ui_services.env_random_uuid ()) ]
                uuid ~sibling:true ] in
          if Option.is_none result || not (current ()) then Js.Promise.resolve ()
          else begin
            S.set (fun st -> { st with S.editing = None });
            if Dialogs_state.ready () && Dialogs_state.is_open "quick-add" then
              Quick_add_state.reload ();
            Ops.refresh_via_delta ?owner result
          end
         | _ -> Js.Promise.resolve ())
