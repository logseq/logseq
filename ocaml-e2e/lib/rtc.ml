(** RTC testing helpers, mirroring clj-e2e's [rtc.clj]. *)

open Fest.Promise

type rtc_tx = { local_tx : int option; remote_tx : int option }

let contains_sub hay needle =
  let hl = String.length hay and nl = String.length needle in
  let rec go i =
    if i + nl > hl then false
    else if String.sub hay i nl = needle then true
    else go (i + 1)
  in
  nl = 0 || go 0

let int_after ~label text =
  (* finds [":label <int-or-nil>"] in the EDN-ish payload *)
  let key = ":" ^ label in
  let key_len = String.length key in
  let text_len = String.length text in
  let rec find i =
    if i + key_len > text_len then None
    else if String.sub text i key_len = key then Some (i + key_len)
    else find (i + 1)
  in
  match find 0 with
  | None -> None
  | Some j ->
      let rec skip_spaces k =
        if k < text_len && text.[k] = ' ' then skip_spaces (k + 1) else k
      in
      let start = skip_spaces j in
      if start + 3 <= text_len && String.sub text start 3 = "nil" then None
      else
        let rec digits k =
          if k < text_len && text.[k] >= '0' && text.[k] <= '9' then
            digits (k + 1)
          else k
        in
        let stop = digits start in
        if stop = start then None
        else int_of_string_opt (String.sub text start (stop - start))

(** Reads [local-tx]/[remote-tx] straight from [:rtc/state] via
    [logseq.api.get_state_from_store] — same source the [rtc-tx] DOM node
    renders, but immune to the header indicator unmounting. *)
let get_rtc_tx env =
  let deadline = Js.Date.now () +. 30000. in
  let rec poll () =
    let* json =
      Pw.eval_js env
        "(() => { const s = logseq.api.get_state_from_store('rtc/state'); \
         return s ? {localTx: s.localTx ?? null, remoteTx: s.remoteTx ?? \
         null} : null; })()"
    in
    let field name =
      match Js.Json.decodeObject json with
      | Some obj -> (
          match Js.Dict.get obj name with
          | Some v ->
              Js.Json.decodeNumber v
              |> Option.map (fun f -> int_of_float f)
          | None -> None)
      | None -> None
    in
    match field "localTx", field "remoteTx" with
    | Some _, Some _ | Some _, None | None, Some _ ->
        Js.Promise.resolve
          { local_tx = field "localTx"; remote_tx = field "remoteTx" }
    | None, None ->
        if Js.Date.now () > deadline then
          Js.Promise.resolve { local_tx = None; remote_tx = None }
        else
          let* () = Util.wait_timeout env 250. in
          poll ()
  in
  poll ()

(** Same predicate as the cljs [indicator-button-class] idle state —
    rtc-lock open, zero pending local/asset/server ops — read from
    [:rtc/state] so the check survives the header indicator unmounting
    (same flake that hides [rtc-tx]). *)
let wait_idle env =
  (* remote-op apply backlog can run deep under parallel load —
     pendingServerOpsCount=43+ while checksums already match *)
  let deadline = Js.Date.now () +. 120000. in
  let last_log = ref (Js.Date.now ()) in
  let rec poll () =
    let* json =
      Pw.eval_js env
        "(() => { const s = logseq.api.get_state_from_store('rtc/state') || \
         {}; const online = \
         logseq.api.get_state_from_store('network/online?'); const local = s.localTx ?? 0; \
         const remote = s.remoteTx ?? 0; const pendingLocal = \
         s.unpushedBlockUpdateCount ?? 0; const pendingAsset = \
         s.pendingAssetOpsCount ?? 0; const pendingServer = \
         s.pendingServerOpsCount ?? Math.max(0, remote - local); const open = \
         !!s.rtcLock; return (online && open && pendingLocal === 0 && \
         pendingAsset === 0 && pendingServer === 0); })()"
    in
    match Js.Json.decodeBoolean json with
    | Some true -> Js.Promise.resolve ()
    | _ ->
        let now = Js.Date.now () in
        let* snap =
          Pw.eval_js env
            "JSON.stringify(logseq.api.get_state_from_store('rtc/state'))"
        in
        (* log the snapshot every 30s — frozen pendingServer means the
           remote-op apply is wedged, not just slow *)
        if now -. !last_log > 30000. then begin
          last_log := now;
          Js.log2 "wait-idle pending" snap
        end;
        if now > deadline then
          (* surface the worker-side failure that froze the sync loop —
             db-sync error lines carry the exception that blocked apply *)
          let err_lines =
            Env.console_logs env
            |> List.filter (fun l ->
                   contains_sub l "db-sync/" || contains_sub l "Error"
                   || contains_sub l "error" || contains_sub l "apply-remote"
                   || contains_sub l "Invalid")
            |> (fun l -> if List.length l > 15 then
                    List.filteri (fun i _ -> i >= List.length l - 15) l
                  else l)
            |> String.concat "\n  "
          in
          let err_lines =
            if String.length err_lines > 3000
            then String.sub err_lines 0 3000 ^ "..."
            else err_lines
          in
          Js.Promise.reject
            (Failure
               (Printf.sprintf
                  "wait-idle: rtc/state not idle, state=%s\n  logs: %s"
                  (Option.value ~default:"null"
                     (Js.Json.decodeString snap))
                  err_lines))
        else
          let* () = Util.wait_timeout env 500. in
          poll ()
  in
  poll ()

(** exec [body], then wait for the rtc-tx to advance past the previous max
    with local-tx = remote-tx. Returns the new tx numbers. The tx goal is
    checked before the idle settle — when the target is already applied,
    waiting on a full idle first only burns wall-clock (each wait_idle can
    sit 120s on a busy remote backlog). *)
let with_wait_tx_updated env body =
  let* m = get_rtc_tx env in
  let local = Option.value ~default:0 m.local_tx in
  let remote = Option.value ~default:0 m.remote_tx in
  let tx = max local remote in
  let* () = body () in
  let deadline = Js.Date.now () +. 240000. in
  let rec loop () =
    let* new_m = get_rtc_tx env in
    let new_local = Option.value ~default:0 new_m.local_tx in
    let new_remote = Option.value ~default:0 new_m.remote_tx in
    if new_local = new_remote && new_local > tx then
      Js.Promise.resolve new_m
    else if Js.Date.now () > deadline then
      Js.Promise.reject
        (Failure
           (Printf.sprintf "wait-tx-updated failed old=%d/%d new=%d/%d" local
              remote new_local new_remote))
    else
      let* () = wait_idle env in
      let* () = Util.wait_timeout env 300. in
      loop ()
  in
  loop ()

let wait_tx_update_to env new_tx =
  let deadline = Js.Date.now () +. 240000. in
  let rec loop () =
    let* m = get_rtc_tx env in
    let local = Option.value ~default:0 m.local_tx in
    if local >= new_tx then Js.Promise.resolve local
    else if Js.Date.now () > deadline then
      Js.Promise.reject
        (Failure
           (Printf.sprintf "wait-tx-update-to %d, last local-tx %d" new_tx
              local))
    else
      let* () = wait_idle env in
      let* () = Util.wait_timeout env 300. in
      loop ()
  in
  loop ()

let rtc_start env = Util.search_and_click env "(Dev) RTC Start"
let rtc_stop env = Util.search_and_click env "(Dev) RTC Stop"

let validate_graphs_in_2_pages env page1 page2 =
  let* s1 = Env.with_page env page1 (fun () -> Graph.validate_graph env) in
  let* s2 = Env.with_page env page2 (fun () -> Graph.validate_graph env) in
  E2e_assert.graph_summary_equal s1 s2;
  Js.Promise.resolve ()

(** For two separate app instances — each env keeps its own console queue,
    so a failure dump shows the right instance's worker logs. *)
let validate_graphs_in_2_envs env1 env2 =
  let* s1 = Graph.validate_graph env1 in
  let* s2 = Graph.validate_graph env2 in
  E2e_assert.graph_summary_equal s1 s2;
  Js.Promise.resolve ()
