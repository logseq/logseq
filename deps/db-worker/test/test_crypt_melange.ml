(* 1:1 port of src/test/frontend/worker/sync/crypt_test.cljs.
   cljs `p/with-redefs` maps to assigning the [*_fn] hook refs in
   Sync_crypt; [reset_hooks] restores them after each test. *)

open Db_worker_effect
open Sync_crypt

let promise_of_task t =
  Js.Promise.make (fun ~resolve ~reject ->
      Db_worker_effect.on_any t (fun v -> resolve v [@u]) (fun e -> reject e [@u]))

let delay_task ms v =
  let task, resolver = Db_worker_effect.wait () in
  ignore (Timers.set_timeout ms (fun () -> Db_worker_effect.wakeup resolver v));
  task

let contains haystack needle =
  match Js.String.indexOf ~search:needle haystack with
  | -1 -> false
  | _ -> true

let ( let* ) t f = bind t f
let ( and* ) a b = map (fun l -> match l with [ a; b ] -> (a, b) | _ -> invalid_arg "and*") (all [ a; b ])

let eq (a : 'a) (b : 'a) = Fest.expect |> Fest.ok (a = b)
let str_eq a b = Fest.expect |> Fest.equal a b
let env runtime owner_source = { runtime; owner_source }
let kwm fields = Wire.kw_map fields

(* cljs pr-str — used where tests stub ldb/write-transit-str with pr-str. *)
let rec pr_str (w : Wire.t) : string =
  match w with
  | Wire.Nil -> "nil"
  | Wire.Bool b -> string_of_bool b
  | Wire.String s -> Printf.sprintf "%S" s
  | Wire.Int i -> string_of_int i
  | Wire.Int64 i -> Int64.to_string i
  | Wire.Float f -> string_of_float f
  | Wire.Keyword k -> ":" ^ k
  | Wire.Symbol s -> s
  | Wire.Array xs | Wire.List xs ->
      "[" ^ String.concat " " (List.map pr_str xs) ^ "]"
  | Wire.Set xs -> "#{" ^ String.concat " " (List.map pr_str xs) ^ "}"
  | Wire.Map kvs ->
      "{"
      ^ String.concat
          ", "
          (List.map (fun (k, v) -> pr_str k ^ " " ^ pr_str v) kvs)
      ^ "}"
  | Wire.Tagged (t, v) -> "#" ^ t ^ " " ^ pr_str v
  | Wire.Binary b -> "#js " ^ Printf.sprintf "%S" b
  | Wire.Big_decimal s | Wire.Big_int s -> s
  | Wire.Date_ms ms -> "#inst " ^ Int64.to_string ms
  | Wire.Uuid u -> "#uuid " ^ Printf.sprintf "%S" u
  | Wire.Uri u -> u

let stub_state ~refresh_token ~id_token ~access_token () =
  state_get_fn :=
    (fun k ->
      match k with
      | "auth/refresh-token" -> Option.map (fun s -> Wire.String s) refresh_token
      | "auth/id-token" -> Option.map (fun s -> Wire.String s) id_token
      | "auth/access-token" -> Option.map (fun s -> Wire.String s) access_token
      | _ -> None)

let expect_rejection task (on_err : exn -> unit) =
  promise_of_task
    (catch
       (map (fun _ -> Fest.expect |> Fest.ok false) task)
       (fun e ->
         on_err e;
         pure ()))

let code_in_missing_or _code e =
  match exn_code e with
  | Some c -> List.mem c [ "db-sync/missing-e2ee-password"; "missing-e2ee-password" ]
  | None ->
      (match exn_message e with
       | "missing-e2ee-password" | "db-sync/missing-e2ee-password" -> true
       | _ -> false)

let () =
  Fest.test "cli-node-auth-token-reads-state-test" (fun () ->
      db_sync_config_fn :=
        (fun () -> kwm [ ("ws-url", Wire.String "wss://example.com/sync/%s") ]);
      stub_state ~refresh_token:None ~id_token:(Some "state-token")
        ~access_token:None ();
      platform_env_fn := (fun () -> env "node" "cli");
      eq (auth_token ()) (Some "state-token");
      reset_hooks ());

  Fest.test "cli-node-get-user-uuid-reads-state-token-test" (fun () ->
      stub_state ~refresh_token:None ~id_token:(Some "state-token")
        ~access_token:None ();
      platform_env_fn := (fun () -> env "node" "cli");
      parse_jwt_fn :=
        (fun token ->
          if token = "state-token" then kwm [ ("sub", Wire.String "state-user-id") ]
          else kwm []);
      eq (get_user_uuid ()) (Some "state-user-id");
      reset_hooks ());

  Fest.test "desktop-token-path-keeps-id-token-behavior-test" (fun () ->
      stub_state ~refresh_token:None ~id_token:(Some "state-token")
        ~access_token:None ();
      platform_env_fn := (fun () -> env "node" "electron");
      parse_jwt_fn :=
        (fun token ->
          if token = "state-token" then kwm [ ("sub", Wire.String "state-user-id") ]
          else kwm []);
      eq (auth_token ()) (Some "state-token");
      eq (get_user_uuid ()) (Some "state-user-id");
      reset_hooks ());

  Fest.Promise.test "resolve-user-uuid-falls-back-to-resolved-token-test" (fun () ->
      get_user_uuid_fn := (fun () -> None);
      resolve_ws_token_fn := (fun () -> pure (Some "fresh-token"));
      parse_jwt_fn :=
        (fun token ->
          if token = "fresh-token" then kwm [ ("sub", Wire.String "fresh-user-id") ]
          else kwm []);
      promise_of_task (!resolve_user_uuid_fn ())
      |> Js.Promise.then_ (fun user_id ->
             eq user_id (Some "fresh-user-id");
             reset_hooks ();
             Js.Promise.resolve ()));

  Fest.Promise.test "get-item-preserves-uint8array-type-test" (fun () ->
      let expected = Wire.Binary (String.init 3 (fun i -> Char.chr [| 9; 8; 7 |].(i))) in
      platform_env_fn := (fun () -> env "test" "");
      kv_get_fn := (fun _platform' _k -> pure expected);
      promise_of_task (!get_item_fn "rtc-encrypted-aes-key###graph-1")
      |> Js.Promise.then_ (fun result ->
             eq result expected;
             reset_hooks ();
             Js.Promise.resolve ()));

  Fest.test "graph-e2ee-preserves-nil-kv-value-test" (fun () ->
      datascript_conn_fn := (fun _repo -> Some (Datascript.create_conn ()));
      ldb_graph_rtc_e2ee_fn := (fun _db -> None);
      eq (graph_e2ee "logseq_db_demo") None;
      reset_hooks ());

  Fest.test "graph-e2ee-preserves-false-kv-value-test" (fun () ->
      datascript_conn_fn := (fun _repo -> Some (Datascript.create_conn ()));
      ldb_graph_rtc_e2ee_fn := (fun _db -> Some (Datascript.Bool false));
      eq (graph_e2ee "logseq_db_demo") (Some (Datascript.Bool false));
      reset_hooks ());

  let save_secret_test ~runtime ~owner_source ~refresh_from_state ~expect_auth_read () =
    let secret_calls = ref [] in
    let auth_read_calls = ref [] in
    let encrypt_calls = ref [] in
    stub_state ~refresh_token:refresh_from_state ~id_token:None
      ~access_token:None ();
    platform_env_fn := (fun () -> env runtime owner_source);
    encrypt_text_by_text_password_fn :=
      (fun refresh_token password ->
        encrypt_calls := !encrypt_calls @ [ (refresh_token, password) ];
        pure (kwm [ ("cipher", Wire.String "payload") ]));
    read_text_fn :=
      (fun path ->
        auth_read_calls := !auth_read_calls @ [ path ];
        pure "{\"refresh-token\":\"refresh-from-auth-file\"}");
    secret_save_fn :=
      (fun ~key text ->
        secret_calls := !secret_calls @ [ (key, text) ];
        pure ());
    promise_of_task (!save_e2ee_password_fn "password")
    |> Js.Promise.then_ (fun _ ->
           eq (List.length !auth_read_calls)
             (if expect_auth_read then 1 else 0);
           (if expect_auth_read then
              str_eq (List.hd !auth_read_calls) "~/logseq/auth.json");
           eq !encrypt_calls
             [ ((if refresh_from_state = None then "refresh-from-auth-file"
                 else Option.get refresh_from_state),
                "password") ];
           eq (List.length !secret_calls) 1;
           eq (fst (List.hd !secret_calls)) "logseq-encrypted-password";
           Fest.expect |> Fest.ok (String.length (snd (List.hd !secret_calls)) > 0);
           reset_hooks ();
           Js.Promise.resolve ())
  in

  Fest.Promise.test "save-e2ee-password-uses-secret-storage-in-browser-runtime-test"
    (save_secret_test ~runtime:"browser" ~owner_source:""
       ~refresh_from_state:(Some "refresh-from-state") ~expect_auth_read:false);

  Fest.Promise.test "save-e2ee-password-uses-native-storage-in-capacitor-runtime-test"
    (fun () ->
      let native_calls = ref [] in
      let secret_calls = ref [] in
      let encrypt_calls = ref [] in
      stub_state ~refresh_token:(Some "refresh-from-state") ~id_token:None
        ~access_token:None ();
      platform_env_fn := (fun () -> env "browser" "capacitor");
      encrypt_text_by_text_password_fn :=
        (fun refresh_token password ->
          encrypt_calls := !encrypt_calls @ [ (refresh_token, password) ];
          pure (kwm [ ("cipher", Wire.String "payload") ]));
      ui_request_fn :=
        (fun action payload ?hint:_ ?timeout_ms:_ () ->
          native_calls := !native_calls @ [ (action, payload) ];
          pure (kwm [ ("supported?", Wire.Bool true) ]));
      secret_save_fn :=
        (fun ~key text ->
          secret_calls := !secret_calls @ [ (key, text) ];
          pure ());
      promise_of_task (!save_e2ee_password_fn "password")
      |> Js.Promise.then_ (fun _ ->
             eq !encrypt_calls [ ("refresh-from-state", "password") ];
             eq (List.length !native_calls) 1;
             let action, payload = List.hd !native_calls in
             eq action (Wire.Keyword "native-save-e2ee-password");
             eq (Wire.get "key" payload) (Some (Wire.String "logseq-encrypted-password"));
             Fest.expect
             |> Fest.ok
                  (match Wire.get "encrypted-text" payload with
                   | Some (Wire.String _) -> true
                   | _ -> false);
             eq !secret_calls [];
             reset_hooks ();
             Js.Promise.resolve ()));

  Fest.Promise.test "save-e2ee-password-uses-secret-storage-in-node-runtime-test"
    (save_secret_test ~runtime:"node" ~owner_source:"cli" ~refresh_from_state:None
       ~expect_auth_read:true);

  Fest.Promise.test "save-e2ee-password-uses-secret-storage-in-electron-runtime-test"
    (save_secret_test ~runtime:"node" ~owner_source:"electron"
       ~refresh_from_state:None ~expect_auth_read:true);

  Fest.Promise.test "save-e2ee-password-missing-refresh-token-in-auth-file-test" (fun () ->
      let encrypt_calls = ref 0 in
      platform_env_fn := (fun () -> env "node" "cli");
      read_text_fn := (fun _path -> pure "{\"refresh-token\":\"\"}");
      encrypt_text_by_text_password_fn :=
        (fun _refresh_token _password ->
          incr encrypt_calls;
          error (ex_info "should-not-encrypt" []));
      expect_rejection (!save_e2ee_password_fn "password") (fun e ->
          Fest.expect |> Fest.ok (code_in_missing_or "code" e);
          eq !encrypt_calls 0;
          reset_hooks ()));

  let read_secret_test ~runtime ~owner_source () =
    let secret_calls = ref [] in
    let file_calls = ref [] in
    platform_env_fn := (fun () -> env runtime owner_source);
    secret_read_fn :=
      (fun ~key ->
        secret_calls := !secret_calls @ [ key ];
        pure (Some (transit_write (kwm [ ("cipher", Wire.String "payload") ]))));
    read_text_fn :=
      (fun path ->
        file_calls := !file_calls @ [ path ];
        pure (transit_write (kwm [ ("cipher", Wire.String "legacy") ])));
    decrypt_text_by_text_password_fn :=
      (fun _refresh_token _data -> pure "decrypted-password");
    promise_of_task (!read_e2ee_password_fn (Some "refresh-token"))
    |> Js.Promise.then_ (fun password ->
           str_eq password "decrypted-password";
           eq !secret_calls [ "logseq-encrypted-password" ];
           eq !file_calls [];
           reset_hooks ();
           Js.Promise.resolve ())
  in

  Fest.Promise.test "read-e2ee-password-uses-secret-storage-in-browser-runtime-test"
    (read_secret_test ~runtime:"browser" ~owner_source:"");

  Fest.Promise.test "read-e2ee-password-uses-native-storage-in-capacitor-runtime-test"
    (fun () ->
      let native_calls = ref [] in
      let secret_calls = ref [] in
      platform_env_fn := (fun () -> env "browser" "capacitor");
      ui_request_fn :=
        (fun action payload ?hint:_ ?timeout_ms:_ () ->
          native_calls := !native_calls @ [ (action, payload) ];
          pure
            (kwm
               [ ("supported?", Wire.Bool true);
                 ( "encrypted-text",
                   Wire.String (transit_write (kwm [ ("cipher", Wire.String "payload") ]))
                 ) ]));
      secret_read_fn :=
        (fun ~key ->
          secret_calls := !secret_calls @ [ key ];
          pure (Some (transit_write (kwm [ ("cipher", Wire.String "legacy") ]))));
      decrypt_text_by_text_password_fn :=
        (fun _refresh_token _data -> pure "decrypted-password");
      promise_of_task (!read_e2ee_password_fn (Some "refresh-token"))
      |> Js.Promise.then_ (fun password ->
             str_eq password "decrypted-password";
             eq !native_calls
               [ ( Wire.Keyword "native-get-e2ee-password",
                   kwm [ ("key", Wire.String "logseq-encrypted-password") ] ) ];
             eq !secret_calls [];
             reset_hooks ();
             Js.Promise.resolve ()));

  Fest.Promise.test "read-e2ee-password-uses-secret-storage-in-node-runtime-test"
    (read_secret_test ~runtime:"node" ~owner_source:"cli");

  Fest.Promise.test "read-e2ee-password-uses-secret-storage-in-electron-runtime-test"
    (read_secret_test ~runtime:"node" ~owner_source:"electron");

  Fest.Promise.test
    "read-e2ee-password-browser-missing-secret-does-not-fallback-to-file-test" (fun () ->
      let secret_read_calls = ref 0 in
      let file_read_calls = ref 0 in
      platform_env_fn := (fun () -> env "browser" "");
      secret_read_fn :=
        (fun ~key:_ ->
          incr secret_read_calls;
          pure None);
      read_text_fn :=
        (fun _path ->
          incr file_read_calls;
          pure (transit_write (kwm [ ("cipher", Wire.String "legacy") ])));
      decrypt_text_by_text_password_fn :=
        (fun _refresh_token _data -> error (ex_info "should-not-decrypt" []));
      expect_rejection (!read_e2ee_password_fn (Some "refresh-token")) (fun e ->
          eq !secret_read_calls 1;
          eq !file_read_calls 0;
          Fest.expect |> Fest.ok (code_in_missing_or "code" e);
          reset_hooks ()));

  Fest.Promise.test
    "read-e2ee-password-capacitor-missing-native-secret-does-not-fallback-to-worker-storage-test"
    (fun () ->
      let native_read_calls = ref 0 in
      let secret_read_calls = ref 0 in
      let file_read_calls = ref 0 in
      platform_env_fn := (fun () -> env "browser" "capacitor");
      ui_request_fn :=
        (fun action payload ?hint:_ ?timeout_ms:_ () ->
          incr native_read_calls;
          eq action (Wire.Keyword "native-get-e2ee-password");
          eq payload (kwm [ ("key", Wire.String "logseq-encrypted-password") ]);
          pure (kwm [ ("supported?", Wire.Bool true); ("encrypted-text", Wire.Nil) ]));
      secret_read_fn :=
        (fun ~key:_ ->
          incr secret_read_calls;
          pure (Some (transit_write (kwm [ ("cipher", Wire.String "legacy") ]))));
      read_text_fn :=
        (fun _path ->
          incr file_read_calls;
          pure (transit_write (kwm [ ("cipher", Wire.String "legacy-file") ])));
      decrypt_text_by_text_password_fn :=
        (fun _refresh_token _data -> error (ex_info "should-not-decrypt" []));
      expect_rejection (!read_e2ee_password_fn (Some "refresh-token")) (fun e ->
          eq !native_read_calls 1;
          eq !secret_read_calls 0;
          eq !file_read_calls 0;
          Fest.expect |> Fest.ok (code_in_missing_or "code" e);
          reset_hooks ()));

  Fest.Promise.test "verify-and-save-e2ee-password-verifies-before-write-test" (fun () ->
      let save_calls = ref [] in
      let decrypt_calls = ref [] in
      platform_env_fn := (fun () -> env "node" "cli");
      transit_read_fn :=
        (fun value ->
          if value = "encrypted-private-key" then
            Wire.Keyword "encrypted-private-key-payload"
          else Wire.String value);
      decrypt_private_key_crypt_fn :=
        (fun password encrypted_private_key ->
          decrypt_calls := !decrypt_calls @ [ (password, encrypted_private_key) ];
          pure (Wire.Keyword "private-key"));
      read_text_fn := (fun _path -> pure "{\"refresh-token\":\"refresh-token\"}");
      encrypt_text_by_text_password_fn :=
        (fun _refresh_token _password ->
          pure (kwm [ ("cipher", Wire.String "password-payload") ]));
      secret_save_fn :=
        (fun ~key text ->
          save_calls := !save_calls @ [ (key, text) ];
          pure ());
      promise_of_task
        (!verify_and_save_e2ee_password_fn "new-password"
           (Wire.String "encrypted-private-key"))
      |> Js.Promise.then_ (fun _ ->
             eq !decrypt_calls
               [ ("new-password", Wire.Keyword "encrypted-private-key-payload") ];
             eq (List.length !save_calls) 1;
             eq (fst (List.hd !save_calls)) "logseq-encrypted-password";
             Fest.expect
             |> Fest.ok
                  (match List.hd !save_calls with _, t -> String.length t > 0);
             reset_hooks ();
             Js.Promise.resolve ()));

  Fest.Promise.test "verify-and-save-e2ee-password-invalid-password-does-not-overwrite-test"
    (fun () ->
      let save_calls = ref 0 in
      platform_env_fn := (fun () -> env "node" "cli");
      transit_read_fn := (fun _ -> Wire.Keyword "encrypted-private-key-payload");
      decrypt_private_key_crypt_fn :=
        (fun _password _encrypted_private_key ->
          error
            (ex_info "decrypt-private-key" [ (Wire.Keyword "code", kw "invalid-password") ]));
      secret_save_fn :=
        (fun ~key:_ _text ->
          incr save_calls;
          pure ());
      expect_rejection
        (!verify_and_save_e2ee_password_fn "wrong_password"
           (Wire.String "encrypted-private-key"))
        (fun e ->
          str_eq (exn_message e) "decrypt-private-key";
          eq !save_calls 0;
          reset_hooks ()));

  Fest.Promise.test "verify-and-save-e2ee-password-invalid-server-user-keys-shape-test"
    (fun () ->
      platform_env_fn := (fun () -> env "node" "cli");
      e2ee_base_fn := (fun () -> Some "https://example.com");
      resolve_user_uuid_fn := (fun () -> pure (Some "user-1"));
      get_item_fn := (fun _k -> pure Wire.Nil);
      fetch_user_rsa_key_pair_raw_fn := (fun _base -> pure (Wire.Keyword "public-key"));
      decrypt_private_key_crypt_fn :=
        (fun _password _encrypted_private_key ->
          error (ex_info "should-not-decrypt" []));
      expect_rejection (!verify_and_save_e2ee_password_from_server_fn "password")
        (fun e ->
          let data_code =
            match exn_code e with Some c -> c | None -> exn_message e
          in
          Fest.expect
          |> Fest.ok
               (List.mem data_code [ "db-sync/missing-field"; "missing-field" ]);
          eq (exn_field "field" e) (Some (Wire.Keyword "encrypted-private-key"));
          Fest.expect
          |> Fest.ok (exn_message e <> ":public-key is not ISeqable");
          reset_hooks ()));

  Fest.Promise.test "verify-and-save-e2ee-password-from-server-bypasses-cache-test"
    (fun () ->
      let cache_calls = ref 0 in
      let fetch_calls = ref 0 in
      let decrypt_calls = ref [] in
      let save_calls = ref [] in
      e2ee_base_fn := (fun () -> Some "https://example.com");
      get_user_rsa_key_pair_raw_fn :=
        (fun _base ->
          incr cache_calls;
          pure
            (kwm
               [ ("public-key", Wire.String "public-key-old");
                 ("encrypted-private-key", Wire.String "encrypted-private-key-old") ]));
      fetch_user_rsa_key_pair_raw_fn :=
        (fun _base ->
          incr fetch_calls;
          pure
            (kwm
               [ ("public-key", Wire.String "public-key-current");
                 ("encrypted-private-key", Wire.String "encrypted-private-key-current") ]));
      transit_read_fn := (fun value -> Wire.String value);
      decrypt_private_key_crypt_fn :=
        (fun password encrypted_private_key ->
          decrypt_calls := !decrypt_calls @ [ (password, encrypted_private_key) ];
          pure (Wire.Keyword "private-key"));
      save_e2ee_password_fn :=
        (fun password ->
          save_calls := !save_calls @ [ password ];
          pure ());
      promise_of_task
        (!verify_and_save_e2ee_password_from_server_fn "current-password")
      |> Js.Promise.then_ (fun private_key ->
             eq private_key (Wire.Keyword "private-key");
             eq !cache_calls 0;
             eq !fetch_calls 1;
             eq !decrypt_calls
               [ ("current-password", Wire.String "encrypted-private-key-current") ];
             eq !save_calls [ "current-password" ];
             reset_hooks ();
             Js.Promise.resolve ()));

  Fest.Promise.test "ensure-user-rsa-keys-saves-new-ui-password-test" (fun () ->
      let upload_calls = ref [] in
      let save_calls = ref [] in
      e2ee_base_fn := (fun () -> Some "http://base");
      resolve_user_uuid_fn := (fun () -> pure (Some "user-1"));
      fetch_user_rsa_key_pair_raw_fn := (fun _base -> pure Wire.Nil);
      upload_user_rsa_key_pair_fn :=
        (fun base public_key encrypted_private_key ->
          upload_calls := !upload_calls @ [ (base, public_key, encrypted_private_key) ];
          pure
            (kwm
               [ ("public-key", Wire.String public_key);
                 ("encrypted-private-key", Wire.String encrypted_private_key) ]));
      save_e2ee_password_fn :=
        (fun password ->
          save_calls := !save_calls @ [ password ];
          pure ());
      platform_env_fn := (fun () -> env "browser" "");
      kv_get_fn := (fun _platform' _k -> pure Wire.Nil);
      kv_set_fn := (fun _platform' _k _value -> pure ());
      ui_request_fn :=
        (fun action payload ?hint:_ ?timeout_ms:_ () ->
          eq action (Wire.Keyword "request-e2ee-password");
          eq payload (kwm [ ("reason", Wire.Keyword "generate-user-rsa-key-pair") ]);
          pure (kwm [ ("password", Wire.String "new-password") ]));
      generate_rsa_key_pair_fn :=
        (fun () ->
          pure
            (kwm
               [ ("publicKey", Wire.Keyword "public-key");
                 ("privateKey", Wire.Keyword "private-key") ]));
      encrypt_private_key_fn :=
        (fun password private_key ->
          str_eq password "new-password";
          eq private_key (Wire.Keyword "private-key");
          pure (Wire.Keyword "encrypted-private-key"));
      export_public_key_fn :=
        (fun public_key ->
          eq public_key (Wire.Keyword "public-key");
          pure (Wire.Keyword "exported-public-key"));
      transit_write_fn := pr_str;
      promise_of_task (!ensure_user_rsa_keys_fn Wire.Nil)
      |> Js.Promise.then_ (fun result ->
             eq (Wire.get "password" result) (Some (Wire.String "new-password"));
             eq !upload_calls
               [ ("http://base", pr_str (Wire.Keyword "exported-public-key"),
                  pr_str (Wire.Keyword "encrypted-private-key")) ];
             eq !save_calls [ "new-password" ];
             reset_hooks ();
             Js.Promise.resolve ()));

  Fest.Promise.test
    "ensure-user-rsa-keys-deduplicates-concurrent-new-user-password-request-test" (fun () ->
      let ui_calls = ref 0 in
      let upload_calls = ref [] in
      let save_calls = ref [] in
      e2ee_base_fn := (fun () -> Some "http://base");
      resolve_user_uuid_fn := (fun () -> pure (Some "user-1"));
      fetch_user_rsa_key_pair_raw_fn := (fun _base -> delay_task 10 Wire.Nil);
      upload_user_rsa_key_pair_fn :=
        (fun base public_key encrypted_private_key ->
          upload_calls := !upload_calls @ [ (base, public_key, encrypted_private_key) ];
          pure
            (kwm
               [ ("public-key", Wire.String public_key);
                 ("encrypted-private-key", Wire.String encrypted_private_key) ]));
      save_e2ee_password_fn :=
        (fun password ->
          save_calls := !save_calls @ [ password ];
          pure ());
      platform_env_fn := (fun () -> env "browser" "");
      kv_get_fn := (fun _platform' _k -> pure Wire.Nil);
      kv_set_fn := (fun _platform' _k _value -> pure ());
      ui_request_fn :=
        (fun action payload ?hint:_ ?timeout_ms:_ () ->
          eq action (Wire.Keyword "request-e2ee-password");
          eq payload (kwm [ ("reason", Wire.Keyword "generate-user-rsa-key-pair") ]);
          incr ui_calls;
          pure (kwm [ ("password", Wire.String "new-password") ]));
      generate_rsa_key_pair_fn :=
        (fun () ->
          pure
            (kwm
               [ ("publicKey", Wire.Keyword "public-key");
                 ("privateKey", Wire.Keyword "private-key") ]));
      encrypt_private_key_fn :=
        (fun password private_key ->
          str_eq password "new-password";
          eq private_key (Wire.Keyword "private-key");
          pure (Wire.Keyword "encrypted-private-key"));
      export_public_key_fn :=
        (fun public_key ->
          eq public_key (Wire.Keyword "public-key");
          pure (Wire.Keyword "exported-public-key"));
      transit_write_fn := pr_str;
      let task1 = !ensure_user_rsa_keys_fn Wire.Nil in
      let task2 = !ensure_user_rsa_keys_fn Wire.Nil in
      promise_of_task (all [ task1; task2 ])
      |> Js.Promise.then_ (fun results ->
             eq (List.length results) 2;
             eq !ui_calls 1;
             eq (List.length !upload_calls) 1;
             eq !save_calls [ "new-password" ];
             reset_hooks ();
             Js.Promise.resolve ()));

  Fest.Promise.test "decrypt-private-key-headless-ignores-config-e2ee-password-test"
    (fun () ->
      db_sync_config_fn :=
        (fun () ->
          kwm
            [ ("e2ee-password", Wire.String "legacy-config-password");
              ("auth-token", Wire.String "legacy-auth-token") ]);
      stub_state ~refresh_token:None ~id_token:None ~access_token:None ();
      platform_env_fn := (fun () -> env "node" "cli");
      transit_read_fn := (fun _ -> Wire.Keyword "encrypted-private-key");
      decrypt_private_key_crypt_fn :=
        (fun _password _encrypted_private_key ->
          error (ex_info "should-not-use-config-password" []));
      ui_request_fn :=
        (fun _action _payload ?hint:_ ?timeout_ms:_ () ->
          error (ex_info "should-not-request-ui-in-headless" []));
      expect_rejection
        (!decrypt_private_key_fn (default_decrypt_private_key_opts ())
           "encrypted-private-key-str")
        (fun e ->
          Fest.expect |> Fest.ok (code_in_missing_or "code" e);
          reset_hooks ()));

  Fest.Promise.test
    "decrypt-private-key-browser-fallback-does-not-log-missing-persisted-password-test"
    (fun () ->
      let fail_calls = ref [] in
      let decrypt_calls = ref [] in
      let save_calls = ref [] in
      stub_state ~refresh_token:(Some "refresh-token") ~id_token:None
        ~access_token:None ();
      platform_env_fn := (fun () -> env "browser" "");
      secret_read_fn := (fun ~key:_ -> pure None);
      read_text_fn := (fun _path -> error (ex_info "should-not-read-browser-file" []));
      ui_request_fn :=
        (fun _action payload ?hint:_ ?timeout_ms:_ () ->
          eq payload (kwm [ ("reason", Wire.Keyword "decrypt-user-rsa-private-key") ]);
          pure (kwm [ ("password", Wire.String "ui-password") ]));
      fail_missing_e2ee_password_fn :=
        (fun data ->
          fail_calls := !fail_calls @ [ data ];
          raise (ex_info "missing-e2ee-password" (Wire.as_map (kwm data))));
      transit_read_fn := (fun _ -> Wire.Keyword "encrypted-private-key");
      decrypt_private_key_crypt_fn :=
        (fun password encrypted_private_key ->
          decrypt_calls := !decrypt_calls @ [ (password, encrypted_private_key) ];
          pure (Wire.Keyword "private-key"));
      encrypt_text_by_text_password_fn :=
        (fun refresh_token password ->
          save_calls := !save_calls @ [ `Encrypt (refresh_token, password) ];
          pure (kwm [ ("cipher", Wire.String "password-payload") ]));
      secret_save_fn :=
        (fun ~key text ->
          save_calls := !save_calls @ [ `Save (key, text) ];
          pure ());
      promise_of_task
        (!decrypt_private_key_fn (default_decrypt_private_key_opts ())
           "encrypted-private-key-str")
      |> Js.Promise.then_ (fun private_key ->
             eq private_key (Wire.Keyword "private-key");
             eq !decrypt_calls
               [ ("ui-password", Wire.Keyword "encrypted-private-key") ];
             eq (List.length !save_calls) 2;
             eq !fail_calls [];
             reset_hooks ();
             Js.Promise.resolve ()));

  Fest.Promise.test
    "decrypt-private-key-capacitor-missing-native-secret-prompts-and-saves-test" (fun () ->
      let fail_calls = ref [] in
      let decrypt_calls = ref [] in
      let ui_calls = ref [] in
      let save_calls = ref [] in
      stub_state ~refresh_token:(Some "refresh-token") ~id_token:None
        ~access_token:None ();
      platform_env_fn := (fun () -> env "browser" "capacitor");
      secret_read_fn := (fun ~key:_ -> error (ex_info "should-not-read-worker-secret" []));
      secret_save_fn :=
        (fun ~key:_ _text -> error (ex_info "should-not-save-worker-secret" []));
      read_text_fn := (fun _path -> error (ex_info "should-not-read-browser-file" []));
      ui_request_fn :=
        (fun action payload ?hint:_ ?timeout_ms:_ () ->
          ui_calls := !ui_calls @ [ (action, payload) ];
          match action with
          | Wire.Keyword "native-get-e2ee-password" ->
              pure
                (kwm [ ("supported?", Wire.Bool true); ("encrypted-text", Wire.Nil) ])
          | Wire.Keyword "request-e2ee-password" ->
              pure (kwm [ ("password", Wire.String "ui-password") ])
          | Wire.Keyword "native-save-e2ee-password" ->
              save_calls := !save_calls @ [ payload ];
              pure (kwm [ ("supported?", Wire.Bool true) ])
          | _ -> error (ex_info "unexpected-action" []));
      fail_missing_e2ee_password_fn :=
        (fun data ->
          fail_calls := !fail_calls @ [ data ];
          raise (ex_info "missing-e2ee-password" (Wire.as_map (kwm data))));
      transit_read_fn := (fun _ -> Wire.Keyword "encrypted-private-key");
      decrypt_private_key_crypt_fn :=
        (fun password encrypted_private_key ->
          decrypt_calls := !decrypt_calls @ [ (password, encrypted_private_key) ];
          pure (Wire.Keyword "private-key"));
      encrypt_text_by_text_password_fn :=
        (fun refresh_token password ->
          pure
            (kwm
               [ ("cipher", Wire.Array [ Wire.String refresh_token; Wire.String password ]) ]));
      transit_write_fn := pr_str;
      promise_of_task
        (!decrypt_private_key_fn (default_decrypt_private_key_opts ())
           "encrypted-private-key-str")
      |> Js.Promise.then_ (fun private_key ->
             eq private_key (Wire.Keyword "private-key");
             eq !ui_calls
               [ ( Wire.Keyword "native-get-e2ee-password",
                   kwm [ ("key", Wire.String "logseq-encrypted-password") ] );
                 ( Wire.Keyword "request-e2ee-password",
                   kwm [ ("reason", Wire.Keyword "decrypt-user-rsa-private-key") ] );
                 ( Wire.Keyword "native-save-e2ee-password",
                   kwm
                     [ ("key", Wire.String "logseq-encrypted-password");
                       ( "encrypted-text",
                         Wire.String
                           (pr_str
                              (kwm
                                 [ ( "cipher",
                                     Wire.Array
                                       [ Wire.String "refresh-token";
                                         Wire.String "ui-password" ] ) ])) ) ] ) ];
             eq !decrypt_calls
               [ ("ui-password", Wire.Keyword "encrypted-private-key") ];
             eq !save_calls
               [ kwm
                   [ ("key", Wire.String "logseq-encrypted-password");
                     ( "encrypted-text",
                       Wire.String
                         (pr_str
                            (kwm
                               [ ( "cipher",
                                   Wire.Array
                                     [ Wire.String "refresh-token";
                                       Wire.String "ui-password" ] ) ])) ) ] ];
             eq !fail_calls [];
             reset_hooks ();
             Js.Promise.resolve ()));

  Fest.Promise.test "decrypt-private-key-capacitor-wrong-ui-password-prompts-once-test"
    (fun () ->
      let ui_calls = ref [] in
      let save_calls = ref [] in
      stub_state ~refresh_token:(Some "refresh-token") ~id_token:None
        ~access_token:None ();
      platform_env_fn := (fun () -> env "browser" "capacitor");
      ui_request_fn :=
        (fun action payload ?hint:_ ?timeout_ms:_ () ->
          ui_calls := !ui_calls @ [ (action, payload) ];
          match action with
          | Wire.Keyword "native-get-e2ee-password" ->
              pure
                (kwm [ ("supported?", Wire.Bool true); ("encrypted-text", Wire.Nil) ])
          | Wire.Keyword "request-e2ee-password" ->
              pure (kwm [ ("password", Wire.String "wrong-password") ])
          | Wire.Keyword "native-save-e2ee-password" ->
              save_calls := !save_calls @ [ payload ];
              pure (kwm [ ("supported?", Wire.Bool true) ])
          | _ -> error (ex_info "unexpected-action" []));
      transit_read_fn := (fun _ -> Wire.Keyword "encrypted-private-key");
      decrypt_private_key_crypt_fn :=
        (fun _password _encrypted_private_key ->
          error (ex_info "decrypt-private-key" []));
      encrypt_text_by_text_password_fn :=
        (fun _refresh_token _password ->
          pure (kwm [ ("cipher", Wire.String "should-not-save") ]));
      expect_rejection
        (!decrypt_private_key_fn (default_decrypt_private_key_opts ())
           "encrypted-private-key-str")
        (fun e ->
          str_eq (exn_message e) "decrypt-private-key";
          eq !ui_calls
            [ ( Wire.Keyword "native-get-e2ee-password",
                kwm [ ("key", Wire.String "logseq-encrypted-password") ] );
              ( Wire.Keyword "request-e2ee-password",
                kwm [ ("reason", Wire.Keyword "decrypt-user-rsa-private-key") ] ) ];
          eq !save_calls [];
          reset_hooks ()));

  Fest.Promise.test "preflight-upload-does-not-retry-rejected-password-request-test"
    (fun () ->
      let get_pair_calls = ref 0 in
      let clear_cache_calls = ref 0 in
      let ui_calls = ref [] in
      stub_state ~refresh_token:(Some "current-refresh-token") ~id_token:None
        ~access_token:None ();
      e2ee_base_fn := (fun () -> Some "https://sync.example.test");
      resolve_user_uuid_fn := (fun () -> pure (Some "user-1"));
      get_user_rsa_key_pair_raw_fn :=
        (fun _base ->
          incr get_pair_calls;
          pure
            (kwm
               [ ("public-key", Wire.String "public-key");
                 ("encrypted-private-key", Wire.String "encrypted-private-key") ]));
      clear_user_rsa_key_pair_cache_fn :=
        (fun _base _user_id ->
          incr clear_cache_calls;
          pure ());
      import_public_key_fn := (fun _public_key -> pure (Wire.Keyword "public-key"));
      platform_env_fn := (fun () -> env "node" "electron");
      secret_read_fn := (fun ~key:_ -> pure (Some "stored-password"));
      transit_read_fn := (fun v -> Wire.String v);
      decrypt_text_by_text_password_fn :=
        (fun _refresh_token _data ->
          error (ex_info "decrypt-text-by-text-password" []));
      ui_request_fn :=
        (fun action payload ?hint:_ ?timeout_ms:_ () ->
          ui_calls := !ui_calls @ [ (action, payload) ];
          error
            (ex_info "cancelled"
               [ (Wire.Keyword "code", kw "ui-request-rejected") ]));
      expect_rejection (!preflight_upload_e2ee_fn "logseq_db_demo" true) (fun e ->
          eq (exn_code e) (Some "ui-request-rejected");
          eq !get_pair_calls 1;
          eq !clear_cache_calls 0;
          eq !ui_calls
            [ ( Wire.Keyword "request-e2ee-password",
                kwm [ ("reason", Wire.Keyword "decrypt-user-rsa-private-key") ] ) ];
          reset_hooks ()));

  Fest.Promise.test "preflight-upload-reuses-invalid-ui-password-after-cache-refresh-test"
    (fun () ->
      let get_pair_calls = ref 0 in
      let clear_cache_calls = ref 0 in
        let ui_calls = ref [] in
      stub_state ~refresh_token:(Some "current-refresh-token") ~id_token:None
        ~access_token:None ();
      e2ee_base_fn := (fun () -> Some "https://sync.example.test");
      resolve_user_uuid_fn := (fun () -> pure (Some "user-1"));
      get_user_rsa_key_pair_raw_fn :=
        (fun _base ->
          incr get_pair_calls;
          pure
            (kwm
               [ ("public-key", Wire.String "public-key");
                 ("encrypted-private-key", Wire.String "encrypted-private-key") ]));
      clear_user_rsa_key_pair_cache_fn :=
        (fun _base _user_id ->
          incr clear_cache_calls;
          pure ());
      import_public_key_fn := (fun _public_key -> pure (Wire.Keyword "public-key"));
      platform_env_fn := (fun () -> env "node" "electron");
      secret_read_fn := (fun ~key:_ -> pure (Some "stored-password"));
      transit_read_fn := (fun v -> Wire.String v);
      decrypt_text_by_text_password_fn :=
        (fun _refresh_token _data ->
          error (ex_info "decrypt-text-by-text-password" []));
      decrypt_private_key_crypt_fn :=
        (fun _password _encrypted_private_key ->
          error
            (ex_info "decrypt-private-key"
               [ (Wire.Keyword "invalid-password?", Wire.Bool true) ]));
      ui_request_fn :=
        (fun action payload ?hint:_ ?timeout_ms:_ () ->
          ui_calls := !ui_calls @ [ (action, payload) ];
          pure (kwm [ ("password", Wire.String "wrong-password") ]));
      expect_rejection (!preflight_upload_e2ee_fn "logseq_db_demo" true) (fun e ->
          eq (exn_code e) (Some "db-sync/invalid-e2ee-password");
          eq !get_pair_calls 2;
          eq !clear_cache_calls 1;
          eq !ui_calls
            [ ( Wire.Keyword "request-e2ee-password",
                kwm [ ("reason", Wire.Keyword "decrypt-user-rsa-private-key") ] ) ];
          reset_hooks ()));

  Fest.Promise.test "preflight-upload-reuses-ui-password-with-refreshed-rsa-key-test"
    (fun () ->
      let get_pair_calls = ref 0 in
      let ui_calls = ref [] in
      let save_calls = ref [] in
      stub_state ~refresh_token:(Some "current-refresh-token") ~id_token:None
        ~access_token:None ();
      e2ee_base_fn := (fun () -> Some "https://sync.example.test");
      resolve_user_uuid_fn := (fun () -> pure (Some "user-1"));
      get_user_rsa_key_pair_raw_fn :=
        (fun _base ->
          incr get_pair_calls;
          let call = !get_pair_calls in
          pure
            (kwm
               [ ("public-key", Wire.String (Printf.sprintf "public-key-%d" call));
                 ( "encrypted-private-key",
                   Wire.String
                     (if call = 1 then "encrypted-private-key-old"
                      else "encrypted-private-key-current") ) ]));
      clear_user_rsa_key_pair_cache_fn := (fun _base _user_id -> pure ());
      import_public_key_fn := (fun public_key -> pure (Wire.String public_key));
      save_e2ee_password_fn :=
        (fun password ->
          save_calls := !save_calls @ [ password ];
          pure ());
      platform_env_fn := (fun () -> env "node" "electron");
      secret_read_fn := (fun ~key:_ -> pure (Some "stored-password"));
      transit_read_fn := (fun v -> Wire.String v);
      decrypt_text_by_text_password_fn :=
        (fun _refresh_token _data ->
          error (ex_info "decrypt-text-by-text-password" []));
      decrypt_private_key_crypt_fn :=
        (fun password encrypted_private_key ->
          match password, encrypted_private_key with
          | "current-password", Wire.String "encrypted-private-key-current" ->
              pure (Wire.Keyword "private-key-current")
          | _ ->
              error
                (ex_info "decrypt-private-key"
                   [ (Wire.Keyword "invalid-password?", Wire.Bool true) ]));
      ui_request_fn :=
        (fun action payload ?hint:_ ?timeout_ms:_ () ->
          ui_calls := !ui_calls @ [ (action, payload) ];
          pure (kwm [ ("password", Wire.String "current-password") ]));
      promise_of_task (!preflight_upload_e2ee_fn "logseq_db_demo" true)
      |> Js.Promise.then_ (fun _result ->
             eq !get_pair_calls 2;
             eq !ui_calls
               [ ( Wire.Keyword "request-e2ee-password",
                   kwm [ ("reason", Wire.Keyword "decrypt-user-rsa-private-key") ] ) ];
             eq !save_calls [ "current-password" ];
             reset_hooks ();
             Js.Promise.resolve ()));

  Fest.Promise.test
    "preflight-upload-does-not-save-unverified-ui-password-after-cache-refresh-test"
    (fun () ->
      let get_pair_calls = ref 0 in
      let clear_cache_calls = ref 0 in
      let ui_calls = ref [] in
      let save_calls = ref [] in
      stub_state ~refresh_token:(Some "current-refresh-token") ~id_token:None
        ~access_token:None ();
      e2ee_base_fn := (fun () -> Some "https://sync.example.test");
      resolve_user_uuid_fn := (fun () -> pure (Some "user-1"));
      get_user_rsa_key_pair_raw_fn :=
        (fun _base ->
          incr get_pair_calls;
          let call = !get_pair_calls in
          pure
            (kwm
               [ ("public-key", Wire.String (Printf.sprintf "public-key-%d" call));
                 ( "encrypted-private-key",
                   Wire.String
                     (if call = 1 then "encrypted-private-key-old"
                      else "encrypted-private-key-current") ) ]));
      clear_user_rsa_key_pair_cache_fn :=
        (fun _base _user_id ->
          incr clear_cache_calls;
          pure ());
      import_public_key_fn := (fun public_key -> pure (Wire.String public_key));
      save_e2ee_password_fn :=
        (fun password ->
          save_calls := !save_calls @ [ password ];
          pure ());
      platform_env_fn := (fun () -> env "node" "electron");
      secret_read_fn := (fun ~key:_ -> pure (Some "stored-password"));
      transit_read_fn := (fun v -> Wire.String v);
      decrypt_text_by_text_password_fn :=
        (fun _refresh_token _data -> pure "persisted-password");
      decrypt_private_key_crypt_fn :=
        (fun password encrypted_private_key ->
          match password, encrypted_private_key with
          | "persisted-password", Wire.String "encrypted-private-key-current" ->
              pure (Wire.Keyword "private-key-current")
          | _ ->
              error
                (ex_info "decrypt-private-key"
                   [ (Wire.Keyword "invalid-password?", Wire.Bool true) ]));
      ui_request_fn :=
        (fun action payload ?hint:_ ?timeout_ms:_ () ->
          ui_calls := !ui_calls @ [ (action, payload) ];
          pure (kwm [ ("password", Wire.String "wrong-password") ]));
      expect_rejection (!preflight_upload_e2ee_fn "logseq_db_demo" true) (fun e ->
          eq (exn_code e) (Some "db-sync/invalid-e2ee-password");
          eq !get_pair_calls 2;
          eq !clear_cache_calls 1;
          eq !ui_calls
            [ ( Wire.Keyword "request-e2ee-password",
                kwm [ ("reason", Wire.Keyword "decrypt-user-rsa-private-key") ] ) ];
          eq !save_calls [];
          reset_hooks ()));

  Fest.Promise.test "ensure-graph-aes-key-uses-platform-kv-adapters-test" (fun () ->
      let graph_id = "graph-kv-adapters" in
      let expected_key = "rtc-encrypted-aes-key###" ^ graph_id in
      let platform_map = env "test" "" in
      let current_calls = ref 0 in
      let kv_get_calls = ref [] in
      let kv_set_calls = ref [] in
      stub_state ~refresh_token:None ~id_token:(Some "token") ~access_token:None ();
      graph_e2ee_fn := (fun _repo -> Some (Datascript.Bool true));
      e2ee_base_fn := (fun () -> Some "https://example.com");
      parse_jwt_fn := (fun _ -> kwm [ ("sub", Wire.String "user-1") ]);
      decrypt_private_key_fn :=
        (fun _opts _s -> pure (Wire.Keyword "private-key"));
      import_public_key_crypt_fn := (fun _ -> pure (Wire.Keyword "public-key"));
      decrypt_aes_key_fn :=
        (fun _private_key encrypted ->
          pure (Wire.String ("aes:" ^ raw_binary encrypted)));
      transit_read_fn := (fun value -> Wire.String value);
      platform_env_fn :=
        (fun () ->
          incr current_calls;
          platform_map);
      kv_get_fn :=
        (fun platform' k ->
          kv_get_calls := !kv_get_calls @ [ (platform', k) ];
          pure Wire.Nil);
      kv_set_fn :=
        (fun platform' k value ->
          kv_set_calls := !kv_set_calls @ [ (platform', k, value) ];
          pure ());
      http_send_fn :=
        (fun (req : Http.request) ->
          if contains req.url "/e2ee/user-keys" then
            pure
              { Http.status = 200;
                headers = [];
                body =
                  "{\"public-key\":\"public-key\",\"encrypted-private-key\":\"encrypted-private-key\"}"
              }
          else if contains req.url ("/e2ee/graphs/" ^ graph_id ^ "/aes-key") then
            pure
              { Http.status = 200;
                headers = [];
                body = "{\"encrypted-aes-key\":\"remote-encrypted\"}"
              }
          else
            pure { Http.status = 404; headers = []; body = "{\"message\":\"not-found\"}" });
      promise_of_task (!ensure_graph_aes_key_fn "repo-1" (Some graph_id))
      |> Js.Promise.then_ (fun aes_key ->
             eq aes_key (Some (Wire.String "aes:remote-encrypted"));
             Fest.expect
             |> Fest.ok
                  (List.exists
                     (fun (p, k) -> p = platform_map && k = expected_key)
                     !kv_get_calls);
             Fest.expect
             |> Fest.ok
                  (List.exists
                     (fun (p, k, v) ->
                       p = platform_map && k = expected_key
                       && v = Wire.String "remote-encrypted")
                     !kv_set_calls);
             Fest.expect |> Fest.ok (!current_calls > 0);
             reset_hooks ();
             Js.Promise.resolve ()));

  Fest.Promise.test "fetch-graph-aes-key-for-download-uses-platform-kv-clear-test"
    (fun () ->
      let graph_id = "graph-kv-clear" in
      let expected_key = "rtc-encrypted-aes-key###" ^ graph_id in
      let platform_map = env "test" "" in
      let kv_set_calls = ref [] in
      stub_state ~refresh_token:None ~id_token:(Some "token") ~access_token:None ();
      e2ee_base_fn := (fun () -> Some "https://example.com");
      parse_jwt_fn := (fun _ -> kwm [ ("sub", Wire.String "user-1") ]);
      decrypt_private_key_fn := (fun _opts _s -> pure (Wire.Keyword "private-key"));
      decrypt_aes_key_fn :=
        (fun _private_key encrypted ->
          pure (Wire.String ("aes:" ^ raw_binary encrypted)));
      transit_read_fn := (fun value -> Wire.String value);
      platform_env_fn := (fun () -> platform_map);
      kv_get_fn := (fun _platform' _k -> pure Wire.Nil);
      kv_set_fn :=
        (fun platform' k value ->
          kv_set_calls := !kv_set_calls @ [ (platform', k, value) ];
          pure ());
      http_send_fn :=
        (fun (req : Http.request) ->
          if contains req.url "/e2ee/user-keys" then
            pure
              { Http.status = 200;
                headers = [];
                body =
                  "{\"public-key\":\"public-key\",\"encrypted-private-key\":\"encrypted-private-key\"}"
              }
          else if contains req.url ("/e2ee/graphs/" ^ graph_id ^ "/aes-key") then
            pure
              { Http.status = 200;
                headers = [];
                body = "{\"encrypted-aes-key\":\"remote-encrypted\"}"
              }
          else
            pure { Http.status = 404; headers = []; body = "{\"message\":\"not-found\"}" });
      promise_of_task (!fetch_graph_aes_key_for_download_fn (Some graph_id))
      |> Js.Promise.then_ (fun aes_key ->
             eq aes_key (Wire.String "aes:remote-encrypted");
             eq
               (List.filter (fun (_p, k, _v) -> k = expected_key) !kv_set_calls)
               [ (platform_map, expected_key, Wire.Nil);
                 (platform_map, expected_key, Wire.String "remote-encrypted") ];
             reset_hooks ();
             Js.Promise.resolve ()));

  let encrypt_text_for_snapshot aes_key value =
    map transit_write (!encrypt_text_fn aes_key (transit_write value))
  in

  Fest.Promise.test "decrypt-snapshot-datoms-test" (fun () ->
      decrypt_snapshot_datoms_batch_fn := decrypt_snapshot_datoms_batch_impl;
      bind (!generate_aes_key_fn ()) (fun aes_key ->
          bind
            (all
               [ encrypt_text_for_snapshot aes_key (Wire.String "Title");
                 encrypt_text_for_snapshot aes_key (Wire.String "name") ])
            (fun encrypted ->
              let encrypted_title = List.nth encrypted 0
              and encrypted_name = List.nth encrypted 1 in
              let datoms =
                Wire.Array
                  [ kwm
                      [ ("e", Wire.Int 1); ("a", Wire.Keyword "block/title");
                        ("v", Wire.String encrypted_title); ("tx", Wire.Int 1000);
                        ("added", Wire.Bool true) ];
                    kwm
                      [ ("e", Wire.Int 1); ("a", Wire.Keyword "block/name");
                        ("v", Wire.String encrypted_name); ("tx", Wire.Int 1000);
                        ("added", Wire.Bool true) ] ]
              in
              map
                (fun decrypted ->
                  let rows = Wire.as_seq decrypted in
                  eq (Wire.get "v" (List.nth rows 0)) (Some (Wire.String "Title"));
                  eq (Wire.get "v" (List.nth rows 1)) (Some (Wire.String "name"));
                  reset_hooks ())
                (!decrypt_snapshot_datoms_batch_fn aes_key datoms)))
      |> promise_of_task
      |> Js.Promise.catch (fun _e ->
             Fest.expect |> Fest.ok false;
             Js.Promise.resolve ()));

  Fest.Promise.test "decrypt-snapshot-rows-test" (fun () ->
      bind (!generate_aes_key_fn ()) (fun aes_key ->
          bind
            (all
               [ encrypt_text_for_snapshot aes_key (Wire.String "Title");
                 encrypt_text_for_snapshot aes_key (Wire.String "name") ])
            (fun encrypted ->
              let encrypted_title = List.nth encrypted 0
              and encrypted_name = List.nth encrypted 1 in
              let raw_content =
                transit_write
                  (kwm
                     [ ( "keys",
                         Wire.Array
                           [ Wire.Array
                               [ Wire.Int 1; Wire.Keyword "block/title";
                                 Wire.String encrypted_title; Wire.Int 1000 ];
                             Wire.Array
                               [ Wire.Int 1; Wire.Keyword "block/title";
                                 Wire.String encrypted_name; Wire.Int 1000 ] ] ) ])
              in
              let rows =
                Wire.Array
                  [ Wire.Array
                      [ Wire.String "addr-1"; Wire.String raw_content; Wire.Nil ] ]
              in
              map
                (fun decrypted ->
                  match Wire.as_seq decrypted with
                  | [ row ] ->
                      (match Wire.as_seq row with
                       | [ _addr; decrypted_content; _addrs ] ->
                           let keys =
                             match decrypted_content with
                             | Wire.String s ->
                                 Option.value
                                   (Wire.get "keys" (transit_read s))
                                   ~default:Wire.Nil
                             | _ -> Wire.Nil
                           in
                           (match Wire.as_seq keys with
                            | [ k1; k2 ] ->
                                eq (List.nth (Wire.as_seq k1) 2)
                                  (Wire.String "Title");
                                eq (List.nth (Wire.as_seq k2) 2)
                                  (Wire.String "name")
                            | _ -> Fest.expect |> Fest.ok false)
                       | _ -> Fest.expect |> Fest.ok false)
                  | _ -> Fest.expect |> Fest.ok false;
                  reset_hooks ())
                (!decrypt_snapshot_rows_batch_fn aes_key rows)))
      |> promise_of_task
      |> Js.Promise.catch (fun _e ->
             Fest.expect |> Fest.ok false;
             Js.Promise.resolve ()));

  Fest.Promise.test "fetch-graph-aes-key-for-download-retries-with-fresh-rsa-key-pair-test"
    (fun () ->
      let clear_user_rsa_cache_calls = ref 0 in
      let get_pair_calls = ref 0 in
      e2ee_base_fn := (fun () -> Some "https://sync.example.test");
      get_user_uuid_fn := (fun () -> Some "user-1");
      clear_item_fn := (fun _ -> pure ());
      set_item_fn := (fun _ _ -> pure ());
      clear_user_rsa_key_pair_cache_fn :=
        (fun _base _user_id ->
          incr clear_user_rsa_cache_calls;
          pure ());
      get_user_rsa_key_pair_raw_fn :=
        (fun _base ->
          incr get_pair_calls;
          if !get_pair_calls = 1 then
            pure
              (kwm
                 [ ("public-key", Wire.String "pk-old");
                   ("encrypted-private-key", Wire.String "enc-old") ])
          else
            pure
              (kwm
                 [ ("public-key", Wire.String "pk-new");
                   ("encrypted-private-key", Wire.String "enc-new") ]));
      decrypt_private_key_fn :=
        (fun _opts encrypted_private_key ->
          pure
            (match encrypted_private_key with
             | "enc-old" -> Wire.Keyword "private-key-old"
             | "enc-new" -> Wire.Keyword "private-key-new"
             | _ -> Wire.Keyword "private-key-unknown"));
      fetch_graph_encrypted_aes_key_raw_fn :=
        (fun _base _graph_id ->
          pure
            (kwm
               [ ( "encrypted-aes-key",
                   Wire.String (transit_write (Wire.String "encrypted-aes")) ) ]));
      decrypt_aes_key_fn :=
        (fun private_key encrypted_aes_key ->
          match private_key with
          | Wire.Keyword "private-key-old" ->
              error (ex_info "decrypt-aes-key" [])
          | _ ->
              pure (Wire.Array [ Wire.Keyword "aes-key"; private_key; encrypted_aes_key ]));
      promise_of_task (!fetch_graph_aes_key_for_download_fn (Some "graph-1"))
      |> Js.Promise.then_ (fun result ->
             eq result
               (Wire.Array
                  [ Wire.Keyword "aes-key"; Wire.Keyword "private-key-new";
                    Wire.String "encrypted-aes" ]);
             eq !clear_user_rsa_cache_calls 1;
             eq !get_pair_calls 2;
             reset_hooks ();
             Js.Promise.resolve ()));

  Fest.Promise.test "fetch-graph-aes-key-for-download-rethrows-without-user-id-test"
    (fun () ->
      let clear_user_rsa_cache_calls = ref 0 in
      e2ee_base_fn := (fun () -> Some "https://sync.example.test");
      get_user_uuid_fn := (fun () -> None);
      clear_item_fn := (fun _ -> pure ());
      set_item_fn := (fun _ _ -> pure ());
      clear_user_rsa_key_pair_cache_fn :=
        (fun _base _user_id ->
          incr clear_user_rsa_cache_calls;
          pure ());
      get_user_rsa_key_pair_raw_fn :=
        (fun _base ->
          pure
            (kwm
               [ ("public-key", Wire.String "pk-old");
                 ("encrypted-private-key", Wire.String "enc-old") ]));
      decrypt_private_key_fn :=
        (fun _opts _ -> pure (Wire.Keyword "private-key-old"));
      fetch_graph_encrypted_aes_key_raw_fn :=
        (fun _base _graph_id ->
          pure
            (kwm
               [ ( "encrypted-aes-key",
                   Wire.String (transit_write (Wire.String "encrypted-aes")) ) ]));
      decrypt_aes_key_fn := (fun _ _ -> error (ex_info "decrypt-aes-key" []));
      expect_rejection (!fetch_graph_aes_key_for_download_fn (Some "graph-1"))
        (fun e ->
          str_eq (exn_message e) "decrypt-aes-key";
          eq !clear_user_rsa_cache_calls 0;
          reset_hooks ()));

  Fest.Promise.test "user-rsa-key-pair-cache-is-scoped-by-server-test" (fun () ->
      let kv_store : (string, Wire.t) Hashtbl.t = Hashtbl.create 7 in
      platform_env_fn := (fun () -> env "node" "electron");
      kv_get_fn :=
        (fun _platform' k ->
          pure (Option.value (Hashtbl.find_opt kv_store k) ~default:Wire.Nil));
      kv_set_fn :=
        (fun _platform' k v ->
          (match v with
           | Wire.Nil -> Hashtbl.remove kv_store k
           | _ -> Hashtbl.replace kv_store k v);
          pure ());
      let pair_a =
        kwm
          [ ("public-key", Wire.String "pk-a");
            ("encrypted-private-key", Wire.String "enc-a") ]
      and pair_b =
        kwm
          [ ("public-key", Wire.String "pk-b");
            ("encrypted-private-key", Wire.String "enc-b") ]
      in
      promise_of_task
        (let* _ =
           !set_user_rsa_key_pair_to_idb_fn (Some "https://server-a.example")
             (Some "user-1") pair_a
         and* _ =
           !set_user_rsa_key_pair_to_idb_fn (Some "https://server-b.example")
             (Some "user-1") pair_b
         in
         let* cached_a =
           !get_user_rsa_key_pair_from_idb_fn (Some "https://server-a.example")
             (Some "user-1")
         in
         let* cached_b =
           !get_user_rsa_key_pair_from_idb_fn (Some "https://server-b.example")
             (Some "user-1")
         in
         let* cached_c =
           !get_user_rsa_key_pair_from_idb_fn (Some "https://server-c.example")
             (Some "user-1")
         in
         eq
           (Option.bind cached_a (fun p -> Wire.get "public-key" p))
           (Some (Wire.String "pk-a"));
         eq
           (Option.bind cached_b (fun p -> Wire.get "public-key" p))
           (Some (Wire.String "pk-b"));
         eq cached_c None;
         let* () =
           !clear_user_rsa_key_pair_cache_fn (Some "https://server-a.example")
             (Some "user-1")
         in
         let* cleared =
           !get_user_rsa_key_pair_from_idb_fn (Some "https://server-a.example")
             (Some "user-1")
         in
         let* intact =
           !get_user_rsa_key_pair_from_idb_fn (Some "https://server-b.example")
             (Some "user-1")
         in
         eq cleared None;
         eq
           (Option.bind intact (fun p -> Wire.get "public-key" p))
           (Some (Wire.String "pk-b"));
         pure ())
      |> Js.Promise.then_ (fun _ ->
             reset_hooks ();
             Js.Promise.resolve ())
      |> Js.Promise.catch (fun _e ->
             Fest.expect |> Fest.ok false;
             Js.Promise.resolve ()));

  Fest.Promise.test "decrypt-text-value-legacy-plaintext-test" (fun () ->
      promise_of_task
        (bind (!generate_aes_key_fn ()) (fun aes_key ->
             let plaintext = "$$$favorites" in
             bind (!encrypt_uint8array_fn aes_key plaintext) (fun encrypted ->
                 let encrypted_str = transit_write encrypted in
                 map
                   (fun decrypted -> eq decrypted (Wire.String plaintext))
                   (!decrypt_text_value_fn aes_key encrypted_str))))
      |> Js.Promise.then_ (fun _ ->
             reset_hooks ();
             Js.Promise.resolve ())
      |> Js.Promise.catch (fun _e ->
             Fest.expect |> Fest.ok false;
             Js.Promise.resolve ()))
