let post_fn = ref (fun ~kind:_ ~payload:_ -> ())

let set_post_fn f = post_fn := f

let to_clients ~kind ~transit_payload = !post_fn ~kind ~payload:transit_payload
