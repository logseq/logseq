let post_fn = ref (fun ~kind:_ ~payload:_ -> ())

let set_post_fn f = post_fn := f

let extra_poster = ref (fun ~kind:_ ~transit_payload:_ -> ())

let set_extra_poster f =
  extra_poster := Option.value ~default:(fun ~kind:_ ~transit_payload:_ -> ()) f

let to_clients ~kind ~transit_payload =
  !post_fn ~kind ~payload:transit_payload;
  !extra_poster ~kind ~transit_payload
