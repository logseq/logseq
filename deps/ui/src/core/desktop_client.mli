type transport = {
  mutable repo : string;
  mutable sink : string -> Wire.t -> unit;
  pending : (string * Wire.t list) Queue.t;
  dead : string Js.Promise.t;
  fail : exn -> unit;
  mutable stopped : bool;
}
val create_transport : unit -> transport
val invoke : transport -> string -> Wire.t list -> Wire.t Js.Promise.t
val start_events : transport -> on_failure:(unit -> unit) -> unit
