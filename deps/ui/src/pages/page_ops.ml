(* Page mutations against the db-worker outliner ops. Each applies then
   re-resolves the current route so views re-render. *)

let repo () = Option.value !Runtime.current_repo ~default:""

let reload () = Router.resolve ()

let rename uuid new_title =
  if String.trim new_title = "" then Js.Promise.resolve ()
  else
    Sdk_util.apply_op "rename-page"
      [ Wire.Uuid uuid; Wire.String new_title ]
    |> Js.Promise.then_ (fun _ -> Js.Promise.resolve (reload ()))

let delete uuid =
  (* bounce to Home after deleting, but only when the route still
     points where it did at click time — a navigation that already
     happened (e.g. to Recycle) must not be stomped *)
  let from = Platform.location_hash () in
  Sdk_util.apply_op "delete-page" [ Wire.Uuid uuid; Wire.Map [] ]
  |> Js.Promise.then_ (fun _ ->
         if Platform.location_hash () = from then
           Platform.set_location_hash (Runtime.nav_hash "/");
         Js.Promise.resolve ())

let convert_to_tag db_id =
  Runtime.invoke2 "thread-api/convert-page-to-tag"
    (Wire.String (repo ())) (Wire.Int db_id)
  |> Js.Promise.then_ (fun _ -> Js.Promise.resolve (reload ()))

let convert_tag_to_page db_id =
  Runtime.invoke2 "thread-api/convert-tag-to-page"
    (Wire.String (repo ())) (Wire.Int db_id)
  |> Js.Promise.then_ (fun _ -> Js.Promise.resolve (reload ()))
