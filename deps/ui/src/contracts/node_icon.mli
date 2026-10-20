type t =
  { icon_kind : string
  ; icon_id : string
  ; icon_color : string option
  }

val tabler : ?color:string -> string -> t
val emoji : string -> t
val decode : Wire.t -> t option
val own : Wire.t -> t option
val tags : Wire.t -> Wire.t list
val tag_ident : Wire.t -> string option
val inherited : Wire.t list -> t list
val resolve : own:t option -> is_class:bool -> is_property:bool ->
  asset_type:string option -> inherited:t list -> fallback:t option -> t option
val of_entity : ?ignore_current:bool -> fallback:t option -> Wire.t -> t option
