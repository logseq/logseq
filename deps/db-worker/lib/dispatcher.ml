(* Endpoint registry + transit-string dispatch. Mirrors
   frontend.common.thread-api/remote-function: args arrive as a
   transit-encoded vector, result leaves transit-encoded; errors are
   encoded as tagged "error" values like ExceptionInfo. *)


type handler = Wire.t list -> Wire.t Db_worker_effect.t

let handlers : (string, handler) Hashtbl.t = Hashtbl.create 127

(* ex-info equivalent: message + structured data map that survives
   the transit round-trip, so callers can match on ex-data keys like
   :type/:code/:repo the way cljs callers do. *)
exception Exn_info of string * (Wire.t * Wire.t) list

let register name f = Hashtbl.replace handlers name f
let registered name = Hashtbl.mem handlers name
let registered_names () = Hashtbl.fold (fun k _ acc -> k :: acc) handlers []

(* invoke_raw lets a synchronous raise escape the handler call — cljs
   (apply f args) throwing inside remote-function's try rejects
   remoteInvoke instead of resolving error transit. *)
let invoke_raw name args =
  match Hashtbl.find_opt handlers name with
  | Some f -> f args
  | None ->
      (* cljs (throw (ex-info (str "not found thread-api: " qkw) {})) —
         a synchronous throw: remoteInvoke rejects, the failure never
         enters the handler's promise channel. *)
      raise (Exn_info ("not found thread-api: " ^ name, []))

let invoke name args =
  try invoke_raw name args with exn -> Db_worker_effect.error exn

(* cljs (ex-message e) — the raw message, not Printexc.to_string's
   Constructor(...) rendering. *)
let exn_message = function
  | Invalid_argument m -> m
  | Failure m -> m
  | Assert_failure (file, line, col) ->
      Printf.sprintf "Assert failed: %s %d:%d" file line col
  | exn -> Printexc.to_string exn

let kw s = Wire.Keyword s

let error_payload message data =
  Wire.Map [ (kw "message", Wire.String message); (kw "data", data) ]

let encode_error _name exn =
  match exn with
  (* cljs ExceptionInfo -> ~#error {:message m :data m} *)
  | Exn_info (msg, kvs) -> Wire.Tagged ("error", error_payload msg (Wire.Map kvs))
  | Outliner_validate.Notification w ->
      let message =
        match w with
        | Wire.Map _ ->
            (match Wire.get "payload" w with
             | Some p ->
                 (match Wire.get "message" p with
                  | Some (Wire.String m) -> m
                  | _ -> exn_message exn)
             | None -> exn_message exn)
        | _ -> exn_message exn
      in
      Wire.Tagged ("error", error_payload message w)
  (* cljs js/Error -> ~#js/Error {:message m} *)
  | _ ->
      Wire.Tagged
        ( "js/Error",
          Wire.Map [ (kw "message", Wire.String (exn_message exn)) ] )

let invoke_transit name transit_args =
  let open Db_worker_effect.Infix in
  let args =
    match Transit_codec.of_string transit_args with
    | Wire.Array xs -> xs
    | Wire.List xs -> xs
    | Wire.Nil -> []
    | other -> [ other ]
  in
  (* cljs remote-function: `invoke` raising synchronously — unknown
     endpoint or an eager raise inside the handler call — makes
     remoteInvoke reject: the error escapes as a rejected effect rather
     than error transit. A handler's failure arriving as a rejected
     effect (settled or pending) is cljs's p/catch path: it resolves to
     error transit. *)
  match (try `Task (invoke_raw name args) with exn -> `Raise exn) with
  | `Raise exn -> Db_worker_effect.error exn
  | `Task task ->
      Db_worker_effect.catch task (fun exn ->
          Db_worker_effect.pure (encode_error name exn))
      >>= fun result ->
      Db_worker_effect.pure (Transit_codec.to_string result)
