(* Port of frontend.worker.sync.crypt (E2EE helpers for db-sync) plus
   the helper surface it pulls from frontend.common.crypt,
   frontend.worker.sync.{util,auth}, frontend.worker.ui-request, and
   frontend.worker-common.util/parse-jwt.

   Wire conventions: cljs keyword maps are [Wire.Map] with
   [Wire.Keyword] keys; transit strings flow through
   [transit_read]/[transit_write] (ldb/read-transit-str /
   write-transit-str); cljs CryptoKey/js-Uint8Array handles are raw
   byte strings via the [Crypto] platform vm. Encrypted packages are
   transit vectors [salt iv data] / [version salt iv data] (private
   keys) / [iv data] (aes-gcm text).

   Redef seams: every platform/crypt/internal function the cljs tests
   stub through with-redefs is a module-level [*_fn] ref defaulting to
   the real implementation; tests assign the ref directly and
   [reset_hooks] restores all defaults. *)

open Db_worker_effect

(* ---------- atoms ---------- *)

let graph_aes_keys : (string, Wire.t) Hashtbl.t = Hashtbl.create 7

let user_rsa_key_pair_inflight : ((string * string), Wire.t t) Hashtbl.t =
  Hashtbl.create 7

let ensure_user_rsa_key_pair_inflight
  : ((string * string * bool option * bool option), Wire.t t) Hashtbl.t =
  Hashtbl.create 7

let node_default_auth_file = "~/logseq/auth.json"
let e2ee_password_secret_key = "logseq-encrypted-password"
let default_ui_timeout_ms = 60000
let pbkdf2_version = "20251210"
let encrypt_attr_set = [ "block/title"; "block/name" ]

(* ---------- wire helpers ---------- *)

let kw s = Wire.Keyword s
let str s = Wire.String s
let wire_opt f = function Some x -> f x | None -> Wire.Nil

let kw_name s =
  match String.rindex_opt s '/' with
  | Some i -> String.sub s (i + 1) (String.length s - i - 1)
  | None -> s

let wire_assoc key v m =
  match m with
  | Wire.Map kvs ->
      Wire.Map ((kw key, v) :: List.filter (fun (k, _) -> not (Wire.key_matches key k)) kvs)
  | _ -> Wire.Map [ (kw key, v) ]

let seq_ = function
  | Some s -> String.length (String.trim s) > 0
  | None -> false

(* Wraps an effect-body so sync raises (fail-fast, transit errors
   before the first bind) become rejections, like promesa. *)
let run f = try f () with e -> error e

(* ---------- ex-info helpers ---------- *)

let ex_info msg data = Dispatcher.Exn_info (msg, data)

let exn_data (e : exn) : (Wire.t * Wire.t) list =
  match e with
  | Dispatcher.Exn_info (_, data) -> data
  | _ -> []

let exn_field k e =
  match List.find_opt (fun (ek, _) -> Wire.key_matches k ek) (exn_data e) with
  | Some (_, v) -> Some v
  | None -> None

let exn_code e =
  match exn_field "code" e with
  | Some (Wire.Keyword s) | Some (Wire.String s) -> Some s
  | _ -> None

let exn_field_true k e =
  match exn_field k e with
  | Some (Wire.Bool true) -> true
  | _ -> false

let exn_message (e : exn) : string =
  match e with
  | Dispatcher.Exn_info (m, _) -> m
  | Failure m -> m
  | Invalid_argument m -> m
  | e -> Printexc.to_string e

let fail_fast tag data =
  Worker_log.error tag [];
  raise (ex_info (kw_name tag) (Wire.as_map data))

let missing_e2ee_password_exn data =
  ex_info "missing-e2ee-password"
    (Wire.as_map
       (Wire.kw_map
          ([ ("code", kw "db-sync/missing-e2ee-password");
             ("field", kw "e2ee-password") ]
           @ data)))

let fail_missing_e2ee_password_impl data : unit =
  fail_fast "db-sync/missing-e2ee-password"
    (Wire.kw_map
       ([ ("code", kw "db-sync/missing-e2ee-password");
          ("field", kw "e2ee-password") ]
        @ data))

let fail_missing_e2ee_password_fn : ((string * Wire.t) list -> unit) ref =
  ref fail_missing_e2ee_password_impl

let ensure_refresh_token refresh_token =
  if not (seq_ refresh_token) then
    !fail_missing_e2ee_password_fn
      [ ("reason", kw "missing-refresh-token");
        ("hint", str "Run logseq login first.") ]

let non_retriable_user_rsa_key_error_codes =
  [ "ui-interaction-required"; "ui-request-cancelled"; "ui-request-rejected";
    "ui-request-timeout" ]

let user_rsa_key_cache_retryable_error error =
  match exn_code error with
  | Some c -> not (List.mem c non_retriable_user_rsa_key_error_codes)
  | None -> true

(* ---------- base64 ---------- *)

let decode_base64 s =
  let tbl = Array.make 256 (-1) in
  String.iteri
    (fun i c -> tbl.(Char.code c) <- i)
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = Buffer.create (String.length s) in
  let i = ref 0 in
  while !i < String.length s && s.[!i] <> '=' do
    let read_v k =
      if !i + k < String.length s && s.[!i + k] <> '=' then
        let v = tbl.(Char.code s.[!i + k]) in
        if v >= 0 then Some v else None
      else None
    in
    match read_v 0, read_v 1, read_v 2, read_v 3 with
    | Some a, Some b, Some c, Some d ->
        Buffer.add_char out (Char.chr ((a lsl 2) lor (b lsr 4)));
        Buffer.add_char out (Char.chr (((b lsl 4) lor (c lsr 2)) land 0xFF));
        Buffer.add_char out (Char.chr (((c lsl 6) lor d) land 0xFF));
        i := !i + 4
    | Some a, Some b, Some c, None ->
        Buffer.add_char out (Char.chr ((a lsl 2) lor (b lsr 4)));
        Buffer.add_char out (Char.chr (((b lsl 4) lor (c lsr 2)) land 0xFF));
        i := !i + 4
    | Some a, Some b, None, _ ->
        Buffer.add_char out (Char.chr ((a lsl 2) lor (b lsr 4)));
        i := !i + 4
    | _ -> i := !i + 4
  done;
  Buffer.contents out

let decode_base64url s =
  let buf = Buffer.create (String.length s) in
  String.iter
    (fun c -> Buffer.add_char buf (match c with '-' -> '+' | '_' -> '/' | c -> c))
    s;
  decode_base64 (Buffer.contents buf)

(* cljs decode-username: read UTF-16 code units, keep the low byte of
   each, then UTF-8 decode the resulting bytes (identity for ASCII). *)
let decode_username s =
  let low = Buffer.create (String.length s) in
  let i = ref 0 in
  while !i < String.length s do
    let dec = String.get_utf_8_uchar s !i in
    if Uchar.utf_decode_is_valid dec then begin
      let cp = Uchar.to_int (Uchar.utf_decode_uchar dec) in
      i := !i + Uchar.utf_decode_length dec;
      if cp <= 0xFFFF then Buffer.add_char low (Char.chr (cp land 0xFF))
      else begin
        let v = cp - 0x10000 in
        let hi = 0xD800 lor (v lsr 10) and lo = 0xDC00 lor (v land 0x3FF) in
        Buffer.add_char low (Char.chr (hi land 0xFF));
        Buffer.add_char low (Char.chr (lo land 0xFF))
      end
    end else i := !i + 1
  done;
  let src = Buffer.contents low in
  let buf = Buffer.create (String.length src) in
  let j = ref 0 in
  while !j < String.length src do
    let dec = String.get_utf_8_uchar src !j in
    if Uchar.utf_decode_is_valid dec then begin
      Buffer.add_utf_8_uchar buf (Uchar.utf_decode_uchar dec);
      j := !j + Uchar.utf_decode_length dec
    end else begin
      Buffer.add_utf_8_uchar buf Uchar.rep;
      j := !j + 1
    end
  done;
  Buffer.contents buf

let urlencode s =
  let buf = Buffer.create (String.length s) in
  String.iter
    (fun c ->
      match c with
      | 'A' .. 'Z' | 'a' .. 'z' | '0' .. '9' | '-' | '_' | '.' | '~' -> Buffer.add_char buf c
      | c -> Buffer.add_string buf (Printf.sprintf "%%%02X" (Char.code c)))
    s;
  Buffer.contents buf

let urlencoded params =
  String.concat "&" (List.map (fun (k, v) -> urlencode k ^ "=" ^ urlencode v) params)

(* ---------- platform env (cljs platform/current :env) ---------- *)

type platform_env =
  { runtime : string  (* "browser" | "node" *)
  ; owner_source : string
  }

let platform_env_impl () : platform_env =
  match Runtime_env.kind () with
  | Runtime_env.Browser_worker ->
      { runtime = "browser"; owner_source = Runtime_env.owner_source () }
  | Runtime_env.Node | Runtime_env.Native ->
      { runtime = "node"; owner_source = Runtime_env.owner_source () }

let platform_env_fn : (unit -> platform_env) ref = ref platform_env_impl
let platform_env () = !platform_env_fn ()

let browser_runtime () = String.equal (platform_env ()).runtime "browser"
let owner_source () = (platform_env ()).owner_source

let capacitor_runtime () =
  browser_runtime () && String.equal (owner_source ()) "capacitor"

let interactive_runtime () =
  let env = platform_env () in
  String.equal env.runtime "browser"
  || (String.equal env.runtime "node" && String.equal env.owner_source "electron")

let cli_node_owner () =
  try
    let env = platform_env () in
    String.equal env.runtime "node" && String.equal env.owner_source "cli"
  with _ -> false

(* ---------- hooks: ldb / worker-state ---------- *)

let transit_read_fn : (string -> Wire.t) ref = ref Transit_codec.of_string
let transit_write_fn : (Wire.t -> string) ref = ref (fun w -> Transit_codec.to_string w)
let transit_read s = !transit_read_fn s
let transit_write w = !transit_write_fn w

exception Invalid_transit

let transit_read_safe value = try Some (!transit_read_fn value) with _ -> None

let read_transit_exn v =
  match transit_read_safe v with
  | Some w -> w
  | None -> raise Invalid_transit

(* cljs read-transit-str over a kv value (nil parses to nil). *)
let transit_read_value = function
  | Wire.String s -> !transit_read_fn s
  | Wire.Nil -> Wire.Nil
  | _ -> invalid_arg "transit_read_value: expected string or nil"

let ldb_graph_rtc_e2ee_fn : (Datascript.db -> Datascript.value option) ref =
  ref Ldb.get_graph_rtc_e2ee

let ldb_graph_rtc_uuid_fn : (Datascript.db -> Datascript.value option) ref =
  ref Ldb.get_graph_rtc_uuid

let datascript_conn_fn : (string -> Datascript.conn option) ref =
  ref Worker_state.datascript_conn

let state_get_fn : (string -> Wire.t option) ref = ref Worker_state.state_get
let merge_state_fn : (Wire.t -> unit) ref = ref Worker_state.merge_state
let db_sync_config_fn : (unit -> Wire.t) ref = ref Worker_state.db_sync_config

(* ---------- hooks: kv (platform/kv-get, kv-set!) ---------- *)

(* cljs stores typed values in IDB; our kv is string-based, so binary
   payloads use a "b64:"-prefixed string (Idb.{get,set}_binary). *)
let kv_get_impl (_platform : platform_env) (k : string) : Wire.t t =
  map
    (function
      | Some s when String.length s >= 4 && String.sub s 0 4 = "b64:" ->
          Wire.Binary (decode_base64 (String.sub s 4 (String.length s - 4)))
      | Some s -> Wire.String s
      | None -> Wire.Nil)
    (Idb.get k)

let kv_set_impl (_platform : platform_env) k (v : Wire.t) : unit t =
  match v with
  | Wire.Nil -> Idb.delete k
  | Wire.Binary b -> Idb.set_binary k b
  | Wire.String s -> Idb.set k s
  | v -> Idb.set k (transit_write v)

let kv_get_fn : (platform_env -> string -> Wire.t t) ref = ref kv_get_impl
let kv_set_fn : (platform_env -> string -> Wire.t -> unit t) ref = ref kv_set_impl

(* ---------- hooks: secret store / file / http / comm ---------- *)

let secret_save_fn : (key:string -> string -> unit t) ref = ref Secret_store.save
let secret_read_fn : (key:string -> string option t) ref = ref Secret_store.read
let secret_delete_fn : (key:string -> unit t) ref = ref Secret_store.delete
let read_text_fn : (string -> string t) ref = ref File_sys.read_text
let http_send_fn : (Http.request -> Http.response t) ref = ref Http.send
let post_message_fn : (string -> unit) ref = ref Comlink.post_message
let now_ms_fn : (unit -> float) ref = ref Clock.now_ms

(* ---------- hooks: crypt helpers (frontend.common.crypt) ---------- *)

let raw_binary = function
  | Wire.Binary b -> b
  | Wire.String s -> s
  | _ -> invalid_arg "expected binary wire value"

let generate_rsa_key_pair_impl () : Wire.t t =
  map
    (fun (kp : Crypto.Rsa.key_pair) ->
      Wire.kw_map
        [ ("publicKey", Wire.Binary kp.public_key);
          ("privateKey", Wire.Binary kp.private_key) ])
    (Crypto.Rsa.generate ())

let generate_rsa_key_pair_fn : (unit -> Wire.t t) ref = ref generate_rsa_key_pair_impl

(* cljs <encrypt-private-key encrypts the exported pkcs8 DER; our
   private_key IS the DER string (wire Binary). *)
let encrypt_private_key_impl (password : string) (private_key : Wire.t) : Wire.t t =
  let salt = Crypto.random_bytes 16 in
  let iv = Crypto.random_bytes 12 in
  bind (Crypto.Pbkdf2.derive_aes_gcm_256 ~password ~salt ~iterations:600000) (fun derived ->
      map
        (fun encrypted ->
          Wire.Array
            [ str pbkdf2_version; Wire.Binary salt; Wire.Binary iv; Wire.Binary encrypted ])
        (Crypto.Aes_gcm.encrypt ~key:derived ~iv (raw_binary private_key)))

(* encrypted-key-data: [version salt iv enc] (4) or legacy [salt iv enc] (3). *)
let decrypt_private_key_crypt_impl (password : string) (encrypted_key_data : Wire.t) :
    Wire.t t =
  run (fun () ->
      let items = Wire.as_seq encrypted_key_data in
      assert (List.length items >= 3);
      let len = List.length items in
      let salt_data, iv_data, enc_data =
        match len = 3 with
        | true -> (List.nth items 0, List.nth items 1, List.nth items 2)
        | false -> (List.nth items 1, List.nth items 2, List.nth items 3)
      in
      let version =
        match len = 4 with
        | true -> List.nth items 0
        | false -> Wire.Nil
      in
      let version_ge =
        match version with
        | Wire.String v -> String.compare v pbkdf2_version >= 0
        | _ -> false
      in
      let iterations = if version_ge then 600000 else 100000 in
      let bytes_of = function
        | Wire.Binary b -> b
        | _ -> invalid_arg "decrypt-private-key: expected binary fields"
      in
      let salt = bytes_of salt_data and iv = bytes_of iv_data and enc = bytes_of enc_data in
      catch
        (bind (Crypto.Pbkdf2.derive_aes_gcm_256 ~password ~salt ~iterations) (fun derived ->
             map
               (fun k -> Wire.Binary k)
               (Crypto.Aes_gcm.decrypt ~key:derived ~iv enc)))
        (fun e ->
          let invalid_password = match e with Crypto.Operation_error -> true | _ -> false in
          if not invalid_password then
            Worker_log.error "decrypt-private-key" [ ("error", exn_message e) ];
          error
            (ex_info "decrypt-private-key"
               (if invalid_password then [ (kw "invalid-password?", Wire.Bool true) ] else []))))

let encrypt_private_key_fn : (string -> Wire.t -> Wire.t t) ref = ref encrypt_private_key_impl
let decrypt_private_key_crypt_fn : (string -> Wire.t -> Wire.t t) ref =
  ref decrypt_private_key_crypt_impl

(* export/import — cljs deal in CryptoKeys; ours are DER strings inside Wire. *)
let export_public_key_impl (public_key : Wire.t) : Wire.t t =
  pure (Wire.Binary (raw_binary public_key))

let export_public_key_fn : (Wire.t -> Wire.t t) ref = ref export_public_key_impl
let import_public_key_crypt_fn : (string -> Wire.t t) ref =
  ref (fun der -> pure (Wire.Binary der))

let generate_aes_key_impl () : Wire.t t =
  map (fun (k : Crypto.Aes_gcm.key) -> Wire.Binary k) (Crypto.Aes_gcm.generate ())

let generate_aes_key_fn : (unit -> Wire.t t) ref = ref generate_aes_key_impl
let import_aes_key_fn : (string -> Crypto.Aes_gcm.key t) ref = ref Crypto.Aes_gcm.import_key

let encrypt_aes_key_impl (public_key : Wire.t) (aes_key : Wire.t) : Wire.t t =
  map
    (fun encrypted -> Wire.Binary encrypted)
    (Crypto.Rsa.encrypt ~public_key:(raw_binary public_key) (raw_binary aes_key))

let decrypt_aes_key_impl (private_key : Wire.t) (encrypted : Wire.t) : Wire.t t =
  catch
    (bind
       (Crypto.Rsa.decrypt ~private_key:(raw_binary private_key) (raw_binary encrypted))
       (fun raw ->
         map (fun (k : Crypto.Aes_gcm.key) -> Wire.Binary k) (!import_aes_key_fn raw)))
    (fun e ->
      (match e with
       | Crypto.Operation_error -> ()
       | _ -> Worker_log.error "decrypt-aes-key failed" [ ("error", exn_message e) ]);
      error (ex_info "decrypt-aes-key" []))

let encrypt_aes_key_fn : (Wire.t -> Wire.t -> Wire.t t) ref = ref encrypt_aes_key_impl

let decrypt_aes_key_fn : (Wire.t -> Wire.t -> Wire.t t) ref = ref decrypt_aes_key_impl

let encrypt_uint8array_impl (aes_key : Wire.t) (arr : string) : Wire.t t =
  let iv = Crypto.random_bytes 12 in
  map
    (fun enc -> Wire.Array [ Wire.Binary iv; Wire.Binary enc ])
    (Crypto.Aes_gcm.encrypt ~key:(raw_binary aes_key) ~iv arr)

let decrypt_uint8array_impl (aes_key : Wire.t) (v : Wire.t) : string t =
  match Wire.as_seq v with
  | [ Wire.Binary iv; Wire.Binary enc ] ->
      catch
        (Crypto.Aes_gcm.decrypt ~key:(raw_binary aes_key) ~iv enc)
        (fun e ->
          Worker_log.error "decrypt-uint8array" [ ("error", exn_message e) ];
          error (ex_info "decrypt-uint8array" []))
  | _ -> invalid_arg "decrypt-uint8array: expected [iv data]"

let encrypt_uint8array_fn : (Wire.t -> string -> Wire.t t) ref =
  ref encrypt_uint8array_impl

let decrypt_uint8array_fn : (Wire.t -> Wire.t -> string t) ref =
  ref decrypt_uint8array_impl

let encrypt_text_impl (aes_key : Wire.t) (text : string) : Wire.t t =
  run (fun () ->
      ignore (transit_read text);
      let iv = Crypto.random_bytes 12 in
      map
        (fun enc -> Wire.Array [ Wire.Binary iv; Wire.Binary enc ])
        (Crypto.Aes_gcm.encrypt ~key:(raw_binary aes_key) ~iv text))

let decrypt_text_impl (aes_key : Wire.t) (v : Wire.t) : string t =
  catch
    (decrypt_uint8array_impl aes_key v)
    (fun e ->
      Worker_log.error "decrypt-text" [ ("error", exn_message e) ];
      error (ex_info "decrypt-text" []))

let decrypt_text_if_encrypted_impl (aes_key : Wire.t) (v : Wire.t) :
    string option t =
  match Wire.as_seq v with
  | _ :: _ :: _ -> map Option.some (decrypt_text_impl aes_key v)
  | _ -> pure None

let encrypt_text_fn : (Wire.t -> string -> Wire.t t) ref = ref encrypt_text_impl
let decrypt_text_fn : (Wire.t -> Wire.t -> string t) ref = ref decrypt_text_impl

let decrypt_text_if_encrypted_fn : (Wire.t -> Wire.t -> string option t) ref =
  ref decrypt_text_if_encrypted_impl

let encrypt_text_by_text_password_impl (text_password : string) (text : string) : Wire.t t =
  let salt = Crypto.random_bytes 16 in
  let iv = Crypto.random_bytes 12 in
  bind
    (Crypto.Pbkdf2.derive_aes_gcm_256 ~password:text_password ~salt ~iterations:600000)
    (fun derived ->
      map
        (fun enc -> Wire.Array [ Wire.Binary salt; Wire.Binary iv; Wire.Binary enc ])
        (Crypto.Aes_gcm.encrypt ~key:derived ~iv text))

let decrypt_text_by_text_password_impl (text_password : string) (v : Wire.t) : string t =
  catch
    (match Wire.as_seq v with
     | [ Wire.Binary salt; Wire.Binary iv; Wire.Binary enc ] ->
         bind
           (Crypto.Pbkdf2.derive_aes_gcm_256 ~password:text_password ~salt ~iterations:600000)
           (fun derived -> Crypto.Aes_gcm.decrypt ~key:derived ~iv enc)
     | _ -> invalid_arg "decrypt-text-by-text-password: expected [salt iv data]")
    (fun e ->
      Worker_log.error "decrypt-text-by-text-password" [ ("error", exn_message e) ];
      error (ex_info "decrypt-text-by-text-password" []))

let encrypt_text_by_text_password_fn : (string -> string -> Wire.t t) ref =
  ref encrypt_text_by_text_password_impl

let decrypt_text_by_text_password_fn : (string -> Wire.t -> string t) ref =
  ref decrypt_text_by_text_password_impl

(* ---------- auth (sync.util/auth-token, sync.auth/<resolve-ws-token, parse-jwt) ---------- *)

let parse_jwt_impl (jwt : string) : Wire.t =
  match String.split_on_char '.' jwt with
  | [ _; payload; _ ] ->
      let json = Json.parse (decode_base64url payload) in
      (match Wire.get "cognito:username" json with
       | Some (Wire.String u) -> wire_assoc "cognito:username" (str (decode_username u)) json
       | _ -> json)
  | _ -> raise (Failure "parse-jwt: invalid token")

let parse_jwt_fn : (string -> Wire.t) ref = ref parse_jwt_impl

let auth_token_impl () : string option =
  match !state_get_fn "auth/id-token" with
  | Some (Wire.String s) when seq_ (Some s) -> Some s
  | _ ->
      (match !state_get_fn "auth/access-token" with
       | Some (Wire.String s) when seq_ (Some s) -> Some s
       | _ -> None)

let auth_token_fn : (unit -> string option) ref = ref auth_token_impl
let auth_token () = !auth_token_fn ()

let refresh_token_from_state () =
  match !state_get_fn "auth/refresh-token" with
  | Some (Wire.String s) -> Some s
  | _ -> None

let id_token_expired token =
  match token with
  | Some s when seq_ (Some s) ->
      (try
         match !parse_jwt_fn s |> Wire.get "exp" with
         | Some w ->
             (match Wire.as_int64 w with
              | Some exp -> Int64.to_float exp *. 1000. <= !now_ms_fn ()
              | None -> true)
         | None -> true
       with _ -> true)
  | _ -> true

let oauth_token_url () =
  match !state_get_fn "auth/oauth-token-url" with
  | Some (Wire.String s) when seq_ (Some s) -> Some s
  | _ ->
      (match !state_get_fn "auth/oauth-domain" with
       | Some (Wire.String d) when seq_ (Some d) -> Some ("https://" ^ d ^ "/oauth2/token")
       | _ -> None)

let refresh_id_access_token () =
  let refresh_token = refresh_token_from_state () in
  let token_url = oauth_token_url () in
  let client_id =
    match !state_get_fn "auth/oauth-client-id" with
    | Some (Wire.String s) -> Some s
    | _ -> None
  in
  if not (seq_ refresh_token) then
    error
      (ex_info "worker auth refresh requires refresh token"
         [ (kw "code", kw "missing-refresh-token") ])
  else
    match token_url, client_id with
    | Some token_url, Some client_id when seq_ (Some client_id) ->
        let body =
          urlencoded
            [ ("grant_type", "refresh_token");
              ("client_id", client_id);
              ("refresh_token", Option.get refresh_token) ]
        in
        bind
          (!http_send_fn
             { Http.url = token_url; method_ = "POST";
               headers = [ ("content-type", "application/x-www-form-urlencoded") ];
               body = Some body })
          (fun resp ->
            let data =
              match resp.body with
              | "" -> Wire.Nil
              | b -> Json.parse b
            in
            if resp.status >= 200 && resp.status < 300 then
              pure
                ( Wire.as_string (Option.value (Wire.get "id_token" data) ~default:Wire.Nil)
                , Wire.as_string (Option.value (Wire.get "access_token" data) ~default:Wire.Nil)
                )
            else
              error
                (ex_info "worker auth refresh failed"
                   [ (kw "code", kw "auth-refresh-failed");
                     (kw "status", Wire.Int resp.status);
                     (kw "token-url", str token_url);
                     (kw "body", data) ]))
    | _ ->
        (match token_url with
         | None ->
             error
               (ex_info "worker auth refresh requires oauth token url"
                  [ (kw "code", kw "missing-oauth-token-url") ])
         | Some _ ->
             error
               (ex_info "worker auth refresh requires oauth client id"
                  [ (kw "code", kw "missing-oauth-client-id") ]))

let resolve_ws_token_impl () : string option t =
  let token = auth_token () in
  if (not (cli_node_owner ())) && id_token_expired token then
    bind (refresh_id_access_token ()) (fun (id_token, access_token) ->
        match id_token with
        | Some id_token when seq_ (Some id_token) ->
            !merge_state_fn
              (Wire.kw_map
                 ([ ("auth/id-token", str id_token) ]
                  @
                  match access_token with
                  | Some a when seq_ (Some a) -> [ ("auth/access-token", str a) ]
                  | _ -> []));
            pure (Some id_token)
        | _ ->
            error
              (ex_info "worker auth refresh returned empty id-token"
                 [ (kw "code", kw "auth-refresh-empty-id-token") ]))
  else pure token

let resolve_ws_token_fn : (unit -> string option t) ref = ref resolve_ws_token_impl

(* ---------- malli coercion (e2ee schemas only) ---------- *)

exception Invalid_coerce

(* cljs db-sync-schema/http-request-coercers — validates required
   fields of the e2ee request schemas; returns the body unchanged. *)
let coerce_http_request_impl schema_key (body : Wire.t) : Wire.t option =
  let get_str k m =
    match Wire.get k m with
    | Some (Wire.String s) -> s
    | _ -> raise Invalid_coerce
  in
  try
    (match schema_key with
     | "e2ee/user-keys" ->
         ignore (get_str "public-key" body);
         ignore (get_str "encrypted-private-key" body);
         (match Wire.get "reset-private-key?" body with
          | Some (Wire.Bool _) | None -> ()
          | _ -> raise Invalid_coerce)
     | "e2ee/graph-aes-key" -> ignore (get_str "encrypted-aes-key" body)
     | "e2ee/grant-access" ->
         (match Wire.get "target-user-email+encrypted-aes-key-coll" body with
          | Some items ->
              List.iter
                (fun item ->
                  ignore (get_str "email" item);
                  ignore (get_str "encrypted-aes-key" item))
                (Wire.as_seq items)
          | None -> raise Invalid_coerce)
     | _ -> ());
    Some body
  with Invalid_coerce ->
    Worker_log.error "db-sync/malli-coerce-failed" [ ("schema", schema_key) ];
    None

let coerce_http_request_fn : (string -> Wire.t -> Wire.t option) ref =
  ref coerce_http_request_impl

let coerce_http_response_fn : (string -> Wire.t -> Wire.t option) ref =
  ref (fun _schema body -> Some body)

(* ---------- fetch-json (sync.util/<fetch-json) ---------- *)

let fetch_json_impl url ?(method_ = "GET") ?(headers = []) ?body ?response_schema
    ?(error_schema = "error") () =
  run (fun () ->
      match auth_token () with
      | None -> error (ex_info "Empty token" [])
      | Some token ->
          let headers = headers @ [ ("authorization", "Bearer " ^ token) ] in
          bind
            (!http_send_fn { Http.url; method_; headers; body })
            (fun (resp : Http.response) ->
              let data =
                match resp.body with
                | "" -> Wire.Nil
                | b -> Json.parse b
              in
              if resp.status >= 200 && resp.status < 300 then
                match response_schema with
                | None -> pure data
                | Some schema ->
                    (match !coerce_http_response_fn schema data with
                     | Some b -> pure b
                     | None ->
                         error
                           (ex_info "db-sync invalid response"
                              [ (kw "status", Wire.Int resp.status);
                                (kw "url", str url);
                                (kw "body", Wire.Nil) ]))
              else
                let body =
                  match data with
                  | Wire.Nil -> Wire.Nil
                  | _ ->
                      Option.value
                        (!coerce_http_response_fn error_schema data)
                        ~default:Wire.Nil
                in
                error
                  (ex_info "db-sync request failed"
                     [ (kw "status", Wire.Int resp.status);
                       (kw "url", str url);
                       (kw "body", body) ])))

let fetch_json_fn = ref fetch_json_impl

(* ---------- ui-request client (frontend.worker.ui-request) ---------- *)

let ui_interaction_required_error action hint =
  ex_info "ui-interaction-required"
    ([ (kw "code", kw "ui-interaction-required"); (kw "action", action) ]
     @
     match hint with
     | Some h when seq_ (Some h) -> [ (kw "hint", str h) ]
     | _ -> [])

(* cljs ui-request/->rejectable-error — an Error-map's fields become
   ex-data; code defaults to :ui-request-rejected. *)
let rejectable_exn_of_wire request_id action (m : Wire.t) =
  let entries = Wire.as_map m in
  let code =
    match Wire.get "code" m with
    | Some (Wire.Keyword s) | Some (Wire.String s) -> s
    | _ -> "ui-request-rejected"
  in
  let message =
    match Wire.get "message" m with
    | Some (Wire.String s) -> s
    | _ -> code
  in
  let entries =
    entries
    @ (match Wire.get "code" m with
       | Some _ -> []
       | None -> [ (kw "code", kw "ui-request-rejected") ])
    @ (match Wire.get "request-id" m with
       | Some _ -> []
       | None -> [ (kw "request-id", str request_id) ])
    @ (match Wire.get "action" m with
       | Some _ -> []
       | None -> [ (kw "action", action) ])
  in
  ex_info message entries

let ui_request_impl (action : Wire.t) (payload : Wire.t) ?hint ?timeout_ms () : Wire.t t =
  run (fun () ->
      if not (interactive_runtime ()) then
        error (ui_interaction_required_error action hint)
      else begin
        let request_id = Uuid_gen.uuid () in
        let timeout_ms =
          match timeout_ms with
          | Some t when t > 0 -> t
          | _ -> default_ui_timeout_ms
        in
        let task, resolver = wait () in
        Worker_state.ui_request_put request_id resolver;
        let timer =
          Timers.set_timeout timeout_ms (fun () ->
              match Worker_state.ui_request_take request_id with
              | Some r ->
                  wakeup r
                    (Error
                       (Wire.kw_map
                          [ ("code", kw "ui-request-timeout");
                            ("request-id", str request_id);
                            ("action", action);
                            ("timeout-ms", Wire.Int timeout_ms) ]))
              | None -> ())
        in
        (try
           !post_message_fn
             (transit_write
                (Wire.Array
                   [ kw "db-worker/ui-request";
                     Wire.kw_map
                       [ ("request-id", str request_id);
                         ("action", action);
                         ("payload", payload);
                         ("timeout-ms", Wire.Int timeout_ms) ] ]))
         with e ->
           (match Worker_state.ui_request_take request_id with
            | Some r ->
                Timers.clear timer;
                wakeup r
                  (Error
                     (Wire.kw_map
                        [ ("code", kw "ui-request-rejected");
                          ("request-id", str request_id);
                          ("action", action);
                          ("data", Wire.Map (exn_data e)) ]))
            | None -> ()));
        bind task (function
          | Ok v ->
              Timers.clear timer;
              pure v
          | Error m ->
              Timers.clear timer;
              error (rejectable_exn_of_wire request_id action m))
      end)

let ui_request_fn :
    (Wire.t -> Wire.t -> ?hint:string -> ?timeout_ms:int -> unit -> Wire.t t) ref =
  ref ui_request_impl

let request_ui action payload ?hint ?timeout_ms () =
  !ui_request_fn action payload ?hint ?timeout_ms ()

(* cljs ui-request/cancel-all! — resolve/reject endpoints already live
   in endpoint_state.ml. *)
let cancel_all_ui_requests context =
  let ids = Worker_state.ui_request_ids () in
  List.iter
    (fun id ->
      match Worker_state.ui_request_take id with
      | Some r ->
          wakeup r
            (Error
               (Wire.kw_map
                  [ ("code", kw "ui-request-cancelled");
                    ("request-id", str id);
                    ("context", context) ]))
      | None -> ())
    ids;
  Wire.kw_map [ ("ok", Wire.Bool true); ("cancelled", Wire.Int (List.length ids)) ]

(* ---------- small pieces ---------- *)

let auth_file_path () = node_default_auth_file

let parse_auth_file text =
  match seq_ text with
  | false -> `Empty
  | true -> (try `Parsed (Json.parse (Option.get text)) with _ -> `Invalid)

let e2ee_base_impl () : string option =
  match !db_sync_config_fn () with
  | Wire.Map _ as config ->
      (match Wire.get "http-base" config with
       | Some (Wire.String s) when seq_ (Some s) -> Some s
       | _ ->
           (match Wire.get "ws-url" config with
            | Some (Wire.String ws) ->
                let base =
                  if String.length ws >= 6 && String.sub ws 0 6 = "wss://" then
                    "https://" ^ String.sub ws 6 (String.length ws - 6)
                  else if String.length ws >= 5 && String.sub ws 0 5 = "ws://" then
                    "http://" ^ String.sub ws 5 (String.length ws - 5)
                  else ws
                in
                let suffix = "/sync/%s" in
                let blen = String.length base and slen = String.length suffix in
                if blen >= slen && String.sub base (blen - slen) slen = suffix then
                  Some (String.sub base 0 (blen - slen))
                else Some base
            | _ -> None))
  | _ -> None

let e2ee_base_fn : (unit -> string option) ref = ref e2ee_base_impl
let e2ee_base () = !e2ee_base_fn ()

let graph_e2ee_impl (repo : string) : Datascript.value option =
  match !datascript_conn_fn repo with
  | Some conn -> !ldb_graph_rtc_e2ee_fn (Datascript.db conn)
  | None -> None

let graph_e2ee_fn : (string -> Datascript.value option) ref = ref graph_e2ee_impl
let graph_e2ee repo = !graph_e2ee_fn repo

let graph_e2ee_truthy repo =
  match graph_e2ee repo with
  | Some (Datascript.Bool false) | None -> false
  | Some _ -> true

let get_graph_id_impl repo : string option =
  match !datascript_conn_fn repo with
  | Some conn ->
      (match !ldb_graph_rtc_uuid_fn (Datascript.db conn) with
       | Some (Datascript.Uuid u) | Some (Datascript.String u) -> Some u
       | _ -> None)
  | None -> None

let get_graph_id_fn : (string -> string option) ref = ref get_graph_id_impl

let get_user_uuid_impl () : string option =
  match auth_token () with
  | Some t ->
      (try
         match !parse_jwt_fn t |> Wire.get "sub" with
         | Some (Wire.String s) -> Some s
         | _ -> None
       with _ -> None)
  | None -> None

let get_user_uuid_fn : (unit -> string option) ref = ref get_user_uuid_impl
let get_user_uuid () = !get_user_uuid_fn ()

let token_to_user_uuid token =
  match token with
  | Some t ->
      (try
         match !parse_jwt_fn t |> Wire.get "sub" with
         | Some (Wire.String s) -> Some s
         | _ -> None
       with _ -> None)
  | None -> None

let resolve_user_uuid_impl () : string option t =
  match get_user_uuid () with
  | Some id when seq_ (Some id) -> pure (Some id)
  | _ -> catch (map token_to_user_uuid (!resolve_ws_token_fn ())) (fun _ -> pure None)

let resolve_user_uuid_fn : (unit -> string option t) ref = ref resolve_user_uuid_impl

(* ---------- idb item wrappers ---------- *)

let get_item_impl k =
  assert (seq_ (Some k));
  !kv_get_fn (platform_env ()) k

let set_item_impl k v =
  assert (seq_ (Some k));
  !kv_set_fn (platform_env ()) k v

let clear_item_impl k =
  assert (seq_ (Some k));
  !kv_set_fn (platform_env ()) k Wire.Nil

let get_item_fn : (string -> Wire.t t) ref = ref get_item_impl
let set_item_fn : (string -> Wire.t -> unit t) ref = ref set_item_impl
let clear_item_fn : (string -> unit t) ref = ref clear_item_impl

let get_item k = !get_item_fn k
let set_item k v = !set_item_fn k v
let clear_item k = !clear_item_fn k

let graph_encrypted_aes_key_idb_key graph_id = "rtc-encrypted-aes-key###" ^ graph_id
let user_rsa_key_pair_idb_key base user_id = "rtc-user-rsa-key-pair###" ^ base ^ "###" ^ user_id

(* ---------- user rsa key pair ---------- *)

let fetch_user_rsa_key_pair_raw_impl base =
  !fetch_json_fn (base ^ "/e2ee/user-keys") ~response_schema:"e2ee/user-keys" ()

let fetch_user_rsa_key_pair_raw_fn : (string -> Wire.t t) ref =
  ref fetch_user_rsa_key_pair_raw_impl

let user_rsa_key_pair_valid pair =
  match pair with
  | Wire.Map _ ->
      (match Wire.get "public-key" pair, Wire.get "encrypted-private-key" pair with
       | Some (Wire.String _), Some (Wire.String _) -> true
       | _ -> false)
  | _ -> false

let set_user_rsa_key_pair_to_idb_impl base user_id pair =
  (match base, user_id with
   | Some b, Some u when user_rsa_key_pair_valid pair ->
       Db_worker_effect.async (fun () -> set_item (user_rsa_key_pair_idb_key b u) (str (transit_write pair)))
   | _ -> ());
  pure pair

let set_user_rsa_key_pair_to_idb_fn : (string option -> string option -> Wire.t -> Wire.t t) ref =
  ref set_user_rsa_key_pair_to_idb_impl

let get_user_rsa_key_pair_from_idb_impl base user_id =
  match base, user_id with
  | Some b, Some u ->
      bind (get_item (user_rsa_key_pair_idb_key b u)) (fun pair_w ->
          let pair = transit_read_value pair_w in
          pure (if user_rsa_key_pair_valid pair then Some pair else None))
  | _ -> pure None

let get_user_rsa_key_pair_from_idb_fn :
    (string option -> string option -> Wire.t option t) ref =
  ref get_user_rsa_key_pair_from_idb_impl

let clear_user_rsa_key_pair_cache_impl base user_id =
  (match base, user_id with
   | Some b, Some u -> Hashtbl.remove user_rsa_key_pair_inflight (b, u)
   | _ -> ());
  match base, user_id with
  | Some b, Some u -> clear_item (user_rsa_key_pair_idb_key b u)
  | _ -> pure ()

let clear_user_rsa_key_pair_cache_fn : (string option -> string option -> unit t) ref =
  ref clear_user_rsa_key_pair_cache_impl

let get_user_rsa_key_pair_raw_impl base : Wire.t t =
  run (fun () ->
      bind (!resolve_user_uuid_fn ()) (fun user_id ->
          (match base, user_id with
           | Some _, Some _ -> ()
           | _ ->
               fail_fast "db-sync/missing-field"
                 (Wire.kw_map
                    [ ("base", wire_opt str base);
                      ("user-id", wire_opt str user_id);
                      ("field", kw "user-rsa-key-pair") ]));
          let b = Option.get base and u = Option.get user_id in
          let k = (b, u) in
          match Hashtbl.find_opt user_rsa_key_pair_inflight k with
          | Some inflight -> inflight
          | None ->
              let task =
                finally
                  (bind (!get_user_rsa_key_pair_from_idb_fn base user_id) (function
                     | Some cached -> pure cached
                     | None ->
                         bind (!fetch_user_rsa_key_pair_raw_fn b) (fun pair ->
                             if user_rsa_key_pair_valid pair then
                               map
                                 (fun _ -> pair)
                                 (!set_user_rsa_key_pair_to_idb_fn base user_id pair)
                             else pure Wire.Nil)))
                  (fun () ->
                    Hashtbl.remove user_rsa_key_pair_inflight k;
                    pure ())
              in
              Hashtbl.replace user_rsa_key_pair_inflight k task;
              task))

let get_user_rsa_key_pair_raw_fn : (string option -> Wire.t t) ref =
  ref get_user_rsa_key_pair_raw_impl

let upload_user_rsa_key_pair_impl base public_key encrypted_private_key =
  run (fun () ->
      let body =
        !coerce_http_request_fn "e2ee/user-keys"
          (Wire.kw_map
             [ ("public-key", str public_key);
               ("encrypted-private-key", str encrypted_private_key) ])
      in
      (match body with
       | None ->
           fail_fast "db-sync/invalid-field"
             (Wire.kw_map [ ("type", kw "e2ee/user-keys"); ("body", Wire.Nil) ])
       | Some _ -> ());
      bind
        (!fetch_json_fn (base ^ "/e2ee/user-keys") ~method_:"POST"
           ~headers:[ ("content-type", "application/json") ]
           ~body:(Json.stringify (Option.get body))
           ~response_schema:"e2ee/user-keys" ())
        (fun pair ->
          bind (!resolve_user_uuid_fn ()) (fun user_id ->
              map (fun _ -> pair) (!set_user_rsa_key_pair_to_idb_fn (Some base) user_id pair))))

let upload_user_rsa_key_pair_fn : (string -> string -> string -> Wire.t t) ref =
  ref upload_user_rsa_key_pair_impl

(* ---------- e2ee password storage ---------- *)

let read_refresh_token_from_auth_file () : string option t =
  bind
    (catch (!read_text_fn (auth_file_path ())) (fun _ -> pure ""))
    (fun text ->
      (match parse_auth_file (Some text) with
       | `Invalid ->
           !fail_missing_e2ee_password_fn
             [ ("reason", kw "invalid-auth-file");
               ("hint", str "Run logseq login first.") ]
       | `Empty | `Parsed _ -> ());
      let refresh_token =
        match parse_auth_file (Some text) with
        | `Parsed w ->
            Wire.as_string (Option.value (Wire.get "refresh-token" w) ~default:Wire.Nil)
        | _ -> None
      in
      ensure_refresh_token refresh_token;
      pure refresh_token)

let save_e2ee_password_impl (password : string) : unit t =
  bind
    (if browser_runtime () then pure (refresh_token_from_state ())
     else read_refresh_token_from_auth_file ())
    (fun refresh_token ->
      ensure_refresh_token refresh_token;
      bind
        (!encrypt_text_by_text_password_fn (Option.get refresh_token) password)
        (fun result ->
          let text = transit_write result in
          if capacitor_runtime () then
            catch
              (bind
                 (request_ui (kw "native-save-e2ee-password")
                    (Wire.kw_map
                       [ ("key", str e2ee_password_secret_key);
                         ("encrypted-text", str text) ])
                    ())
                 (fun resp ->
                   match Wire.get "supported?" resp with
                   | Some (Wire.Bool true) -> pure ()
                   | _ -> !secret_save_fn ~key:e2ee_password_secret_key text))
              (fun e ->
                Worker_log.warn "db-sync/save-e2ee-password-native-failed"
                  [ ("error", exn_message e) ];
                !secret_save_fn ~key:e2ee_password_secret_key text)
          else !secret_save_fn ~key:e2ee_password_secret_key text))

let save_e2ee_password_fn : (string -> unit t) ref = ref save_e2ee_password_impl

let read_platform_e2ee_password_text () : string option t =
  catch
    (!secret_read_fn ~key:e2ee_password_secret_key)
    (fun e ->
      Worker_log.warn "db-sync/read-e2ee-password-secret-failed"
        [ ("error", exn_message e) ];
      pure None)

let read_e2ee_password_text_impl (refresh_token : string option) : string option t =
  run (fun () ->
      ensure_refresh_token refresh_token;
      if capacitor_runtime () then
        bind
          (catch
             (request_ui (kw "native-get-e2ee-password")
                (Wire.kw_map [ ("key", str e2ee_password_secret_key) ])
                ())
             (fun e ->
               Worker_log.warn "db-sync/read-e2ee-password-native-failed"
                 [ ("error", exn_message e) ];
               pure (Wire.kw_map [ ("supported?", Wire.Bool false) ])))
          (fun result ->
            match Wire.get "supported?" result with
            | Some (Wire.Bool true) ->
                pure
                  (Wire.as_string
                     (Option.value (Wire.get "encrypted-text" result) ~default:Wire.Nil))
            | _ -> read_platform_e2ee_password_text ())
      else read_platform_e2ee_password_text ())

let read_e2ee_password_text_fn : (string option -> string option t) ref =
  ref read_e2ee_password_text_impl

let decrypt_e2ee_password_text refresh_token text : string t =
  run (fun () ->
      match seq_ text with
      | false ->
          error
            (missing_e2ee_password_exn
               [ ("reason", kw "missing-persisted-password");
                 ("hint", str "Provide --e2ee-password to persist it.") ])
      | true ->
          (match transit_read_safe (Option.get text) with
           | None ->
               fail_fast "db-sync/invalid-e2ee-password-payload"
                 (Wire.kw_map
                    [ ("field", kw "e2ee-password");
                      ("reason", kw "invalid-transit-payload") ])
           | Some data ->
               !decrypt_text_by_text_password_fn (Option.get refresh_token) data))

let decrypt_e2ee_password_text_fn : (string option -> string option -> string t) ref =
  ref decrypt_e2ee_password_text

let read_e2ee_password refresh_token : string t =
  bind (!read_e2ee_password_text_fn refresh_token) (fun text ->
      !decrypt_e2ee_password_text_fn refresh_token text)

let read_e2ee_password_fn : (string option -> string t) ref = ref read_e2ee_password

let clear_e2ee_password_impl () : unit t =
  if capacitor_runtime () then
    bind
      (catch
         (request_ui (kw "native-delete-e2ee-password")
            (Wire.kw_map [ ("key", str e2ee_password_secret_key) ])
            ())
         (fun e ->
           Worker_log.warn "db-sync/delete-e2ee-password-native-failed"
             [ ("error", exn_message e) ];
           pure Wire.Nil))
      (fun resp ->
        match Wire.get "supported?" resp with
        | Some (Wire.Bool true) -> pure ()
        | _ ->
            catch (!secret_delete_fn ~key:e2ee_password_secret_key) (fun e ->
                Worker_log.warn "db-sync/delete-e2ee-password-secret-failed"
                  [ ("error", exn_message e) ];
                pure ()))
  else
    catch (!secret_delete_fn ~key:e2ee_password_secret_key) (fun e ->
        Worker_log.warn "db-sync/delete-e2ee-password-secret-failed"
          [ ("error", exn_message e) ];
        pure ())

let clear_e2ee_password_fn : (unit -> unit t) ref = ref clear_e2ee_password_impl

(* ---------- password verify / ensure flows ---------- *)

let request_e2ee_password_from_ui_impl payload : string t =
  bind
    (request_ui (kw "request-e2ee-password") payload
       ~hint:"Provide e2ee-password to continue." ())
    (fun resp ->
      match Wire.get "password" resp with
      | Some (Wire.String s) when seq_ (Some s) -> pure s
      | _ ->
          fail_fast "db-sync/missing-e2ee-password"
            (Wire.kw_map
               [ ("field", kw "e2ee-password"); ("reason", kw "empty-ui-password") ]))

let request_e2ee_password_from_ui_fn : (Wire.t -> string t) ref =
  ref request_e2ee_password_from_ui_impl

let verify_e2ee_password_impl password encrypted_private_key_or_str : Wire.t t =
  run (fun () ->
      if not (seq_ (Some password)) then
        !fail_missing_e2ee_password_fn [ ("reason", kw "empty-password") ];
      let encrypted_private_key =
        match encrypted_private_key_or_str with
        | Wire.String s -> transit_read s
        | v -> v
      in
      catch (!decrypt_private_key_crypt_fn password encrypted_private_key) (fun e ->
          if exn_field_true "invalid-password?" e then
            error
              (ex_info "invalid-e2ee-password"
                 [ (kw "code", kw "db-sync/invalid-e2ee-password") ])
          else error e))

let verify_e2ee_password_fn : (string -> Wire.t -> Wire.t t) ref =
  ref verify_e2ee_password_impl

let verify_and_save_e2ee_password password encrypted : Wire.t t =
  bind (!verify_e2ee_password_fn password encrypted) (fun priv ->
      map (fun () -> priv) (!save_e2ee_password_fn password))

let verify_and_save_e2ee_password_fn : (string -> Wire.t -> Wire.t t) ref =
  ref verify_and_save_e2ee_password

let verify_and_save_e2ee_password_from_server_impl (password : string) : Wire.t t =
  run (fun () ->
      match e2ee_base () with
      | None ->
          fail_fast "db-sync/missing-field"
            (Wire.kw_map [ ("base", Wire.Nil); ("field", kw "e2ee-base") ])
      | Some base ->
          bind (!fetch_user_rsa_key_pair_raw_fn base) (fun pair ->
              match Wire.get "encrypted-private-key" pair with
              | Some (Wire.String s) ->
                  !verify_and_save_e2ee_password_fn password (Wire.String s)
              | _ ->
                  fail_fast "db-sync/missing-field"
                    (Wire.kw_map
                       [ ("base", str base); ("field", kw "encrypted-private-key") ])))

let verify_and_save_e2ee_password_from_server_fn : (string -> Wire.t t) ref =
  ref verify_and_save_e2ee_password_from_server_impl

let generate_and_upload_user_rsa_key_pair_impl base (opts : Wire.t) : Wire.t t =
  run (fun () ->
      let opt_password =
        match Wire.get "password" opts with
        | Some (Wire.String s) when seq_ (Some s) -> Some s
        | _ -> None
      in
      bind (!generate_rsa_key_pair_fn ()) (fun kp ->
          bind
            (match opt_password with
             | Some p -> pure p
             | None when interactive_runtime () ->
                 !request_e2ee_password_from_ui_fn
                   (Wire.kw_map [ ("reason", kw "generate-user-rsa-key-pair") ])
             | None ->
                 !fail_missing_e2ee_password_fn
                   [ ("reason", kw "missing-password-for-generate-user-rsa-key-pair");
                     ( "hint"
                     , str
                         "Provide --e2ee-password when running sync ensure-keys --upload-keys."
                     ) ];
                 assert false)
            (fun password ->
              let private_key =
                match Wire.get "privateKey" kp with
                | Some v -> v
                | None -> invalid_arg "generate-rsa-key-pair: missing privateKey"
              in
              let public_key =
                match Wire.get "publicKey" kp with
                | Some v -> v
                | None -> invalid_arg "generate-rsa-key-pair: missing publicKey"
              in
              bind (!encrypt_private_key_fn password private_key) (fun encrypted_priv ->
                  bind (!export_public_key_fn public_key) (fun exported_pub ->
                      let public_key_str = transit_write exported_pub in
                      let encrypted_private_key_str = transit_write encrypted_priv in
                      bind (!save_e2ee_password_fn password) (fun () ->
                          map
                            (fun _ ->
                              Wire.kw_map
                                [ ("public-key", str public_key_str);
                                  ("encrypted-private-key", str encrypted_private_key_str);
                                  ("password", str password) ])
                            (!upload_user_rsa_key_pair_fn base public_key_str
                               encrypted_private_key_str)))))))

let generate_and_upload_user_rsa_key_pair_fn : (string -> Wire.t -> Wire.t t) ref =
  ref generate_and_upload_user_rsa_key_pair_impl

let ensure_user_rsa_key_pair_raw_impl base (opts : Wire.t) : Wire.t t =
  run (fun () ->
      let ensure_server =
        match Wire.get "ensure-server?" opts with
        | Some (Wire.Bool b) -> Some b
        | _ -> None
      in
      let server_keys_exists_opt =
        match Wire.get "server-rsa-keys-exists?" opts with
        | Some (Wire.Bool b) -> Some b
        | _ -> None
      in
      bind (!get_user_rsa_key_pair_raw_fn (Some base)) (fun existing ->
          let existing_valid = user_rsa_key_pair_valid existing in
          bind
            (match server_keys_exists_opt with
             | Some b -> pure (Some b)
             | None ->
                 (match ensure_server, existing_valid with
                  | Some true, true ->
                      map
                        (fun pair -> Some (user_rsa_key_pair_valid pair))
                        (!fetch_user_rsa_key_pair_raw_fn base)
                  | _ -> pure None))
            (fun server_rsa_keys_exists ->
              match existing_valid, server_rsa_keys_exists with
              | true, Some false ->
                  (* local pair exists but server lacks keys -> re-upload *)
                  let pub =
                    match Wire.get "public-key" existing with
                    | Some (Wire.String s) -> s
                    | _ -> invalid_arg "public-key"
                  in
                  let enc =
                    match Wire.get "encrypted-private-key" existing with
                    | Some (Wire.String s) -> s
                    | _ -> invalid_arg "encrypted-private-key"
                  in
                  map (fun _ -> existing) (!upload_user_rsa_key_pair_fn base pub enc)
              | true, _ -> pure existing
              | false, _ -> !generate_and_upload_user_rsa_key_pair_fn base opts)))

let ensure_user_rsa_key_pair_raw_fn : (string -> Wire.t -> Wire.t t) ref =
  ref ensure_user_rsa_key_pair_raw_impl

let ensure_user_rsa_key_pair_impl base (opts : Wire.t) : Wire.t t =
  run (fun () ->
      let password =
        match Wire.get "password" opts with
        | Some (Wire.String s) when seq_ (Some s) -> Some s
        | _ -> None
      in
      match password with
      | Some _ -> !ensure_user_rsa_key_pair_raw_fn base opts
      | None ->
          bind (!resolve_user_uuid_fn ()) (fun user_id ->
              (match user_id with
               | Some _ -> ()
               | None ->
                   fail_fast "db-sync/missing-field"
                     (Wire.kw_map
                        [ ("base", str base);
                          ("user-id", Wire.Nil);
                          ("field", kw "user-rsa-key-pair") ]));
              let u = Option.get user_id in
              let ensure_server =
                match Wire.get "ensure-server?" opts with
                | Some (Wire.Bool b) -> Some b
                | _ -> None
              in
              let server_exists =
                match Wire.get "server-rsa-keys-exists?" opts with
                | Some (Wire.Bool b) -> Some b
                | _ -> None
              in
              let k = (base, u, ensure_server, server_exists) in
              match Hashtbl.find_opt ensure_user_rsa_key_pair_inflight k with
              | Some inflight -> inflight
              | None ->
                  let task =
                    finally
                      (!ensure_user_rsa_key_pair_raw_fn base opts)
                      (fun () ->
                        Hashtbl.remove ensure_user_rsa_key_pair_inflight k;
                        pure ())
                  in
                  Hashtbl.replace ensure_user_rsa_key_pair_inflight k task;
                  task))

let ensure_user_rsa_key_pair_fn : (string -> Wire.t -> Wire.t t) ref =
  ref ensure_user_rsa_key_pair_impl

let ensure_user_rsa_keys_impl (opts : Wire.t) : Wire.t t =
  match e2ee_base () with
  | Some base -> !ensure_user_rsa_key_pair_fn base opts
  | None ->
      Worker_log.info "db-sync/skip-ensure-user-rsa-keys"
        [ ("reason", "missing-e2ee-base") ];
      pure Wire.Nil

let ensure_user_rsa_keys_fn : (Wire.t -> Wire.t t) ref = ref ensure_user_rsa_keys_impl

(* ---------- sync-crypt/<decrypt-private-key (ui + headless flow) ---------- *)

type decrypt_private_key_opts = {
  ui_password_ref : string option ref;
  save_ui_password : bool;
}

let default_decrypt_private_key_opts () =
  { ui_password_ref = ref None; save_ui_password = true }

let decrypt_private_key_impl (opts : decrypt_private_key_opts)
    (encrypted_private_key_str : string) : Wire.t t =
  let ui_password_ref = opts.ui_password_ref in
  let save_ui_password = opts.save_ui_password in
  let decrypt_with_ui_request enc =
    bind
      (match !ui_password_ref with
       | Some p when seq_ (Some p) -> pure p
       | _ ->
           !request_e2ee_password_from_ui_fn
             (Wire.kw_map [ ("reason", kw "decrypt-user-rsa-private-key") ]))
      (fun password ->
        ui_password_ref := Some password;
        bind (!verify_e2ee_password_fn password enc) (fun priv ->
            bind
              (if save_ui_password then !save_e2ee_password_fn password else pure ())
              (fun () -> pure priv)))
  in
  let decrypt_in_headless enc =
    let refresh_token = refresh_token_from_state () in
    bind (!read_e2ee_password_text_fn refresh_token) (fun text ->
        match seq_ text with
        | true ->
            bind (!decrypt_e2ee_password_text_fn refresh_token text) (fun password ->
                if not (seq_ (Some password)) then
                  !fail_missing_e2ee_password_fn
                    [ ("reason", kw "headless-empty-password");
                      ("hint", str "Provide --e2ee-password to persist it.") ];
                !verify_e2ee_password_fn password enc)
        | false ->
            error
              (missing_e2ee_password_exn
                 [ ("reason", kw "missing-persisted-password");
                   ("hint", str "Provide --e2ee-password to persist it.") ]))
  in
  run (fun () ->
      let enc = transit_read encrypted_private_key_str in
      match !ui_password_ref with
      | Some p when seq_ (Some p) -> decrypt_with_ui_request enc
      | _ ->
          catch (decrypt_in_headless enc) (fun headless_error ->
              if not (interactive_runtime ()) then error headless_error
              else decrypt_with_ui_request enc))

let decrypt_private_key_fn :
    (decrypt_private_key_opts -> string -> Wire.t t) ref =
  ref decrypt_private_key_impl

let decrypt_private_key (encrypted_private_key_str : string) : Wire.t t =
  !decrypt_private_key_fn (default_decrypt_private_key_opts ()) encrypted_private_key_str

(* ---------- public-key / aes-key fetch ---------- *)

let import_public_key_impl (public_key_str : string) : Wire.t t =
  run (fun () ->
      let exported = transit_read public_key_str in
      match exported with
      | Wire.Binary der -> !import_public_key_crypt_fn der
      | Wire.String s -> !import_public_key_crypt_fn s
      | v -> !import_public_key_crypt_fn (transit_write v))

let import_public_key_fn : (string -> Wire.t t) ref = ref import_public_key_impl

let fetch_user_public_key_by_email_impl base email =
  !fetch_json_fn
    (base ^ "/e2ee/user-public-key?email=" ^ urlencode email)
    ~response_schema:"e2ee/user-public-key" ()

let fetch_user_public_key_by_email_fn : (string -> string -> Wire.t t) ref =
  ref fetch_user_public_key_by_email_impl

let fetch_graph_encrypted_aes_key_raw_impl base graph_id =
  !fetch_json_fn
    (base ^ "/e2ee/graphs/" ^ graph_id ^ "/aes-key")
    ~response_schema:"e2ee/graph-aes-key" ()

let fetch_graph_encrypted_aes_key_raw_fn : (string -> string -> Wire.t t) ref =
  ref fetch_graph_encrypted_aes_key_raw_impl

let fetch_graph_encrypted_aes_key_impl base graph_id =
  match graph_id with
  | Some gid ->
      bind (!fetch_graph_encrypted_aes_key_raw_fn base gid) (fun resp ->
          match Wire.get "encrypted-aes-key" resp with
          | Some (Wire.String s) -> pure (Some (transit_read s))
          | _ -> pure None)
  | None -> pure None

let fetch_graph_encrypted_aes_key_fn : (string -> string option -> Wire.t option t) ref =
  ref fetch_graph_encrypted_aes_key_impl

let upsert_graph_encrypted_aes_key_impl base graph_id encrypted_aes_key_str =
  run (fun () ->
      let body =
        !coerce_http_request_fn "e2ee/graph-aes-key"
          (Wire.kw_map [ ("encrypted-aes-key", str encrypted_aes_key_str) ])
      in
      (match body with
       | Some _ -> ()
       | None ->
           fail_fast "db-sync/invalid-field"
             (Wire.kw_map [ ("type", kw "e2ee/graph-aes-key"); ("body", Wire.Nil) ]));
      !fetch_json_fn (base ^ "/e2ee/graphs/" ^ graph_id ^ "/aes-key")
        ~method_:"POST" ~headers:[ ("content-type", "application/json") ]
        ~body:(Json.stringify (Option.get body))
        ~response_schema:"e2ee/graph-aes-key" ())

let upsert_graph_encrypted_aes_key_fn : (string -> string -> string -> Wire.t t) ref =
  ref upsert_graph_encrypted_aes_key_impl

(* ---------- rsa key material (ui password cache + cache-clear retry) ---------- *)

let load_user_rsa_key_material_impl base (user_id : string) (graph_id : string option) :
    (Wire.t * Wire.t) t =
  let ui_password_ref : string option ref = ref None in
  let load_once () =
    bind (!ensure_user_rsa_key_pair_raw_fn base Wire.Nil) (fun pair ->
        (match Wire.get "public-key" pair, Wire.get "encrypted-private-key" pair with
         | Some (Wire.String _), Some (Wire.String _) -> ()
         | _ ->
             fail_fast "db-sync/missing-field"
               (Wire.kw_map
                  [ ("base", str base); ("user-id", str user_id);
                    ("graph-id", wire_opt str graph_id);
                    ("field", kw "user-rsa-key-pair") ]));
        let public_key =
          match Wire.get "public-key" pair with
          | Some (Wire.String s) -> s
          | _ -> assert false
        in
        let encrypted_private_key =
          match Wire.get "encrypted-private-key" pair with
          | Some (Wire.String s) -> s
          | _ -> assert false
        in
        bind (!import_public_key_fn public_key) (fun public_key' ->
            bind
              (!decrypt_private_key_fn
                 { ui_password_ref; save_ui_password = false }
                 encrypted_private_key)
              (fun private_key' -> pure (public_key', private_key'))))
  in
  bind
    (catch (load_once ()) (fun err ->
         if not (user_rsa_key_cache_retryable_error err) then error err
         else
           catch
             (bind (!clear_user_rsa_key_pair_cache_fn (Some base) (Some user_id))
                (fun () -> load_once ()))
             (fun retry_err ->
               Worker_log.warn "db-sync/user-rsa-key-cache-invalid"
                 [ ("base", base); ("user-id", user_id);
                   ("graph-id", Option.value graph_id ~default:"");
                   ("first-error", exn_message err);
                   ("retry-error", exn_message retry_err) ];
               error retry_err)))
    (fun key_material ->
      match !ui_password_ref with
      | Some p when seq_ (Some p) ->
          map (fun () -> key_material) (!save_e2ee_password_fn p)
      | _ -> pure key_material)

let load_user_rsa_key_material_fn :
    (string -> string -> string option -> (Wire.t * Wire.t) t) ref =
  ref load_user_rsa_key_material_impl

let preflight_upload_e2ee_impl repo encrypted_graph : unit t =
  match encrypted_graph with
  | true ->
      run (fun () ->
          let base = e2ee_base () in
          bind (!resolve_user_uuid_fn ()) (fun user_id ->
              (match base, user_id with
               | Some _, Some _ -> ()
               | _ ->
                   fail_fast "db-sync/missing-field"
                     (Wire.kw_map
                        [ ("repo", str repo);
                          ("base", wire_opt str base);
                          ("user-id", wire_opt str user_id);
                          ("field", kw "user-rsa-key-pair") ]));
              map ignore
                (!load_user_rsa_key_material_fn (Option.get base) (Option.get user_id) None)))
  | false -> pure ()

let preflight_upload_e2ee_fn : (string -> bool -> unit t) ref =
  ref preflight_upload_e2ee_impl

(* ---------- graph aes key ---------- *)

let ensure_graph_aes_key_impl repo (graph_id : string option) :
    Wire.t option t =
  if not (graph_e2ee_truthy repo) then pure None
  else
    run (fun () ->
        match graph_id with
        | Some gid when Hashtbl.mem graph_aes_keys gid ->
            pure (Some (Hashtbl.find graph_aes_keys gid))
        | _ ->
            let base = e2ee_base () in
            bind (!resolve_user_uuid_fn ()) (fun user_id ->
                (match base, user_id with
                 | Some _, Some _ -> ()
                 | _ ->
                     fail_fast "db-sync/missing-field"
                       (Wire.kw_map
                          [ ("base", wire_opt str base);
                            ("user-id", wire_opt str user_id);
                            ("graph-id", wire_opt str graph_id) ]));
                let base = Option.get base and user_id = Option.get user_id in
                bind
                  (!load_user_rsa_key_material_fn base user_id graph_id)
                  (fun (public_key, private_key) ->
                    bind
                      (match graph_id with
                       | Some gid -> get_item (graph_encrypted_aes_key_idb_key gid)
                       | None -> pure Wire.Nil)
                      (fun local_encrypted ->
                        let local =
                          match local_encrypted with
                          | Wire.Nil -> None
                          | v -> Some v
                        in
                        bind
                          (match local, graph_id with
                           | None, Some gid ->
                               !fetch_graph_encrypted_aes_key_fn base (Some gid)
                           | _ -> pure None)
                          (fun remote_encrypted ->
                            let encrypted_aes_key =
                              match local with Some _ -> local | None -> remote_encrypted
                            in
                            bind
                              (match encrypted_aes_key with
                               | Some enc ->
                                   catch (!decrypt_aes_key_fn private_key enc)
                                     (fun err ->
                                       match graph_id, local with
                                       | Some gid, Some _ ->
                                           let k = graph_encrypted_aes_key_idb_key gid in
                                           catch
                                             (bind (clear_item k) (fun () ->
                                                  bind
                                                    (!fetch_graph_encrypted_aes_key_fn
                                                       base (Some gid))
                                                    (function
                                                      | None -> error err
                                                      | Some refetched ->
                                                          bind
                                                            (!decrypt_aes_key_fn private_key
                                                               refetched)
                                                            (fun aes_key ->
                                                              map
                                                                (fun () -> aes_key)
                                                                (!set_item_fn k refetched)))))
                                             (fun retry_err ->
                                               Worker_log.warn
                                                 "db-sync/graph-aes-key-cache-invalid"
                                                 [ ("base", base); ("user-id", user_id);
                                                   ("graph-id", gid);
                                                   ("first-error", exn_message err);
                                                   ("retry-error", exn_message retry_err) ];
                                               error retry_err)
                                       | _ -> error err)
                               | None ->
                                   bind (!generate_aes_key_fn ()) (fun aes_key ->
                                       bind (!encrypt_aes_key_fn public_key aes_key)
                                         (fun encrypted ->
                                           let encrypted_str = transit_write encrypted in
                                           bind
                                             (!upsert_graph_encrypted_aes_key_fn base
                                                (Option.get graph_id) encrypted_str)
                                             (fun _ ->
                                               map
                                                 (fun () -> aes_key)
                                                 (!set_item_fn
                                                    (graph_encrypted_aes_key_idb_key
                                                       (Option.get graph_id))
                                                    encrypted)))))
                              (fun aes_key ->
                                bind
                                  (match graph_id, encrypted_aes_key, local with
                                   | Some gid, Some enc, None ->
                                       !set_item_fn
                                         (graph_encrypted_aes_key_idb_key gid) enc
                                   | _ -> pure ())
                                  (fun () ->
                                    (match graph_id with
                                     | Some gid ->
                                         Hashtbl.replace graph_aes_keys gid aes_key
                                     | None -> ());
                                    pure (Some aes_key))))))))

let ensure_graph_aes_key_fn : (string -> string option -> Wire.t option t) ref =
  ref ensure_graph_aes_key_impl

let fetch_graph_aes_key_for_download_impl (graph_id : string option) : Wire.t t =
  run (fun () ->
      let base = e2ee_base () in
      let aes_key_k =
        match graph_id with
        | Some gid -> Some (graph_encrypted_aes_key_idb_key gid)
        | None -> None
      in
      (match base, graph_id with
       | Some b, Some gid when seq_ (Some b) && seq_ (Some gid) -> ()
       | _ ->
           fail_fast "db-sync/missing-field"
             (Wire.kw_map
                [ ("base", wire_opt str base); ("graph-id", wire_opt str graph_id) ]));
      let base = Option.get base and aes_key_k = Option.get aes_key_k in
      let fetch_once pair =
        bind (clear_item aes_key_k) (fun () ->
            (match Wire.get "public-key" pair, Wire.get "encrypted-private-key" pair with
             | Some (Wire.String _), Some (Wire.String _) -> ()
             | _ ->
                 fail_fast "db-sync/missing-field"
                   (Wire.kw_map
                      [ ("graph-id", wire_opt str graph_id);
                        ("field", kw "user-rsa-key-pair") ]));
            let enc_priv =
              match Wire.get "encrypted-private-key" pair with
              | Some (Wire.String s) -> s
              | _ -> assert false
            in
            bind
              (!decrypt_private_key_fn (default_decrypt_private_key_opts ()) enc_priv)
              (fun private_key ->
                bind
                  (!fetch_graph_encrypted_aes_key_raw_fn base (Option.get graph_id))
                  (fun resp ->
                    let encrypted_aes_key =
                      match Wire.get "encrypted-aes-key" resp with
                      | Some (Wire.String s) -> Some (transit_read s)
                      | _ -> None
                    in
                    (match encrypted_aes_key with
                     | Some _ -> ()
                     | None ->
                         fail_fast "db-sync/missing-field"
                           (Wire.kw_map
                              [ ("graph-id", wire_opt str graph_id);
                                ("field", kw "encrypted-aes-key") ]));
                    let enc = Option.get encrypted_aes_key in
                    bind (!set_item_fn aes_key_k enc) (fun () ->
                        bind (!decrypt_aes_key_fn private_key enc) (fun aes_key ->
                            Hashtbl.replace graph_aes_keys (Option.get graph_id) aes_key;
                            pure aes_key)))))
      in
      bind (!get_user_rsa_key_pair_raw_fn (Some base)) (fun pair ->
          catch (fetch_once pair) (fun err ->
              let user_id = get_user_uuid () in
              match String.equal (exn_message err) "decrypt-aes-key", user_id with
              | true, Some uid when seq_ (Some uid) ->
                  catch
                    (bind
                       (!clear_user_rsa_key_pair_cache_fn (Some base) (Some uid))
                       (fun () ->
                         bind (!get_user_rsa_key_pair_raw_fn (Some base)) fetch_once))
                    (fun retry_err ->
                      Worker_log.warn "db-sync/user-rsa-key-cache-invalid-on-download"
                        [ ("base", base); ("user-id", uid);
                          ("graph-id", Option.value graph_id ~default:"");
                          ("first-error", exn_message err);
                          ("retry-error", exn_message retry_err) ];
                      error retry_err)
              | _ -> error err)))

let fetch_graph_aes_key_for_download_fn : (string option -> Wire.t t) ref =
  ref fetch_graph_aes_key_for_download_impl

(* ---------- grant access ---------- *)

let grant_graph_access_impl repo graph_id target_email : unit t =
  if not (graph_e2ee_truthy repo) then pure ()
  else
    run (fun () ->
        let base = e2ee_base () in
        (match base with
         | Some b when seq_ (Some b) -> ()
         | _ ->
             fail_fast "db-sync/missing-field"
               (Wire.kw_map
                  [ ("base", wire_opt str base); ("graph-id", wire_opt str graph_id) ]));
        let base = Option.get base in
        bind (!ensure_graph_aes_key_fn repo graph_id) (fun aes_key ->
            (match aes_key with
             | Some _ -> ()
             | None ->
                 fail_fast "db-sync/missing-field"
                   (Wire.kw_map [ ("repo", str repo); ("field", kw "aes-key") ]));
            let aes_key = Option.get aes_key in
            bind
              (!fetch_user_public_key_by_email_fn base target_email)
              (fun resp ->
                match Wire.get "public-key" resp with
                | Some (Wire.String public_key_str) ->
                    bind (!import_public_key_fn public_key_str) (fun public_key ->
                        bind (!encrypt_aes_key_fn public_key aes_key) (fun encrypted ->
                            let encrypted_str = transit_write encrypted in
                            let body =
                              !coerce_http_request_fn "e2ee/grant-access"
                                (Wire.kw_map
                                   [ ( "target-user-email+encrypted-aes-key-coll"
                                     , Wire.Array
                                         [ Wire.kw_map
                                             [ ("email", str target_email);
                                               ("encrypted-aes-key", str encrypted_str) ] ]
                                     ) ])
                            in
                            (match body with
                             | Some _ -> ()
                             | None ->
                                 fail_fast "db-sync/invalid-field"
                                   (Wire.kw_map
                                      [ ("type", kw "e2ee/grant-access");
                                        ("body", Wire.Nil) ]));
                            map
                              (fun _ -> ())
                              (!fetch_json_fn
                                 (base ^ "/e2ee/graphs/" ^ Option.get graph_id
                                  ^ "/grant-access")
                                 ~method_:"POST"
                                 ~headers:[ ("content-type", "application/json") ]
                                 ~body:(Json.stringify (Option.get body))
                                 ~response_schema:"e2ee/grant-access" ())))
                | _ ->
                    fail_fast "db-sync/missing-field"
                      (Wire.kw_map
                         [ ("repo", str repo); ("field", kw "public-key");
                           ("email", str target_email) ]))))

let grant_graph_access_fn : (string -> string option -> string -> unit t) ref =
  ref grant_graph_access_impl

(* ---------- text value / tx data encrypt/decrypt ---------- *)

let encrypt_text_value_impl aes_key (value : string) : string t =
  map
    (fun enc -> transit_write enc)
    (!encrypt_text_fn aes_key (transit_write (str value)))

let decrypt_text_value_impl aes_key (value : string) : Wire.t t =
  run (fun () ->
      match transit_read_safe value with
      | None -> pure (str value)
      | Some decoded ->
          bind (!decrypt_text_if_encrypted_fn aes_key decoded) (fun maybe ->
              let value = match maybe with Some s -> str s | None -> decoded in
              let value' =
                match value with
                | Wire.String s ->
                    (match transit_read_safe s with Some w -> w | None -> value)
                | _ -> value
              in
              pure value'))

let encrypt_text_value_fn : (Wire.t -> string -> string t) ref =
  ref encrypt_text_value_impl

let decrypt_text_value_fn : (Wire.t -> string -> Wire.t t) ref =
  ref decrypt_text_value_impl

let in_encrypt_attr_set = function
  | Wire.Keyword k | Wire.String k -> List.mem k encrypt_attr_set
  | _ -> false

let encrypt_tx_item aes_key (item : Wire.t) : Wire.t t =
  match item with
  | Wire.Array xs when List.length xs >= 4 ->
      let attr = List.nth xs 2 and v = List.nth xs 3 in
      (match in_encrypt_attr_set attr, Wire.as_string v with
       | true, Some vs ->
           map
             (fun v' -> Wire.Array (List.mapi (fun i x -> if i = 3 then str v' else x) xs))
             (!encrypt_text_value_fn aes_key vs)
       | _ -> pure item)
  | _ -> pure item

let decrypt_tx_item aes_key (item : Wire.t) : Wire.t t =
  match item with
  | Wire.Array xs when List.length xs >= 4 ->
      let attr = List.nth xs 2 and v = List.nth xs 3 in
      (match in_encrypt_attr_set attr, Wire.as_string v with
       | true, Some vs ->
           map
             (fun v' -> Wire.Array (List.mapi (fun i x -> if i = 3 then v' else x) xs))
             (!decrypt_text_value_fn aes_key vs)
       | _ -> pure item)
  | _ -> pure item

let encrypt_tx_data aes_key (tx_data : Wire.t) : Wire.t t =
  map
    (fun items -> Wire.Array items)
    (all (List.map (encrypt_tx_item aes_key) (Wire.as_seq tx_data)))

let decrypt_tx_data aes_key (tx_data : Wire.t) : Wire.t t =
  map
    (fun items -> Wire.Array items)
    (all (List.map (decrypt_tx_item aes_key) (Wire.as_seq tx_data)))

let wire_as_string_exn = function
  | Wire.String s -> s
  | _ -> invalid_arg "expected string wire value"

(* <decrypt-datoms: seq of [e a v t] quadruples. *)
let decrypt_datoms_impl aes_key (data : Wire.t) : Wire.t t =
  map
    (fun xs -> Wire.Array xs)
    (all
       (List.map
          (fun d ->
            match Wire.as_seq d with
            | [ e; a; v; t_ ] when in_encrypt_attr_set a ->
                map
                  (fun v' -> Wire.Array [ e; a; v'; t_ ])
                  (!decrypt_text_value_fn aes_key (wire_as_string_exn v))
            | _ -> pure d)
          (Wire.as_seq data)))

let decrypt_datoms_fn : (Wire.t -> Wire.t -> Wire.t t) ref =
  ref decrypt_datoms_impl

(* [addr content-transit addresses-json] snapshot rows. *)
let decrypt_snapshot_row_impl aes_key (row : Wire.t) : Wire.t t =
  run (fun () ->
      match Wire.as_seq row with
      | [ addr; raw_content; raw_addresses ] ->
          let content_str =
            match raw_content with
            | Wire.String s -> s
            | _ -> invalid_arg "snapshot row content"
          in
          let data = transit_read content_str in
          let addresses =
            match raw_addresses with
            | Wire.String s when String.length s > 0 -> Some (Json.parse s)
            | _ -> None
          in
          (match data with
           | Wire.Map _ ->
               let keys = Option.value (Wire.get "keys" data) ~default:Wire.Nil in
               bind
                 (match Wire.as_seq keys with
                  | _ :: _ -> !decrypt_datoms_fn aes_key keys
                  | [] -> pure keys)
                 (fun keys' ->
                   let result = wire_assoc "keys" keys' data in
                   let result =
                     match addresses with
                     | Some a -> wire_assoc "addresses" a result
                     | None -> result
                   in
                   pure (Wire.Array [ addr; str (transit_write result); raw_addresses ]))
           | _ ->
               bind
                 (map
                    (fun xs -> Wire.Array xs)
                    (all (List.map (decrypt_datoms_impl aes_key) (Wire.as_seq data))))
                 (fun result ->
                   pure (Wire.Array [ addr; str (transit_write result); raw_addresses ])))
      | _ -> invalid_arg "decrypt-snapshot-row: expected [addr content addresses]")

let decrypt_snapshot_row_fn : (Wire.t -> Wire.t -> Wire.t t) ref =
  ref decrypt_snapshot_row_impl

let decrypt_snapshot_rows_batch_impl aes_key (rows : Wire.t) : Wire.t t =
  map
    (fun r -> Wire.Array r)
    (all (List.map (fun row -> !decrypt_snapshot_row_fn aes_key row) (Wire.as_seq rows)))

let decrypt_snapshot_rows_batch_fn : (Wire.t -> Wire.t -> Wire.t t) ref =
  ref decrypt_snapshot_rows_batch_impl

let decrypt_snapshot_datoms_batch_impl aes_key (datoms : Wire.t) : Wire.t t =
  map
    (fun r -> Wire.Array r)
    (all
       (List.map
          (fun (datom : Wire.t) ->
            match datom with
            | Wire.Map _ ->
                let a = Option.value (Wire.get "a" datom) ~default:Wire.Nil in
                (match in_encrypt_attr_set a with
                 | true ->
                     let v = Option.value (Wire.get "v" datom) ~default:Wire.Nil in
                     (match Wire.as_string v with
                      | Some vs ->
                          map
                            (fun v' -> wire_assoc "v" v' datom)
                            (!decrypt_text_value_fn aes_key vs)
                      | None -> pure datom)
                 | false -> pure datom)
            | _ -> pure datom)
          (Wire.as_seq datoms)))

let decrypt_snapshot_datoms_batch_fn : (Wire.t -> Wire.t -> Wire.t t) ref =
  ref decrypt_snapshot_datoms_batch_impl

let split_at n xs =
  let rec go i acc = function
    | [] -> (List.rev acc, [])
    | x :: tl when i > 0 -> go (i - 1) (x :: acc) tl
    | rest -> (List.rev acc, rest)
  in
  go n [] xs

let encrypt_datoms ?progress_f aes_key (datoms : Wire.t) : Wire.t t =
  let batch_size = 5000 in
  let items = Wire.as_seq datoms in
  let total = List.length items in
  let rec batches acc xs =
    match xs with
    | [] -> List.rev acc
    | _ ->
        let b, rest = split_at batch_size xs in
        batches (b :: acc) rest
  in
  let rec loop remaining result encrypted_count =
    match remaining with
    | [] -> pure result
    | batch :: rest ->
        bind
          (all
             (List.map
                (fun (datom : Wire.t) ->
                  let a = Option.value (Wire.get "a" datom) ~default:Wire.Nil in
                  match in_encrypt_attr_set a with
                  | true ->
                      let v = Option.value (Wire.get "v" datom) ~default:Wire.Nil in
                      (match Wire.as_string v with
                       | Some vs ->
                           map
                             (fun v' -> wire_assoc "v" (str v') datom)
                             (!encrypt_text_value_fn aes_key vs)
                       | None -> pure datom)
                  | false -> pure datom)
                batch))
          (fun encrypted ->
            let encrypted_count' = encrypted_count + List.length batch in
            (match progress_f with
             | Some f -> f encrypted_count' total
             | None -> ());
            loop rest (result @ encrypted) encrypted_count')
  in
  map (fun xs -> Wire.Array xs) (loop (batches [] items) [] 0)

let encrypt_datoms_fn : (?progress_f:(int -> int -> unit) -> Wire.t -> Wire.t -> Wire.t t) ref =
  ref encrypt_datoms

(* ---------- password change ---------- *)

let re_encrypt_private_key encrypted_private_key_str old_password new_password : string t =
  run (fun () ->
      let enc = transit_read encrypted_private_key_str in
      bind (!decrypt_private_key_crypt_fn old_password enc) (fun private_key ->
          bind (!encrypt_private_key_fn new_password private_key) (fun new_enc ->
              pure (transit_write new_enc))))

let change_e2ee_password_impl _refresh_token user_uuid old_password new_password : unit t =
  run (fun () ->
      let base = e2ee_base () in
      (match base with
       | Some b when seq_ (Some b) -> ()
       | _ ->
           fail_fast "db-sync/missing-field"
             (Wire.kw_map
                [ ("base", wire_opt str base);
                  ("user-uuid", wire_opt str user_uuid) ]));
      let base = Option.get base in
      bind (!get_user_rsa_key_pair_raw_fn (Some base)) (fun pair ->
          (match Wire.get "public-key" pair, Wire.get "encrypted-private-key" pair with
           | Some (Wire.String _), Some (Wire.String _) -> ()
           | _ ->
               fail_fast "db-sync/missing-field"
                 (Wire.kw_map
                    [ ("base", str base); ("user-uuid", wire_opt str user_uuid);
                      ("field", kw "user-rsa-key-pair") ]));
          let public_key =
            match Wire.get "public-key" pair with
            | Some (Wire.String s) -> s | _ -> assert false
          in
          let enc =
            match Wire.get "encrypted-private-key" pair with
            | Some (Wire.String s) -> s | _ -> assert false
          in
          bind (re_encrypt_private_key enc old_password new_password) (fun enc' ->
              bind (!upload_user_rsa_key_pair_fn base public_key enc') (fun _ ->
                  !save_e2ee_password_fn new_password))))

let change_e2ee_password_fn :
    (string option -> string option -> string -> string -> unit t) ref =
  ref change_e2ee_password_impl

let cancel_ui_requests context = cancel_all_ui_requests context

(* ---------- init + hook reset ---------- *)

(* Registered endpoints live in endpoint_crypt.ml — see its header for
   the thread-api names it wires up. *)
let init () =
  (* cljs binds these hooks via direct namespace references when
     crypt.cljs is loaded; the OCaml port routes them through Sync_deps so
     they must be wired here. *)
  Sync_deps.graph_e2ee :=
    Some
      (fun (db : Datascript.db) ->
        match Ldb.get_graph_rtc_e2ee db with
        | Some (Datascript.Bool false) | None -> false
        | Some _ -> true);
  Sync_deps.ensure_graph_aes_key :=
    Some
      (fun repo ->
        map
          (fun o -> Option.value ~default:Wire.Nil o)
          (!ensure_graph_aes_key_fn repo (!get_graph_id_fn repo)));
  Sync_deps.encrypt_tx_data :=
    Some
      (fun key items ->
        map Wire.as_seq
          (encrypt_tx_data (Wire.String key) (Wire.Array items)));
  Sync_deps.decrypt_tx_data :=
    Some
      (fun key items ->
        map Wire.as_seq
          (decrypt_tx_data (Wire.String key) (Wire.Array items)));
  Sync_deps.encrypt_datoms :=
    Some
      (fun aes_key items ->
        map Wire.as_seq
          (!encrypt_datoms_fn aes_key (Wire.Array items)));
  Sync_deps.decrypt_snapshot_datoms_batch :=
    Some
      (fun aes_key items ->
        map Wire.as_seq
          (!decrypt_snapshot_datoms_batch_fn aes_key (Wire.Array items)));
  Sync_deps.encrypt_text_value :=
    Some (fun key v -> !encrypt_text_value_fn key v);
  Sync_deps.decrypt_text_value :=
    Some
      (fun key v ->
        map
          (fun w ->
            match w with
            | Wire.String s -> s
            | _ ->
                invalid_arg
                  "sync_crypt: decrypted text value is not a string")
          (!decrypt_text_value_fn key v));
  Sync_deps.encrypt_bytes := Some (fun key b -> !encrypt_uint8array_fn key b);
  Sync_deps.decrypt_bytes := Some (fun key w -> !decrypt_uint8array_fn key w);
  Sync_deps.fetch_graph_aes_key_for_download :=
    Some
      (fun _repo graph_id ->
        !fetch_graph_aes_key_for_download_fn (Some graph_id));
  Sync_deps.preflight_upload_e2ee :=
    Some (fun repo e2ee -> !preflight_upload_e2ee_fn repo e2ee);
  Sync_deps.ensure_user_rsa_keys := Some (fun opts -> !ensure_user_rsa_keys_fn opts)

let reset_hooks () =
  platform_env_fn := platform_env_impl;
  fail_missing_e2ee_password_fn := fail_missing_e2ee_password_impl;
  transit_read_fn := Transit_codec.of_string;
  transit_write_fn := (fun w -> Transit_codec.to_string w);
  ldb_graph_rtc_e2ee_fn := Ldb.get_graph_rtc_e2ee;
  ldb_graph_rtc_uuid_fn := Ldb.get_graph_rtc_uuid;
  datascript_conn_fn := Worker_state.datascript_conn;
  state_get_fn := Worker_state.state_get;
  merge_state_fn := Worker_state.merge_state;
  db_sync_config_fn := Worker_state.db_sync_config;
  kv_get_fn := kv_get_impl;
  kv_set_fn := kv_set_impl;
  secret_save_fn := Secret_store.save;
  secret_read_fn := Secret_store.read;
  secret_delete_fn := Secret_store.delete;
  read_text_fn := File_sys.read_text;
  http_send_fn := Http.send;
  post_message_fn := Comlink.post_message;
  now_ms_fn := Clock.now_ms;
  generate_rsa_key_pair_fn := generate_rsa_key_pair_impl;
  encrypt_private_key_fn := encrypt_private_key_impl;
  decrypt_private_key_crypt_fn := decrypt_private_key_crypt_impl;
  export_public_key_fn := export_public_key_impl;
  import_public_key_crypt_fn := (fun der -> pure (Wire.Binary der));
  generate_aes_key_fn := generate_aes_key_impl;
  import_aes_key_fn := Crypto.Aes_gcm.import_key;
  encrypt_aes_key_fn := encrypt_aes_key_impl;
  decrypt_aes_key_fn := decrypt_aes_key_impl;
  encrypt_uint8array_fn := encrypt_uint8array_impl;
  decrypt_uint8array_fn := decrypt_uint8array_impl;
  encrypt_text_fn := encrypt_text_impl;
  decrypt_text_fn := decrypt_text_impl;
  decrypt_text_if_encrypted_fn := decrypt_text_if_encrypted_impl;
  encrypt_text_by_text_password_fn := encrypt_text_by_text_password_impl;
  decrypt_text_by_text_password_fn := decrypt_text_by_text_password_impl;
  parse_jwt_fn := parse_jwt_impl;
  auth_token_fn := auth_token_impl;
  resolve_ws_token_fn := resolve_ws_token_impl;
  coerce_http_request_fn := coerce_http_request_impl;
  fetch_json_fn := fetch_json_impl;
  ui_request_fn := ui_request_impl;
  e2ee_base_fn := e2ee_base_impl;
  graph_e2ee_fn := graph_e2ee_impl;
  get_graph_id_fn := get_graph_id_impl;
  get_user_uuid_fn := get_user_uuid_impl;
  resolve_user_uuid_fn := resolve_user_uuid_impl;
  get_item_fn := get_item_impl;
  set_item_fn := set_item_impl;
  clear_item_fn := clear_item_impl;
  fetch_user_rsa_key_pair_raw_fn := fetch_user_rsa_key_pair_raw_impl;
  get_user_rsa_key_pair_from_idb_fn := get_user_rsa_key_pair_from_idb_impl;
  set_user_rsa_key_pair_to_idb_fn := set_user_rsa_key_pair_to_idb_impl;
  clear_user_rsa_key_pair_cache_fn := clear_user_rsa_key_pair_cache_impl;
  get_user_rsa_key_pair_raw_fn := get_user_rsa_key_pair_raw_impl;
  upload_user_rsa_key_pair_fn := upload_user_rsa_key_pair_impl;
  save_e2ee_password_fn := save_e2ee_password_impl;
  read_e2ee_password_text_fn := read_e2ee_password_text_impl;
  decrypt_e2ee_password_text_fn := decrypt_e2ee_password_text;
  read_e2ee_password_fn := read_e2ee_password;
  clear_e2ee_password_fn := clear_e2ee_password_impl;
  request_e2ee_password_from_ui_fn := request_e2ee_password_from_ui_impl;
  verify_e2ee_password_fn := verify_e2ee_password_impl;
  verify_and_save_e2ee_password_fn := verify_and_save_e2ee_password;
  verify_and_save_e2ee_password_from_server_fn := verify_and_save_e2ee_password_from_server_impl;
  generate_and_upload_user_rsa_key_pair_fn := generate_and_upload_user_rsa_key_pair_impl;
  ensure_user_rsa_key_pair_raw_fn := ensure_user_rsa_key_pair_raw_impl;
  ensure_user_rsa_key_pair_fn := ensure_user_rsa_key_pair_impl;
  ensure_user_rsa_keys_fn := ensure_user_rsa_keys_impl;
  decrypt_private_key_fn := decrypt_private_key_impl;
  import_public_key_fn := import_public_key_impl;
  fetch_user_public_key_by_email_fn := fetch_user_public_key_by_email_impl;
  fetch_graph_encrypted_aes_key_raw_fn := fetch_graph_encrypted_aes_key_raw_impl;
  fetch_graph_encrypted_aes_key_fn := fetch_graph_encrypted_aes_key_impl;
  upsert_graph_encrypted_aes_key_fn := upsert_graph_encrypted_aes_key_impl;
  load_user_rsa_key_material_fn := load_user_rsa_key_material_impl;
  preflight_upload_e2ee_fn := preflight_upload_e2ee_impl;
  ensure_graph_aes_key_fn := ensure_graph_aes_key_impl;
  fetch_graph_aes_key_for_download_fn := fetch_graph_aes_key_for_download_impl;
  grant_graph_access_fn := grant_graph_access_impl;
  encrypt_text_value_fn := encrypt_text_value_impl;
  decrypt_text_value_fn := decrypt_text_value_impl;
  decrypt_datoms_fn := decrypt_datoms_impl;
  decrypt_snapshot_row_fn := decrypt_snapshot_row_impl;
  decrypt_snapshot_rows_batch_fn := decrypt_snapshot_rows_batch_impl;
  decrypt_snapshot_datoms_batch_fn := decrypt_snapshot_datoms_batch_impl;
  encrypt_datoms_fn := encrypt_datoms;
  change_e2ee_password_fn := change_e2ee_password_impl;
  Hashtbl.reset graph_aes_keys;
  Hashtbl.reset user_rsa_key_pair_inflight;
  Hashtbl.reset ensure_user_rsa_key_pair_inflight
