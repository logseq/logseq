(* Native persistence, appearance state, navigation, and scheduling services.
   This library contains no browser runtime emulation. *)

(* ---------- host request channel ---------- *)

(* Requests the OCaml side needs the native host to perform. Serialized
   to JSON and passed through the platform-request wakeup. *)
let host_request : (string -> unit) ref = ref (fun _ -> ())

let request_host name payload = !host_request (name ^ "\n" ^ payload)

(* ---------- persisted ui state (localStorage equivalent) ---------- *)

let app_support_dir =
  let path =
    match Sys.getenv_opt "LOGSEQ_UI_STATE_DIR" with
    | Some path when path <> "" -> path
    | Some _ -> invalid_arg "LOGSEQ_UI_STATE_DIR must not be empty"
    | None ->
        Filename.concat
          (Filename.concat (Unix.getenv "HOME") "Library")
          "Application Support/logseq"
  in
  fun () -> path

let state_file () =
  Filename.concat (app_support_dir ()) "ui-state.json"

let ls : (string, string) Hashtbl.t = Hashtbl.create 64
let ls_loaded = ref false

let rec mkdir_p path =
  if path <> "" && path <> "/" && not (Sys.file_exists path) then begin
    mkdir_p (Filename.dirname path);
    try Unix.mkdir path 0o755 with _ -> ()
  end

let load_state () =
  if not !ls_loaded then begin
    ls_loaded := true;
    (try
       if Sys.file_exists (state_file ()) then
         let ic = open_in_bin (state_file ()) in
         let n = in_channel_length ic in
         let s = really_input_string ic n in
         close_in ic;
         match Yojson.Safe.from_string s with
         | `Assoc kvs ->
             List.iter
               (fun (k, v) ->
                 match v with
                 | `String v -> Hashtbl.replace ls k v
                 | _ -> ())
               kvs
         | _ -> ()
     with _ -> ())
  end

let save_state () =
  (try
     mkdir_p (app_support_dir ());
     let json =
       `Assoc
         (Hashtbl.fold (fun k v acc -> (k, `String v) :: acc) ls [])
     in
     let oc = open_out_bin (state_file ()) in
     output_string oc (Yojson.Safe.to_string json);
     close_out oc
   with _ -> ())

(* cljs storage.cljs reads with reader/read-string and writes pr-str,
   so cljs-stored strings appear double-quoted. Strip/add that quoting
   at the storage boundary. *)
let storage_unquote s =
  let len = String.length s in
  if len >= 2 && String.get s 0 = '"' && String.get s (len - 1) = '"' then
    String.sub s 1 (len - 2)
  else s

let storage_quote v = "\"" ^ v ^ "\""

(* the native window title is host-managed — the call is a no-op *)
let set_document_title (_ : string) : unit = ()

let local_storage_get k =
  load_state ();
  Hashtbl.find_opt ls k

let local_storage_set k v =
  load_state ();
  Hashtbl.replace ls k v;
  save_state ()

let local_storage_remove k =
  load_state ();
  Hashtbl.remove ls k;
  save_state ()

let session : (string, string) Hashtbl.t = Hashtbl.create 16

let session_storage_get k = Hashtbl.find_opt session k
let session_storage_set k v = Hashtbl.replace session k v

(* ---------- host-side document state ---------- *)

(* Classes/data the web build puts on <html>/<body>; the native
   renderer subscribes to these via the ui-state extension event. *)
let root_classes : (string, unit) Hashtbl.t = Hashtbl.create 8
let body_classes : (string, unit) Hashtbl.t = Hashtbl.create 8
let doc_data : (string, string) Hashtbl.t = Hashtbl.create 8
let lang = ref "en"

let push_ui_state () =
  let classes h =
    Hashtbl.fold (fun k _ acc -> k :: acc) h [] |> String.concat " "
  in
  request_host "ui-state"
    (Yojson.Safe.to_string
       (`Assoc
         [ "lang", `String !lang
         ; "root-classes", `String (classes root_classes)
         ; "body-classes", `String (classes body_classes)
         ; ( "data"
           , `Assoc (Hashtbl.fold (fun k v acc -> (k, `String v) :: acc) doc_data [])
           ) ]))

let document_set_lang s =
  lang := s;
  push_ui_state ()

let document_set_data name value =
  Hashtbl.replace doc_data name value;
  push_ui_state ()

let body_set_data name value = document_set_data name value

let body_rm_data name =
  Hashtbl.remove doc_data name;
  push_ui_state ()

let root_add_class c =
  Hashtbl.replace root_classes c ();
  push_ui_state ()

let root_rm_class c =
  Hashtbl.remove root_classes c;
  push_ui_state ()

let body_add_class c =
  Hashtbl.replace body_classes c ();
  push_ui_state ()

let body_rm_class c =
  Hashtbl.remove body_classes c;
  push_ui_state ()

(* ---------- url / hash routing ---------- *)

let hash_ref = ref ""

(* in-memory navigation history — the native app has no browser
   history, so back/forward is a pair of hash stacks. [set_location_hash]
   pushes the previous hash; back/forward swap stacks and re-notify. *)
let back_stack : string list ref = ref []

let fwd_stack : string list ref = ref []

let hash_change_fns : (unit -> unit) list ref = ref []

let notify_hash () = List.iter (fun f -> f ()) !hash_change_fns

let location_hash () = !hash_ref

let set_location_hash s =
  if s <> !hash_ref then begin
    (* the pre-route empty hash is not a destination — never push it *)
    if !hash_ref <> "" then back_stack := !hash_ref :: !back_stack;
    fwd_stack := [];
    hash_ref := s;
    notify_hash ()
  end

let can_history_back () = !back_stack <> []

let can_history_forward () = !fwd_stack <> []

let search_ref = ref ""
let location_search () = !search_ref

(* hosts pass the launched URL's query through here; tests use it to
   reach flags like rtc-test mode *)
let set_location_search s = search_ref := s

let on_hash_change f = hash_change_fns := f :: !hash_change_fns

(* URLSearchParams = k=v&.. query, percent-decoded *)
let new_url_search_params (s : string) : (string * string) list =
  let s =
    if String.length s > 0 && s.[0] = '?' then
      String.sub s 1 (String.length s - 1)
    else s
  in
  String.split_on_char '&' s
  |> List.filter_map (fun kv ->
         match String.index_opt kv '=' with
         | Some i ->
             let k = String.sub kv 0 i in
             let v = String.sub kv (i + 1) (String.length kv - i - 1) in
             Some (k, Uri.pct_decode v)
         | None -> Some (kv, ""))

let search_params_get (params : (string * string) list) name =
  match List.assoc_opt name params with
  | Some v -> Some v
  | None -> None

let query_param name =
  if !search_ref = "" then None
  else search_params_get (new_url_search_params !search_ref) name

let hash_query_param name =
  if !hash_ref = "" then None
  else
    match String.index_opt !hash_ref '?' with
    | Some i ->
        search_params_get
          (new_url_search_params
             (String.sub !hash_ref (i + 1)
                (String.length !hash_ref - i - 1)))
          name
    | None -> None

let replace_url_fragment hash = hash_ref := hash

let history_back () =
  match !back_stack with
  | [] -> ()
  | h :: t ->
      fwd_stack := !hash_ref :: !fwd_stack;
      back_stack := t;
      hash_ref := h;
      notify_hash ()

let history_forward () =
  match !fwd_stack with
  | [] -> ()
  | h :: t ->
      back_stack := !hash_ref :: !back_stack;
      fwd_stack := t;
      hash_ref := h;
      notify_hash ()

let local_ymd tm =
  (tm.Unix.tm_year + 1900, tm.Unix.tm_mon + 1, tm.Unix.tm_mday)

let install_ui_services ~assert_owner ~request_flush =
  Ui_services.install
    { storage =
        { get = local_storage_get
        ; set = local_storage_set
        ; remove = local_storage_remove
        }
    ; literal_text = Fun.id
    ; request_flush
    ; assert_owner
    };
  Ui_task.install { enqueue = Host.enqueue; assert_owner };
  Properties_services.install
    { schedule = (fun f ms -> ignore (Host.set_timeout f ms))
    ; report_error =
        (fun msg -> prerr_endline ("[properties] " ^ msg))
    ; publishing = (fun () -> false)
    ; random_uuid = Host.random_uuid
    ; encode_uri_component =
        (fun s -> Uri.pct_encode ~component:`Query_value s)
    ; now_ms = (fun () -> Unix.gettimeofday () *. 1000.)
    ; local_ymd_now =
        (fun () -> local_ymd (Unix.localtime (Unix.gettimeofday ())))
    ; local_ymd_of_ms =
        (fun ms -> local_ymd (Unix.localtime (ms /. 1000.)))
    ; local_ms_of_fields =
        (fun ~year ~month ~date ~hours ~minutes ~seconds ->
          (* the contract needs LOCAL-time construction like real
             Js.Date.make — mktime honors the host timezone *)
          fst
            (Unix.mktime
               { Unix.tm_sec = seconds
               ; tm_min = minutes
               ; tm_hour = hours
               ; tm_mday = date
               ; tm_mon = month
               ; tm_year = year - 1900
               ; tm_wday = 0
               ; tm_yday = 0
               ; tm_isdst = false
               })
          *. 1000.)
    }
