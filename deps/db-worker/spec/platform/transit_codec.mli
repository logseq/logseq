(* Platform transit codec. Melange: melange-transit Json backend.
   Native: melange-transit native backend. Both produce/consume the
   same transit-json wire format the CLJS worker uses. *)
val of_string : string -> Wire.t
val to_string : ?mode:Wire.mode -> Wire.t -> string
