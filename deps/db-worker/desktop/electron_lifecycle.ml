(* Port of src/electron/electron/lifecycle.cljs — serialize lifecycle
   operations and continue after an earlier operation fails. *)

let enqueue (op : unit Js.Promise.t ref)
    (operation : unit -> unit Js.Promise.t) : unit Js.Promise.t =
  let next_op =
    Js.Promise.then_
      (fun () -> operation ())
      (Js.Promise.catch (fun _ -> Js.Promise.resolve ()) !op)
  in
  op := next_op;
  next_op
