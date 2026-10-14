(* Page mutations against the db-worker outliner ops. Each applies then
   re-resolves the current route so views re-render. *)

open Promise_ext
let repo = Runtime.repo

let reload () = Router.resolve ()

let copy_url (page : Model.page) =
  match page.page_uuid with
  | None -> Toast.warning (I18n.t "page/no-page-found-to-copy")
  | Some entity_id ->
      let app_base_url =
        if Ui_services.env_dev_build () then "http://localhost:3001" else "https://logseq.com"
      in
      match Ui_url.entity_url_for_copy ~app_base_url
          ~graph_id:(!Runtime.current_graph_uuid)
          ~repo:(Runtime.model ()).repo ~entity_id ~kind:`Page with
      | Some url -> Ui_services.clipboard_copy url
      | None -> Toast.warning (I18n.t "page/copy-url-unavailable-warning")

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
