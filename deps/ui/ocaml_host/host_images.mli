type t
val create : ?executor:Lui_resource.executor ->
  ?source:(string -> Lui_resource_loaders.source) -> on_change:(int -> unit) -> unit -> t
val sync_batch : t -> Lui_store.t -> Lui_protocol.patch_batch -> unit
val image_of : t -> int -> Lui_scene.image option
val owner_count : t -> int
val resource_count : t -> int
val dispose : t -> unit
