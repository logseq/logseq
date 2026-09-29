(* Worker broadcast dispatch — Broadcast.to_clients on the worker posts
   `[<kind> <payload>]` transit arrays to the main thread; Worker_client
   decodes the frame and calls this with (kind, payload).

   - "notification"    -> toast push (see Decode.toast_of_wire)
   - "sync-db-changes" -> reload current route's data (keeps route_page
     until the fresh one lands — no blank flicker), then run the
     Runtime.on_sync subscribers (areas holding worker data outside the
     model)
   - anything else     -> Worker_event action for future consumers *)

let dispatch kind payload =
  match kind with
  | "notification" -> (
      match Decode.toast_of_wire payload with
      | Some t ->
          Runtime.send (Action.Toast_push t);
          Runtime.flush ()
      | None -> ())
  | "sync-db-changes" ->
      Router.reload ();
      Views_mount.refresh_query_insts ();
      Runtime.run_sync_subs ()
  | _ -> Runtime.send (Action.Worker_event (kind, payload))

(* sdk show_msg/close_msg dispatch `ls:toast`/`ls:toast-close`
   CustomEvents on document — same toast path as worker notifications. *)
let detail_json ev = Platform.json_prop ev "detail"

let init () =
  (* the worker's search-index build reports progress through this
     remoteInvoke; without a handler the worker->main comlink call hangs
     and the build never settles *)
  Worker_client.register_api "thread-api/search-index-build-progress"
    (fun args ->
      ignore args;
      Js.Promise.resolve Wire.Nil);
  Platform.on_document_event "ls:toast" (fun ev ->
      let d = detail_json ev in
      let text =
        match Js.Json.decodeObject d with
        | Some o -> (
            match Js.Dict.get o "msg" with
            | Some v -> Option.value (Js.Json.decodeString v) ~default:""
            | None -> "")
        | None -> ""
      in
      let kind =
        match Js.Json.decodeObject d with
        | Some o -> (
            match Js.Dict.get o "cls" with
            | Some v -> Option.value (Js.Json.decodeString v) ~default:"info"
            | None -> "info")
        | None -> "info"
      in
      Runtime.send
        (Action.Toast_push
           { Model.toast_id = 0; toast_text = text; toast_kind = kind });
      Runtime.flush ());
  Platform.on_document_event "ls:toast-close" (fun _ ->
      Runtime.send Action.Toasts_clear;
      Runtime.flush ())
