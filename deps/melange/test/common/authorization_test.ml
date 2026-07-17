module Authorization = Melange_common.Authorization

module Fake_platform = struct
  type t = unit
  type payload = string
  type jwk = string * string option
  type crypto_key = string
  type bytes = string
  type header = { kid : string option }

  type claims = {
    payload : payload;
    issuer : string option;
    audience_present : bool;
    audience : string option;
    client_id : string option;
    expiration_seconds : float option;
  }

  let now_ms () = 20_000.
  let decode_header () _ = { kid = Some "key" }

  let decode_claims () _ =
    {
      payload = "payload";
      issuer = Some "issuer";
      audience_present = true;
      audience = Some "client";
      client_id = None;
      expiration_seconds = Some 1_001.;
    }

  let fetch_jwks () _ =
    Js.Promise.resolve (Rrbvec.singleton ("key", Some "key"))

  let jwk_kid () (_, kid) = kid
  let import_rsa_pkcs1_sha256 () (key, _) = Js.Promise.resolve key
  let utf8_encode () value = value
  let base64url_decode () value = value

  let verify_rsa_pkcs1_sha256 () _ ~data:_ ~signature:_ =
    Js.Promise.resolve true
end

module Authorization_workflow = Authorization.Make (Fake_platform)

let fail message =
  Fest.expect |> Fest.equal message "";
  failwith message

let expect_equal label actual expected =
  if actual <> expected then fail (label ^ ": unexpected value")

let expect_some label = function
  | Some value -> value
  | None -> fail (label ^ ": expected a value")

let () =
  Fest.test "authorization token structure preserves legacy split behavior"
    (fun () ->
      let parts =
        Authorization.split_token "header.payload.signature"
        |> expect_some "valid token"
      in
      expect_equal "header" (Authorization.header_part parts) "header";
      expect_equal "payload" (Authorization.payload_part parts) "payload";
      expect_equal "signature" (Authorization.signature_part parts) "signature";
      let empty_payload =
        Authorization.split_token "header..signature"
        |> expect_some "empty payload"
      in
      expect_equal "empty payload value"
        (Authorization.payload_part empty_payload)
        "";
      let empty_header =
        Authorization.split_token ".payload.signature"
        |> expect_some "empty header"
      in
      expect_equal "empty header value"
        (Authorization.header_part empty_header)
        "";
      expect_equal "too few parts"
        (Authorization.split_token "header.payload")
        None;
      expect_equal "too many parts" (Authorization.split_token "a.b.c.d") None;
      expect_equal "trailing empty part"
        (Authorization.split_token "header.payload.")
        None;
      expect_equal "empty token" (Authorization.split_token "") None);

  Fest.test "authorization claim validation preserves precedence and boundaries"
    (fun () ->
      let validate ?issuer ?audience ?client_id_claim ?expiration_seconds () =
        Authorization.validate_claims ~expected_issuer:"issuer"
          ~expected_client_id:"client" ~issuer
          ~audience_present:(Option.is_some audience) ~audience ~client_id_claim
          ~expiration_seconds ~now_seconds:1_000.
      in
      expect_equal "audience claim"
        (validate ~issuer:"issuer" ~audience:"client" ~client_id_claim:"ignored"
           ~expiration_seconds:1_001. ())
        (Ok ());
      expect_equal "client id claim fallback"
        (validate ~issuer:"issuer" ~client_id_claim:"client" ())
        (Ok ());
      expect_equal "missing expiration"
        (validate ~issuer:"issuer" ~audience:"client" ())
        (Ok ());
      expect_equal "expiration equal to now"
        (validate ~issuer:"issuer" ~audience:"client" ~expiration_seconds:1_000.
           ())
        (Ok ());
      expect_equal "issuer error wins"
        (validate ~issuer:"wrong" ~audience:"wrong" ~expiration_seconds:999. ())
        (Error Authorization.Invalid_issuer);
      expect_equal "missing issuer"
        (validate ~audience:"client" ())
        (Error Authorization.Invalid_issuer);
      expect_equal "audience error precedes expiration"
        (validate ~issuer:"issuer" ~audience:"wrong" ~expiration_seconds:999. ())
        (Error Authorization.Invalid_audience);
      expect_equal "empty audience is preferred over client id"
        (validate ~issuer:"issuer" ~audience:"" ~client_id_claim:"client" ())
        (Error Authorization.Invalid_audience);
      expect_equal "present non-string audience blocks client id fallback"
        (Authorization.validate_claims ~expected_issuer:"issuer"
           ~expected_client_id:"client" ~issuer:(Some "issuer")
           ~audience_present:true ~audience:None
           ~client_id_claim:(Some "client") ~expiration_seconds:None
           ~now_seconds:1_000.)
        (Error Authorization.Invalid_audience);
      expect_equal "missing audience and client id"
        (validate ~issuer:"issuer" ())
        (Error Authorization.Invalid_audience);
      expect_equal "expired"
        (validate ~issuer:"issuer" ~audience:"client" ~expiration_seconds:999.
           ())
        (Error Authorization.Expired);
      expect_equal "issuer error message"
        (Authorization.claim_error_message Authorization.Invalid_issuer)
        "iss not found";
      expect_equal "audience error message"
        (Authorization.claim_error_message Authorization.Invalid_audience)
        "aud not found";
      expect_equal "expiration error message"
        (Authorization.claim_error_message Authorization.Expired)
        "exp");

  Fest.test "authorization token cache decisions preserve strict TTL behavior"
    (fun () ->
      expect_equal "fresh cached token"
        (Authorization.is_cached_token_valid ~expiration_seconds:(Some 1_001.)
           ~now_seconds:1_000. ~cached_at_ms:10_000. ~now_ms:20_000.)
        true;
      expect_equal "expiration equal to now"
        (Authorization.is_cached_token_valid ~expiration_seconds:(Some 1_000.)
           ~now_seconds:1_000. ~cached_at_ms:10_000. ~now_ms:20_000.)
        false;
      expect_equal "missing expiration"
        (Authorization.is_cached_token_valid ~expiration_seconds:None
           ~now_seconds:1_000. ~cached_at_ms:10_000. ~now_ms:20_000.)
        false;
      expect_equal "exact token TTL"
        (Authorization.is_cached_token_valid ~expiration_seconds:(Some 10_000.)
           ~now_seconds:1_000. ~cached_at_ms:0. ~now_ms:3_600_000.)
        false;
      expect_equal "future cache timestamp"
        (Authorization.is_cached_token_valid ~expiration_seconds:(Some 1_001.)
           ~now_seconds:1_000. ~cached_at_ms:30_000. ~now_ms:20_000.)
        true;
      expect_equal "retain valid entry"
        (Authorization.should_retain_token_cache_entry
           ~expiration_seconds:(Some 1_001.) ~cached_at_ms:10_000.
           ~now_ms:20_000.)
        true;
      expect_equal "discard expiration equal to now"
        (Authorization.should_retain_token_cache_entry
           ~expiration_seconds:(Some 20.) ~cached_at_ms:10_000. ~now_ms:20_000.)
        false;
      expect_equal "discard exact TTL"
        (Authorization.should_retain_token_cache_entry
           ~expiration_seconds:(Some 10_000.) ~cached_at_ms:0.
           ~now_ms:3_600_000.)
        false;
      expect_equal "discard missing expiration"
        (Authorization.should_retain_token_cache_entry ~expiration_seconds:None
           ~cached_at_ms:0. ~now_ms:1.)
        false;
      expect_equal "token capacity" Authorization.token_capacity 200);

  Fest.test
    "authorization JWKS freshness preserves force and strict TTL behavior"
    (fun () ->
      expect_equal "fresh matching cache"
        (Authorization.is_jwks_cache_fresh ~force:false ~same_url:true
           ~has_keys:true ~fetched_at_ms:1_000. ~now_ms:2_000.)
        true;
      expect_equal "forced refresh"
        (Authorization.is_jwks_cache_fresh ~force:true ~same_url:true
           ~has_keys:true ~fetched_at_ms:1_000. ~now_ms:2_000.)
        false;
      expect_equal "different URL"
        (Authorization.is_jwks_cache_fresh ~force:false ~same_url:false
           ~has_keys:true ~fetched_at_ms:1_000. ~now_ms:2_000.)
        false;
      expect_equal "missing keys"
        (Authorization.is_jwks_cache_fresh ~force:false ~same_url:true
           ~has_keys:false ~fetched_at_ms:1_000. ~now_ms:2_000.)
        false;
      expect_equal "exact JWKS TTL"
        (Authorization.is_jwks_cache_fresh ~force:false ~same_url:true
           ~has_keys:true ~fetched_at_ms:0. ~now_ms:21_600_000.)
        false;
      expect_equal "future fetch timestamp"
        (Authorization.is_jwks_cache_fresh ~force:false ~same_url:true
           ~has_keys:true ~fetched_at_ms:3_000. ~now_ms:2_000.)
        true);

  Fest.test "authorization key selection preserves first-match and missing ids"
    (fun () ->
      let key_ids =
        [| Some "first"; Some "match"; Some "match" |] |> Rrbvec.of_array
      in
      expect_equal "first matching key"
        (Authorization.matching_key_index ~requested_kid:(Some "match") key_ids)
        (Some 1);
      expect_equal "missing key"
        (Authorization.matching_key_index ~requested_kid:(Some "missing")
           key_ids)
        None;
      expect_equal "missing id matches missing key id"
        (Authorization.matching_key_index ~requested_kid:None
           ([| Some "first"; None |] |> Rrbvec.of_array))
        (Some 1);
      expect_equal "empty keys"
        (Authorization.matching_key_index ~requested_kid:(Some "match")
           Rrbvec.empty)
        None);

  Fest.test "authorization cache state is explicit and isolated" (fun () ->
      let first = Authorization_workflow.create_state () in
      let second = Authorization_workflow.create_state () in
      Authorization_workflow.cache_token first ~token:"token" ~payload:"payload"
        ~expiration_seconds:1_001. ~current_ms:20_000.;
      expect_equal "cached in first state"
        (Authorization_workflow.cached_token first ~token:"token"
           ~now_seconds:1_000. ~current_ms:20_001.)
        (Some "payload");
      expect_equal "second state remains empty"
        (Authorization_workflow.cached_token second ~token:"token"
           ~now_seconds:1_000. ~current_ms:20_001.)
        None)
