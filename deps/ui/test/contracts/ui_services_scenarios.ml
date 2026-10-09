let check label condition = if not condition then failwith label
let invalid f = try f (); false with Invalid_argument _ -> true

let run () =
  check "storage access before installation fails"
    (invalid (fun () -> ignore (Ui_services.storage_get "wide-mode")));
  let values = Hashtbl.create 8 and flushes = ref 0 in
  let hash_ref = ref "" and dark_ref = ref false in
  let hist : string list ref = ref [] and fwd : string list ref = ref [] in
  let hash_fns : (unit -> unit) list ref = ref [] in
  let nav_fns : (unit -> unit) list ref = ref [] in
  let classes : (string, unit) Hashtbl.t = Hashtbl.create 8 in
  let datasets : (string, string) Hashtbl.t = Hashtbl.create 8 in
  let last_title = ref "" and reloads = ref 0 in
  let errors = ref 0 and infos = ref 0 and marks : string list ref = ref [] in
  let copied = ref "" and clip = ref "clip-0" and read_count = ref 0 in
  let session_tbl : (string, string) Hashtbl.t = Hashtbl.create 4 in
  let publishing_ref = ref true and online_ref = ref true in
  let uuid_seq = ref 0 and opened_urls : string list ref = ref [] in
  let prevented = ref 0 and sidebar_w = ref 0 in
  let uuids = ref [ "u1"; "u2" ] in
  let emitted : (string * string) list ref = ref [] in
  let set_hash s =
    if s <> !hash_ref then begin
      if !hash_ref <> "" then hist := !hash_ref :: !hist;
      fwd := [];
      hash_ref := s;
      List.iter (fun f -> f ()) !hash_fns
    end
  in
  let services : Ui_services.t =
    { storage =
        { get = Hashtbl.find_opt values
        ; set = Hashtbl.replace values
        ; remove = Hashtbl.remove values
        }
    ; literal_text = Fun.id
    ; request_flush = (fun () -> incr flushes)
    ; assert_owner = (fun () -> ())
    ; theme =
        { mode = (fun () ->
              match Hashtbl.find_opt values "system-theme?" with
              | Some "true" | Some "\"true\"" -> "system"
              | Some _ -> (
                  match Hashtbl.find_opt values "theme" with
                  | Some t -> String.sub t 1 (String.length t - 2)
                  | None -> "light")
              | None -> "light")
        ; system_default = (fun () -> true)
        ; prefers_dark = (fun () -> !dark_ref)
        ; set_system_pref =
            (fun v ->
              Hashtbl.replace values "system-theme?" (if v then "true" else "false"))
        ; set_theme_pref =
            (fun v -> Hashtbl.replace values "theme" ("\"" ^ v ^ "\""))
        ; apply_dataset = (fun v -> Hashtbl.replace datasets "theme" v)
        ; apply_classes =
            (fun v ->
              Hashtbl.remove classes "dark";
              Hashtbl.remove classes "dark-theme";
              Hashtbl.remove classes "light-theme";
              Hashtbl.remove classes "white-theme";
              if v = "dark" then (
                Hashtbl.replace classes "dark" ();
                Hashtbl.replace classes "dark-theme" ())
              else (
                Hashtbl.replace classes "white-theme" ();
                Hashtbl.replace classes "light-theme" ()))
        }
    ; nav =
        { hash = (fun () -> !hash_ref)
        ; set_hash
        ; replace_hash = (fun h -> hash_ref := h)
        ; back =
            (fun () ->
              match !hist with
              | [] -> ()
              | h :: t ->
                  fwd := !hash_ref :: !fwd;
                  hist := t;
                  hash_ref := h;
                  List.iter (fun f -> f ()) !hash_fns)
        ; forward =
            (fun () ->
              match !fwd with
              | [] -> ()
              | h :: t ->
                  hist := !hash_ref :: !hist;
                  fwd := t;
                  hash_ref := h;
                  List.iter (fun f -> f ()) !hash_fns)
        ; on_change = (fun f -> hash_fns := f :: !hash_fns)
        ; on_navigate =
            (fun f ->
              hash_fns := f :: !hash_fns;
              nav_fns := f :: !nav_fns)
        ; search = (fun () -> "")
        ; query_param = (fun _ -> None)
        ; hash_query_param =
            (fun name ->
              match String.index_opt !hash_ref '?' with
              | None -> None
              | Some i ->
                  let q = String.sub !hash_ref (i + 1)
                      (String.length !hash_ref - i - 1) in
                  List.assoc_opt name
                    (List.filter_map
                       (fun kv ->
                         match String.index_opt kv '=' with
                         | Some j ->
                             Some
                               ( String.sub kv 0 j
                               , String.sub kv (j + 1)
                                   (String.length kv - j - 1) )
                         | None -> Some (kv, ""))
                       (String.split_on_char '&' q)))
        ; decode_uri = (fun s -> s)
        ; reload = (fun () -> ())
        ; origin = (fun () -> "")
        ; pathname = (fun () -> "")
        }
    ; doc =
        { set_lang = (fun l -> Hashtbl.replace datasets "lang" l)
        ; preferred_lang = (fun () ->
              match Hashtbl.find_opt values "preferred-language" with
              | Some v ->
                  if String.length v >= 2
                     && String.get v 0 = '"'
                     && String.get v (String.length v - 1) = '"' then
                    String.sub v 1 (String.length v - 2)
                  else v
              | None -> "en")
        ; set_lang_pref =
            (fun v -> Hashtbl.replace values "preferred-language" ("\"" ^ v ^ "\""))
        ; set_data = (fun name v -> Hashtbl.replace datasets name v)
        ; rm_data = (fun name -> Hashtbl.remove datasets name)
        ; set_title = (fun t -> last_title := t)
        ; reload = (fun () -> incr reloads)
        }
    ; time = Helper_scenarios.fake_time
    ; log = { error = (fun _ -> incr errors); info = (fun _ -> incr infos) }
    ; perf = { mark = (fun name -> marks := name :: !marks) }
    ; uri =
        { encode_component =
            (fun s ->
              let buf = Buffer.create (String.length s) in
              String.iter
                (fun c ->
                  match c with
                  | 'A' .. 'Z' | 'a' .. 'z' | '0' .. '9' | '-' | '_' | '.'
                    | '!' | '~' | '*' | '\'' | '(' | ')' -> Buffer.add_char buf c
                  | _ ->
                      Buffer.add_string buf
                        (Printf.sprintf "%%%02X" (Char.code c)))
                s;
              Buffer.contents buf)
        }
    ; clipboard =
        { copy = (fun s -> copied := s)
        ; write_text = (fun s -> copied := s; Ui_task.resolve ())
        ; read_text = (fun () -> incr read_count; Ui_task.resolve !clip)
        }
    ; session =
        { get = (fun k -> Hashtbl.find_opt session_tbl k)
        ; set = (fun k v -> Hashtbl.replace session_tbl k v)
        }
    ; env =
        { publishing = (fun () -> !publishing_ref)
        ; dev_build = (fun () -> true)
        ; rtc_test_mode = (fun () -> false)
        ; online = (fun () -> !online_ref)
        ; is_mac = (fun () -> true)
        ; native_drag = (fun () -> false)
        ; native_block_controls = (fun () -> false)
        ; css_transform_icons = (fun () -> true)
        ; edit_units = (fun () -> `U16)
        ; random_uuid = (fun () -> incr uuid_seq; Printf.sprintf "uuid-%d" !uuid_seq)
        ; open_url = (fun u -> opened_urls := u :: !opened_urls)
        }
    ; dom =
        (let listeners : (string, Ui_services.ev -> unit) Hashtbl.t =
           Hashtbl.create 8 in
         let fake_el () : Ui_services.el =
           { Ui_services.token = 0
           ; closest = (fun _ -> None)
           ; attr = (fun _ -> None)
           ; rect = (fun () -> (0., 0., 0., 0.))
           ; set_style = (fun _ _ -> ())
           ; add_class = (fun _ -> ())
           ; remove_class = (fun _ -> ())
           ; offset_width = (fun () -> 0.)
           ; focus = (fun () -> ())
           ; select_text = (fun () -> ())
           ; set_selection_range = (fun _ _ -> ())
           ; set_attr = (fun _ _ -> ())
           ; rm_attr = (fun _ -> ())
           ; value = (fun () -> "")
           ; set_value = (fun _ -> ())
           ; set_text = (fun _ -> ())
           ; checked = (fun () -> false)
           ; set_checked = (fun _ -> ())
           ; contains = (fun _ -> false)
           ; connected = (fun () -> true)
           ; click = (fun () -> ())
           ; scroll_into_view = (fun () -> ())
           ; scroll_into_view_nearest = (fun () -> ())
           ; scroll_top = (fun () -> 0.)
           ; set_scroll_top = (fun _ -> ())
           ; scroll_height = (fun () -> 0.)
           ; client_height = (fun () -> 0.)
           ; id = (fun () -> "")
           ; tag = (fun () -> "")
           ; editable = (fun () -> false)
           ; query = (fun _ -> None)
           ; query_all = (fun _ -> [])
           ; files = (fun () -> [])
           ; style_prop = (fun _ -> "")
           }
         in
         { on_document_event = (fun ?capture:_ name f -> Hashtbl.replace listeners name f)
         ; on_window_event = (fun _ _ -> ())
         ; query = (fun _ -> None)
         ; query_all = (fun _ -> [])
         ; by_id = (fun _ -> None)
         ; active_element = (fun () -> None)
         ; element_at = (fun _ _ -> None)
         ; doc_root = fake_el
         ; body = fake_el
         ; viewport_width = (fun () -> 1024.)
         ; viewport_height = (fun () -> 768.)
         ; document_visible = (fun () -> true)
         ; dispatch =
             (fun name ->
               match Hashtbl.find_opt listeners name with
               | Some f ->
                   f
                     { Ui_services.x = 0.
                     ; y = 0.
                     ; shift = false
                     ; meta = false
                     ; ctrl = false
                     ; alt = false
                     ; composing = false
                     ; key = None
                     ; buttons = 0
                     ; movement_x = 0.
                     ; movement_y = 0.
                     ; default_prevented = false
                     ; target = None
                     ; touches = []
                     ; detail = (fun _ -> None)
                     ; clipboard_get = (fun _ -> "")
                     ; clipboard_set = (fun _ _ -> ())
                     ; data_transfer_get = (fun _ -> "")
                     ; files = []
                     ; prevent_default = (fun () -> incr prevented)
                     ; stop_propagation = (fun () -> ())
                     ; stop_immediate = (fun () -> ())
                     }
               | None -> ())
         ; emit_json = (fun n p -> emitted := (n, p) :: !emitted)
         ; open_dialog =
             (fun name ->
               match Hashtbl.find_opt listeners "ls:open-dialog" with
               | Some f ->
                   f
                     { Ui_services.x = 0.
                     ; y = 0.
                     ; shift = false
                     ; meta = false
                     ; ctrl = false
                     ; alt = false
                     ; composing = false
                     ; key = None
                     ; buttons = 0
                     ; movement_x = 0.
                     ; movement_y = 0.
                     ; default_prevented = false
                     ; target = None
                     ; touches = []
                     ; detail =
                         (fun k -> if k = "dialog" then Some name else None)
                     ; clipboard_get = (fun _ -> "")
                     ; clipboard_set = (fun _ _ -> ())
                     ; data_transfer_get = (fun _ -> "")
                     ; files = []
                     ; prevent_default = (fun () -> ())
                     ; stop_propagation = (fun () -> ())
                     ; stop_immediate = (fun () -> ())
                     }
               | None -> ())
         ; dispatch_json = (fun _ _ -> ())
         ; confirm = (fun _ -> false)
         ; scroll_row_into_view = (fun ~scroller:_ ~row:_ -> ())
         ; ensure_fixups = (fun () -> ())
         ; apply_left_sidebar_width = (fun px -> sidebar_w := px)
         ; selected_block_uuids = (fun () -> !uuids)
         })
    ; timers =
        { Ui_services.timeout = (fun _ _ -> 0)
        ; clear_timeout = (fun _ -> ())
        ; interval = (fun _ _ -> 0)
        ; clear_interval = (fun _ -> ())
        ; debounce = (fun _ -> (fun _ -> ()))
        ; later = (fun ~ms:_ _ -> ())
        }
    ; files =
        { Ui_services.pick_files = (fun ?accept:_ ?multiple:_ ?directory:_ _ -> ())
        ; download_text = (fun ~filename:_ ~mime:_ _ -> ())
        ; download_binary = (fun ~filename:_ ~mime:_ _ -> ())
        ; inflate_raw = (fun _ -> Ui_task.resolve "")
        ; dir_picker_supported = (fun () -> false)
        ; show_dir_picker = (fun () -> failwith "web-only")
        }
    }
  in
  Ui_services.install services;
  Ui_services.storage_set "wide-mode" "\"true\"";
  check "storage preserves the serialized preference"
    (Ui_services.storage_get "wide-mode" = Some "\"true\"");
  Ui_services.request_flush ();
  check "flush uses the installed application" (!flushes = 1);
  check "duplicate installation must fail" (invalid (fun () -> Ui_services.install services));
  check "failed installation preserves existing storage"
    (Ui_services.storage_get "wide-mode" = Some "\"true\"");
  Ui_services.storage_remove "wide-mode";
  check "removed preferences are absent" (Ui_services.storage_get "wide-mode" = None);

  (* theme contract: semantic values in, quoted storage out *)
  check "theme defaults to light" (Ui_services.theme_mode () = "light");
  Ui_services.theme_set_system_pref true;
  check "system pref persists unquoted"
    (Ui_services.storage_get "system-theme?" = Some "true");
  check "system mode reads back" (Ui_services.theme_mode () = "system");
  Ui_services.theme_set_system_pref false;
  Ui_services.theme_set_pref "dark";
  check "explicit theme persists quoted"
    (Ui_services.storage_get "theme" = Some "\"dark\"");
  check "explicit mode reads back" (Ui_services.theme_mode () = "dark");
  dark_ref := true;
  check "live host appearance is re-queried" (Ui_services.theme_prefers_dark ());
  Ui_services.theme_apply_dataset "dark";
  check "dataset carries the effective mode"
    (Hashtbl.find_opt datasets "theme" = Some "dark");
  Ui_services.theme_apply_classes "dark";
  check "dark classes applied"
    (Hashtbl.mem classes "dark" && Hashtbl.mem classes "dark-theme");
  Ui_services.theme_apply_classes "light";
  check "light swap removes dark classes"
    ((not (Hashtbl.mem classes "dark")) && Hashtbl.mem classes "light-theme");

  (* nav contract: push notifies, quiet replace does not *)
  let seen = ref [] in
  Ui_services.nav_on_navigate (fun () -> seen := !hash_ref :: !seen);
  Ui_services.nav_set_hash "#/settings";
  check "set_hash pushes and notifies" (!seen = [ "#/settings" ]);
  Ui_services.nav_replace_hash "#/quiet";
  check "quiet replace rewrites without notifying"
    (!hash_ref = "#/quiet" && !seen = [ "#/settings" ]);
  Ui_services.nav_set_hash "#/page/x?graph-id=g1";
  check "hash-qualified query param resolves"
    (Ui_services.nav_hash_query_param "graph-id" = Some "g1");
  Ui_services.nav_back ();
  check "back returns and notifies"
    (!hash_ref = "#/quiet" && List.hd !seen = "#/quiet");
  Ui_services.nav_forward ();
  check "forward replays and notifies"
    (!hash_ref = "#/page/x?graph-id=g1"
     && List.hd !seen = "#/page/x?graph-id=g1");
  let only_hash = ref 0 in
  Ui_services.nav_on_change (fun () -> incr only_hash);
  List.iter (fun f -> f ()) !nav_fns;
  check "imperative ls:navigate reaches on_navigate but not on_change"
    (!only_hash = 0 && List.hd !seen = "#/page/x?graph-id=g1");

  (* doc contract: lang pref quoting *)
  Ui_services.doc_set_lang_pref "fr";
  check "lang pref persists quoted"
    (Ui_services.storage_get "preferred-language" = Some "\"fr\"");
  check "lang pref reads back" (Ui_services.doc_preferred_lang () = "fr");
  Ui_services.doc_set_lang "fr";
  check "doc lang applied" (Hashtbl.find_opt datasets "lang" = Some "fr");
  Ui_services.doc_set_title "My Page";
  check "doc title reaches the host" (!last_title = "My Page");

  (* storage quoting is a pure boundary helper *)
  check "unquote strips one layer"
    (Ui_services.storage_unquote "\"dark\"" = "dark"
     && Ui_services.storage_unquote "plain" = "plain"
     && Ui_services.storage_quote "dark" = "\"dark\"");

  (* literal_text identity on the fake; real impls decode UTF-8 *)
  check "literal_text dispatches" (Ui_services.literal_text "abc" = "abc");

  (* log/perf: calls reach the host sinks *)
  Ui_services.log_error ("boom", 1);
  Ui_services.log_error "plain";
  Ui_services.log_info "note";
  check "log sinks receive values" (!errors = 2 && !infos = 1);
  Ui_services.perf_mark "p1";
  check "perf mark recorded" (!marks = [ "p1" ]);

  (* uri encode *)
  check "encode_component escapes"
    (Ui_services.uri_encode_component "a b&c" = "a%20b%26c");

  (* clipboard: sync copy + task-returning write/read (Ui_task semantics
     are covered by ui_task_scenarios; here we assert dispatch + that the
     ops yield tasks) *)
  Ui_services.clipboard_copy "c1";
  check "clipboard copy stores" (!copied = "c1");
  let _t : unit Ui_task.t = Ui_services.clipboard_write_text "c2" in
  check "clipboard write_text dispatches" (!copied = "c2");
  let _t : string Ui_task.t = Ui_services.clipboard_read_text () in
  check "clipboard read_text dispatches" (!read_count = 1);

  (* session storage is separate from local storage *)
  Ui_services.session_set "k" "sv";
  check "session roundtrip"
    (Ui_services.session_get "k" = Some "sv"
     && Ui_services.storage_get "k" = None);

  (* env facts *)
  check "env publishing" (Ui_services.env_publishing ());
  check "env online" (Ui_services.env_online ());
  check "env is_mac" (Ui_services.env_is_mac ());
  check "env dev_build" (Ui_services.env_dev_build ());
  check "env edit_units" (Ui_services.env_edit_units () = `U16);
  check "env flags off" (not (Ui_services.env_rtc_test_mode ())
                         && not (Ui_services.env_native_drag ())
                         && not (Ui_services.env_native_block_controls ()));
  check "env css icons" (Ui_services.env_css_transform_icons ());
  let u1 = Ui_services.env_random_uuid () and u2 = Ui_services.env_random_uuid () in
  check "random_uuid distinct" (u1 <> u2 && String.length u1 > 0);
  Ui_services.env_open_url "https://x";
  check "open_url reaches host" (!opened_urls = [ "https://x" ]);

  (* nav origin/pathname *)
  check "nav origin/path" (Ui_services.nav_origin () = ""
                           && Ui_services.nav_pathname () = "");

  (* time fmt_date *)
  check "fmt_date short form"
    (Ui_services.time_fmt_date 0. = "Jan 1, 1970");

  (* dom: typed event delivery + element/document ops *)
  let got : Ui_services.ev option ref = ref None in
  Ui_services.dom_on_document_event "ls:test" (fun ev -> got := Some ev);
  Ui_services.dom_dispatch "ls:test";
  check "dom dispatch delivers typed ev"
    (match !got with Some ev -> ev.Ui_services.x = 0. | None -> false);
  Ui_services.dom_on_document_event "ls:open-dialog"
    (fun ev -> match ev.Ui_services.detail "dialog" with
      | Some d -> opened_urls := ("dlg:" ^ d) :: !opened_urls
      | None -> ());
  Ui_services.dom_open_dialog "settings";
  check "open_dialog delivers detail"
    (List.hd !opened_urls = "dlg:settings");
  Ui_services.dom_emit_json "ls:host-evt" "{\"a\":1}";
  check "emit_json forwards name + raw payload"
    (!emitted = [ ("ls:host-evt", "{\"a\":1}") ]);
  check "dom metrics"
    (Ui_services.dom_viewport_width () = 1024.
     && Ui_services.dom_query "body" = None);
  Ui_services.dom_apply_left_sidebar_width 260;
  check "sidebar width applied" (!sidebar_w = 260);
  check "selected uuids"
    (Ui_services.dom_selected_block_uuids () = [ "u1"; "u2" ]);
  print_endline "PASS services: installation, storage, theme, navigation, document, ops"
