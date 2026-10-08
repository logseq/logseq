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
        ; reload = (fun () -> ())
        }
    ; time = Helper_scenarios.fake_time
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
  print_endline "PASS services: installation, storage, theme, navigation, document"
