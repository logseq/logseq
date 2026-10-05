(** Page operations, mirroring clj-e2e's [page.clj]. Named [Ls_page] because
    [Page] collides conceptually with the Playwright page handle. *)

open Fest.Promise

let get_page_name env =
  Util.get_text env "div[data-testid='page title'] .block-title-wrap"

(** clj's goto-page only clicks the search result; a dropped click can
    leave the client on whatever page it was on (e.g. today's journal),
    which later ops then write into.  Poll the visible page title and
    retry the whole search+click until the app actually lands. *)
let goto_page env page_name =
  let landed () =
    Pw.catch_timeout
      (let* t = get_page_name env in
       if String.lowercase_ascii t = String.lowercase_ascii page_name
       then Js.Promise.resolve true
       else Js.Promise.resolve false)
      (fun () -> Js.Promise.resolve false)
  in
  let rec wait_landed n =
    let* ok = landed () in
    if ok then Js.Promise.resolve true
    else if n <= 0 then Js.Promise.resolve false
    else
      let* () = Util.wait_timeout env 200. in
      wait_landed (n - 1)
  in
  let rec attempt n =
    if n <= 0 then
      Js.Promise.reject
        (Failure ("goto_page: never landed on " ^ page_name))
    else
      let* () =
        Pw.catch_timeout
          (Util.search_and_click env page_name)
          (fun () ->
            let* () = Keyboard.esc env in
            Util.search_and_click env page_name)
      in
      let* ok = wait_landed 40 in
      if ok then Js.Promise.resolve ()
      else
        let* () = Keyboard.esc env in
        attempt (n - 1)
  in
  attempt 3

let new_page env title =
  let create_item env =
    Ls_locator.filter env ".search-results > div"
      ~has_text:(Printf.sprintf "Create page called '%s'" title)
  in
  let attempt env =
    let* () = Util.search env title in
    let item = create_item env in
    let* () = Pw.wait_for_l item in
    Pw.click_l (Playwright.locator_first item)
  in
  let* () =
    Pw.catch_timeout
      (attempt env)
      (fun () ->
        let* () = Keyboard.esc env in
        attempt env)
  in
  Util.wait_editor_visible env

let delete_page env page_name =
  let* () = goto_page env page_name in
  let* () = Pw.click env ".toolbar-dots-btn" in
  let* () = Pw.click env "[role='menuitem'] div:text('Delete page')" in
  Pw.click env "div[role='alertdialog'] button:text('Confirm')"

let rename_page env old_name new_name =
  let* () = goto_page env old_name in
  let* () = Pw.click env "div[data-testid='page title']" in
  let* () = Block.save_block env new_name in
  Keyboard.esc env

let rec set_tag_extends env ?(retry_count = 20) extends =
  Pw.catch_timeout
    (let* () = Util.wait_timeout env 500. in
     let* () =
       Pw.click_l
         (Ls_locator.filter env ".property-value" ~has_text:"root tag")
     in
     let option_selector parent_tag =
       Printf.sprintf ".ui__dropdown-menu-content a.menu-link:has-text('%s')"
         parent_tag
     in
     let rec click_each = function
       | [] -> Js.Promise.resolve ()
       | tag :: rest ->
           let* () = Pw.click env (option_selector tag) in
           click_each rest
     in
     let* () = click_each extends in
     if List.mem "Root Tag" extends then Js.Promise.resolve ()
     else Pw.click env (option_selector "Root Tag"))
    (fun () ->
      if retry_count <= 0 then
        Js.Promise.reject (Failure "parent-tag not found")
      else
        let* () = Keyboard.esc env in
        set_tag_extends env ~retry_count:(retry_count - 1) extends)

let convert_to_tag ?(extends = []) env page_name =
  let* () = goto_page env page_name in
  let* () = Pw.click_right env "div[data-testid='page title']" in
  let* () =
    Pw.click_l
      (Ls_locator.filter env "div[role='menuitem']" ~has_text:"convert to tag")
  in
  let* _ = E2e_assert.is_visible env ".ls-page-icon" in
  match extends with
  | [] -> Js.Promise.resolve ()
  | es ->
      let* () = set_tag_extends env es in
      Keyboard.esc env
