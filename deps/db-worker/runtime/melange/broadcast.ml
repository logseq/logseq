(* shared-service/broadcast-to-clients!
   browser worker: self.postMessage(transit-payload)
   (the cljs shared-service BroadcastChannel is an embedder concern and is
   not ported yet); node embedders register a callback via set_post_fn —
   cljs platform/post-message! calls the host's event-fn the same way. *)

let post_fn = ref (fun ~kind:_ ~payload:_ -> ())

let set_post_fn f = post_fn := f

let to_clients ~kind ~transit_payload =
  match Runtime_env.kind () with
  | Browser_worker -> Comlink.post_message transit_payload
  | _ -> !post_fn ~kind ~payload:transit_payload
