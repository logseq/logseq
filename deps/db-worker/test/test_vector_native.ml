let await task =
  let result = ref None in
  Db_worker_effect.on_any task (fun value -> result := Some (Ok value))
    (fun error -> result := Some (Error error));
  while !result = None do Thread.delay 0.001 done;
  match Option.get !result with Ok value -> value | Error error -> raise error

let doc id page vector_title embedding : Vector_index.doc =
  { id; page; embedding; vector_title = Some vector_title }

let () =
  let operation = Sys.argv.(1) and path = Sys.argv.(2) in
  let index = Option.get (await (Vector_index.open_index ~path ~dimension:3)) in
  Fun.protect ~finally:(fun () -> Vector_index.close index) (fun () ->
    match operation with
    | "seed" ->
        Vector_index.upsert index [doc "native" "原生" "Native title" [|1.; 0.; 0.|]]
    | "update" ->
        let results = Vector_index.query index ~embedding:[|1.; 0.; 0.|] ~limit:3 ~page:None in
        if (List.hd results).Vector_index.id <> "node" then failwith "Cannot read Node vectors";
        Vector_index.upsert index [doc "node" "页面" "Updated from native" [|1.; 0.; 0.|]];
        Vector_index.delete index ["remove"];
        ignore (await (Vector_index.set_metadata index ["embedding-dimension", Wire.Int 3]))
    | "inspect" ->
        let results = Vector_index.query index ~embedding:[|1.; 0.; 0.|] ~limit:10 ~page:None in
        let rows = List.map (fun (result : Vector_index.query_result) ->
          Wire.Map [Wire.String "id", Wire.String result.id;
            Wire.String "page", (match result.page with Some page -> Wire.String page | None -> Wire.Nil);
            Wire.String "title", (match result.vector_title with Some title -> Wire.String title | None -> Wire.Nil);
            Wire.String "score", Wire.Float result.vector_score]) results in
        print_endline (Json.stringify (Wire.Array rows))
    | _ -> invalid_arg "Unknown vector fixture operation")
