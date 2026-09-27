(* Render-scoped access to the current repo for worker lookups
   (e.g. resolving ((uuid)) block references). Reads the app-tracked
   current repo; falls back to the first listed graph before boot. *)

let with_repo f =
  match !Runtime.current_repo with
  | Some r -> f r
  | None ->
      ignore
        (Runtime.invoke "thread-api/list-db" []
         |> Js.Promise.then_ (fun w ->
                Js.Promise.resolve
                  (match w with
                   | Wire.Array (m :: _) -> (
                       match Wire.map_get_string m "name" with
                       | Some r -> f r
                       | None -> ())
                   | _ -> ())))
