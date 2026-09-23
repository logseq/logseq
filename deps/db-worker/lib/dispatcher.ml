(* Endpoint registry + transit-string dispatch. Mirrors
   frontend.common.thread-api/remote-function: args arrive as a
   transit-encoded vector, result leaves transit-encoded; errors are
   encoded as tagged "error" values like ExceptionInfo. *)


type handler = Wire.t list -> Wire.t Db_worker_effect.t

let handlers : (string, handler) Hashtbl.t = Hashtbl.create 127

exception Not_implemented of string

let register name f = Hashtbl.replace handlers name f
let registered name = Hashtbl.mem handlers name
let registered_names () = Hashtbl.fold (fun k _ acc -> k :: acc) handlers []

let invoke name args =
  match Hashtbl.find_opt handlers name with
  | Some f -> (try f args with exn -> Db_worker_effect.error exn)
  | None -> Db_worker_effect.error (Not_implemented name)

(* ex-info equivalent: message + structured data map that survives
   the transit round-trip, so callers can match on ex-data keys like
   :type/:code/:repo the way cljs callers do. *)
exception Exn_info of string * (Wire.t * Wire.t) list

let encode_error name exn =
  let message, data =
    match exn with
    | Exn_info (msg, kvs) -> (msg, kvs)
    | Outliner_validate.Notification (Wire.Map kvs) ->
        ( (match Wire.get "message" (Wire.Map kvs) with
           | Some (Wire.String m) -> m
           | _ ->
               (match Wire.get "payload" (Wire.Map kvs) with
                | Some p ->
                    (match Wire.get "message" p with
                     | Some (Wire.String m) -> m
                     | _ -> Printexc.to_string exn)
                | None -> Printexc.to_string exn))
        , kvs )
    | _ -> (Printexc.to_string exn, [ (Wire.Keyword "endpoint", Wire.String name) ])
  in
  Wire.Tagged
    ( "error",
      Wire.Map
        [
          (Wire.Keyword "message", Wire.String message);
          (Wire.Keyword "data", Wire.Map data);
        ] )

let invoke_transit name transit_args =
  let open Db_worker_effect.Infix in
  let args =
    match Transit_codec.of_string transit_args with
    | Wire.Array xs -> xs
    | Wire.List xs -> xs
    | Wire.Nil -> []
    | other -> [ other ]
  in
  let task = invoke name args in
  (* cljs remote-function: a handler that throws synchronously
     ((apply f args) or a missing method) makes remoteInvoke reject; a
     handler whose promise rejects resolves the error transit instead.
     An already-settled task maps to the sync path, a pending one to the
     async path. *)
  if Db_worker_effect.is_pending task then
    Db_worker_effect.catch task (fun exn ->
        Db_worker_effect.pure (encode_error name exn))
    >>= fun result -> Db_worker_effect.pure (Transit_codec.to_string result)
  else
    Db_worker_effect.map Transit_codec.to_string task
