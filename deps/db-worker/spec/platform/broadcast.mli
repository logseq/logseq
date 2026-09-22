(* shared-service/broadcast-to-clients! — posts a transit-encoded
   [type' data] message back to every UI client.
   kind: keyword string without ":" (e.g. "rtc-log").
   transit_payload: Transit_codec.of the [kind-keyword data] array. *)
val to_clients : kind:string -> transit_payload:string -> unit

(* node embedders register the host event callback here (cljs
   platform/post-message! calls the host event-fn); browser workers ignore it
   and always use self.postMessage. *)
val set_post_fn : (kind:string -> payload:string -> unit) -> unit
