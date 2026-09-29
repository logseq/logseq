(* Page-level .block-add-button. pages/page.ml is owned by another area and
   renders only .page-blocks-inner, so the trailing "click to add block" row
   (cljs components/page.cljs add-button-inner) is injected imperatively:
   a MutationObserver appends it to .page-blocks-inner whenever the page
   subtree mounts/remounts and it's missing. Clicks are delegated to
   Editor_keys' document-level listener (closest .block-add-button). *)

open Editor_dom

let set_parent_attr btn puuid = el_set_attr btn "parentblockid" puuid

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
   edited or when the page already has children *)
let refresh_opacity ?puuid btn =
  let cls =
    if Editor_state.ready () && Editor_state.editing () <> None then
      "ls-block block-add-button flex-1 flex-col rounded-sm cursor-text \
       transition-opacity ease-in duration-100 !py-0 opacity-0"
    else
      let page_of uuid =
        List.find_opt
          (fun (p : Model.page) -> p.Model.page_uuid = Some uuid)
          !Runtime.current_journals
      in
      let has_children =
        match puuid with
        | Some u -> (
            match page_of u with
            | Some p -> p.Model.page_blocks <> []
            | None -> (
                match !Runtime.current_page with
                | Some p -> p.Model.page_blocks <> []
                | None -> false))
        | None -> (
            match !Runtime.current_page with
            | Some p -> p.Model.page_blocks <> []
            | None -> false)
      in
      if has_children then
        "ls-block block-add-button flex-1 flex-col rounded-sm \
         cursor-text transition-opacity ease-in duration-100 !py-0 \
         opacity-0"
      else
        "ls-block block-add-button flex-1 flex-col rounded-sm cursor-text \
         transition-opacity ease-in duration-100 !py-0 opacity-50"
  in
  el_set_class btn cls;
  match puuid with
  | Some u -> set_parent_attr btn u
  | None -> ()

let ensure_all () =
  for_each_selector ".page-blocks-inner" (fun parent ->
      let puuid =
        match el_get_attr parent "data-pu" with
        | Some u -> Some u
        | None -> (
            match !Runtime.current_page with
            | Some p -> p.Model.page_uuid
            | None -> None)
      in
      match el_query parent ".block-add-button" with
      | Some existing -> refresh_opacity ?puuid existing
      | None -> el_append_child parent (build_el ?puuid ()))

let installed = ref false

let install () =
  if not !installed then begin
    installed := true;
    let obs = new_observer (fun () -> ensure_all ()) in
    observe obs document_element
      (observe_opts ~childList:true ~subtree:true);
    ensure_all ()
  end
