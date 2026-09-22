(* thread-api registrations for worker.sync.crypt (and the
   worker.handler.sync crypt endpoints that call into it).

   Registered here (see Sync_crypt.init for the counterpart hook):
   - thread-api/get-user-rsa-key-pair [token user-uuid]
   - thread-api/init-user-rsa-key-pair [token refresh-token user-uuid]
   - thread-api/reset-user-rsa-key-pair [token refresh-token user-uuid new-password]
   - thread-api/change-e2ee-password [token refresh-token user-uuid old-password new-password]
   - thread-api/verify-and-save-e2ee-password [refresh-token password]
   - thread-api/get-e2ee-password [refresh-token]
   - thread-api/save-e2ee-password [password]
   - thread-api/clear-e2ee-password []
   - thread-api/db-sync-grant-graph-access [repo graph-id target-email]
   - thread-api/db-sync-ensure-user-rsa-keys [& [opts]] *)

open Db_worker_effect
open Sync_crypt

let arg args n = List.nth_opt args n

let arg_str args n =
  match List.nth_opt args n with
  | Some w -> Wire.as_string w
  | None -> None

(* :thread-api/get-user-rsa-key-pair [_token _user-uuid] *)
let () =
  Dispatcher.register "thread-api/get-user-rsa-key-pair" (fun _args ->
      run (fun () ->
          match e2ee_base () with
          | Some base when seq_ (Some base) ->
              bind (!get_user_rsa_key_pair_raw_fn (Some base)) (fun pair ->
                  let truthy = function
                    | Some Wire.Nil | Some (Wire.Bool false) | None -> false
                    | Some _ -> true
                  in
                  match
                    Wire.get "public-key" pair, Wire.get "encrypted-private-key" pair
                  with
                  | pk, epk when truthy pk && truthy epk ->
                      pure
                        (Wire.kw_map
                           [ ("public-key", Option.get pk);
                             ("encrypted-private-key", Option.get epk) ])
                  | _ -> pure Wire.Nil)
          | _ ->
              fail_fast "db-sync/missing-field"
                (Wire.kw_map [ ("base", Wire.Nil) ])))

(* :thread-api/init-user-rsa-key-pair [_token _refresh-token _user-uuid] *)
let () =
  Dispatcher.register "thread-api/init-user-rsa-key-pair" (fun _args ->
      run (fun () ->
          match e2ee_base () with
          | Some base when seq_ (Some base) ->
              bind (!get_user_rsa_key_pair_raw_fn (Some base)) (fun existing ->
                  match
                    Wire.get "public-key" existing,
                    Wire.get "encrypted-private-key" existing
                  with
                  | Some (Wire.String _), Some (Wire.String _) -> pure Wire.Nil
                  | _ ->
                      bind (!generate_rsa_key_pair_fn ())
                        (fun kp ->
                          let field name =
                            match Wire.get name kp with
                            | Some v -> v
                            | None -> invalid_arg ("generate-rsa-key-pair: missing " ^ name)
                          in
                          bind
                            (!request_e2ee_password_from_ui_fn
                               (Wire.kw_map [ ("reason", kw "init-user-rsa-key-pair") ]))
                            (fun password ->
                              bind
                                (!encrypt_private_key_fn password (field "privateKey"))
                                (fun encrypted_private_key ->
                                  bind
                                    (!export_public_key_fn (field "publicKey"))
                                    (fun exported_public_key ->
                                      let public_key_str =
                                        transit_write exported_public_key
                                      in
                                      let encrypted_private_key_str =
                                        transit_write encrypted_private_key
                                      in
                                      bind
                                        (!upload_user_rsa_key_pair_fn base public_key_str
                                           encrypted_private_key_str)
                                        (fun _ ->
                                          bind
                                            (!save_e2ee_password_fn password)
                                            (fun () -> pure Wire.Nil)))))))
          | _ ->
              fail_fast "db-sync/missing-field"
                (Wire.kw_map [ ("base", Wire.Nil) ])))

(* :thread-api/reset-user-rsa-key-pair [_token _refresh-token _user-uuid new-password] *)
let () =
  Dispatcher.register "thread-api/reset-user-rsa-key-pair" (fun args ->
      let new_password = arg_str args 3 in
      run (fun () ->
          bind (!generate_rsa_key_pair_fn ()) (fun kp ->
              let field name =
                match Wire.get name kp with
                | Some v -> v
                | None -> invalid_arg ("generate-rsa-key-pair: missing " ^ name)
              in
              bind
                (!encrypt_private_key_fn (Option.get new_password) (field "privateKey"))
                (fun encrypted_private_key ->
                  bind (!export_public_key_fn (field "publicKey")) (fun exported_public_key ->
                      let public_key_str =
                        transit_write exported_public_key
                      in
                      let encrypted_private_key_str =
                        transit_write encrypted_private_key
                      in
                      match e2ee_base () with
                      | Some base when seq_ (Some base) ->
                          bind
                            (!upload_user_rsa_key_pair_fn base public_key_str
                               encrypted_private_key_str)
                            (fun _ ->
                              bind
                                (!save_e2ee_password_fn (Option.get new_password))
                                (fun () -> pure Wire.Nil))
                      | _ ->
                          fail_fast "db-sync/missing-field"
                            (Wire.kw_map [ ("base", Wire.Nil) ]))))))

(* :thread-api/change-e2ee-password
   [_token refresh-token user-uuid old-password new-password] *)
let () =
  Dispatcher.register "thread-api/change-e2ee-password" (fun args ->
      let refresh_token = arg_str args 1
      and user_uuid = arg_str args 2
      and old_password = arg_str args 3
      and new_password = arg_str args 4 in
      run (fun () ->
          map (fun () -> Wire.Nil)
            (!change_e2ee_password_fn refresh_token user_uuid
               (Option.get old_password) (Option.get new_password))))

(* :thread-api/verify-and-save-e2ee-password [_refresh-token password] *)
let () =
  Dispatcher.register "thread-api/verify-and-save-e2ee-password" (fun args ->
      let password = arg_str args 1 in
      run (fun () ->
          map (fun _ -> Wire.Nil)
            (!verify_and_save_e2ee_password_from_server_fn (Option.get password))))

(* :thread-api/get-e2ee-password [refresh-token] *)
let () =
  Dispatcher.register "thread-api/get-e2ee-password" (fun args ->
      let refresh_token = arg_str args 0 in
      run (fun () ->
          map
            (fun password -> Wire.kw_map [ ("password", str password) ])
            (!read_e2ee_password_fn refresh_token)))

(* :thread-api/save-e2ee-password [password] *)
let () =
  Dispatcher.register "thread-api/save-e2ee-password" (fun args ->
      let password = arg_str args 0 in
      run (fun () ->
          map (fun () -> Wire.Nil)
            (!save_e2ee_password_fn (Option.get password))))

(* :thread-api/clear-e2ee-password [] *)
let () =
  Dispatcher.register "thread-api/clear-e2ee-password" (fun _args ->
      run (fun () ->
          map (fun () -> Wire.Nil) (!clear_e2ee_password_fn ())))

(* :thread-api/db-sync-grant-graph-access [repo graph-id target-email]
   (worker.handler.sync — calls sync-crypt/<grant-graph-access!) *)
let () =
  Dispatcher.register "thread-api/db-sync-grant-graph-access" (fun args ->
      let repo = arg_str args 0
      and graph_id = arg_str args 1
      and target_email = arg_str args 2 in
      run (fun () ->
          map
            (fun () -> Wire.Nil)
            (!grant_graph_access_fn (Option.get repo) graph_id
               (Option.get target_email))))

(* :thread-api/db-sync-ensure-user-rsa-keys [& [opts]] *)
let () =
  Dispatcher.register "thread-api/db-sync-ensure-user-rsa-keys" (fun args ->
      let opts = match arg args 0 with Some w -> w | None -> Wire.Nil in
      run (fun () -> !ensure_user_rsa_keys_fn opts))
