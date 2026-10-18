(** Port of flashcards_basic_test.clj. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

let open_flashcards env =
  let* () = Util.double_esc env in
  let* visible = Pw.visible env ".flashcards-nav" in
  let* () =
    if not visible then
      let* () = Pw.click env "#left-menu" in
      Pw.wait_for env ".flashcards-nav"
    else Js.Promise.resolve ()
  in
  let* _ =
    Pw.eval_js_arg env
      "selector => document.querySelector(selector)?.click()"
      ".flashcards-nav a"
  in
  E2e_assert.is_visible env "#cards-modal"

let select_cards_option env label =
  let* () = Pw.click env "#cards-modal [role='combobox']" in
  Pw.click_l
    (Ls_locator.filter env ~has_text:label "[role='option']")

let click_flashcards_plus env = Pw.click env "#ls-cards-add"

let page_name_arg = function Some n -> Api.str n | None -> Api.null

let setup_flashcards_data env ~page_name ~tag_a ~tag_b ~card_a ~card_b ~query_a
    ~query_b =
  let* _ =
    Api.ls_api_call env "editor.appendBlockInPage"
      [| page_name_arg page_name; Api.str (card_a ^ " #Card #" ^ tag_a) |]
  in
  let* _ =
    Api.ls_api_call env "editor.appendBlockInPage"
      [| page_name_arg page_name; Api.str (card_b ^ " #Card #" ^ tag_b) |]
  in
  let* cards =
    Api.ls_api_call env "editor.getTag" [| Api.str "logseq.class/Cards" |]
  in
  let cards_id =
    match Api.get_id cards () with
    | Some n -> float_of_int n
    | None -> failwith "cards id missing"
  in
  let* cards_a =
    Api.ls_api_call env "editor.appendBlockInPage"
      [| page_name_arg page_name;
         Api.str "Cards A";
         Api.obj [ ("properties", Api.obj [ ("block/tags", Api.arr [| Api.num cards_id |]) ]) ] |]
  in
  let* cards_b =
    Api.ls_api_call env "editor.appendBlockInPage"
      [| page_name_arg page_name;
         Api.str "Cards B";
         Api.obj [ ("properties", Api.obj [ ("block/tags", Api.arr [| Api.num cards_id |]) ]) ] |]
  in
  let query_a_id : Js.Json.t =
    Option.get (Js.Nullable.toOption (Api.get cards_a ":logseq.property/query"))
  in
  let query_b_id : Js.Json.t =
    Option.get (Js.Nullable.toOption (Api.get cards_b ":logseq.property/query"))
  in
  let* _ =
    Api.ls_api_call env "editor.updateBlock"
      [| query_a_id; Api.str query_a |]
  in
  Api.ls_api_call env "editor.updateBlock"
    [| query_b_id; Api.str query_b |]

let get_page_name env =
  let* page = Api.ls_api_call env "editor.getCurrentPage" [||] in
  Js.Promise.resolve (Api.get_string page "name")

let () =
  Fest.Promise.test "flashcards-plus-and-switching-test" (fun () ->
    let* env = env in
    let* () = Util.goto_journals env in
    let tag_a = "fc-tag-a" in
    let tag_b = "fc-tag-b" in
    let card_a = "Card A" in
    let card_b = "Card B" in
    let query_a = "[[" ^ tag_a ^ "]]" in
    let query_b = "[[" ^ tag_b ^ "]]" in
    let* page_name = get_page_name env in
    let* _ =
      setup_flashcards_data env ~page_name ~tag_a ~tag_b ~card_a ~card_b
        ~query_a ~query_b
    in
    let* _ = open_flashcards env in
    let* () = click_flashcards_plus env in
    let* () = Pw.wait_for env ".ls-block .tag:has-text('Cards')" in
    let* _ = open_flashcards env in
    let* () = select_cards_option env "Cards A" in
    let* _ =
      E2e_assert.is_visible env
        (Printf.sprintf "#cards-modal .ls-card :text('%s')" card_a)
    in
    let* () =
      E2e_assert.have_count env
        (Printf.sprintf "#cards-modal .ls-card :text('%s')" card_b)
        0
    in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env ~has_text:"1/1"
           "#cards-modal .text-sm.opacity-50")
    in
    let* () = select_cards_option env "Cards B" in
    let* _ =
      E2e_assert.is_visible env
        (Printf.sprintf "#cards-modal .ls-card :text('%s')" card_b)
    in
    let* () =
      E2e_assert.have_count env
        (Printf.sprintf "#cards-modal .ls-card :text('%s')" card_a)
        0
    in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env ~has_text:"1/1"
           "#cards-modal .text-sm.opacity-50")
    in
    let* () = select_cards_option env "All cards" in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env ~has_text:"1/2"
           "#cards-modal .text-sm.opacity-50")
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test
    "flashcards-untitled-cards-block-lists-by-query-page-names-test" (fun () ->
    let* env = env in
    let tag_a = "fc-tag-a" in
    let card_a = "Card A" in
    let query_a = "[[" ^ tag_a ^ "]]" in
    let* () = Keyboard.esc env in
    let* _ = E2e_assert.is_hidden env "#cards-modal" in
    let* () = Util.goto_journals env in
    let* page_name = get_page_name env in
    let* cards =
      Api.ls_api_call env "editor.getTag" [| Api.str "logseq.class/Cards" |]
    in
    let cards_id =
      match Api.get_id cards () with
      | Some n -> float_of_int n
      | None -> failwith "cards id missing"
    in
    let* untitled_cards =
      Api.ls_api_call env "editor.appendBlockInPage"
        [| page_name_arg page_name;
           Api.str "";
           Api.obj [ ("properties", Api.obj [ ("block/tags", Api.arr [| Api.num cards_id |]) ]) ] |]
    in
    let query_id : Js.Json.t =
      Option.get
        (Js.Nullable.toOption
           (Api.get untitled_cards ":logseq.property/query"))
    in
    let* _ =
      Api.ls_api_call env "editor.updateBlock"
        [| query_id; Api.str query_a |]
    in
    let* _ = open_flashcards env in
    let* () = Pw.click env "#cards-modal [role='combobox']" in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env ~has_text:query_a
           "[role='option']")
    in
    let uuid_re =
      Js.Re.fromString
        "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
    in
    let* () =
      E2e_assert.have_count_l
        (Ls_locator.filter env ~has_text:uuid_re "[role='option']")
        0
    in
    let* () =
      Pw.click_l
        (Ls_locator.filter env ~has_text:query_a
           "[role='option']")
    in
    let* _ =
      E2e_assert.is_visible env
        (Printf.sprintf "#cards-modal .ls-card :text('%s')" card_a)
    in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env ~has_text:"1/1"
           "#cards-modal .text-sm.opacity-50")
    in
    Fixtures.validate_graph env)
