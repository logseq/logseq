(* Page-level .block-add-button. pages/page.ml is owned by another area and
   renders only .page-blocks-inner, so the trailing "click to add block" row
   (cljs components/page.cljs add-button-inner) is injected imperatively:
   a MutationObserver appends it to .page-blocks-inner whenever the page
   subtree mounts/remounts and it's missing. Clicks are delegated to
   Editor_keys' document-level listener (closest .block-add-button). *)

open Web_dom

(* attr writes queue a mutation record even when the value is unchanged;
   the sync doc scan revisits this button on every flush, so only write
   when the value differs or the observer would spin forever *)
let set_parent_attr btn puuid =
  match el_get_attr btn "parentblockid" with
  | Some v when String.equal v puuid -> ()
  | _ -> el_set_attr btn "parentblockid" puuid

let build_el ?puuid () =
  let btn = create_element "div" in
  el_set_class btn
    "ls-block block-add-button flex-1 flex-col rounded-sm cursor-text \
     transition-opacity ease-in duration-100 !py-0 opacity-0";
  el_set_attr btn "tabindex" "0";
  (match puuid with Some u -> set_parent_attr btn u | None -> ());
  let row = create_element "div" in
  el_set_class row "flex flex-row";
  let bullet_wrap = create_element "div" in
  el_set_class bullet_wrap "flex items-center";
  el_set_attr bullet_wrap "style" "height: 28px; margin-left: 22px;";
  let container = create_element "span" in
  el_set_class container "bullet-container";
  let bullet = create_element "span" in
  el_set_class bullet "bullet";
  el_append_child container bullet;
  el_append_child bullet_wrap container;
  el_append_child row bullet_wrap;
  el_append_child btn row;
  btn

(* opacity matches cljs: hidden while a block on this page is being
   edited or when the page already has children — counted from the DOM
   (cljs child-uuids includes the unsaved blank block, which is not in
   the page model) *)
let refresh_opacity ?puuid ~has_children btn =
  let cls =
    if
      (Editor_state.ready () && Editor_state.editing () <> None)
      || has_children
    then
      "ls-block block-add-button flex-1 flex-col rounded-sm cursor-text \
       transition-opacity ease-in duration-100 !py-0 opacity-0"
    else
      "ls-block block-add-button flex-1 flex-col rounded-sm cursor-text \
       transition-opacity ease-in duration-100 !py-0 opacity-50"
  in
  (match el_get_attr btn "class" with
   | Some c when String.equal c cls -> ()
   | _ -> el_set_class btn cls);
  match puuid with
  | Some u -> set_parent_attr btn u
  | None -> ()

let ensure_all roots =
  for_each_touched roots ".page-blocks-inner" (fun parent ->
      let puuid =
        match el_get_attr parent "data-pu" with
        | Some u -> Some u
        | None -> (
            match !Runtime.current_page with
            | Some p -> p.Model.page_uuid
            | None -> None)
      in
      let has_children =
        match el_query parent ".ls-block:not(.block-add-button)" with
        | Some _ -> true
        | None -> false
      in
      match el_query parent ".block-add-button" with
      | Some existing -> refresh_opacity ?puuid ~has_children existing
      | None -> el_append_child parent (build_el ?puuid ()))

let installed = State_cell.Once.make ()

let install () =
  State_cell.Once.run installed (fun () ->
      (* sync: cljs renders add-button-inner inside the page component, so
         the row exists atomically with the blocks. Debounced injection
         leaves the row absent for ~60ms after a (re)mount — visible as a
         shorter journal item on remount *)
      register_doc_scan ~sync:true ensure_all)
