(** Port of rtc_extra_part2_test.clj. *)

open Fest.Promise

module B = Block
module Page = Ls_page
module K = Keyboard
module Assert = E2e_assert
module Loc = Ls_locator
module Rtc = Rtc

external read_file_sync : string -> string -> string = "readFileSync"
  [@@mel.module "fs"]

let read_utf8 path = read_file_sync path "utf8"

external process_env : string Js.Dict.t = "process.env"

let env_int k default =
  match Js.Dict.get process_env k with
  | None -> default
  | Some s -> (
      match int_of_string_opt (String.trim s) with
      | Some n -> n
      | None -> default)

let pages = Fixtures.shared_2_pages ()

let ready : (Env.t * Env.t * string) Js.Promise.t Lazy.t =
  lazy
    (let* env1, env2 = pages in
     let graph_name = "rtc-extra-part2-test-graph-" ^ Fixtures.inst_string () in
     let* _ =
       Js.Promise.all2
         ( Env.with_page env1 (Env.page env1) (fun () ->
               let* _ = Settings.developer_mode env1 in
               let* _ = Settings.refresh_test_env env1 in
               Util.login_test_account env1)
         , Env.with_page env2 (Env.page env2) (fun () ->
               let* _ = Settings.developer_mode env2 in
               let* _ = Settings.refresh_test_env env2 in
               Util.login_test_account env2) )
     in
     let* () =
       Env.with_page env1 (Env.page env1) (fun () ->
           Graph.new_graph env1 graph_name ~enable_sync:true
             ~graph_e2ee:false ())
     in
     let* () =
       Env.with_page env2 (Env.page env2) (fun () ->
           let* () = Graph.wait_for_remote_graph env2 graph_name in
           let* _ =
             Graph.switch_graph env2 graph_name ~wait_sync:true
               ~need_input_password:true
           in
           Js.Promise.resolve ())
     in
     Fixtures.after (fun () ->
         Env.with_page env2 (Env.page env2) (fun () ->
             let* _ = Graph.remove_remote_graph env2 graph_name in
             Js.Promise.resolve ()));
     Js.Promise.resolve (env1, env2, graph_name))

let new_rtc_page env p1 p2 = Fixtures.new_logseq_page_in_rtc env p1 p2 ()

let stress_default_rounds = 1
let stress_default_ops_per_client = 50
let stress_default_seed_blocks = 20
let stress_default_seed = 20260330
let stress_max_seed_depth = 4

let severe_sync_log_patterns =
  [ "db-sync/checksum-mismatch"; "db-sync/tx-rejected"
  ; "db-sync/apply-remote-txs-failed" ]

let rec iter_seq f = function
  | [] -> Js.Promise.resolve ()
  | x :: rest ->
      let* () = f x in
      iter_seq f rest

let contains_sub hay needle =
  let hl = String.length hay and nl = String.length needle in
  let rec go i =
    if i + nl > hl then false
    else if String.sub hay i nl = needle then true
    else go (i + 1)
  in
  nl = 0 || go 0

let recent_console_logs env1 env2 =
  Env.console_logs env1 @ Env.console_logs env2

let assert_no_severe_sync_errors env1 env2 =
  let matched =
    List.filter
      (fun line ->
        List.exists (fun pat -> contains_sub line pat)
          severe_sync_log_patterns)
      (recent_console_logs env1 env2)
  in
  let tail =
    let rec last n = function
      | [] -> []
      | l ->
          if List.length l <= n then l
          else last n (List.tl l)
    in
    last 20 matched
  in
  Fest.deep_equal matched [] Fest.expect;
  if matched <> [] then Js.log2 "severe sync errors" tail

let page_sync_state env p =
  Env.with_page env p (fun () ->
      let* () = Util.exit_edit env in
      let* tx = Rtc.get_rtc_tx env in
      let* blocks = Util.settled_page_blocks_contents env in
      Js.Promise.resolve (tx, Array.to_list blocks))

let assert_two_pages_synced env p1 p2 =
  let* tx1, blocks1 = page_sync_state env p1 in
  let* tx2, blocks2 = page_sync_state env p2 in
  Fest.deep_equal blocks1 blocks2 Fest.expect;
  Fest.deep_equal tx1.Rtc.local_tx tx1.Rtc.remote_tx Fest.expect;
  Fest.deep_equal tx2.Rtc.local_tx tx2.Rtc.remote_tx Fest.expect;
  Js.Promise.resolve ()

let try_indent env =
  let* editor = Util.get_editor env in
  match editor with
  | None -> Js.Promise.resolve false
  | Some ed -> (
      let* x1, _ = Pw.bounding_xy_l ed in
      let* () = K.tab env in
      let* editor' = Util.get_editor env in
      match editor' with
      | Some ed' ->
          let* x2, _ = Pw.bounding_xy_l ed' in
          Js.Promise.resolve (x2 > x1)
      | None -> Js.Promise.resolve false)

let try_outdent env =
  let* editor = Util.get_editor env in
  match editor with
  | None -> Js.Promise.resolve false
  | Some ed -> (
      let* x1, _ = Pw.bounding_xy_l ed in
      let* () = K.shift_tab env in
      let* editor' = Util.get_editor env in
      match editor' with
      | Some ed' ->
          let* x2, _ = Pw.bounding_xy_l ed' in
          Js.Promise.resolve (x1 > x2)
      | None -> Js.Promise.resolve false)

let rec align_depth env depth target =
  if depth < target then
    let* ok = try_indent env in
    if ok then align_depth env (depth + 1) target
    else Js.Promise.resolve depth
  else if depth > target then
    let* ok = try_outdent env in
    if ok then align_depth env (depth - 1) target
    else Js.Promise.resolve depth
  else Js.Promise.resolve depth

let new_block_safe env title =
  let rec loop attempt =
    let* created =
      Js.Promise.catch
        (fun _ -> Js.Promise.resolve false)
        (let* () = B.new_block env "" in
         let* () = B.save_block env title in
         Js.Promise.resolve true)
    in
    if created then Js.Promise.resolve ()
    else if attempt = 0 then
      Js.Promise.reject (Failure ("new-block-safe failed: " ^ title))
    else
      let* () = Util.exit_edit env in
      let* () = Util.wait_timeout env 80. in
      let* _ =
        Js.Promise.catch
          (fun _ -> Js.Promise.resolve ())
          (B.open_last_block env)
      in
      let* () = Util.wait_timeout env 80. in
      loop (attempt - 1)
  in
  loop 4

let rec max_of = function
  | [] -> 0
  | x :: tl -> max x (max_of tl)

(** sync-by-trigger: first ensure both pages observed all checkpoint txs,
    then create a trigger block on p1 and wait it on both. *)
let sync_by_trigger env p1 p2 tag checkpoints =
  let target_tx = max_of checkpoints in
  let* () =
    if target_tx > 0 then
      let* () =
        Env.with_page env p1 (fun () ->
            let* _ = Rtc.wait_tx_update_to env target_tx in
            Js.Promise.resolve ())
      in
      Env.with_page env p2 (fun () ->
          let* _ = Rtc.wait_tx_update_to env target_tx in
          Js.Promise.resolve ())
    else Js.Promise.resolve ()
  in
  let* tx =
    Env.with_page env p1 (fun () ->
        Rtc.with_wait_tx_updated env (fun () ->
            new_block_safe env ("sync-trigger-" ^ tag)))
  in
  let remote = Option.value ~default:0 tx.Rtc.remote_tx in
  let* () =
    Env.with_page env p1 (fun () ->
        let* _ = Rtc.wait_tx_update_to env remote in
        Js.Promise.resolve ())
  in
  Env.with_page env p2 (fun () ->
      let* _ = Rtc.wait_tx_update_to env remote in
      Js.Promise.resolve ())

(* A deterministic RNG stand-in for java.util.Random. *)
type rng = Random.State.t

let rng_make seed = Random.State.make [| seed |]
let rng_int rng bound = Random.State.int rng bound

let seed_long_nested_page env p1 p2 (seed : int) =
  let seed_blocks =
    max 20
      (env_int "DB_SYNC_E2E_STRESS_SEED_BLOCKS" stress_default_seed_blocks)
  in
  let rng = rng_make (seed + 97) in
  let* titles =
    Env.with_page env p1 (fun () ->
        let* () = Util.exit_edit env in
        let rec loop i depth titles =
          if i < seed_blocks then
            let title = Printf.sprintf "seed-r%d-%03d" seed i in
            let target_depth = rng_int rng (stress_max_seed_depth + 1) in
            let* () = new_block_safe env title in
            let* depth' = align_depth env depth target_depth in
            loop (i + 1) depth' (title :: titles)
          else
            let* () = Util.exit_edit env in
            Js.Promise.resolve titles
        in
        loop 0 0 [])
  in
  let* () = sync_by_trigger env p1 p2 ("seed-" ^ string_of_int seed) [] in
  Js.Promise.resolve titles

let delete_existing_random_block env rng known_titles =
  let rec loop attempt =
    if attempt = 0 then Js.Promise.resolve 0
    else
      match !known_titles with
      | [] -> Js.Promise.resolve 0
      | titles ->
          let title = List.nth titles (rng_int rng (List.length titles)) in
          let* deleted =
            Js.Promise.catch
              (fun _ -> Js.Promise.resolve false)
              (let* () = B.jump_to_block env title in
               let* () = B.delete_blocks env in
               Js.Promise.resolve true)
          in
          if deleted then (
            known_titles := List.filter (fun t -> t <> title) !known_titles;
            Js.Promise.resolve 1)
          else loop (attempt - 1)
  in
  loop 8

type action = New | Save | Indent_outdent | Delete_existing | Undo | Redo

let random_edit_actions =
  [| New; Save; Indent_outdent; Delete_existing; Undo; Redo |]

let random_edit_op env rng known_titles client_prefix round op_idx =
  let base = Printf.sprintf "%s-r%d-op%d" client_prefix round op_idx in
  match random_edit_actions.(rng_int rng (Array.length random_edit_actions)) with
  | New ->
      let title = base ^ "-new" in
      let* () = new_block_safe env title in
      known_titles := title :: !known_titles;
      Js.Promise.resolve 1
  | Save ->
      let save_title = base ^ "-save-updated" in
      let* () = new_block_safe env (base ^ "-save") in
      let* () = B.save_block env save_title in
      known_titles := save_title :: !known_titles;
      Js.Promise.resolve 2
  | Indent_outdent ->
      let title = base ^ "-nest" in
      let* () = new_block_safe env title in
      known_titles := title :: !known_titles;
      let* i = try_indent env in
      let* o = try_outdent env in
      Js.Promise.resolve
        (1 + (if i then 1 else 0) + (if o then 1 else 0))
  | Delete_existing -> delete_existing_random_block env rng known_titles
  | Undo ->
      let* () = B.undo env in
      Js.Promise.resolve 0
  | Redo ->
      let* () = B.redo env in
      Js.Promise.resolve 0

let local_random_edit_batch env rng known_titles client_prefix round =
  let ops =
    max 1
      (env_int "DB_SYNC_E2E_STRESS_OPS_PER_CLIENT"
         stress_default_ops_per_client)
  in
  let rec loop i undo_steps =
    if i < ops then
      let* steps =
        random_edit_op env rng known_titles client_prefix round i
      in
      loop (i + 1) (undo_steps + steps)
    else
      let* () = Util.exit_edit env in
      Js.Promise.resolve undo_steps
  in
  loop 0 0

let local_undo_redo_batch env undo_steps =
  let steps = max 1 undo_steps in
  let* () = B.open_last_block env in
  let rec times n f =
    if n <= 0 then Js.Promise.resolve ()
    else
      let* () = f () in
      times (n - 1) f
  in
  let* () = times steps (fun () -> B.undo env) in
  let* () = times steps (fun () -> B.redo env) in
  Util.exit_edit env

let () =
  if Util.is_main "test_rtc_extra_part2.js" then
  Fest.Promise.test "online-two-clients-undo-redo-stress-test" (fun () ->
    let* env1, env2, _graph_name = Lazy.force ready in
    let env = env1 in
    let p1 = Env.page env1 in
    let p2 = Env.page env2 in
    let* () = new_rtc_page env p1 p2 in
    let rounds =
      max 1 (env_int "DB_SYNC_E2E_STRESS_ROUNDS" stress_default_rounds)
    in
    let seed = env_int "DB_SYNC_E2E_STRESS_SEED" stress_default_seed in
    let p1_rng = rng_make (seed + 101) in
    let p2_rng = rng_make (seed + 202) in
    let* titles = seed_long_nested_page env p1 p2 seed in
    let known_titles = ref titles in
    let rec round_loop round =
      if round < rounds then (
        (* Phase 1: random edits on both clients without forced sync *)
        let* p1_steps =
          Env.with_page env p1 (fun () ->
              local_random_edit_batch env p1_rng known_titles "p1" round)
        in
        let* p2_steps =
          Env.with_page env p2 (fun () ->
              local_random_edit_batch env p2_rng known_titles "p2" round)
        in
        let* p1_edit_tx =
          Env.with_page env p1 (fun () ->
              let* tx = Rtc.get_rtc_tx env in
              Js.Promise.resolve
                (Option.value ~default:0 tx.Rtc.local_tx))
        in
        let* p2_edit_tx =
          Env.with_page env p2 (fun () ->
              let* tx = Rtc.get_rtc_tx env in
              Js.Promise.resolve
                (Option.value ~default:0 tx.Rtc.local_tx))
        in
        (* Phase 2: undo+redo both clients *)
        let* () =
          Env.with_page env p1 (fun () ->
              local_undo_redo_batch env p1_steps)
        in
        let* () =
          Env.with_page env p2 (fun () ->
              local_undo_redo_batch env p2_steps)
        in
        let* p1_undo_tx =
          Env.with_page env p1 (fun () ->
              let* tx = Rtc.get_rtc_tx env in
              Js.Promise.resolve
                (Option.value ~default:0 tx.Rtc.local_tx))
        in
        let* p2_undo_tx =
          Env.with_page env p2 (fun () ->
              let* tx = Rtc.get_rtc_tx env in
              Js.Promise.resolve
                (Option.value ~default:0 tx.Rtc.local_tx))
        in
        let* () =
          sync_by_trigger env p1 p2 (string_of_int round)
            [ p1_edit_tx; p2_edit_tx; p1_undo_tx; p2_undo_tx ]
        in
        let* () = assert_two_pages_synced env p1 p2 in
        assert_no_severe_sync_errors env1 env2;
        round_loop (round + 1))
      else Js.Promise.resolve ()
    in
    round_loop 0)

let () =
  if Util.is_main "test_rtc_extra_part2.js" then
  Fest.Promise.test "issue-651-block-title-double-transit-encoded-test"
    (fun () ->
    let* env1, env2, _graph_name = Lazy.force ready in
    let env = env1 in
    let p1 = Env.page env1 in
    let p2 = Env.page env2 in
    let* () = new_rtc_page env p1 p2 in
    let* () =
      Env.with_page env p1 (fun () ->
          let* () = Page.new_page env "aaa" in
          let* () = Page.convert_to_tag env "aaa" in
          let* () = Page.new_page env "bbb" in
          let* () = Page.convert_to_tag env ~extends:[ "aaa" ] "bbb" in
          let* () = Page.new_page env "ccc" in
          let* () = B.new_block env "" in
          let* () = Util.input_command env "query" in
          let* () = Pw.click_l (Util.query_last env "button:text('filter')") in
          let* () = Util.input env "tags" in
          let* () = Pw.click env "a.menu-link:has-text('tags')" in
          let* () = Pw.click env "a.menu-link:has-text('bbb')" in
          (* as described in the issue *)
          Util.wait_timeout env 5000.)
    in
    let* tx =
      Env.with_page env p1 (fun () ->
          Rtc.with_wait_tx_updated env (fun () -> B.new_block env "done"))
    in
    let* () =
      Env.with_page env p2 (fun () ->
          let* _ =
            Rtc.wait_tx_update_to env
              (Option.value ~default:0 tx.Rtc.remote_tx)
          in
          Js.Promise.resolve ())
    in
    let* () =
      Env.with_page env p1 (fun () -> Page.goto_page env "bbb")
    in
    let* () =
      Env.with_page env p2 (fun () -> Page.goto_page env "bbb")
    in
    Rtc.validate_graphs_in_2_pages env p1 p2)

let () =
  if Util.is_main "test_rtc_extra_part2.js" then
  Fest.Promise.test "paste-multiple-blocks-test" (fun () ->
    let* env1, env2, _graph_name = Lazy.force ready in
    let env = env1 in
    let p1 = Env.page env1 in
    let p2 = Env.page env2 in
    let* () = new_rtc_page env p1 p2 in
    let* () =
      Env.with_page env p1 (fun () ->
          let* () = B.new_blocks env [ "block1"; "block2"; "block3" ] in
          let* () = Util.exit_edit env in
          let* () = B.select_blocks env 2 in
          let* () = B.copy env in
          let* () = B.jump_to_block env "block3" in
          Util.repeat_keyboard env 1 "Enter")
    in
    let rec paste_n n =
      if n <= 0 then Js.Promise.resolve ()
      else
        let* tx =
          Env.with_page env p1 (fun () ->
              Rtc.with_wait_tx_updated env (fun () -> B.paste env))
        in
        let* () =
          Env.with_page env p2 (fun () ->
              let* _ =
                Rtc.wait_tx_update_to env
                  (Option.value ~default:0 tx.Rtc.remote_tx)
              in
              Js.Promise.resolve ())
        in
        paste_n (n - 1)
    in
    let* () = paste_n 5 in
    let* tx =
      Env.with_page env p1 (fun () ->
          Rtc.with_wait_tx_updated env (fun () ->
              B.new_block env "sync-trigger"))
    in
    let* () =
      Env.with_page env p2 (fun () ->
          let* _ =
            Rtc.wait_tx_update_to env
              (Option.value ~default:0 tx.Rtc.remote_tx)
          in
          Js.Promise.resolve ())
    in
    let expected =
      let one = [ "block1"; "block2"; "block3" ] in
      one
      @ List.concat (List.init 5 (fun _ -> one))
      @ [ "sync-trigger" ]
    in
    let* () =
      Env.with_page env p1 (fun () ->
          let* () = Util.exit_edit env in
          let* contents = Util.settled_page_blocks_contents env in
          Fest.deep_equal (Array.to_list contents) expected Fest.expect;
          Js.Promise.resolve ())
    in
    let* () =
      Env.with_page env p2 (fun () ->
          let* () = Util.exit_edit env in
          let* contents = Util.settled_page_blocks_contents env in
          Fest.deep_equal (Array.to_list contents) expected Fest.expect;
          Js.Promise.resolve ())
    in
    Rtc.validate_graphs_in_2_pages env p1 p2)

let () =
  if Util.is_main "test_rtc_extra_part2.js" then
  Fest.Promise.test "asset-blocks-validate-after-init-downloaded-test"
    (fun () ->
    let* env1, env2, graph_name = Lazy.force ready in
    let env = env1 in
    let p1 = Env.page env1 in
    let p2 = Env.page env2 in
    let* () = new_rtc_page env p1 p2 in
    let* page_title =
      Env.with_page env p1 (fun () -> Page.get_page_name env)
    in
    let* () =
      Env.with_page env p1 (fun () ->
          Playwright.on_event (Env.page env) "filechooser"
            (fun fc ->
              ignore
                (Playwright.file_chooser_set_files fc
                   [| "../assets/icon.png" |]));
          let* () = B.new_block env "asset block" in
          let* () = Util.input_command env "Upload an asset" in
          Pw.wait_for env ".ls-block img")
    in
    let* tx =
      Env.with_page env p1 (fun () ->
          Rtc.with_wait_tx_updated env (fun () ->
              B.new_block env "sync done"))
    in
    let* () =
      Env.with_page env p2 (fun () ->
          let* _ =
            Rtc.wait_tx_update_to env
              (Option.value ~default:0 tx.Rtc.remote_tx)
          in
          Js.Promise.resolve ())
    in
    let* () =
      Env.with_page env p2 (fun () ->
          let* () =
            Graph.remove_local_graph env graph_name
          in
          let* () =
            Graph.wait_for_remote_graph env graph_name
          in
          let* _ =
            Graph.switch_graph env graph_name ~wait_sync:true
              ~need_input_password:false
          in
          let* () = Page.goto_page env page_title in
          let* () = Pw.wait_for env ".ls-block img" in
          let* src = Pw.attr env ".ls-block img" "src" in
          Fest.deep_equal (src <> None) true Fest.expect;
          Js.Promise.resolve ())
    in
    Rtc.validate_graphs_in_2_pages env p1 p2)

let () =
  if Util.is_main "test_rtc_extra_part2.js" then
  Fest.Promise.test "issue-683-paste-large-block-test" (fun () ->
    let* env1, env2, _graph_name = Lazy.force ready in
    let env = env1 in
    let p1 = Env.page env1 in
    let p2 = Env.page env2 in
    let* () = new_rtc_page env p1 p2 in
    let large_text = read_utf8 "../clj-e2e/resources/large_text.txt" in
    let* () =
      Env.with_page env p1 (fun () ->
          let* () =
            Pw.eval_js env
              ("navigator.clipboard.writeText("
              ^ Pw.json_stringify large_text
              ^ ")")
          in
          Js.Promise.resolve ())
    in
    let* tx =
      Env.with_page env p1 (fun () ->
          Rtc.with_wait_tx_updated env (fun () ->
              let* () = B.new_block env "" in
              B.paste env))
    in
    let* () =
      Env.with_page env p2 (fun () ->
          let* _ =
            Rtc.wait_tx_update_to env
              (Option.value ~default:0 tx.Rtc.remote_tx)
          in
          Js.Promise.resolve ())
    in
    Rtc.validate_graphs_in_2_pages env p1 p2)
