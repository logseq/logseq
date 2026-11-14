(** TLDR: borrow an application's single owner/root and issue fenced reveal
    leases after its complete flat projection contains the exact scoped key.

    Usage: [create ~scope ~source ~request_scroll], then [issue] after
    domain load/expansion. [request_scroll] publishes the target and increments
    the app-owned token stream, returning that fresh positive scroll token.
    [current] fences the application's route, repository, scope and intent.
    Source lease and owner epoch are captured and checked by this controller.
    Dispose this controller before disposing the borrowed SDK owner. *)
type t
(** [Editor {reveal = false; _}] keeps an existing edit resident while a
    read-only navigation owns scrolling. It still requires an exact current
    control and real SDK receipts. A new editing session supersedes navigation. *)
type kind = Navigation | Editor of { require_focus : bool; control_node : unit -> int option; reveal : bool }
type phase = Awaiting | Scrolled | Releasing | Released | Cancelled | Refused of string
type demand = {
  scope : string; attempt : int; source_node : int; source_lease : int;
  owner_node : int; owner_epoch : int; ticket : int; key : string;
  block : string; require_focus : bool; control_node : int;
}

val create : scope:string -> source:Lui_virtual.source ->
  request_scroll:(key:string -> int) -> t
val issue : t -> key:string -> block:string -> kind:kind -> current:(unit -> bool) -> int
val phase : t -> attempt:int -> phase option
val scroll_token : t -> attempt:int -> int option

(** [Scrolled] proves only scroll completion. Verify the exact mounted occurrence
    separately, then [cancel] a short read-only navigation lease. Only editor
    handoffs can become [Released], following an actual SDK receipt/release. *)
val cancel : t -> attempt:int -> unit
val dispose : t -> unit
val scroll_completed : t -> Lui_protocol.event -> unit

(** Native entry only; call under the application's entry lock. *)
val has_editor_work : unit -> bool
val poll : unit -> demand list
