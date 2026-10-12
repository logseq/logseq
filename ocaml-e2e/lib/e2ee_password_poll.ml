let modal_selector = ".e2ee-password-modal-content"
let cloud_ready_selector = "button.cloud.on.idle"
let poll_ms = 250.
let grace_ms = 2000.
let timeout_ms = 20000.

module type Monad = sig
  type 'a t
  val return : 'a -> 'a t
  val bind : 'a t -> ('a -> 'b t) -> 'b t
end

module Make (M : Monad) = struct
  let run ~visible ~wait_timeout ~input_password () =
    let rec loop remaining_ms cloud_ready_ms =
      M.bind (visible modal_selector) (fun modal ->
        if modal then input_password ()
        else M.bind (visible cloud_ready_selector) (fun cloud_ready ->
          if cloud_ready_ms >= grace_ms && cloud_ready then
            M.return ()
          else if remaining_ms <= 0. then M.return ()
          else M.bind (wait_timeout poll_ms) (fun () ->
            loop (remaining_ms -. poll_ms)
              (if cloud_ready then cloud_ready_ms +. poll_ms else 0.))))
    in
    loop timeout_ms 0.
end
