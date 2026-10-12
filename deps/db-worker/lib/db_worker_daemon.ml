(* logseq.db-worker.daemon — helpers for probing a running
   db-worker-node daemon: owner-source normalization, pid liveness
   and a small http client. *)

module E = Db_worker_effect

(* :ownership-protocol *)

let valid_owner_sources = [ "cli"; "electron"; "unknown" ]

(* normalize-owner-source — keywords and strings normalize to their
   name, anything else to :unknown. An empty/absent source is :unknown
   (cljs nil normalizes the same way). *)
let normalize_owner_source (v : Wire.t) : string =
  match v with
  | Wire.Keyword s -> s
  | Wire.String "" -> "unknown"
  | Wire.String s -> s
  | _ -> "unknown"

(* pid-status — process.kill(pid, 0) mapped to a status. *)
let pid_status = Node_process.kill0

(* http-request — cljs resolves {:status :body :elapsed-ms}; timeout
   (default 5s) rejects with a :timeout ex-info. *)
type http_result =
  { status : int
  ; body : string
  ; elapsed_ms : float
  }

let http_request ?(timeout_ms = 5000.) ~method_ ~host ~port ~path
    ?(headers = []) ?body () : http_result E.t =
  let start_ms = Time.monotonic_now () in
  let url =
    Printf.sprintf "http://%s:%d%s" host port path
  in
  E.map
    (fun (res : Http.response) ->
       { status = res.status
       ; body = res.body
       ; elapsed_ms = Time.diff_monotonic_ms start_ms (Time.monotonic_now ()) })
    (E.timeout
       (Http.send { url; method_; headers; body })
       timeout_ms)

(* ready? — GET /healthz with a 1s timeout; any failure means not
   ready. *)
let ready ~host ~port : bool E.t =
  E.catch
    (E.map
       (fun r -> r.status = 200)
       (http_request ~timeout_ms:1000. ~method_:"GET" ~host ~port
          ~path:"/healthz" ()))
    (fun _ -> E.pure false)
