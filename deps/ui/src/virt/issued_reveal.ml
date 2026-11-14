(* Minimal application contract, deliberately independent of domain loading and
   projection. The caller owns exactly one owner/root, the complete flat row
   sequence, intent cancellation, selection, and any editor focus transition. *)

type kind = Navigation | Editor of { require_focus : bool; control_node : unit -> int option; reveal : bool }
type phase = Awaiting | Scrolled | Releasing | Released | Cancelled | Refused of string
type issued = {
  attempt : int;
  key : string;
  block : string;
  kind : kind;
  current : unit -> bool;
  mutable scroll_token : int option;
  mutable retention : Lui_virtual.retention option;
  mutable releasing : Lui_virtual.receipt option;
  mutable phase : phase;
}
type demand = {
  scope : string; attempt : int; source_node : int; source_lease : int;
  owner_node : int; owner_epoch : int; ticket : int; key : string;
  block : string; require_focus : bool; control_node : int;
}
type t = {
  scope : string;
  source : Lui_virtual.source;
  request_scroll : key:string -> int;
  mutable current : issued option;
  mutable disposed : bool;
}

let producers : (string, t) Hashtbl.t = Hashtbl.create 4
let serial = ref 0

let create ~scope ~source ~request_scroll =
  if scope = "" || Hashtbl.mem producers scope then
    invalid_arg "Issued reveal requires a unique nonempty presentation scope";
  let producer = { scope; source; request_scroll; current = None; disposed = false } in
  Hashtbl.add producers scope producer;
  producer

let cancel_lease issued =
  Option.iter Lui_virtual.cancel_retention issued.retention;
  issued.retention <- None;
  issued.releasing <- None

let cancel producer ~attempt =
  match producer.current with
  | Some issued when issued.attempt = attempt ->
      cancel_lease issued;
      if issued.phase <> Released then issued.phase <- Cancelled
  | _ -> () (* A superseded application's callback cannot cancel a newer lease. *)

let dispose producer =
  if not producer.disposed then begin
    Option.iter (fun (issued : issued) -> cancel producer ~attempt:issued.attempt) producer.current;
    producer.disposed <- true;
    Hashtbl.remove producers producer.scope
  end

let issue producer ~key ~block ~kind ~current =
  if producer.disposed || key = "" || block = "" then
    invalid_arg "Issued reveal requires a live scope and exact projected row/block";
  if !serial = max_int then invalid_arg "Issued reveal attempt space exhausted";
  let source, owner = match Signal.sample (Lui_virtual.binding producer.source),
      Lui_virtual.Internal.owner_binding producer.source with
    | Some source, Some owner -> source, owner
    | _ -> invalid_arg "Issued reveal requires a bound root and owner" in
  let current () = current ()
    && Signal.sample (Lui_virtual.binding producer.source) = Some source
    && Lui_virtual.Internal.owner_binding producer.source = Some owner in
  if not (current ()) then invalid_arg "Issued reveal requires a current application intent";
  Option.iter (fun (issued : issued) -> cancel producer ~attempt:issued.attempt) producer.current;
  incr serial;
  let issued = { attempt = !serial; key; block; kind; current;
    scroll_token = None;
    retention = Some (Lui_virtual.retain producer.source ~key);
    releasing = None; phase = Awaiting } in
  producer.current <- Some issued;
  (* The app owns its token stream, including scroll requests outside this
     producer. An attempt ID cannot safely substitute for that scroll token. *)
  (try
     if (match kind with Navigation -> true | Editor editor -> editor.reveal) then begin
       let token = producer.request_scroll ~key in
       if token <= 0 then invalid_arg "Issued reveal requires a fresh positive scroll token";
       issued.scroll_token <- Some token
     end
   with failure -> cancel producer ~attempt:issued.attempt; raise failure);
  issued.attempt

let phase producer ~attempt =
  match producer.current with
  | Some issued when issued.attempt = attempt ->
      if not (issued.current ()) then begin
        cancel_lease issued;
        issued.phase <- Cancelled
      end;
      Some issued.phase
  | _ -> None

let scroll_token producer ~attempt =
  match producer.current with
  | Some issued when issued.attempt = attempt -> issued.scroll_token
  | _ -> None

let scroll_completed producer = function
  | Lui_protocol.ScrollCompleted (node, token, outcome) ->
      (match producer.current, Signal.sample (Lui_virtual.binding producer.source) with
       | Some issued, Some source when issued.kind = Navigation && node = source.node
           && Some token = issued.scroll_token && issued.phase = Awaiting && issued.current () ->
           if outcome = "succeeded" then begin
             (* Scrolling is not a native receipt. Navigation remains retained
                until the caller verifies the exact mounted occurrence and cancels. *)
             issued.phase <- Scrolled
           end else begin
             cancel_lease issued;
             issued.phase <- Refused outcome
           end
       | _ -> ())
  | _ -> invalid_arg "Expected a scroll completion event"

let refuse issued reason =
  cancel_lease issued;
  issued.phase <- Refused reason

let advance producer =
  match producer.current with
  | Some issued when not (issued.current ()) ->
      cancel_lease issued; issued.phase <- Cancelled
  | Some ({ kind = Editor { require_focus; _ }; retention = Some retention; _ } as issued) ->
      (match Signal.sample (Lui_virtual.receipt retention) with
       | None -> ()
       | Some receipt ->
           match Lui_virtual.receipt_status receipt with
           | Lui_virtual.Released ->
               issued.retention <- None;
               issued.releasing <- None;
               issued.phase <- Released
           | Lui_virtual.Missing_target -> refuse issued "missing-target"
           | Lui_virtual.Retired -> refuse issued "owner-retired"
           | Lui_virtual.Stale -> issued.releasing <- None; issued.phase <- Awaiting
           | Lui_virtual.Pinned | Lui_virtual.Focused ->
               let ready = not require_focus || Lui_virtual.receipt_status receipt = Lui_virtual.Focused in
               let already_requested = Option.fold ~none:false
                 ~some:(fun pending -> pending == receipt) issued.releasing in
               if ready && not already_requested then
                 (* Keep the exact current opaque SDK value. Never parse or
                    reconstruct a native receipt or release it in Swift. *)
                 match Lui_virtual.request_release retention receipt with
                 | Ok () -> issued.releasing <- Some receipt; issued.phase <- Releasing
                 | Error Lui_virtual.Stale_receipt -> issued.releasing <- None; issued.phase <- Awaiting
                 | Error Lui_virtual.Owner_retired -> refuse issued "owner-retired"
                 | Error Lui_virtual.Unsupported -> refuse issued "unsupported")
  | _ -> ()

(* Called under native_embed's entry lock after committing current app rows. *)
let has_editor_work () =
  Hashtbl.fold (fun _ producer work -> work ||
    match producer.current with
    | Some { kind = Editor _; retention = Some _; _ } -> true
    | _ -> false) producers false

let poll () =
  Hashtbl.fold (fun _ producer demands ->
    advance producer;
    match producer.current, Signal.sample (Lui_virtual.binding producer.source),
          Lui_virtual.Internal.owner_binding producer.source with
    | Some { attempt; key; block; kind = Editor { require_focus; control_node; _ };
             retention = Some retention; phase = Awaiting; _ }, Some source, Some owner ->
        (match control_node () with
         | None -> demands
         | Some control_node ->
             {scope = producer.scope; attempt; source_node = source.node; source_lease = source.lease;
              owner_node = owner.node; owner_epoch = owner.lease;
              ticket = Lui_virtual.ticket retention; key; block; require_focus; control_node} :: demands)
    | _ -> demands) producers []
