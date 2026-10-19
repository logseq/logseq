open Lui_elements
open Promise_ext
module Prop = Ui_components.Prop
module Data = Handbook_data

type loader = {catalog:unit -> Data.t Js.Promise.t;online:unit -> int option Js.Promise.t}
type pane = Dashboard | Topics of string | Topic of string
type entry = {pane:pane;title:string}
type loading = Loading | Loaded of Data.t | Failed

let t = I18n.t
let load_catalog () =
  let* response=Fetch.fetch "https://handbooks.pages.dev/handbooks.edn" in
  if not (Fetch.Response.ok response) then failwith "Could not load Handbook content";
  let* source=Fetch.Response.text response in
  Js.Promise.resolve (Data.parse source)

let load_online () =
  let* response=Fetch.fetch "https://plugins.logseq.io/ds" in
  if not (Fetch.Response.ok response) then failwith "Could not load community presence";
  let* json=Fetch.Response.json response in
  let count=Option.bind (Js.Json.decodeObject json) (fun fields ->
    Option.bind (Js.Dict.get fields "approximate_presence_count") Js.Json.decodeNumber) in
  Js.Promise.resolve (Option.map int_of_float count)

let default_loader={catalog=load_catalog;online=load_online}
let background="var(--lx-handbook-bg)"
let foreground="var(--lx-handbook-body-fg)"
let state context initial =
  let value=Signal.state context.Lui_ui.ui_scheduler initial in
  Signal.on_dispose context.Lui_ui.ui_scope (fun () -> Signal.dispose_signal (Signal.value value));value

let typography size line weight child = Ui_components.with_props
  [Prop.font_size size;Prop.line_height line;Prop.font_weight weight] child

let icon_button ?identifier label name action =
  Ui_components.button ~variant:`ghost ~label:(t label) ?accessibility_identifier:identifier
    ~width:18 ~height:18 ~min_width:18 ~min_height:18 ~padding:0 ~gap:0
    ~background:"transparent" ~foreground:"var(--lx-handbook-heading-fg)"
    ~on_press:(fun _ -> action ()) [Icons.icon ~size:18. name]

let category_title (node:Data.node) = match node.key with
  | "1.getting_started" -> t "help/start"
  | "2.sync" -> t "help.handbook/sync"
  | _ -> node.title

let rich_block_tag = function
  | "p" | "pre" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  | "ul" | "ol" | "hr" | "div" | "blockquote" -> true
  | _ -> false

let rec rich_inline catalog from navigate nodes = List.concat_map (function
  | Render_html.Text value -> [text ~value:(Render_html.decode_entities value) []]
  | Render_html.Elem (tag,attrs,children) ->
    let content ()=rich_inline catalog from navigate children in
    match tag with
    | "p" -> [paragraph ~margin:0 ~font_size:"16px" ~line_height:"25.6px" (content ())]
    | "strong" | "b" -> [text ~font_weight:700 (content ())]
    | "em" | "i" -> [text ~font_style:"italic" (content ())]
    | "code" -> [text ~as_:`Code ~font_family:Bug_report.mono ~font_size:"13.6px"
        ~background:"var(--ls-secondary-background-color)" ~corner_radius:4 ~padding_horizontal:4 (content ())]
    | "pre" -> [text ~as_:`Pre ~white_space:"pre-wrap" ~margin:0 (content ())]
    | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" ->
      let level=int_of_string (String.sub tag 1 1) in
      let size,line,padding,weight=match level with
        | 1 -> "24px","32px",4,700
        | 2 -> "20px","28px",4,700
        | 3 -> "18px","28px",4,600
        | 4 -> "16px","24px",4,600
        | 5 -> "14px","20px",2,600
        | _ -> "12px","16px",2,600 in
      [heading ~level ~margin:0 ~padding_vertical:padding
        ~font_size:size ~line_height:line ~font_weight:weight (content ())]
    | "ul" | "ol" ->
      let ordered=tag="ol" in
      let first=match List.assoc_opt "start" attrs with None -> 1 | Some value -> int_of_string value in
      let _,items=List.fold_left (fun (number,items) -> function
        | Render_html.Text value when String.trim value="" -> number,items
        | Render_html.Elem ("li",attrs,children) ->
          let number=match List.assoc_opt "value" attrs with
            | Some value when ordered -> int_of_string value | _ -> number in
          let marker=if ordered then string_of_int number ^ "." else {js|•|js} in
          let marker=Ui_components.with_props
            [Prop.position `absolute;Prop.inset_left (-19.2);Prop.inset_top 0.;Prop.width 19]
            (text ~text_alignment:`center ~font_size:"16px" ~line_height:"24px" ~white_space:"nowrap" ~value:marker []) in
          let item=Ui_components.with_props [Prop.position `relative]
            (row ~as_:`Li ~gap:0 ~margin:0 ~padding:0 ~cross:`start ~min_width:0
              [marker;column ~grow:1. ~min_width:0 (rich_flow ~compact:true catalog from navigate children)]) in
          number+1,item::items
        | _ -> invalid_arg "Handbook list children must be list items") (first,[]) children in
      [column ~as_:(if ordered then `Ol else `Ul) ~gap:4 ~margin:0 ~margin_left:19
        ~padding:0 ~min_width:0 (List.rev items)]
    | "div" | "blockquote" -> [column ~min_width:0 (rich_flow ~compact:false catalog from navigate children)]
    | "br" -> [text ~value:"\n" []]
    | "hr" -> [divider ~height:1 ~margin:0 ~background:"var(--ls-border-color)" []]
    | "a" ->
      let href=List.assoc "href" attrs in
      (match Data.resolve catalog ~from href with
       | Data.External url -> [link ~url ~foreground:"var(--ls-link-text-color)"
           ~on_press:(fun _ -> Ui_services.env_open_url url) (content ())]
       | Data.Internal key -> [link ~url:("logseq://handbook/" ^ key)
           ~foreground:"var(--ls-link-text-color)" ~on_press:(fun _ -> navigate key) (content ())])
    | "img" -> [image ~url:(Data.asset_url (List.assoc "src" attrs))
        ~container_relative_frame:`horizontal ?label:(List.assoc_opt "alt" attrs) []]
    | "video" ->
      let source=match List.assoc_opt "src" attrs with Some value -> value | None ->
        List.find_map (function Render_html.Elem ("source",attrs,_) -> List.assoc_opt "src" attrs | _ -> None) children
        |> Option.get in
      [Logseq_el.el ~tag:"video" ~attrs:["src",Data.asset_url source;"controls","";"width","100%"] []]
    | "source" -> []
    | _ -> content ()) nodes

and rich_flow ~compact catalog from navigate nodes =
  let flush inline blocks=match inline with
    | [] -> blocks
    | _ -> `Inline (List.rev inline)::blocks in
  let inline,blocks=List.fold_left (fun (inline,blocks) node -> match node with
    | Render_html.Elem (tag,_,_) when rich_block_tag tag -> [],`Block node::flush inline blocks
    | Render_html.Text value when inline=[] && String.trim value="" -> inline,blocks
    | _ -> node::inline,blocks) ([],[]) nodes in
  let blocks=List.rev (flush inline blocks) in
  (* CSS block margins collapse; resolve sibling spacing once for both hosts. *)
  let margin = function
    | `Block (Render_html.Elem (("p" | "pre"),_,_)) -> 12
    | `Block (Render_html.Elem (("ul" | "ol"),_,_)) -> 4
    | `Block (Render_html.Elem ("hr",_,_)) -> 16
    | `Inline _ when not compact -> 12
    | _ -> 0 in
  let rec render previous = function
    | [] -> []
    | node::rest ->
      let current=margin node in
      let props=[Prop.margin_top (max previous current);
        Prop.margin_bottom (if rest=[] then current else 0)] in
      let elements=match node with
        | `Block node -> rich_inline catalog from navigate [node]
        | `Inline nodes -> [paragraph ~margin:0 ~font_size:"16px" ~line_height:"24px"
            (rich_inline catalog from navigate nodes)] in
      List.map (Ui_components.with_props props) elements @ render current rest in
  render 0 blocks

let rich_nodes catalog from navigate nodes = rich_flow ~compact:false catalog from navigate nodes

let media url =
  let url=Data.asset_url url in
  if List.exists (fun suffix -> String.ends_with ~suffix url) [".mp4";".webm";".mov"] then
    Logseq_el.el ~tag:"video" ~attrs:["src",url;"controls","";"width","100%"] []
  else image ~url ~container_relative_frame:`horizontal []

let panel ~loader ~close ~online context parent =
  let loaded=state context Loading and current=state context {pane=Dashboard;title=t "help.handbook/title"}
  and history=state context [] and query=state context "" and selected=state context None in
  let alive=ref true in
  let set signal value=Runtime.signal_set signal value in
  let commit ()=Runtime.flush () in
  let timer=Ui_services.timers_timeout (fun () ->
    ignore (Js.Promise.catch (fun error ->
      Ui_services.log_error error;
      if !alive then (set loaded Failed;commit ());
      Js.Promise.resolve ())
      (let* catalog=loader.catalog () in
       if !alive then (set loaded (Loaded catalog);commit ());Js.Promise.resolve ()))) 0 in
  Signal.on_dispose context.Lui_ui.ui_scope (fun () -> alive:=false;Ui_services.timers_clear_timeout timer);
  Ui_services.dom_subscribe_document_event ~scope:context.Lui_ui.ui_scope ~capture:true "keydown"
    (fun event ->
      if event.Ui_services.key=Some "Escape" && Option.exists
        (fun target -> Option.is_some (target.Ui_services.closest ".cp__handbooks-popup")) event.target then begin
        event.prevent_default ();event.stop_immediate ();
        if String.trim (Signal.get_state query)<>"" then (set query "";set selected None;commit ()) else close ()
      end);
  let clear ()=set query "";set selected None in
  let back ()=match Signal.get_state history with
    | previous::rest -> set current previous;set history rest;clear ();commit ()
    | [] -> set current {pane=Dashboard;title=t "help.handbook/title"};clear ();commit () in
  let home ()=set current {pane=Dashboard;title=t "help.handbook/title"};set history [];clear ();commit () in
  let navigate catalog pane title =
    let previous=Signal.get_state current in
    let same_chapters=match previous.pane,pane with
      | Topic from,Topic target ->
          List.assoc_opt from catalog.Data.parents=List.assoc_opt target catalog.parents ||
          String.starts_with ~prefix:(from ^ "/") target
      | _ -> false in
    if not same_chapters then set history (previous::Signal.get_state history);
    set current {pane;title};clear ();commit () in
  let loaded_view catalog =
    let open_topic key =
      let node=Data.require catalog key in
      let node=Option.get (Data.reading_node catalog node.key) in
      navigate catalog (Topic node.key) (Signal.get_state current).title in
    let results () = match (Signal.get_state current).pane with
      | Topics key -> Data.search ~within:key catalog (Signal.get_state query)
      | _ -> Data.search catalog (Signal.get_state query) in
    let chosen ()=let values=results () in match Signal.get_state selected with
      | Some key -> List.find_opt (fun (node:Data.node) -> node.key=key) values
      | None -> List.nth_opt values 0 in
    let move direction=let values=results () in
      let count=List.length values in
      if count>0 then begin
        let previous=match chosen () with None -> 0 | Some node ->
          let rec index i=function [] -> 0 | (item:Data.node)::rest -> if item.key=node.key then i else index (i+1) rest in
          index 0 values in
        set selected (Some (List.nth values ((previous+direction+count) mod count)).Data.key);commit ()
      end in
    let topic_card ?selected_signal (node:Data.node) =
      Ui_components.with_props
        [Prop.hover_background "var(--lx-handbook-hover-bg)";Prop.font_size "14px";
         Prop.line_height "20px";Prop.font_weight 400;Prop.white_space `normal]
        (button ~key:node.key ~accessibility_identifier:("handbook-topic-" ^ node.key)
          ~label:node.title ~variant:`ghost ~main:`start ~cross:`center ~gap:0
          ~min_width:0 ~min_height:64 ~padding_horizontal:12 ~padding_vertical:10 ~margin_bottom:8 ~corner_radius:8
          ~border_width:1 ~border_color:"var(--ls-border-color)" ~text_alignment:`start
          ~background:"var(--ls-secondary-background-color)" ~foreground
          ?selected_signal ~on_press:(fun _ -> open_topic node.key)
          ((match node.cover with None -> [] | Some url ->
            [Ui_components.with_props [Prop.padding_right 10]
              (row ~width:80 ~min_width:80 ~min_height:64 ~cross:`center
                [image ~url:(Data.asset_url url) ~width:70 ~margin_vertical:4 []])]) @
           [column ~grow:1. ~min_width:0 ~gap:0
             ([Ui_components.with_props [Prop.padding_top 2;Prop.padding_bottom 1]
                 (text ~font_weight:500 ~value:node.title [])] @
              match node.description with None -> [] | Some value -> [text ~font_size:"12px" ~line_height:"16px" ~value []])])) in
    let category_card ~id ~title ~subtitle ~color ~icon action =
      Ui_components.with_props [Prop.hover_background "var(--lx-handbook-hover-bg)";
        Prop.font_size "16px";Prop.line_height "24px";Prop.font_weight 400;Prop.overflow `hidden;Prop.white_space `normal]
        (button ~accessibility_identifier:id ~label:(title ^ " " ^ subtitle) ~variant:`ghost
          ~padding:0 ~min_height:72 ~min_width:0 ~main:`start ~cross:`stretch ~gap:0
          ~corner_radius:4 ~background:"var(--ls-secondary-background-color)" ~foreground
          ~on_press:(fun _ -> action ())
          [box ~width:4 ~min_width:4 ~background:color [];
           row ~padding_horizontal:12 ~padding_vertical:8 ~gap:8 ~cross:`center ~grow:1. ~min_width:0
             [Icons.icon ~size:20. icon;
              column ~min_width:0 ~grow:1. ~gap:4
                [text ~font_size:"14px" ~line_height:"17.5px" ~font_weight:500 ~value:title [];
                 text ~font_size:"12px" ~line_height:"16px" ~font_weight:400
                  ~foreground:"var(--ls-primary-text-color)" ~value:subtitle []]]]) in
    let section key=heading ~level:2 ~font_size:"16px" ~line_height:"24px" ~font_weight:500
      ~padding_vertical:8 ~foreground:"var(--lx-handbook-section-fg)" ~value:(t key) [] in
    let dashboard () = column ~padding_vertical:4 ~padding_horizontal:16 ~min_width:0
      [section "help.handbook/popular-topics";
       column (List.map topic_card (Data.popular catalog));
       section "help.handbook/help-categories";
       grid ~columns:2 ~gap:12
         (List.map (fun (node:Data.node) -> category_card ~id:("handbook-category-" ^ node.key)
           ~title:(category_title node) ~subtitle:(I18n.tf "help.handbook/topics-count" [string_of_int (List.length node.children)])
           ~color:(Option.value ~default:"var(--ls-secondary-background-color)" node.color)
           ~icon:(Option.value ~default:"chart-bubble" node.icon)
           (fun () -> navigate catalog (Topics node.key) (category_title node))) (Data.categories catalog) @
          [category_card ~id:"handbook-shortcuts" ~title:(t "help.shortcuts/label")
            ~subtitle:(I18n.tf "help.handbook/shortcuts-count"
              [string_of_int (Keymap_data.Command_map.cardinal Keymap_data.default_shortcuts)])
            ~color:"#2563EB" ~icon:"command" (fun () -> close ();Sidebar_state.open_shortcuts ())]) ] in
    let footer () =
      let card title description icon url extra = Ui_components.with_props [Prop.white_space `normal]
        (typography "14px" "20px" 400
        (button ~variant:`ghost ~label:(t title) ~padding:0 ~gap:4 ~min_width:0 ~grow:1.
          ~main:`start ~cross:`start ~text_alignment:`start ~background:"transparent" ~foreground
          ~on_press:(fun _ -> Ui_services.env_open_url url)
          [column ~min_width:0 ~gap:4 [row ~opacity:0.3 [Icons.icon ~size:26. icon];
             text ~font_weight:500 ~value:(t title) [];
             Ui_components.with_props [Prop.opacity 0.4]
               (text ~font_size:"12px" ~line_height:"16px" ~value:(t description) []);
             extra]])) in
      Ui_components.with_props [Prop.padding_top 20;Prop.padding_bottom 16]
        (row ~gap:12 ~cross:`stretch ~padding_horizontal:18
        ~background:"var(--lx-handbook-footer-bg)"
        [card "help.handbook/chat-on-discord" "help.handbook/chat-on-discord-desc" "brand-discord"
           "https://discord.gg/KpN4eHY"
           (row ~gap:8 ~margin_top:6 ~cross:`center
             [box ~width:8 ~height:8 ~corner_radius:4 ~background:"#22c55e" [];
              Ui_components.with_props [Prop.opacity 0.7] (text ~font_size:"12px" ~line_height:"16px"
                ~value:(reactive (fun value -> (match value with None -> "?" | Some value -> string_of_int value) ^
                  " " ^ t "help.handbook/users-online") (Signal.value online)) [])]);
         card "help.handbook/visit-the-forum" "help.handbook/visit-the-forum-desc" "message-dots"
           "https://discuss.logseq.com/"
           (row ~gap:4 ~margin_top:6 ~cross:`center [Icons.icon ~size:14. "bolt";
             Ui_components.with_props [Prop.opacity 0.7] (text ~font_size:"12px" ~line_height:"16px"
               ~value:("800+ " ^ t "help.handbook/monthly-posts") [])])]) in
    let search ()=Ui_components.with_props [Prop.padding_bottom 6] (column ~min_width:0
      [Ui_components.with_props [Prop.position `relative]
        (row ~margin_horizontal:16 ~margin_top:6 ~margin_bottom:8
          ~border_width:3 ~border_color:"var(--ls-primary-background-color)" ~corner_radius:8
          ~background:"var(--lx-handbook-search-bg)"
          [Ui_components.with_props
             [Prop.position `absolute;Prop.inset_top 6.;Prop.inset_left 7.;Prop.opacity 0.9;
              Prop.pointer_enabled false;Prop.line_height "24px"]
             (box [Icons.icon ~size:12. "search"]);
           Ui_components.with_props
             [Prop.height_auto]
             (typography "16px" "16px" 500
               (Ui_components.input ~grow:1. ~min_width:0 ~padding_horizontal:24 ~padding_vertical:7
                 ~background:"transparent" ~border_width:0 ~corner_radius:0
                 ~placeholder:(t "help.handbook/search-placeholder") ~label:(t "help.handbook/search-placeholder")
                 ~autofocus:true ~accessibility_identifier:"handbook-search"
                 ~text:(reactive Fun.id (Signal.value query))
                 ~on_input:(fun event -> match event with Lui_protocol.TextChanged (_,value) ->
                   set query value;set selected None;commit () | _ -> ())
                 ~on_navigate:(function Lui_protocol.NavigatePrevious _ -> move (-1)
                   | Lui_protocol.NavigateNext _ -> move 1 | _ -> ())
                 ~on_submit:(fun _ -> Option.iter (fun (node:Data.node) -> open_topic node.key) (chosen ())) []));
           if_ ~test:(reactive (fun value -> String.trim value<>"") (Signal.value query))
             (Ui_components.with_props [Prop.position `absolute;Prop.inset_top 7.;Prop.inset_right 6.;
                Prop.opacity 0.5;Prop.hover_opacity 0.8]
               (Ui_components.button ~variant:`ghost ~label:(t "help.handbook/clear-search")
                 ~width:12 ~height:24 ~min_width:0 ~min_height:0 ~padding:0 ~gap:0
                 ~background:"transparent" ~on_press:(fun _ ->
                   clear ();commit ();
                   let field=Option.get (Ui_services.dom_by_id "handbook-search") in
                   field.Ui_services.focus ())
                 [Icons.icon ~size:12. "x"]))]);
       if_ ~test:(reactive (fun value -> String.trim value<>"") (Signal.value query))
         (column ~padding_horizontal:18
           [keyed ~source:(reactive (fun value -> match (Signal.get_state current).pane with
               | Topics key -> Data.search ~within:key catalog value | _ -> Data.search catalog value) (Signal.value query))
             ~key:(fun (node:Data.node) -> node.key) ~cmp:String.compare
             ~mount:(fun node_signal context parent ->
               let node=Signal.get node_signal in
               (topic_card ~selected_signal:(reactive (fun selection _query -> match selection with
                 | Some key -> key=node.key | None -> Option.map (fun (node:Data.node) -> node.key) (chosen ())=Some node.key)
                   (Signal.value selected) (Signal.value query)) node) context parent)])]) in
    let detail key =
      let node=Data.require catalog key in
      let navigate key=open_topic key in
      let nodes=match node.content with None -> [] | Some source ->
        fst (Render_html.parse_nodes source 0 (String.length source) []) in
      Ui_components.with_props [Prop.padding_top 4;Prop.padding_bottom 20]
        (column ~padding_horizontal:16 ~min_width:0
        ([Ui_components.with_props [Prop.padding_bottom 4]
           (heading ~level:1 ~font_size:"24px" ~line_height:"32px" ~font_weight:600 ~margin:0 ~padding_vertical:0 ~value:node.title [])] @
         List.map media node.demos @
         [Ui_components.with_props [Prop.padding_top 4] (typography "16px" "24px" 400
           (column ~min_width:0 (rich_nodes catalog key navigate nodes)));
          row ~main:`space_between ~margin_top:16
            (List.map (fun (direction,label,icon) -> match Data.adjacent catalog key direction with
              | None -> spacer []
              | Some target -> Ui_components.button ~variant:`ghost ~size:`sm ~label:(t label)
                  ~on_press:(fun _ -> open_topic target.key)
                  [Icons.icon ~size:16. icon;text ~value:(t label) []])
              [`Prev,"help.handbook/prev-chapter","arrow-left";`Next,"help.handbook/next-chapter","arrow-right"])])) in
    column ~grow:1. ~min_height:0 [reactive (fun entry ->
      scroll ~key:(match entry.pane with Topic key -> key | Topics key -> key | Dashboard -> "dashboard")
        ~accessibility_identifier:"handbook-scroll" ~grow:1. ~min_height:0
        [column ~min_width:0
          (match entry.pane with
           | Topic key -> [detail key]
           | Topics key -> [search ();if_ ~test:(reactive (fun value -> String.trim value="") (Signal.value query))
               (column ~padding_horizontal:18 (List.map topic_card (Data.require catalog key).children))]
           | Dashboard -> [search ();if_ ~test:(reactive (fun value -> String.trim value="") (Signal.value query))
               (column [dashboard ();footer ()])])]) (Signal.value current)] in
  let copy ()=match (Signal.get_state current).pane with
    | Topic key ->
        let task=Ui_services.clipboard_write_text ("logseq://handbook/" ^ key) in
        Signal.on_dispose context.Lui_ui.ui_scope (fun () -> Ui_task.cancel task);
        ignore (Ui_task.catch
          (Ui_task.bind task (fun () -> if !alive then Toast.success (t "help.handbook/link-copied");Ui_task.resolve ()))
          (fun _ -> if !alive then Toast.error (t "help.handbook/copy-link-error");Ui_task.resolve ()))
    | _ -> () in
  let viewport=Ui_services.viewport_width_signal ~scheduler:context.Lui_ui.ui_scheduler ~scope:context.Lui_ui.ui_scope in
  Ui_components.with_props
    [Prop.position `fixed;Prop.inset_right 32.;Prop.inset_bottom 58.;
     Prop.max_height_viewport 0.86;Prop.overflow `hidden;
     Prop.shadow "0 10px 30px rgb(0 0 0 / 0.16)";Prop.font_size "16px";Prop.line_height "24px"]
    (popover ~role:`dialog ~accessibility_identifier:"handbook-panel" ~style_class:"cp__handbooks-popup"
      ~on_dismiss:(fun _ -> close ())
      ~transition:Ui_components.popover_transition ~width:420
      ~max_width:(reactive (fun width -> int_of_float (width-.64.)) viewport)
      ~height:686 ~padding:0 ~gap:0 ~corner_radius:8 ~border_width:1 ~border_color:"var(--ls-border-color)"
      ~background ~foreground
      [Ui_components.with_props [Prop.padding_top 12;Prop.padding_bottom 8]
        (row ~height:48 ~min_height:48 ~padding_horizontal:12 ~gap:12 ~main:`space_between ~cross:`center
         ~accessibility_identifier:"handbook-header"
         ~background ~foreground:"var(--lx-handbook-heading-fg)"
         [reactive (fun entry -> match entry.pane with
            | Dashboard -> heading ~level:1 ~font_size:"20px" ~line_height:"28px" ~font_weight:700
                ~grow:1. ~min_width:0 ~value:entry.title []
            | _ -> typography "20px" "28px" 700
                (button ~variant:`ghost ~accessibility_identifier:"handbook-back" ~label:entry.title
                  ~grow:1. ~max_width:292 ~min_width:0 ~main:`start ~padding:0 ~gap:8 ~background:"transparent"
                  ~foreground:"var(--lx-handbook-heading-fg)" ~on_press:(fun _ -> back ())
                  [Icons.icon ~size:18. "chevron-left";text ~grow:1. ~min_width:0
                    ~white_space:"nowrap" ~text_overflow:"ellipsis" ~value:entry.title []]))
            (Signal.value current);
          row ~gap:12 ~cross:`center
            [if_ ~test:(reactive (fun entries -> List.length entries>1) (Signal.value history))
               (icon_button "help.handbook/home" "home" home);
             if_ ~test:(reactive (fun entry -> match entry.pane with Topic _ -> true | _ -> false) (Signal.value current))
               (icon_button ~identifier:"handbook-copy-link" "help.handbook/copy-topic-link" "copy" copy);
             icon_button ~identifier:"handbook-close" "ui/close" "x" close]]);
       column ~grow:1. ~min_height:0 [reactive (function
         | Loading -> Ui_components.with_props [Prop.padding_top 128]
             (column ~cross:`center [text ~value:(t "ui/loading") []])
         | Failed -> column ~padding:18 [text ~accessibility_identifier:"handbook-load-error"
             ~value:(t "help.handbook/load-error") []]
         | Loaded catalog -> loaded_view catalog) (Signal.value loaded)]]) context parent

let host ?(loader=default_loader) ~controls () context parent =
  let visible=state context false and online=state context None in
  let open_ ()=Runtime.signal_set visible true;Runtime.flush ()
  and close ()=Runtime.signal_set visible false;Runtime.flush () in
  let alive=ref true and online_requested=ref false in
  Signal.on_dispose context.Lui_ui.ui_scope (fun () -> alive:=false);
  let open_ ()=
    open_ ();
    if not !online_requested then begin
      online_requested:=true;
      ignore (Js.Promise.catch (fun _ -> Js.Promise.resolve ())
        (let* count=loader.online () in
         if !alive then (Runtime.signal_set online count;Runtime.flush ());Js.Promise.resolve ()))
    end in
  Logseq_el.fragment [controls open_ close;
    if_ ~test:(Signal.value visible) (panel ~loader ~close ~online)] context parent
