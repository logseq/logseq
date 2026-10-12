(* shared-service/broadcast-to-clients!
   browser worker: self.postMessage(transit-payload) plus, while a
   shared-service common channel is live, the {type,data} relay so
   slave clients' UI threads see the same broadcasts (cljs
   shared-service/broadcast-to-clients!); node embedders register a
   callback via set_post_fn — cljs platform/post-message! calls the
   host's event-fn the same way. *)

let post_fn = ref (fun ~kind:_ ~payload:_ -> ())

let set_post_fn f = post_fn := f

let extra_poster = ref (fun ~kind:_ ~transit_payload:_ -> ())

let set_extra_poster f =
  extra_poster := Option.value ~default:(fun ~kind:_ ~transit_payload:_ -> ()) f

let to_clients ~kind ~transit_payload =
  (match Runtime_env.kind () with
   | Browser_worker -> Comlink.post_message transit_payload
   | _ -> !post_fn ~kind ~payload:transit_payload);
  !extra_poster ~kind ~transit_payload
