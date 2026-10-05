(** RTC testing helpers, mirroring clj-e2e's [rtc.clj]. *)

open Fest.Promise

type rtc_tx = { local_tx : int option; remote_tx : int option }

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

let get_rtc_tx env =
  let* text = Playwright.text_content (Pw.get_by_test_id env "rtc-tx") in
  let text = Option.value ~default:"" text in
  Js.Promise.resolve
    { local_tx = int_after ~label:"local-tx" text
    ; remote_tx = int_after ~label:"remote-tx" text
    }

let dump_sync_logs env =
  let kws = [ "sync"; "rtc"; "RTC"; "ws"; "error"; "Error"; "fail"; "exn" ] in
  let has_any m =
    List.exists
      (fun k ->
        let open Js.String in
        includes ~search:k m)
      kws
  in
  let rec take n = function
    | [] -> []
    | x :: tl -> if n <= 0 then [] else x :: take (n - 1) tl
  in
  Env.console_logs env
  |> List.filter has_any
  |> take 40
  |> List.rev
  |> List.iter (fun m -> Js.log ("[rtc-dbg] " ^ m))

let wait_idle env =
  Js.Promise.catch
    (fun e ->
      dump_sync_logs env;
      Playwright.throw_error e)
    (Pw.wait_for env ~timeout:35000. "button.cloud.on.idle")

(** exec [body], then wait for the rtc-tx to advance past the previous max
    with local-tx = remote-tx. Returns the new tx numbers. *)
let with_wait_tx_updated env body =
  let* m = get_rtc_tx env in
  let local = Option.value ~default:0 m.local_tx in
  let remote = Option.value ~default:0 m.remote_tx in
  let tx = max local remote in
  let* () = body () in
  let rec loop i =
    if i <= 0 then
      let* new_m = get_rtc_tx env in
      Js.Promise.reject
        (Failure
           (Printf.sprintf "wait-tx-updated failed old=%d/%d new=%d/%d" local
              remote
              (Option.value ~default:0 new_m.local_tx)
              (Option.value ~default:0 new_m.remote_tx)))
    else
      let* () = Util.wait_timeout env 500. in
      let* () = wait_idle env in
      let* () = Util.wait_timeout env 1000. in
      let* new_m = get_rtc_tx env in
      let new_local = Option.value ~default:0 new_m.local_tx in
      let new_remote = Option.value ~default:0 new_m.remote_tx in
      if new_local = new_remote && new_local > tx then
        Js.Promise.resolve new_m
      else loop (i - 1)
  in
  loop 15

let wait_tx_update_to env new_tx =
  let rec loop i last =
    if i <= 0 then (
      dump_sync_logs env;
      Js.Promise.reject
        (Failure
           (Printf.sprintf "wait-tx-update-to %d, last local-tx %d" new_tx last)))
    else
      let* () = Util.wait_timeout env 1000. in
      let* () = wait_idle env in
      let* m = get_rtc_tx env in
      let local = Option.value ~default:0 m.local_tx in
      if local >= new_tx then Js.Promise.resolve local
      else loop (i - 1) local
  in
  loop 15 0

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
