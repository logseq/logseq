(** JavaScript authorization boundary. *)

module Authorization = struct
  let verifyJwtDefault token expected_issuer expected_client_id jwks_url =
    Melange_common_runtime.Common_runtime.Authorization_runtime
    .verify_jwt_default token expected_issuer expected_client_id jwks_url
    |> Js.Promise.then_ (fun payload ->
        payload |> Js.Nullable.fromOption |> Js.Promise.resolve)
end
