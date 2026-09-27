(* Page-level .block-add-button. pages/page.ml is owned by another area and
   renders only .page-blocks-inner, so the trailing "click to add block" row
   (cljs components/page.cljs add-button-inner) is injected imperatively:
   a MutationObserver appends it to .page-blocks-inner whenever the page
   subtree mounts/remounts and it's missing. Clicks are delegated to
   Editor_keys' document-level listener (closest .block-add-button). *)

open Editor_dom

let build_el () =
  let btn = create_element "div" in
  el_set_class btn
    "ls-block block-add-button flex-1 flex-col rounded-sm cursor-text \
     transition-opacity ease-in duration-100 !py-0 opacity-0";
  el_set_attr btn "tab-index" "0";
  (match !Runtime.current_page with
  | Some p -> (
      match p.Model.page_uuid with
      | Some u -> el_set_attr btn "parentblockid" u
      | None -> ())
  | None -> ());
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
let refresh_opacity btn =
  let cls =
    if Editor_state.ready () && Editor_state.editing () <> None then
      "ls-block block-add-button flex-1 flex-col rounded-sm cursor-text \
       transition-opacity ease-in duration-100 !py-0 opacity-0"
    else
      match !Runtime.current_page with
      | Some p when p.Model.page_blocks <> [] ->
          "ls-block block-add-button flex-1 flex-col rounded-sm \
           cursor-text transition-opacity ease-in duration-100 !py-0 \
           opacity-0"
      | _ ->
          "ls-block block-add-button flex-1 flex-col rounded-sm \
           cursor-text transition-opacity ease-in duration-100 !py-0 \
           opacity-50"
  in
  el_set_class btn cls;
  match !Runtime.current_page with
  | Some p -> (
      match p.Model.page_uuid with
      | Some u -> el_set_attr btn "parentblockid" u
      | None -> ())
  | None -> ()

let ensure_all () =
  for_each_selector ".page-blocks-inner" (fun parent ->
      match el_query parent ".block-add-button" with
      | Some existing -> refresh_opacity existing
      | None -> el_append_child parent (build_el ()))

let installed = ref false

let install () =
  if not !installed then begin
    installed := true;
    let obs = new_observer (fun () -> ensure_all ()) in
    observe obs document_element
      (observe_opts ~childList:true ~subtree:true)
  end
