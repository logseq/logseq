(* Owner-only messages must bypass the browser shared-service relay. *)
let post_to_owner ~kind ~transit_payload =
  match Runtime_env.kind () with
  | Runtime_env.Browser_worker -> Comlink.post_message transit_payload
  | Runtime_env.Node | Runtime_env.Native ->
      Broadcast.to_clients ~kind ~transit_payload
