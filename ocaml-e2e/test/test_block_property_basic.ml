(** Port of block_property_basic_test.clj. *)

open Fest.Promise

module B = Block
module Page = Ls_page
module K = Keyboard
module Loc = Ls_locator
module Assert = E2e_assert
module Json = Js.Json

let env = Fixtures.shared_open_page ()

let rec iter_seq f = function
  | [] -> Js.Promise.resolve ()
  | x :: xs ->
      let* () = f x in
      iter_seq f xs

let add_property_through_ui env property_name property_type =
  let* () = Util.input_command env "Add property" in
  let* () = Pw.click env "input[placeholder]" in
  let* () = Util.input env property_name in
  let* () = Pw.click_l (Util.get_by_text env "New option:" false) in
  Pw.click_l
    (Loc.and_l (Pw.q env "span") (Util.get_by_text env property_type true))

(** clj: [(let [r (ls-api-call! :editor.getBlockProperty uuid prop)]
    (if (instance? Map r) (get r "value") r))] *)
let block_value env uuid property_name =
  let* result =
    Api.ls_api_call env "editor.getBlockProperty"
      [| Json.string uuid; Json.string property_name |]
  in
  match Js.Nullable.toOption result with
  | None -> Js.Promise.resolve Json.null
  | Some v -> (
      match Js.Nullable.toOption (Api.get v "value") with
      | Some inner -> Js.Promise.resolve inner
      | None -> Js.Promise.resolve v)

let open_flashcards env =
  let* () = Util.double_esc env in
  let* open_ = Pw.visible env "#left-sidebar.is-open" in
  let* () =
    if not open_ then
      let* () = Pw.click env "#left-menu" in
      let* _ = Pw.wait_for env "#left-sidebar.is-open" in
      Js.Promise.resolve ()
    else Js.Promise.resolve ()
  in
  let* _ = Pw.wait_for env ".flashcards-nav" in
  let* () = Pw.click env ".flashcards-nav a" in
  let* _ = Assert.is_visible env "#cards-modal" in
  Js.Promise.resolve ()

let wait_for_property_type env property_name expected_type =
  let rec loop remaining =
    let* prop =
      Api.ls_api_call env "editor.getProperty"
        [| Json.string property_name |]
    in
    let actual_type = Api.get_string prop "type" in
    if actual_type = Some expected_type || remaining = 0 then
      Js.Promise.resolve actual_type
    else
      let* () = Util.wait_timeout env 50. in
      loop (remaining - 1)
  in
  loop 20

let current_page_name env = Page.get_page_name env

let () =
  Fest.Promise.test
    "references-embeds-and-mounted-instance-refresh-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let target_page = "block sample target" in
    let source_page = "block sample source" in
    let* () = Page.new_page env target_page in
    let* target =
      Api.ls_api_call env "editor.appendBlockInPage"
        [| Json.string target_page; Json.string "target parent" |]
    in
    let target_uuid = Option.get (Api.get_string target "uuid") in
    let* _ =
      Api.ls_api_call env "editor.insertBlock"
        [| Json.string target_uuid;
           Json.string "target child";
           Api.obj [ ("sibling", Json.boolean false) ] |]
    in
    let* () = Page.new_page env source_page in
    let* () = B.new_block env ("[[" ^ target_page ^ "]]") in
    let* () = B.new_block env "" in
    let* () = Util.input_command env "Node embed" in
    let* () = Util.press_seq env ~delay:20. target_page in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".ui__popover-content a.menu-link.chosen"
           ~has_text:target_page)
    in
    let* () = K.enter env in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".embed-block"
           ~has_text:"target child")
    in
    let* _ =
      Api.ls_api_call env "editor.openInRightSidebar"
        [| Json.string target_uuid |]
    in
    let* () =
      Pw.click env
        (Printf.sprintf ".cp__right-sidebar #block-content-%s" target_uuid)
    in
    let* () = Pw.fill env Util.editor_q "target parent updated" in
    let* () = Util.exit_edit env in
    let* () =
      iter_seq
        (fun container ->
          Assert.is_visible_l
            (Loc.filter env container
               ~has_text:"target parent updated"))
        [ "#main-content-container"; ".cp__right-sidebar" ]
    in
    let* () = Page.goto_page env target_page in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".references"
           ~has_text:source_page)
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test
    "unlinked-reference-filter-and-breadcrumb-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let target = "reference sample target" in
    let include_page = "reference include" in
    let exclude_page = "reference exclude" in
    let* () = Page.new_page env target in
    let* parent =
      Api.ls_api_call env "editor.appendBlockInPage"
        [| Json.string target; Json.string "target nested parent" |]
    in
    let parent_uuid = Option.get (Api.get_string parent "uuid") in
    let* child =
      Api.ls_api_call env "editor.insertBlock"
        [| Json.string parent_uuid;
           Json.string "target nested child";
           Api.obj [ ("sibling", Json.boolean false) ] |]
    in
    let child_uuid = Option.get (Api.get_string child "uuid") in
    let* () = Page.new_page env include_page in
    let* () = B.new_block env (target ^ " plain mention") in
    let* () = Page.new_page env exclude_page in
    let* () = B.new_block env (target ^ " another mention") in
    let* () = Page.goto_page env target in
    let* () =
      Pw.click env ".unlinked-references .ls-foldable-title-control"
    in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".unlinked-references"
           ~has_text:include_page)
    in
    let* () =
      Pw.click env ".unlinked-references button:has(.ls-icon-search)"
    in
    let* () =
      Pw.fill env ".unlinked-references .view-action-search input"
        include_page
    in
    let* () =
      Assert.have_count_l
        (Loc.filter env ".unlinked-references .ls-view-body"
           ~has_text:exclude_page)
        0
    in
    let* () = Pw.click env (Printf.sprintf "#dot-%s" child_uuid) in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".breadcrumb"
           ~has_text:"target nested parent")
    in
    let* _ =
      Api.ls_api_call env "editor.updateBlock"
        [| Json.string parent_uuid;
           Json.string "target renamed parent" |]
    in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".breadcrumb"
           ~has_text:"target renamed parent")
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "flashcard-rating-advances-once-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* page_name = current_page_name env in
    let* _ =
      Api.ls_api_call env "editor.appendBlockInPage"
        [| Json.string page_name;
           Json.string "sample card one #Card" |]
    in
    let* _ =
      Api.ls_api_call env "editor.appendBlockInPage"
        [| Json.string page_name;
           Json.string "sample card two #Card" |]
    in
    let* () = open_flashcards env in
    let* () = Pw.click env "#card-answers" in
    let* () =
      Assert.is_visible_l
        (Loc.filter env "#cards-modal" ~has_text:"Again")
    in
    let* before = Util.get_text env "#cards-modal" in
    let* () = Pw.click env "#card-good" in
    let* after = Util.get_text env "#cards-modal" in
    Fest.deep_equal (before <> after) true Fest.expect;
    let* () =
      Assert.have_count env "#cards-modal .card-rating-loading" 0
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "multi-target-comment-draft-edit-delete-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () =
      B.new_blocks env [ "comment sample a"; "comment sample b" ]
    in
    let* () = B.select_blocks env 2 in
    let* () = Util.search_and_click env "Add comment" in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".ls-comments-area"
           ~has_text:"those blocks")
    in
    let* () =
      Pw.fill env ".ls-comment-add textarea" "draft sample comment"
    in
    let* () = K.esc env in
    let* () =
      Assert.have_count_l
        (Loc.filter env ".ls-comment-row"
           ~has_text:"draft sample comment")
        0
    in
    let reply_placeholder =
      Loc.filter env ".ls-comment-reply-placeholder"
        ~has_text:"draft sample comment"
    in
    let* () = Assert.is_visible_l reply_placeholder in
    let* () = Pw.click_l reply_placeholder in
    let* v = Pw.input_value env ".ls-comment-add textarea" in
    Fest.deep_equal v "draft sample comment" Fest.expect;
    let* () =
      Pw.fill env ".ls-comment-add textarea" "saved sample comment"
    in
    let* () = Pw.click env ".ls-comment-submit" in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".ls-comment-row"
           ~has_text:"saved sample comment")
    in
    let* () =
      Pw.click env ".ls-comment-row button[aria-label='Click to edit']"
    in
    let* () =
      Pw.fill env ".ls-comment-row textarea" "edited sample comment"
    in
    let* () = K.enter env in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".ls-comment-row"
           ~has_text:"edited sample comment")
    in
    let* () = Pw.click env ".ls-comment-row button[title='Delete']" in
    let* () = Assert.have_count env ".ls-comment-row" 0 in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "block-and-comment-reaction-toggle-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () =
      B.new_blocks env [ "reaction sample a"; "reaction sample b" ]
    in
    let* () = B.select_blocks env 2 in
    let* () = Util.search_and_click env "Add reaction" in
    let* () = Pw.fill env ".ls-icon-picker input" "thumbs up" in
    let* () =
      Pw.click env ".ls-icon-picker button:has(em-emoji[id='+1'])"
    in
    let* () =
      Assert.have_count env
        ".ls-page-blocks .ls-block-reactions \
         button:has(em-emoji[id='+1'])"
        2
    in
    let* () =
      Pw.click env
        ".ls-page-blocks .ls-block:has-text('reaction sample a') \
         .ls-block-reactions button:has(em-emoji[id='+1'])"
    in
    let* () =
      Assert.have_count env
        ".ls-page-blocks .ls-block:has-text('reaction sample a') \
         .ls-block-reactions button:has(em-emoji[id='+1'])"
        0
    in
    let* () =
      Pw.click_l
        (Loc.filter env ".block-title-wrap"
           ~has_text:"reaction sample b")
    in
    let* () = Util.search_and_click env "Add comment" in
    let* () = Pw.fill env ".ls-comment-add textarea" "reaction comment" in
    let* () = Pw.click env ".ls-comment-submit" in
    let* () =
      Pw.click env ".ls-comment-row button[title='Add reaction']"
    in
    let* () = Pw.fill env ".ls-icon-picker input" "red heart" in
    let* () =
      Pw.click env ".ls-icon-picker button:has(em-emoji[id='heart'])"
    in
    let* () =
      Assert.have_count env
        ".ls-comment-row .ls-block-reactions \
         button:has(em-emoji[id='heart'])"
        1
    in
    let* () =
      Assert.have_count env
        ".ls-page-blocks .ls-block-reactions \
         button:has(em-emoji[id='heart'])"
        1
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "icon-and-structural-tag-visibility-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let page_name = "icon sample page" in
    let* () = Page.new_page env page_name in
    let* () = Util.exit_edit env in
    let* () = Pw.click env "button:text('Add icon')" in
    let* () = Pw.fill env ".cp__emoji-icon-picker input" "books" in
    let* () =
      Pw.click env
        ".cp__emoji-icon-picker button:has(em-emoji[id='books'])"
    in
    let* _ = Assert.is_visible env ".ls-page-icon" in
    let* () = B.new_block env "icon sample block" in
    let* () = Util.set_tag env "task" in
    let* () = Util.exit_edit env in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".block-tag" ~has_text:"task")
    in
    let* () =
      Assert.have_count_l
        (Loc.filter env ".block-tag" ~has_text:"Page")
        0
    in
    let* page_obj =
      Api.ls_api_call env "editor.getPage" [| Json.string page_name |]
    in
    let* _ =
      Api.ls_api_call env "editor.openInRightSidebar"
        [| Json.string (Option.get (Api.get_string page_obj "uuid")) |]
    in
    let* _ =
      Assert.is_visible env
        ".cp__right-sidebar .page-title em-emoji[id='books']" in
    let* () = Pw.click env ".ls-page-icon button" in
    let* () =
      Pw.click env ".cp__emoji-icon-picker button[data-action='del']"
    in
    let* () = Assert.have_count env "em-emoji[id='books']" 0 in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "property-create-and-name-validation-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = B.new_block env "property validation owner" in
    let* () = add_property_through_ui env "valid-property" "Text" in
    let* () =
      Assert.have_count_l
        (Loc.filter env ".property-k"
           ~has_text:"valid-property")
        1
    in
    let* () = B.open_last_block env in
    let* () = Util.input_command env "Add property" in
    let* () = Pw.click env "input[placeholder]" in
    let* () =
      Assert.have_count_l (Util.get_by_text env "New option:" false) 0
    in
    let* () = K.esc env in
    let* () =
      iter_seq
        (fun invalid_name ->
          let* () = B.open_last_block env in
          let* () = Util.input_command env "Add property" in
          let* () = Pw.click env "input[placeholder]" in
          let* () = Util.input env invalid_name in
          let* () =
            Pw.click_l (Util.get_by_text env "New option:" false)
          in
          let* () =
            Pw.click_l
              (Loc.and_l (Pw.q env "span")
                 (Util.get_by_text env "Text" true))
          in
          let* () =
            Assert.is_visible_l
              (Loc.filter env ".ui__toast.error"
                 ~has_text:"invalid property name")
          in
          let* () =
            iter_seq
              (fun message ->
                let toast =
                  Loc.filter env ".ui__toast.error"
                    ~has_text:message
                in
                let* vis = Pw.visible_l toast in
                if vis then Pw.click_l (Pw.sub toast ".ui__toast-close")
                else Js.Promise.resolve ())
              [ "Property failed to create"; "invalid property name" ]
          in
          K.esc env)
        [ "[[bad"; "#bad" ]
    in
    let* p1 =
      Api.ls_api_call env "editor.getProperty" [| Json.string "[[bad" |]
    in
    Fest.deep_equal
      (Js.Nullable.toOption p1 |> Option.is_some)
      false Fest.expect;
    let* p2 =
      Api.ls_api_call env "editor.getProperty" [| Json.string "#bad" |]
    in
    Fest.deep_equal
      (Js.Nullable.toOption p2 |> Option.is_some)
      false Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "scalar-property-value-validation-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* page_name = current_page_name env in
    let* block =
      Api.ls_api_call env "editor.appendBlockInPage"
        [| Json.string page_name;
           Json.string "scalar property owner" |]
    in
    let uuid = Option.get (Api.get_string block "uuid") in
    let* journal =
      Api.ls_api_call env "editor.createJournalPage"
        [| Json.string "2026-07-28T12:00:00" |]
    in
    let journal_id = Option.get (Api.get_int journal "id") in
    let* () =
      iter_seq
        (fun (property_name, property_type, valid_value, invalid_value) ->
          let* _ =
            Api.ls_api_call env "editor.upsertProperty"
              [| Json.string property_name;
                 Api.obj [ ("type", Json.string property_type) ] |]
          in
          let* _ =
            Api.ls_api_call env "editor.upsertBlockProperty"
              [| Json.string uuid;
                 Json.string property_name;
                 valid_value |]
          in
          let* v = block_value env uuid property_name in
          Fest.deep_equal
            (match Js.Json.decodeNull v with
            | Some _ -> false
            | None -> true)
            true Fest.expect;
          let property_row =
            Loc.filter env
              (Printf.sprintf "#ls-block-%s .bottom-property-pill" uuid)
              ~has_text:property_name
          in
          let* () =
            Pw.click_l
              (Pw.sub property_row ".bottom-property-content .jtrigger")
          in
          let* () = K.press env "ControlOrMeta+a" in
          let* () = Util.press_seq env ~delay:20. invalid_value in
          let* () = K.enter env in
          let* v2 = block_value env uuid property_name in
          Fest.deep_equal
            (Js.Json.decodeString v2 <> Some invalid_value)
            true Fest.expect;
          Js.Promise.resolve ())
        [ ( "sample-number", "number", Json.number (-12.5),
            "not-a-number" );
          ( "sample-date", "date",
            Json.number (float_of_int journal_id), "not-a-date" ) ]
    in
    let property_name = "sample-url" in
    let initial_value = "https://logseq.com" in
    let updated_value = "https://docs.logseq.com" in
    let* _ =
      Api.ls_api_call env "editor.upsertProperty"
        [| Json.string property_name;
           Api.obj [ ("type", Json.string "url") ] |]
    in
    let* _ =
      Api.ls_api_call env "editor.upsertBlockProperty"
        [| Json.string uuid;
           Json.string property_name;
           Json.string initial_value |]
    in
    let* v = block_value env uuid property_name in
    Fest.deep_equal (Js.Json.decodeString v) (Some initial_value) Fest.expect;
    let* (collapsed : bool) =
      Pw.eval_js env
        (Printf.sprintf
           "(() => !!document.querySelector('#ls-block-%s .block-control \
            .rotating-arrow.collapsed'))()"
           uuid)
    in
    let* () =
      if collapsed then
        Pw.click_l
          (Loc.filter env
             (Printf.sprintf "#ls-block-%s .block-control" uuid))
      else Js.Promise.resolve ()
    in
    let property_row =
      Loc.filter env
        (Printf.sprintf "#ls-block-%s .property-pair" uuid)
        ~has_text:property_name
    in
    let* () =
      Pw.click_l (Pw.sub property_row ".property-block-container.jtrigger")
    in
    let* () = Util.input env updated_value in
    let* () = K.enter env in
    let* v2 = block_value env uuid property_name in
    Fest.deep_equal (Js.Json.decodeString v2) (Some updated_value) Fest.expect;
    let* _ = Util.refresh_until_graph_loaded env in
    let* _ =
      Assert.is_visible env (Printf.sprintf "#ls-block-%s" uuid) in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test
    "property-type-cardinality-and-checkbox-choice-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let property_name = "sample-schema-property" in
    let checkbox_property_name = "sample-checkbox-choice" in
    let* page_name = current_page_name env in
    let* block =
      Api.ls_api_call env "editor.appendBlockInPage"
        [| Json.string page_name;
           Json.string "schema property owner" |]
    in
    let uuid = Option.get (Api.get_string block "uuid") in
    let* _ =
      Api.ls_api_call env "editor.upsertProperty"
        [| Json.string property_name;
           Api.obj
             [ ("type", Json.string "default");
               ("cardinality", Json.string "many") ] |]
    in
    let* _ =
      Api.ls_api_call env "editor.upsertBlockProperty"
        [| Json.string uuid;
           Json.string property_name;
           Json.array [| Json.string "one"; Json.string "two" |] |]
    in
    let* v = block_value env uuid property_name in
    Fest.deep_equal
      (match Js.Json.decodeArray v with
      | Some a -> Array.length a
      | None -> -1)
      2 Fest.expect;
    let* () = Page.goto_page env property_name in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".ls-table-header-cell"
           ~has_text:property_name)
    in
    let* () =
      Pw.click_l
        (Playwright.locator_first
           (Loc.filter env ".ls-table-header-cell"
              ~has_text:property_name))
    in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".ls-property-dropdown"
           ~has_text:"Multiple values")
    in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".ls-property-dropdown"
           ~has_text:"Property type")
    in
    let* () = K.esc env in
    let* _ =
      Api.ls_api_call env "editor.upsertProperty"
        [| Json.string checkbox_property_name;
           Api.obj [ ("type", Json.string "default") ] |]
    in
    let* () = Page.goto_page env checkbox_property_name in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".ls-table-header-cell"
           ~has_text:checkbox_property_name)
    in
    let* () =
      Pw.click_l
        (Playwright.locator_first
           (Loc.filter env ".ls-table-header-cell"
              ~has_text:checkbox_property_name))
    in
    let* () =
      Pw.click_l
        (Loc.filter env "[role='menuitem']"
           ~has_text:"Property type")
    in
    let* () = Pw.click_l (Util.get_by_text env "Checkbox" true) in
    let* actual =
      wait_for_property_type env checkbox_property_name "checkbox"
    in
    Fest.deep_equal actual (Some "checkbox") Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test
    "property-default-description-position-and-hidden-state-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let property_name = "sample-configured-property" in
    let tag_name = "sample configured class" in
    let* property =
      Api.ls_api_call env "editor.upsertProperty"
        [| Json.string property_name;
           Api.obj [ ("type", Json.string "default") ] |]
    in
    let property_uuid = Option.get (Api.get_string property "uuid") in
    let* _ =
      Api.ls_api_call env "editor.upsertBlockProperty"
        [| Json.string property_uuid;
           Json.string "logseq.property/default-value";
           Json.string "sample default" |]
    in
    let* _ =
      Api.ls_api_call env "editor.upsertBlockProperty"
        [| Json.string property_uuid;
           Json.string "logseq.property/description";
           Json.string "sample description" |]
    in
    let* _ =
      Api.ls_api_call env "editor.createTag"
        [| Json.string tag_name;
           Api.obj
             [ ( "tagProperties",
                 Json.array
                   [| Api.obj [ ("name", Json.string property_name) ] |]
               ) ] |]
    in
    let* () = Page.new_page env "configured object host" in
    let* () = B.new_block env "configured object" in
    let* () = Util.set_tag env tag_name in
    let* () = Util.exit_edit env in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".property-pair"
           ~has_text:"sample default")
    in
    let* v =
      block_value env property_uuid "logseq.property/description"
    in
    Fest.deep_equal (Js.Json.decodeString v) (Some "sample description")
      Fest.expect;
    let* _ =
      Api.ls_api_call env "editor.upsertBlockProperty"
        [| Json.string property_uuid;
           Json.string "logseq.property/hide-empty-value";
           Json.boolean true |]
    in
    let* () =
      Assert.have_count_l
        (Loc.filter env ".property-pair"
           ~has_text:property_name)
        0
    in
    let* () = K.press env "p" in
    let* () = K.press env "a" in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".property-pair"
           ~has_text:"sample default")
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "property-delete-and-bidirectional-refresh-test"
    (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let property_name = "sample bidirectional" in
    let owner_tag = "SampleOwner" in
    let container_page = "bidirectional refresh host" in
    let* owner_class =
      Api.ls_api_call env "editor.createTag"
        [| Json.string owner_tag;
           Api.obj
             [ ( "tagProperties",
                 Json.array
                   [| Api.obj
                        [ ("name", Json.string property_name);
                          ( "schema",
                            Api.obj [ ("type", Json.string "node") ] ) ]
                   |] ) ] |]
    in
    let* property =
      Api.ls_api_call env "editor.getProperty"
        [| Json.string property_name |]
    in
    let* _ =
      Api.ls_api_call env "editor.upsertBlockProperty"
        [| Json.number
             (float_of_int (Option.get (Api.get_int property "id")));
           Json.string "logseq.property/classes";
           Json.number
             (float_of_int (Option.get (Api.get_int owner_class "id"))) |]
    in
    let* _ =
      Api.ls_api_call env "editor.upsertBlockProperty"
        [| Json.string
             (Option.get (Api.get_string owner_class "uuid"));
           Json.string "logseq.property.class/enable-bidirectional?";
           Json.boolean true |]
    in
    let* _ =
      Api.ls_api_call env "editor.createPage"
        [| Json.string container_page |]
    in
    let* owner =
      Api.ls_api_call env "editor.insertBlock"
        [| Json.string container_page;
           Json.string ("sample owner object #" ^ owner_tag) |]
    in
    let* target =
      Api.ls_api_call env "editor.createPage"
        [| Json.string "sample target object" |]
    in
    let* _ =
      Api.ls_api_call env "editor.upsertBlockProperty"
        [| Json.string (Option.get (Api.get_string owner "uuid"));
           Json.string property_name;
           Json.number
             (float_of_int (Option.get (Api.get_int target "id"))) |]
    in
    let* () = Page.goto_page env "sample target object" in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".ls-bidirectional-properties"
           ~has_text:"sample owner object")
    in
    let* _ =
      Api.ls_api_call env "editor.removeBlockProperty"
        [| Json.string (Option.get (Api.get_string owner "uuid"));
           Json.string property_name |]
    in
    let* () =
      Assert.have_count_l
        (Loc.filter env ".ls-bidirectional-properties"
           ~has_text:"sample owner object")
        0
    in
    let* _ =
      Api.ls_api_call env "editor.removeProperty"
        [| Json.string property_name |]
    in
    let* p =
      Api.ls_api_call env "editor.getProperty"
        [| Json.string property_name |]
    in
    Fest.deep_equal
      (Js.Nullable.toOption p |> Option.is_some)
      false Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "tag-inheritance-schema-and-object-view-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let parent_tag_name = "SampleParent" in
    let child_tag_name = "SampleChild" in
    let inherited_property = "sample-inherited-property" in
    let child_property = "sample-child-property" in
    let* parent_tag =
      Api.ls_api_call env "editor.createTag"
        [| Json.string parent_tag_name;
           Api.obj
             [ ( "tagProperties",
                 Json.array
                   [| Api.obj
                        [ ("name", Json.string inherited_property) ] |]
               ) ] |]
    in
    let* child_tag =
      Api.ls_api_call env "editor.createTag"
        [| Json.string child_tag_name;
           Api.obj
             [ ( "tagProperties",
                 Json.array
                   [| Api.obj [ ("name", Json.string child_property) ] |]
               ) ] |]
    in
    let* _ =
      Api.ls_api_call env "editor.addTagExtends"
        [| Json.number
             (float_of_int (Option.get (Api.get_int child_tag "id")));
           Json.number
             (float_of_int (Option.get (Api.get_int parent_tag "id"))) |]
    in
    let* () = Page.new_page env "tag object host" in
    let* page_name = current_page_name env in
    let* obj =
      Api.ls_api_call env "editor.appendBlockInPage"
        [| Json.string page_name;
           Json.string ("sample child object #" ^ child_tag_name);
           Api.obj
             [ ( "properties",
                 Api.obj [ (inherited_property, Json.string "kept") ] )
             ] |]
    in
    let* () = Page.goto_page env parent_tag_name in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".ls-view-body"
           ~has_text:"sample child object")
    in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".ls-table-header-cell"
           ~has_text:inherited_property)
    in
    let* _ =
      Api.ls_api_call env "editor.upsertBlockProperty"
        [| Json.string (Option.get (Api.get_string obj "uuid"));
           Json.string child_property;
           Json.string "child value" |]
    in
    let* () = Page.goto_page env child_tag_name in
    let* () =
      Assert.is_visible_l
        (Loc.filter env ".ls-view-body"
           ~has_text:"child value")
    in
    let* v =
      block_value env
        (Option.get (Api.get_string obj "uuid"))
        inherited_property
    in
    Fest.deep_equal (Js.Json.decodeString v) (Some "kept") Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "tag-template-dynamic-values-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let tag_name = "sample template class" in
    let template_page = "sample tag template" in
    let template_root = "sample template root" in
    let* () = Page.new_page env template_page in
    let* template =
      Api.ls_api_call env "editor.appendBlockInPage"
        [| Json.string template_page; Json.string template_root |]
    in
    let template_uuid = Option.get (Api.get_string template "uuid") in
    let* template_tag =
      Api.ls_api_call env "editor.getTag" [| Json.string "Template" |]
    in
    let* tag =
      Api.ls_api_call env "editor.createTag" [| Json.string tag_name |]
    in
    let* _ =
      Api.ls_api_call env "editor.upsertBlockProperty"
        [| Json.string template_uuid;
           Json.string "block/tags";
           (match Api.get_int template_tag "id" with
            | Some id -> Json.number (float_of_int id)
            | None -> Json.null) |]
    in
    let* _ =
      Api.ls_api_call env "editor.insertBatchBlock"
        [| Json.string template_uuid;
           Json.array
             [| Api.obj [ ("content", Json.string "template static child") ];
                Api.obj
                  [ ("content", Json.string "template date <% today %>") ]
             |];
           Api.obj [ ("sibling", Json.boolean false) ] |]
    in
    let* _ =
      Api.ls_api_call env "editor.upsertBlockProperty"
        [| Json.string template_uuid;
           Json.string "logseq.property/template-applied-to";
           Json.number
             (float_of_int (Option.get (Api.get_int tag "id"))) |]
    in
    let* () = Page.new_page env "sample templated object" in
    let* page_name = current_page_name env in
    let* obj =
      Api.ls_api_call env "editor.appendBlockInPage"
        [| Json.string page_name; Json.string "templated object" |]
    in
    let* _ =
      Api.ls_api_call env "editor.upsertBlockProperty"
        [| Json.string (Option.get (Api.get_string obj "uuid"));
           Json.string "block/tags";
           Json.number
             (float_of_int (Option.get (Api.get_int tag "id"))) |]
    in
    let* () =
      Assert.have_count_l
        (Loc.filter env ".ls-page-blocks"
           ~has_text:"template static child")
        1
    in
    let* _ = Assert.is_visible env ".page-reference" in
    let* _ = Util.refresh_until_graph_loaded env in
    let* () =
      Assert.have_count_l
        (Loc.filter env ".ls-page-blocks"
           ~has_text:"template static child")
        1
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "checkbox-property-toggle-persists-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let property_name = "e2e checkbox" in
    let* page_name = Page.get_page_name env in
    let* _ =
      Api.ls_api_call env "editor.upsertProperty"
        [| Json.string property_name;
           Api.obj [ ("type", Json.string "checkbox") ] |]
    in
    let* block =
      Api.ls_api_call env "editor.appendBlockInPage"
        [| Json.string page_name;
           Json.string "checkbox owner";
           Api.obj
             [ ("properties",
                Api.obj [ (property_name, Json.boolean false) ]) ] |]
    in
    let uuid = Option.get (Api.get_string block "uuid") in
    let checkbox =
      Pw.q env
        (Printf.sprintf "#ls-block-%s .bottom-property-pill" uuid)
    in
    let* () = Pw.click_l (Pw.sub checkbox "button[role='checkbox']") in
    let* () =
      Assert.is_visible_l
        (Pw.sub checkbox "button[role='checkbox'][data-checked]")
    in
    let* v = block_value env uuid property_name in
    Fest.deep_equal (Js.Json.decodeBoolean v) (Some true) Fest.expect;
    let* _ = Util.refresh_until_graph_loaded env in
    let* _ =
      Assert.is_visible env
        (Printf.sprintf "#ls-block-%s [role='checkbox'][data-checked]" uuid) in
    Fixtures.validate_graph env)
