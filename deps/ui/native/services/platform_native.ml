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

(* ---------- semantic theme/nav/doc service impls ---------- *)

(* imperative "ls:navigate" navigation: dispatched through the event
   emulation (native/platform.ml emit_event) and mirrored here so service
   observers see the same two channels the browser exposes. *)
let navigate_fns : (unit -> unit) list ref = ref []
let notify_navigate () = List.iter (fun f -> f ()) !navigate_fns

let on_navigate f =
  hash_change_fns := f :: !hash_change_fns;
  navigate_fns := f :: !navigate_fns

let theme_mode () =
  let system =
    match local_storage_get "system-theme?" with
    | Some v -> storage_unquote v = "true"
    | None -> true (* native host is a desktop app — follows system *)
  in
  if system then "system"
  else
    match local_storage_get "theme" with
    | Some v -> (match storage_unquote v with "dark" -> "dark" | _ -> "light")
    | None -> "light"

let theme_set_system_pref v =
  local_storage_set "system-theme?" (if v then "true" else "false")

let theme_set_pref v = local_storage_set "theme" (storage_quote v)

let theme_apply_dataset effective = document_set_data "theme" effective

let theme_apply_classes effective =
  if effective = "dark" then begin
    root_add_class "dark";
    body_add_class "dark-theme";
    body_rm_class "light-theme";
    body_rm_class "white-theme"
  end
  else begin
    root_rm_class "dark";
    body_rm_class "dark-theme";
    body_add_class "white-theme";
    body_add_class "light-theme"
  end

let preferred_lang () =
  match local_storage_get "preferred-language" with
  | Some v -> storage_unquote v
  | None -> "en"

let set_lang_pref code =
  local_storage_set "preferred-language" (storage_quote code)

(* native has no page reload — a language swap needs a host restart the
   same way reload_page() is a no-op today *)
let doc_reload () = ()

(* wall-clock via Unix — mktime normalizes overflow the way the JS Date
   constructor does (month 13 -> January, day 0 -> previous month) *)
let local_fields ms : Ui_services.date_fields =
  let tm = Unix.localtime (ms /. 1000.) in
  { year = tm.Unix.tm_year + 1900
  ; month = tm.Unix.tm_mon + 1
  ; day = tm.Unix.tm_mday
  ; wday = tm.Unix.tm_wday
  ; hours = tm.Unix.tm_hour
  ; minutes = tm.Unix.tm_min
  ; seconds = tm.Unix.tm_sec
  ; ms = int_of_float (Float.rem ms 1000.)
  }

let of_fields (f : Ui_services.date_fields) =
  let tm =
    { Unix.tm_sec = f.seconds
    ; tm_min = f.minutes
    ; tm_hour = f.hours
    ; tm_mday = f.day
    ; tm_mon = f.month - 1
    ; tm_year = f.year - 1900
    ; tm_wday = 0
    ; tm_yday = 0
    ; tm_isdst = false
    }
  in
  (fst (Unix.mktime tm) *. 1000.) +. float_of_int f.ms

(* the web accepts RFC 3339 and its own Date.parse shapes; here the
   same contract covers RFC 3339, bare YYYY-MM-DD (UTC midnight, as JS
   does), and the "Sep 30, 2026" journal-title shape *)
let month_of_abbr =
  [ "Jan"; "Feb"; "Mar"; "Apr"; "May"; "Jun"; "Jul"; "Aug"; "Sep"
  ; "Oct"; "Nov"; "Dec" ]

let date_parse s =
  match Ptime.of_rfc3339 s with
  | Ok (pt, _, _) -> Some (Ptime.to_float_s pt *. 1000.)
  | Error _ -> (
      let ymd m d y =
        match Ptime.of_date_time ((y, m, d), ((0, 0, 0), 0)) with
        | Some pt -> Some (Ptime.to_float_s pt *. 1000.)
        | None -> None
      in
      (* YYYY-MM-DD *)
      match String.split_on_char '-' s with
      | [ ys; ms'; ds' ] -> (
          match
            ( int_of_string_opt ys
            , int_of_string_opt ms'
            , int_of_string_opt ds' )
          with
          | Some y, Some m, Some d when m >= 1 && m <= 12 && d >= 1 && d <= 31 ->
              ymd m d y
          | _ -> None)
      | _ -> (
          (* "Sep 30, 2026" / "Sep 30th, 2026" *)
          match String.index_opt s ' ' with
          | Some sp when sp = 3 -> (
              match String.index_opt s ',' with
              | Some comma when comma > sp + 1 -> (
                  let mon = String.sub s 0 sp in
                  let rest = String.sub s (sp + 1) (comma - sp - 1) in
                  let digits =
                    String.sub rest 0
                      (String.length rest
                       - (if String.length rest > 2
                             && Char.code rest.[String.length rest - 1] > 57
                          then 2
                          else 0))
                  in
                  match
                    ( List.find_index
                        (fun m -> m = mon)
                        month_of_abbr
                    , int_of_string_opt digits
                    , int_of_string_opt
                        (String.sub s (comma + 2)
                           (String.length s - comma - 2)) )
                  with
                  | Some mi, Some d, Some y -> ymd (mi + 1) d y
                  | _ -> None)
              | _ -> None)
          | _ -> None))

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
    ; theme =
        { mode = theme_mode
        ; system_default = (fun () -> true)
        ; prefers_dark = Host.prefers_dark
        ; set_system_pref = theme_set_system_pref
        ; set_theme_pref = theme_set_pref
        ; apply_dataset = theme_apply_dataset
        ; apply_classes = theme_apply_classes
        }
    ; nav =
        { hash = location_hash
        ; set_hash = set_location_hash
        ; replace_hash = replace_url_fragment
        ; back = history_back
        ; forward = history_forward
        ; on_change = on_hash_change
        ; on_navigate
        ; search = location_search
        ; query_param
        ; hash_query_param
        ; decode_uri = Uri.pct_decode
        ; reload = doc_reload
        }
    ; doc =
        { set_lang = document_set_lang
        ; preferred_lang
        ; set_lang_pref
        ; set_data = document_set_data
        ; rm_data = body_rm_data
        ; reload = doc_reload
        }
    ; time =
        { now = (fun () -> Unix.gettimeofday () *. 1000.)
        ; local_fields
        ; of_fields
        ; parse = date_parse
        }
    };
  (* platform-owned singletons: bundled icon table, app icon aliases and
     the build revision (LOGSEQ_REVISION baked by the app launcher) *)
  Icon_data.install ();
  Icons.set_app_aliases [ ("new-page", "file-plus") ];
  (match Sys.getenv_opt "LOGSEQ_REVISION" with
   | Some r -> Version.set_revision r
   | None -> ());
  Ui_task.install { enqueue = Host.enqueue; assert_owner }
