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
    let graph = repo () and route = Runtime.route () in
    let* _ =
      Sdk_util.apply_op "rename-page"
        [ Wire.Uuid uuid; Wire.String new_title ]
    in
    if repo () <> graph || Runtime.route () <> route then Js.Promise.resolve ()
    else match route with
    | Model.Page name ->
        ignore (Router.load_page_ref ~accept_missing:true route (Wire.page_ref name));
        Js.Promise.resolve ()
    | _ -> Js.Promise.resolve (reload ())

let delete uuid =
  (* cljs delete-page! stays on the page route; page.cljs recycled?
     swaps the body for :page/moved-to-recycle. Do not bounce Home.
     Classes/properties are hard-retracted — accept_missing so the
     stale route_page is replaced with the not-found shell. *)
  let route_page = (Runtime.model ()).Model.route_page in
  let title, today, permanent =
    match route_page with
    | Some p when p.Model.page_uuid = Some uuid ->
        ( p.page_title
        , (match p.page_journal_day with
           | Some d -> d = Dates.today_journal_day ()
           | None -> false)
        , p.page_is_tag || p.page_is_property )
    | _ -> ("", false, false)
  in
  let route = Runtime.route () in
  let* _ = Sdk_util.apply_op "delete-page" [ Wire.Uuid uuid; Wire.Map [] ] in
  if today then
    Toast.success (I18n.t "page.delete/today-journal-truncate-success")
  else if title <> "" then
    Toast.success (I18n.t1 "page.delete/success" title);
  if Runtime.route () = route then (
    match permanent, route with
    | true, Model.Page name ->
        ignore
          (Router.load_page_ref ~accept_missing:true route
             (Wire.page_ref name))
    | _ -> reload ());
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
