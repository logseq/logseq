type request =
  { url : string
  ; method_ : string
  ; headers : (string * string) list
  ; body : string option
  }

type response =
  { status : int
  ; headers : (string * string) list
  ; body : string
  }

let req_to_hooks (r : request) : Native_test_hooks.http_req =
  { Native_test_hooks.url = r.url; method_ = r.method_
  ; headers = r.headers; body = r.body }

let resp_of_hooks (r : Native_test_hooks.http_resp) : response =
  { status = r.status; headers = r.headers; body = r.body }

let real_send (req : request) : response Db_worker_effect.t =
  Db_worker_effect.map
    (fun (resp : Http.response) ->
       { status = resp.status; headers = resp.headers; body = resp.body })
    (Http.send
       { url = req.url; method_ = req.method_; headers = req.headers; body = req.body })

(* Test driver: tests rebind this like the cljs js/fetch stub. *)
let send_impl = ref real_send

let send req = !send_impl req

let decoded_read read first =
  let output = Bigstringaf.create Gz.io_buffer_size in
  let input chunk = Bigstringaf.of_string ~off:0 ~len:(String.length chunk) chunk in
  let decoder = ref (Gz.Inf.src (Gz.Inf.decoder `Manual ~o:output) (input first) 0 (String.length first)) in
  let ended = ref false in
  let input_ended = ref false in
  let next () =
    let task, resolver = Db_worker_effect.wait () in
    let reject error = Db_worker_effect.reject resolver error in
    let rec verify_end chunk =
      if Gz.Inf.src_rem chunk <> 0 then reject (Failure "Unexpected data after gzip member")
      else Db_worker_effect.on_any (read ())
        (function
          | Some "" -> verify_end chunk
          | Some _ -> reject (Failure "Unexpected data after gzip member")
          | None ->
              ended := true;
              let length = Gz.io_buffer_size - Gz.Inf.dst_rem chunk in
              Db_worker_effect.wakeup resolver
                (if length = 0 then None else Some (Bigstringaf.substring output ~off:0 ~len:length))) reject
    and step () =
      if !ended then Db_worker_effect.wakeup resolver None
      else
        try match Gz.Inf.decode !decoder with
        | `End state -> verify_end state
        | `Flush state ->
            let length = Gz.io_buffer_size - Gz.Inf.dst_rem state in
            decoder := Gz.Inf.flush state;
            if length = 0 then step ()
            else Db_worker_effect.wakeup resolver (Some (Bigstringaf.substring output ~off:0 ~len:length))
        | `Malformed message -> reject (Failure ("Invalid gzip: " ^ message))
        | `Await state ->
            if !input_ended then reject (Failure "Truncated gzip stream")
            else Db_worker_effect.on_any (read ()) (fun chunk ->
              let chunk = match chunk with None -> input_ended := true; "" | Some chunk -> chunk in
              decoder := Gz.Inf.src state (input chunk) 0 (String.length chunk);
              step ()) reject
        with error -> reject error in
    step ();
    task in
  next

let send_stream (req : request) consume =
  Http_transport.send_stream ~url:req.url ~method_:req.method_ ~headers:req.headers ~body:req.body
    (fun status headers read ->
      let gzip = List.exists (fun (name, value) ->
        String.lowercase_ascii name = "content-encoding" && String.lowercase_ascii value = "gzip") headers in
      if not gzip then consume status headers read
      else
        let rec peek prefix =
          if String.length prefix >= 2 then
            if String.sub prefix 0 2 = "\x1f\x8b" then consume status headers (decoded_read read prefix)
            else passthrough prefix
          else Db_worker_effect.bind (read ()) (function
            | Some chunk -> peek (prefix ^ chunk)
            | None -> passthrough prefix)
        and passthrough prefix =
          let first = ref (if prefix = "" then None else Some prefix) in
          consume status headers (fun () -> match !first with
            | Some chunk -> first := None; Db_worker_effect.pure (Some chunk)
            | None -> read ()) in
        peek "")

let () =
  Native_test_hooks.install_http_bytes_fn := (fun sb ->
      send_impl := (fun req ->
        Db_worker_effect.bind (sb (req_to_hooks req)) (fun body ->
            Db_worker_effect.pure { status = 200; headers = []; body })));
  Native_test_hooks.restore_http_bytes_fn := (fun () ->
      send_impl := real_send)
