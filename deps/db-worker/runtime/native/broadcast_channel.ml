type t = unit
type listener = unit

let create _ = invalid_arg "Broadcast_channel: unsupported on native"
let close _ = invalid_arg "Broadcast_channel: unsupported on native"
let post_message _ _ = invalid_arg "Broadcast_channel: unsupported on native"
let add_message_listener _ _ = invalid_arg "Broadcast_channel: unsupported on native"
let remove_message_listener _ _ = invalid_arg "Broadcast_channel: unsupported on native"
