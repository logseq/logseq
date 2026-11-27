type t
val create : ?executor:Lui_resource.executor ->
  ?source:(string -> Lui_resource_loaders.source) -> ?visible:(int -> bool) -> on_change:(int -> unit) -> unit -> t
val sync_batch : t -> Lui_store.t -> Lui_protocol.patch_batch -> unit
val sync_visible : t -> Lui_store.t -> unit
val refresh_math : t -> Lui_store.t -> unit
val image_of : t -> int -> Lui_scene.image option
val owner_count : t -> int
val resource_count : t -> int
val dispose : t -> unit
