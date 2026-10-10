(* Platform + worker-state seams extracted from sync_crypt.ml:
   cljs platform/{current,kv-get,kv-set!,secret,file,http,comm},
   ldb/{read,write}-transit-str, and the worker-state / ldb graph hooks
   the cljs tests stub through with-redefs. Each is a module-level
   [*_fn] ref defaulting to the real implementation; the single
   [Sync_crypt.reset_hooks] restores every default. *)

open Db_worker_effect

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
let db_sync_config_fn : (unit -> Wire.t) ref = ref Worker_state.db_sync_config

(* ---------- base64 (kv binary values are "b64:"-prefixed) ---------- *)

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
(* cljs platform/post-message! — browser posts on self; node routes to the
   embedder's broadcast fn via Broadcast.to_clients *)
let post_message_fn : (string -> unit) ref =
  ref (fun payload -> Broadcast.to_clients ~kind:"db-worker/ui-request" ~transit_payload:payload)

(* ---------- idb item wrappers ---------- *)

let get_item_impl k =
  assert (String.length (Unicode.trim k) > 0);
  !kv_get_fn (platform_env ()) k

let set_item_impl k v =
  assert (String.length (Unicode.trim k) > 0);
  !kv_set_fn (platform_env ()) k v

let clear_item_impl k =
  assert (String.length (Unicode.trim k) > 0);
  !kv_set_fn (platform_env ()) k Wire.Nil

let get_item_fn : (string -> Wire.t t) ref = ref get_item_impl
let set_item_fn : (string -> Wire.t -> unit t) ref = ref set_item_impl
let clear_item_fn : (string -> unit t) ref = ref clear_item_impl

let get_item k = !get_item_fn k
let set_item k v = !set_item_fn k v
let clear_item k = !clear_item_fn k

let graph_encrypted_aes_key_idb_key graph_id = "rtc-encrypted-aes-key###" ^ graph_id
let user_rsa_key_pair_idb_key base user_id = "rtc-user-rsa-key-pair###" ^ base ^ "###" ^ user_id
