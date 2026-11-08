(* Page mutations against the db-worker outliner ops. Each applies then
   re-resolves the current route so views re-render. *)

open Promise_ext
let repo = Runtime.repo

let reload () = Router.resolve ()

let copy_url uuid =
  match uuid with
  | None -> Toast.warning (I18n.t "page/no-page-found-to-copy")
  | Some uuid ->
      let graph = Runtime.repo () in
      let encode = Ui_services.uri_encode_component in
      let url = match !Runtime.current_graph_uuid with
        | Some id when String.trim id <> "" ->
            let base = if Ui_services.env_dev_build () then "http://localhost:3001"
              else "https://logseq.com" in
            Some (base ^ "/page/" ^ encode uuid ^ "?graph-id=" ^ encode id)
        | _ when String.trim graph <> "" ->
            Some ("logseq://graph/" ^ encode (Graphs_ops.short_name graph) ^ "?block-id=" ^ uuid)
        | _ -> None in
      match url with
      | Some url -> Ui_services.clipboard_copy url
      | None -> Toast.warning (I18n.t "page/copy-url-unavailable-warning")

let set_public uuid value =
  let graph = repo () in
  let* _ = Properties_data.set_block_property ~block_uuid:uuid
    ~ident:"logseq.property/publishing-public?" ~value:(Wire.Bool value) in
  if repo () = graph then reload ();
  Js.Promise.resolve ()

let rename uuid new_title =
  if String.trim new_title = "" then Js.Promise.resolve ()
  else
    let* _ =
      Sdk_util.apply_op "rename-page"
        [ Wire.Uuid uuid; Wire.String new_title ]
    in
    Js.Promise.resolve (reload ())

let delete uuid =
  (* bounce to Home after deleting, but only when the route still
     points where it did at click time — a navigation that already
     happened (e.g. to Recycle) must not be stomped *)
  let from = Ui_services.nav_hash () in
  let* _ = Sdk_util.apply_op "delete-page" [ Wire.Uuid uuid; Wire.Map [] ] in
  if Ui_services.nav_hash () = from then
    Ui_services.nav_set_hash (Runtime.nav_hash "/");
  Js.Promise.resolve ()

let convert_to_tag db_id =
  let* _ =
    Runtime.invoke2 "thread-api/convert-page-to-tag"
      (Wire.String (repo ())) (Wire.Int db_id)
  in
  Js.Promise.resolve (reload ())

let convert_tag_to_page db_id =
  let* _ =
    Runtime.invoke2 "thread-api/convert-tag-to-page"
      (Wire.String (repo ())) (Wire.Int db_id)
  in
  Js.Promise.resolve (reload ())
