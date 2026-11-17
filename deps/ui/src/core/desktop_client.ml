open Promise_ext

type transport = {
  mutable repo : string;
  mutable sink : string -> Wire.t -> unit;
  pending : (string * Wire.t list) Queue.t;
  dead : string Js.Promise.t;
  fail : exn -> unit;
  mutable stopped : bool;
}

let call command request =
  let* result = Lui_web_desktop.invoke command request in
  match result with
  | Ok value -> Js.Promise.resolve value
  | Error error -> Js.Promise.reject (Failure error.Lui_command.message)

let json fields = Js.Json.stringify (Js.Json.object_ (Js.Dict.fromList fields))

let post t name args =
  let* result = call Desktop_commands.invoke (json [
    "repo", Js.Json.string t.repo; "method", Js.Json.string name;
    "argsTransit", Js.Json.string (Transit.to_string (Wire.Array args))]) in
  let response = Js.Json.parseExn result in
  let fields = match Js.Json.decodeObject response with
    | Some fields -> fields | None -> failwith "Invalid native worker response" in
  if Option.bind (Js.Dict.get fields "ok") Js.Json.decodeBoolean <> Some true then
    Js.Promise.reject (Failure ("Native database call failed: " ^ result))
  else match Option.bind (Js.Dict.get fields "resultTransit") Js.Json.decodeString with
    | Some value -> Js.Promise.resolve (Transit.of_string value)
    | None -> Js.Promise.reject (Failure "Native database response has no resultTransit")

let list_graphs () =
  let* result = call Desktop_commands.list_graphs () in
  match Js.Json.decodeArray (Js.Json.parseExn result) with
  | None -> Js.Promise.reject (Failure "Invalid native graph list")
  | Some names -> Js.Promise.resolve (Wire.Array (Array.to_list (Array.map (fun value ->
      match Js.Json.decodeString value with
      | Some name -> Wire.Map [Wire.kw "name", Wire.String name]
      | None -> failwith "Invalid native graph name") names)))

let invoke t name args =
  match name with
  | "thread-api/init" -> Js.Promise.resolve Wire.Nil
  | "thread-api/list-db" -> list_graphs ()
  | "thread-api/create-or-open-db" -> (
      match args with
      | Wire.String repo :: options :: _ ->
          let creating = Wire.get options "config" <> None in
          let* () = call Desktop_commands.open_graph
              (json ["repo", Js.Json.string repo; "create", Js.Json.boolean creating]) in
          t.repo <- repo;
          let rec flush () =
            if Queue.is_empty t.pending then Js.Promise.resolve ()
            else let method_, arguments = Queue.take t.pending in
              let* _ = post t method_ arguments in flush () in
          let* () = flush () in
          post t name args
      | _ -> Js.Promise.reject (Failure "Invalid native graph open request"))
  | _ when t.repo = "" -> Queue.add (name, args) t.pending; Js.Promise.resolve Wire.Nil
  | _ -> post t name args

let deliver t frame =
  match Transit.of_string frame with
  | Wire.Array (Wire.Keyword kind :: rest) | Wire.List (Wire.Keyword kind :: rest) ->
      t.sink kind (match rest with [payload] -> payload | values -> Wire.Array values)
  | _ -> failwith "Invalid native database event"

let start_events t ~on_failure =
  let rec poll () =
    let* encoded = call Desktop_commands.events () in
    (match Js.Json.decodeArray (Js.Json.parseExn encoded) with
     | Some frames -> Array.iter (fun value -> match Js.Json.decodeString value with
         | Some frame -> deliver t frame | None -> failwith "Invalid native event payload") frames
     | None -> failwith "Invalid native event batch");
    if t.stopped then Js.Promise.resolve () else poll () in
  ignore (poll () |> Js.Promise.catch (fun error ->
      t.stopped <- true;
      on_failure ();
      t.fail (Failure "Native database event stream stopped");
      Ui_services.log_error ("native database event stream", error);
      Js.Promise.resolve ()))

let create_transport () =
  let fail = ref (fun (_ : exn) -> ()) in
  let dead = Js.Promise.make (fun ~resolve:_ ~reject -> fail := (fun error -> reject error [@u])) in
  {repo = ""; sink = (fun _ _ -> ()); pending = Queue.create (); dead;
   fail = (fun error -> !fail error); stopped = false}
