(* RTC error helpers — port of frontend/handler/events/rtc_error.cljs
   (e2ee-decrypt-failed?) plus the exceed-limit predicates from
   frontend/handler/user.cljs (storage-exceed-limit? /
   graph-count-exceed-limit?).

   Worker endpoint failures resolve (rather than reject) as error
   transits — Wire.Tagged ("error", {:message, :data}) or
   Tagged "js/Error"; see db-worker dispatcher.ml. Nested causes live
   under the :error/:data/:cause keys, mirroring ex-data/ex-cause. *)

(* cljs error-texts/error-codes walk message + ex-data's
   error-message/error-cause plus the :error and ex-cause chains; on
   the wire those are the "message"/"error-message"/"error-cause"
   fields and the "error"/"data"/"cause"/"err" nesting keys ("body"
   carries the HTTP error payload from sync_util/fetch_json) *)
let error_keys = [ "error"; "data"; "cause"; "err" ]
let text_keys = [ "message"; "error-message"; "error-cause"; "body" ]

let rec fold_maps ~f (w : Wire.t) : 'a list =
  match w with
  | Wire.Tagged (_, inner) -> fold_maps ~f inner
  | Wire.Map _ ->
      f w
      @ List.concat_map
          (fun k ->
            match Wire.get w k with
            | Some v -> fold_maps ~f v
            | None -> [])
          error_keys
  | _ -> []

let texts_of (w : Wire.t) : string list =
  fold_maps w ~f:(fun m ->
      List.filter_map
        (fun k ->
          match Wire.get m k with
          | Some (Wire.String s) -> Some s
          | _ -> None)
        text_keys)

let codes_of (w : Wire.t) : string list =
  fold_maps w ~f:(fun m ->
      match Wire.get m "code" with
      | Some (Wire.Keyword s) | Some (Wire.String s) -> [ s ]
      | _ -> [])

(* cljs e2ee-decrypt-error-codes + the "decrypt-aes-key" message check *)
let e2ee_decrypt_failed (w : Wire.t) =
  List.mem "db-sync/invalid-e2ee-password" (codes_of w)
  || List.mem "decrypt-aes-key" (texts_of w)

(* cljs storage-exceed-limit?/graph-count-exceed-limit? — ex-data err
   with :status 403 whose :body message names the limit. The OCaml
   worker raises fetch errors as {status, url, body} on the ex-data map
   itself, so status/body are found by the same key walk *)
type exceed =
  | Storage_limit
  | Graph_count_limit
  | Not_limit

let exceed_limit (w : Wire.t) : exceed =
  let statuses =
    fold_maps w ~f:(fun m ->
        match Wire.map_get_int m "status" with
        | Some s -> [ s ]
        | None -> [])
  in
  if not (List.mem 403 statuses) then Not_limit
  else
    let texts = texts_of w in
    if List.mem "storage-limit" texts then Storage_limit
    else if List.mem "graph-count-exceed-limit" texts then
      Graph_count_limit
    else Not_limit

let is_error = function
  | Wire.Tagged (("error" | "js/Error"), _) -> true
  | _ -> false

(* known errors -> toast (the cljs :rtc/*-exceed-limit +
   wrong-password notification paths); returns true when recognized so
   callers can skip their generic handling *)
let report (w : Wire.t) : bool =
  match exceed_limit w with
  | Storage_limit ->
      Toast.warning (I18n.t "sync/storage-exceed-limit");
      true
  | Graph_count_limit ->
      Toast.warning (I18n.t "sync/graph-count-exceed-limit");
      true
  | Not_limit ->
      if e2ee_decrypt_failed w then begin
        Toast.error (I18n.t "encryption/wrong-password");
        true
      end
      else false

(* resolved invoke result check: recognized errors toast, unknown error
   transits log like the cljs .catch handlers did; non-error results
   pass through silently *)
let report_outcome context (w : Wire.t) =
  if is_error w && not (report w) then
    Ui_services.log_error (context ^ " failed", Transit.to_string w)
