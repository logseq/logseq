(* Thin host service record for the shared properties implementation.
   The shared properties modules must not depend on Js/Web_dom/Platform,
   so the few genuine platform needs they have (deferred scheduling,
   error reporting, publishing mode, uuid/uri helpers, local-time date
   plumbing) arrive through this installed record — the same DI shape as
   Ui_services, kept separate so the ui_services owner can fold these ops
   into the shared contract later.

   Date/time ops stay an explicit small interface on purpose: value
   formatting is a legitimate platform difference — each runtime supplies
   its own local-time implementation (web via Js.Date, native via its
   date shim) instead of the shared code picking one. *)

type t =
  { schedule : (unit -> unit) -> int -> unit
  ; report_error : string -> unit
  ; publishing : unit -> bool
  ; random_uuid : unit -> string
  ; encode_uri_component : string -> string
  ; now_ms : unit -> float
  ; local_ymd_now : unit -> int * int * int
  ; local_ymd_of_ms : float -> int * int * int
  ; local_ms_of_fields :
      year:int -> month:int -> date:int -> hours:int -> minutes:int -> seconds:int -> float
  }

let instance : t option ref = ref None

let install t = instance := Some t

let svc () =
  match !instance with
  | Some t -> t
  | None -> invalid_arg "properties services not installed"

let schedule f ms = (svc ()).schedule f ms
let report_error e = (svc ()).report_error e
let publishing () = (svc ()).publishing ()
let random_uuid () = (svc ()).random_uuid ()
let encode_uri_component s = (svc ()).encode_uri_component s
let now_ms () = (svc ()).now_ms ()
let local_ymd_now () = (svc ()).local_ymd_now ()
let local_ymd_of_ms ms = (svc ()).local_ymd_of_ms ms

let local_ms_of_fields ~year ~month ~date ~hours ~minutes ~seconds =
  (svc ()).local_ms_of_fields ~year ~month ~date ~hours ~minutes ~seconds
