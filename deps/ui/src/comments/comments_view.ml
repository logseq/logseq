open Promise_ext
open Lui_elements

module I = I18n
module Ops = Outliner_ops
module P = Ui_components.Prop

type area_st =
  { targets_open : bool
  ; editing : string option
  ; target_titles : (string * string) list
  }

let draft_key uuid = "comments-" ^ uuid ^ "-draft"
let load_draft uuid = Option.value (Ui_services.storage_get (draft_key uuid)) ~default:""
let save_draft uuid value = Ui_services.storage_set (draft_key uuid) value

let update st f = Runtime.signal_set st (f (Runtime.signal_get st))
let typography size weight el =
  Ui_components.with_props [ P.font_size size; P.font_weight weight ] el

let fetch_target_titles ids =
  match (Runtime.model ()).Model.repo with
  | None -> Js.Promise.resolve []
  | Some repo ->
  let* wire = Runtime.invoke2 "thread-api/get-blocks" (Wire.String repo)
      (Wire.Array (List.map (fun id -> Wire.Map
        [ Wire.String "id", Wire.Int id
        ; Wire.String "opts", Wire.Map [Wire.String "children?", Wire.Bool false] ]) ids)) in
  Js.Promise.resolve (List.filter_map (fun pair ->
    match Wire.map_get pair "block" with
    | Some block when (match Wire.get block "logseq.property/deleted-at" with
        | None | Some Wire.Nil -> true | _ -> false) ->
        (match Wire.map_get_uuid block "block/uuid", Wire.map_get_string block "block/title" with
         | Some uuid, Some title -> Some (uuid, title)
         | _ -> None)
    | _ -> None) (Wire.elems wire))

let toggle_reaction uuid emoji =
  let user = match Rtc_flows.user_uuid () with
    | Some uuid -> Wire.Uuid uuid | None -> Wire.Nil in
  ignore (Ops.apply_and_refresh
    [ Ops.op "toggle-reaction" [ Wire.Uuid uuid; Wire.String emoji; user ] ])

let open_reaction_picker uuid button_id =
  Option.iter (fun anchor ->
    ignore (Icon_picker.open_picker_with_opts ~anchor ~del:false
      ~opts:{ Icon_picker.emoji_only = true; sub = false }
      ~on_chosen:(function Icon_picker.Emoji emoji -> toggle_reaction uuid emoji | _ -> ())))
    (Ui_services.dom_by_id button_id)

let reaction_owned_by current = function
  | None -> current = None
  | Some author -> author.Model.author_uuid <> None && author.author_uuid = current

let reactions_el uuid reactions users =
  match reactions with
  | [] -> Logseq_el.nothing
  | _ ->
      let current = Rtc_flows.user_uuid () in
      row ~key:("rx-" ^ uuid) ~style_class:"ls-block-reactions"
        ~cross:`center ~flex_wrap:`wrap ~gap:2 ~margin_top:4
        (List.map (fun (emoji, count) ->
          let authors = List.filter_map (fun (id, user) ->
            if id = emoji then Some user else None) users in
          let selected = List.exists (reaction_owned_by current) authors in
          let names = List.filter_map (fun author ->
            Option.bind author (fun a -> a.Model.author_name)) authors in
          Ui_components.button ~key:("rxb-" ^ uuid ^ "-" ^ emoji)
            ~variant:`ghost ~height:24 ~padding_horizontal:8 ~padding_vertical:0
            ~corner_radius:999 ~selected
            ~background:(if selected then "hsl(var(--accent) / 0.1)" else "transparent")
            ~label:(emoji ^ " " ^ string_of_int count)
            ~tooltip:(String.concat ", " (List.sort_uniq String.compare names))
            ~on_press:(fun _ -> if not (Ui_services.env_publishing ()) then toggle_reaction uuid emoji)
            [ Logseq_emoji.el ~name:emoji ()
            ; typography "0.75rem" 400 (text ~value:(string_of_int count) []) ])
          (List.sort (fun (a, ac) (b, bc) ->
             let count = Int.compare bc ac in if count = 0 then String.compare a b else count) reactions)
         @ if Ui_services.env_publishing () then [] else
           [ Ui_components.button ~variant:`ghost ~height:24 ~width:24 ~padding:0
               ~accessibility_identifier:("rx-add-" ^ uuid)
               ~label:(I.t "command.editor/add-reaction") ~icon:(`app "plus")
               ~on_press:(fun _ -> open_reaction_picker uuid ("rx-add-" ^ uuid)) [] ])

(* Drafts stay mounted independently of the worker's comment-list refresh. *)
let editor_box ?area_uuid ~initial ~autofocus ?on_cancel ~on_saved submit : t =
 fun ctx parent ->
  let draft = Signal.state ctx.Lui_ui.ui_scheduler initial in
  let busy = Signal.state ctx.Lui_ui.ui_scheduler false in
  let alive = ref true in
  Signal.on_dispose ctx.Lui_ui.ui_scope (fun () -> alive := false);
  let save () =
    let original = Runtime.signal_get draft in
    let content = String.trim original in
    if content <> "" && not (Runtime.signal_get busy) then begin
      Runtime.signal_set busy true;
      (let* () = submit content in
       Option.iter (fun uuid ->
         if load_draft uuid = original then save_draft uuid "") area_uuid;
       if !alive then begin
         if Runtime.signal_get draft = original then Runtime.signal_set draft "";
         Runtime.signal_set busy false;
         on_saved ()
       end;
       Js.Promise.resolve ())
      |> Js.Promise.catch (fun error ->
           if !alive then Runtime.signal_set busy false;
           Ui_services.log_error ("Comment save failed", error);
           Toast.error (I.t "block.comments/save-error");
           Js.Promise.resolve ()) |> ignore
    end
  in
  (row ~style_class:"ls-comment-box" ~gap:8 ~cross:`start ~min_width:0
    [ textarea ~grow:1. ~min_width:0 ~min_height:34
        ~background:"transparent" ~border_width:0 ~padding_horizontal:7 ~padding_vertical:5
        ~placeholder:(I.t "block.comments/placeholder") ~label:(I.t "block.comments/placeholder")
        ~autofocus ~text:(reactive Fun.id (Signal.value draft)) ~submit_on_enter:true
        ~on_input:(function Lui_protocol.TextChanged (_, value) ->
            Runtime.signal_set draft value;
            Option.iter (fun uuid -> save_draft uuid value) area_uuid
          | _ -> ())
        ~on_submit:(fun _ -> save ()) []
    ; row ~style_class:"ls-comment-box-actions" ~gap:4 ~cross:`center
        ((match on_cancel with None -> [] | Some cancel ->
          [ Ui_components.button ~variant:`ghost ~size:`sm ~text:(I.t "ui/cancel")
              ~on_press:(fun _ -> cancel ()) [] ])
         @ [ Ui_components.button ~variant:`ghost ~size:`sm
               ~style_class:"ls-comment-submit" ~icon:(`app "send") ~label:(I.t "ui/submit")
               ~disabled:(reactive (fun content saving -> String.trim content = "" || saving)
                 (Signal.value draft) (Signal.value busy))
               ~on_press:(fun _ -> save ()) [] ]) ]) ctx parent

let comment_body st (comment : Model.block) =
  let uuid = Option.value comment.block_uuid ~default:"" in
  reactive ~equal:(fun a b -> a.editing = b.editing)
    (fun state ->
      if state.editing = Some uuid then
        editor_box ~initial:comment.block_title ~autofocus:true
          ~on_cancel:(fun () -> update st (fun s -> {s with editing = None}))
          ~on_saved:(fun () -> update st (fun s -> {s with editing = None}))
          (fun content -> let* op = Ops.save_block_parsed uuid content in Ops.apply_and_refresh [op])
      else
        column ~style_class:"ls-comment-body" ~min_width:0
          (Render.title comment.block_title
           @ [reactions_el uuid comment.block_reactions comment.block_reaction_users]))
    (Signal.value st)

let comment_actions st (comment : Model.block) =
  let uuid = Option.value comment.block_uuid ~default:"" in
  let action id icon label callback =
    Ui_components.button ~key:id ~accessibility_identifier:id ~variant:`ghost
      ~width:26 ~height:26 ~min_width:26 ~padding:0 ~corner_radius:9
      ~label ~tooltip:label ~icon ~on_press:(fun _ -> callback ()) [] in
  if Ui_services.env_publishing () then Logseq_el.nothing else
  row ~style_class:"ls-comment-actions" ~gap:1 ~cross:`center
    [ action ("cr-" ^ uuid) (`app "mood-smile") (I.t "command.editor/add-reaction")
        (fun () -> open_reaction_picker uuid ("cr-" ^ uuid))
    ; if Comments_ops.comment_owned_by ~current_user:(Rtc_flows.user_uuid ()) comment then
        row ~gap:1
          [ action ("ce-" ^ uuid) (`app "edit") (I.t "editor/click-to-edit")
              (fun () -> update st (fun s -> {s with editing = Some uuid}))
          ; action ("cd-" ^ uuid) (`app "trash") (I.t "ui/delete")
              (fun () -> Comments_ops.delete uuid) ]
      else Logseq_el.nothing ]

let comment_row st (comment : Model.block) =
  let uuid = Option.value comment.block_uuid ~default:"" in
  let author = Option.bind comment.block_created_by (fun a -> a.Model.author_name) in
  row ~key:("comment-" ^ uuid) ~style_class:"ls-comment-row" ~gap:8 ~cross:`start
    ~padding_horizontal:2 ~padding_vertical:6 ~min_width:0
    ~accessibility_identifier:("comment-" ^ uuid)
    [ column ~style_class:"ls-comment-main" ~grow:1. ~min_width:0
        [ row ~style_class:"ls-comment-meta" ~gap:6 ~cross:`center ~flex_wrap:`wrap
            (if Rtc_flows.user_uuid () = None then [] else
              Option.to_list (Option.map (fun name ->
                typography "0.75rem" 600 (text ~value:name [])) author))
        ; comment_body st comment ]
    ; comment_actions st comment ]

let add_box area_uuid : t =
 fun ctx parent ->
  let opened = Signal.state ctx.Lui_ui.ui_scheduler false in
  let initial = load_draft area_uuid in
  (column ~style_class:"ls-comment-add" ~padding:8 ~min_width:0
    ~background:"var(--ls-primary-background-color)"
    [ reactive (fun open_ ->
        if open_ then
          editor_box ~area_uuid ~initial:(load_draft area_uuid) ~autofocus:true
            ~on_saved:(fun () -> ())
            (fun content -> Ops.apply_and_refresh
              [Comments_ops.insert_comment_op area_uuid content])
        else
          Ui_components.button ~variant:`ghost ~style_class:"ls-comment-reply-placeholder"
            ~min_height:34 ~padding_horizontal:7 ~padding_vertical:5 ~main:`start
            ~label:(I.t "block.comments/placeholder")
            ~text:(if initial = "" then I.t "block.comments/placeholder" else initial)
            ~on_press:(fun _ -> Runtime.signal_set opened true) [])
        (Signal.value opened) ]) ctx parent

let header ~alive st (block : Model.block) count : t =
 fun ctx parent ->
  let uuid = Option.value block.block_uuid ~default:"" in
  row ~style_class:"ls-comments-header" ~gap:8 ~cross:`center ~min_height:30
    ~padding_horizontal:10 ~padding_vertical:5
    [ reactive (fun editing ->
        if editing then
          column ~style_class:"ls-comments-title-editor" ~grow:1. ~min_width:0
            [Comments.title_editor_el uuid]
        else
          typography "0.75rem" 600
            (Ui_components.button ~variant:`ghost ~style_class:"ls-comments-label"
              ~height:20 ~padding:0 ~label:(I.t "editor/click-to-edit")
              ~text:(let title = String.trim block.block_title in
                if title = "" then I.t "block.comments/label" else title)
              ~on_press:(fun _ -> Editor_actions.enter_edit uuid 0) []))
        (Logseq_el.own ctx (Comments.editing_sig uuid))
    ; typography "0.75rem" 400
        (text ~style_class:"ls-comments-count" ~value:(string_of_int count) [])
    ; spacer ~grow:1. []
    ; if List.length block.block_comment_target_ids > 1 then
        Ui_components.button ~variant:`ghost ~height:20 ~padding:0
          ~style_class:"ls-comments-targets-toggle" ~text:(I.t "block.comments/on-those-blocks")
          ~on_press:(fun _ ->
            let open_ = not (Runtime.signal_get st).targets_open in
            update st (fun s -> {s with targets_open = open_});
            if open_ then begin
              let repo = Runtime.repo () in
              (let* targets = fetch_target_titles block.block_comment_target_ids in
               if !alive && Runtime.repo () = repo then
                 update st (fun s -> {s with target_titles = targets});
               Js.Promise.resolve ())
              |> Js.Promise.catch (fun error ->
                   Ui_services.log_error ("Comment targets failed", error);
                   Js.Promise.resolve ()) |> ignore
            end) []
      else Logseq_el.nothing ] ctx parent

let area_el (blocks : Model.block Signal.signal) : t =
 fun ctx parent ->
  let st = Signal.state ctx.Lui_ui.ui_scheduler
      { targets_open = false; editing = None; target_titles = [] } in
  let alive = ref true in
  Signal.on_dispose ctx.Lui_ui.ui_scope (fun () -> alive := false);
  (reactive ~equal:(fun (a : Model.block) b -> a.block_uuid = b.block_uuid)
    (fun block ->
    let uuid = Option.value block.block_uuid ~default:"" in
    column ~style_class:"ls-comments-area"
      ~accessibility_identifier:("area-" ^ uuid)
      ~on_appear:(fun _ -> Comments_ops.reveal_if_requested uuid)
      ~min_width:0 ~grow:1.
      ~border_width:1 ~border_color:"var(--lx-gray-04-alpha, var(--rx-gray-04-alpha))"
      ~corner_radius:8 ~background:"var(--lx-gray-02, var(--ls-secondary-background-color))"
      [ reactive (fun (block : Model.block) ->
          let comments = List.filter (Comments_ops.is_comment ~parent:block) block.block_children in
          header ~alive st block (List.length comments)) blocks
      ; reactive ~equal:(fun a b -> a.targets_open = b.targets_open && a.target_titles = b.target_titles)
          (fun state -> if not state.targets_open then Logseq_el.nothing else
            column ~style_class:"ls-comments-targets" ~gap:4 ~padding_horizontal:10
              ~padding_vertical:4
              (List.map (fun (target, title) ->
                Ui_components.button ~key:target ~variant:`ghost ~main:`start
                  ~style_class:"ls-comments-target" ~text:title
                  ~on_press:(fun _ -> Ui_services.nav_set_hash
                    (Runtime.nav_hash ("#/page/" ^ target))) []) state.target_titles))
          (Signal.value st)
      ; scroll ~orientation:`vertical ~max_height:320
          [ reactive (fun (block : Model.block) ->
              let comments = List.filter (Comments_ops.is_comment ~parent:block) block.block_children in
              column ~style_class:"ls-comments-list" ~padding_horizontal:8 ~padding_vertical:4
                ~min_width:0 (List.map (comment_row st) comments)) blocks ]
      ; if Ui_services.env_publishing () then Logseq_el.nothing else
          reactive ~equal:(fun (a : Model.block) b -> a.block_uuid = b.block_uuid)
            (fun block -> add_box (Option.value block.block_uuid ~default:"")) blocks ]) blocks)
    ctx parent

let area_el_static (block : Model.block) : t =
 fun ctx parent -> area_el (Signal.constant ctx.Lui_ui.ui_scheduler block) ctx parent
