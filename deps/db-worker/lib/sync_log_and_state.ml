(* frontend.worker.sync.log-and-state — rtc log atom + broadcast.
   cljs keeps *rtc-log as an atom holding the latest {type, created-at, ...}
   map and broadcasts it as :rtc-log through the shared service. *)

let rtc_log : Wire.t ref = ref Wire.Nil

let allowed_types =
  [ "rtc.log/upload"; "rtc.log/download"; "rtc.log/checksum-mismatch"
  ; "rtc.log/tx-rejected"; "rtc.asset.log/upload-assets"
  ; "rtc.asset.log/download-assets"; "rtc.asset.log/remove-assets"
  ; "rtc.asset.log/asset-too-large"
  ; "rtc.asset.log/initial-download-missing-assets" ]

let add_rtc_log type' m =
  if not (List.mem type' allowed_types) then
    invalid_arg (Printf.sprintf "rtc-log: invalid type %s" type');
  let entry =
    match m with
    | Wire.Map kvs ->
        (* cljs (assoc m :type ... :created-at ...) replaces existing keys *)
        Wire.Map
          (List.filter
             (fun (k, _) ->
                not
                  (Wire.key_matches "type" k
                   || Wire.key_matches "created-at" k))
             kvs
           @ [ Wire.Keyword "type", Wire.Keyword type'
             ; Wire.Keyword "created-at"
             , Wire.Int64 (Time.epoch_ms_to_int64 (Time.now ())) ])
    | _ -> invalid_arg "rtc-log: m must be a map"
  in
  rtc_log := entry;
  Broadcast.to_clients ~kind:"rtc-log"
    ~transit_payload:
      (Transit_codec.to_string (Wire.Array [ Wire.Keyword "rtc-log"; entry ]))
