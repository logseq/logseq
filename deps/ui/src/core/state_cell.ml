(* The mounted-singleton idiom shared by the *_state modules: one
   Signal.state cell created lazily (at mount or first use), a fail-fast
   getter, and the ready/state/value/signal/set accessors.
   Modules `include State_cell.Make(...)` and keep only their custom
   ensure/set on top. *)

module type ARG = sig
  type t
  val name : string
end

module Make (A : ARG) = struct
  let st : A.t Signal.state option ref = ref None

  let mount (ctx : Lui_ui.ui_context) (init : A.t) =
    match !st with
    | Some _ -> ()
    | None -> st := Some (Signal.state ctx.ui_scheduler init)

  (* create-on-first-use variant for cells without a mount point *)
  let get_or_init scheduler init =
    match !st with
    | Some s -> s
    | None ->
        let s = Signal.state scheduler init in
        st := Some s;
        s

  let ready () = Option.is_some !st

  let state () =
    match !st with
    | Some s -> s
    | None -> failwith (A.name ^ " state not mounted")

  let value () = Signal.get_state (state ())
  let signal () = (state ()).Signal.state_signal

  let set f =
    Signal.update (state ()) f;
    Runtime.flush ()
end

(* bare option-ref cell with a fail-fast getter — installed handles and
   ops tables that never become a Signal *)
module Cell (A : ARG) = struct
  let r : A.t option ref = ref None
  let install v = r := Some v
  let current () = !r

  let get () =
    match !r with Some v -> v | None -> failwith (A.name ^ " not installed")
end
