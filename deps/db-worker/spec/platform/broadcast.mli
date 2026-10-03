(* shared-service/broadcast-to-clients! — posts a transit-encoded
   [type' data] message back to every UI client.
   kind: keyword string without ":" (e.g. "rtc-log").
   transit_payload: Transit_codec.of the [kind-keyword data] array. *)
val to_clients : kind:string -> transit_payload:string -> unit

(* node embedders register the host event callback here (cljs
   platform/post-message! calls the host event-fn); browser workers ignore it
   and always use self.postMessage. *)
val set_post_fn : (kind:string -> payload:string -> unit) -> unit

(* Optional secondary poster fired by [to_clients] after the primary
   post — the shared-service common-channel relay registers itself
   here while a service is live (cljs shared-service/broadcast-to-clients!
   posts to both self and the common channel). *)
val set_extra_poster : (kind:string -> transit_payload:string -> unit) option -> unit
