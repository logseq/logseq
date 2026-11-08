open Promise_ext
open Lui_elements

module I = I18n
module Ops = Outliner_ops
module P = Ui_components.Prop

type area_st =
  { targets_open : bool
  ; editing : (string * string) option
  ; target_titles : (string * string) list option
  }

let area_slot : area_st Signal.state_slot = Signal.state_slot "comments-area"
let draft_slot : string Signal.state_slot = Signal.state_slot "comment-draft"
let saving_slot : string option Signal.state_slot = Signal.state_slot "comment-saving"
let activation_slot : string Signal.state_slot = Signal.state_slot "comment-activation"
let session_slot : (string * Editor_state.draft_owner * bool ref) option Signal.state_slot =
  Signal.state_slot "comment-session"
let reply_open_slot : string option Signal.state_slot = Signal.state_slot "comment-reply-open"

let draft_key uuid = "comments-" ^ uuid ^ "-draft"
let load_draft uuid = Option.value (Ui_services.storage_get (draft_key uuid)) ~default:""
let save_draft uuid value = Ui_services.storage_set (draft_key uuid) value

let update st f = Runtime.signal_set st (f (Runtime.signal_get st))
let typography size weight el =
  Ui_components.with_props [ P.font_size size; P.font_weight weight ] el

let comments_of (block : Model.block) =
  List.filter (Comments_ops.is_comment ~parent:block) block.block_children

let collapsed_label (block : Model.block) =
  let comments = comments_of block in
  let latest = List.fold_left (fun latest (comment : Model.block) ->
    match latest with
    | None -> Some comment
    | Some previous ->
        if Option.value comment.block_created_at ~default:0.
           >= Option.value previous.Model.block_created_at ~default:0.
        then Some comment else latest) None comments in
  let author = Option.bind latest (fun c ->
    Option.bind c.Model.block_created_by (fun a -> a.Model.author_name)) in
  I.tf (if List.length comments = 1 then "block.comments/collapsed-summary-one"
        else "block.comments/collapsed-summary-many")
    [string_of_int (List.length comments); Option.value author ~default:""]

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

(* Draft ownership survives worker-driven render remounts. *)
let editor_box ?area_uuid ?comment_uuid ~scope ~activation ~current_activation ~asset_target ~initial
    ?on_cancel ~on_saved prepare : t =
 fun ctx parent ->
  let draft = Signal.state_at ctx.Lui_ui.ui_scheduler ctx.ui_state_scope draft_slot initial in
  let busy = Signal.state_at ctx.Lui_ui.ui_scheduler ctx.ui_state_scope saving_slot None in
  let active = Signal.state_at ctx.Lui_ui.ui_scheduler ctx.ui_state_scope activation_slot "" in
  let session = Signal.state_at ctx.Lui_ui.ui_scheduler ctx.ui_state_scope session_slot None in
  if Runtime.signal_get active <> activation then begin
    Runtime.signal_set active activation;
    Runtime.signal_set draft initial;
    Runtime.signal_set busy None;
    Runtime.signal_set session None
  end;
  let context = Runtime.repo (), Runtime.route () in
  let alive () = not (Signal.scope_is_disposed ctx.ui_state_scope)
    && context = (Runtime.repo (), Runtime.route ())
    && Runtime.signal_get active = activation && current_activation () in
  let create_session () =
  let mount_token = Ui_services.env_random_uuid () in
  let uuid = Option.value comment_uuid ~default:(Ui_services.env_random_uuid ()) in
  let owner : Editor_state.draft_owner = object (self)
    method current = alive ()
    method asset_target = asset_target
    method changed value =
      if alive () then begin
        Runtime.signal_set draft value;
        Option.iter (fun area -> save_draft area value) area_uuid
      end
    method dismiss = if alive () then Option.iter (fun cancel -> cancel ()) on_cancel
    method submit original =
      match Editor_state.editing () with
      | Some editing when alive () && editing.Editor_state.uuid = uuid
          && editing.owner = Editor_state.Explicit_draft (self :> Editor_state.draft_owner)
          && Runtime.signal_get busy = None ->
          let current () = alive () && match Editor_state.editing () with
            | Some live -> live.Editor_state.epoch == editing.epoch
            | None -> false in
          let content = String.trim original in
          if content <> "" then begin
            Runtime.signal_set busy (Some mount_token);
            (let* op = prepare content in
             if not (current ()) then Js.Promise.resolve () else
             let* () = Ops.apply_and_refresh [op] in
             if current () then begin
               if Runtime.signal_get busy = Some mount_token then Runtime.signal_set busy None;
               if Runtime.signal_get draft = original then begin
                 Option.iter (fun area ->
                   if load_draft area = original then save_draft area "") area_uuid;
                 Editor_actions.update_model uuid (fun m -> Edit_model.set_source m "");
                 if area_uuid <> None then Editor_actions.request_focus uuid 0
                 else Editor_actions.dismiss_draft ~notify:false editing;
                 on_saved ()
               end
             end;
             Js.Promise.resolve ())
            |> Js.Promise.catch (fun error ->
                 Ui_services.log_error ("Comment save failed", error);
                 if current () then begin
                   if Runtime.signal_get busy = Some mount_token then Runtime.signal_set busy None;
                   Toast.error (I.t "block.comments/save-error")
                 end;
                 Js.Promise.resolve ()) |> ignore
          end else Option.iter (fun area ->
            Runtime.signal_set busy (Some mount_token);
            let next = Ui_services.env_random_uuid () in
            (let* () = Ops.apply_and_refresh [Ops.insert_blocks
                 [Wire.Map [Wire.String "block/uuid", Wire.Uuid next;
                    Wire.String "block/title", Wire.String ""]] area ~sibling:true] in
             if current () then begin
               Runtime.signal_set busy None;
               Editor_actions.dismiss_draft editing;
               Editor_actions.enter_edit ~scope next 0
             end;
             Js.Promise.resolve ())
            |> Js.Promise.catch (fun error ->
              Ui_services.log_error ("Empty comment exit failed", error);
              if current () then begin
                Runtime.signal_set busy None;
                Toast.error (I.t "block.comments/save-error")
              end;
              Js.Promise.resolve ()) |> ignore) area_uuid
      | _ -> ()
  end in
  Signal.on_dispose ctx.ui_state_scope (fun () ->
    (match Editor_state.editing () with
     | Some e when e.Editor_state.owner = Editor_state.Explicit_draft owner ->
         Editor_actions.dismiss_draft ~notify:false e
     | _ -> ());
    if not (Signal.scope_is_disposed ctx.ui_state_scope)
       && Runtime.signal_get busy = Some mount_token then Runtime.signal_set busy None);
  uuid, owner, ref false in
  let uuid, owner, started = match Runtime.signal_get session with
    | Some current -> current
    | None ->
        let current = create_session () in
        Runtime.signal_set session (Some current);
        current in
  let owns () = alive () && match Editor_state.editing () with
    | Some e -> e.Editor_state.owner = Editor_state.Explicit_draft owner
    | None -> false in
  let cancel () = if owns () then Option.iter (fun e -> Editor_actions.dismiss_draft e)
      (Editor_state.editing ()) in
  let activate _ =
    if owns () then Editor_actions.request_focus uuid (Editor_actions.caret_of uuid)
    else if not !started then begin
      started := true;
      Editor_actions.enter_draft ~uuid ~scope ~buffer:(Runtime.signal_get draft) ~owner
    end
  in
  (row ~style_class:"ls-comment-box" ~gap:8 ~cross:`start ~min_width:0
    [ column ~grow:1. ~min_width:0 ~min_height:34
        ~on_appear:activate ~padding_horizontal:7 ~padding_vertical:5
        [Editor_surface.mount ~owner uuid scope]
    ; row ~style_class:"ls-comment-box-actions" ~gap:4 ~cross:`center
        ((match on_cancel with None -> [] | Some _ ->
          [ Ui_components.button ~variant:`ghost ~size:`sm ~text:(I.t "ui/cancel")
              ~on_press:(fun _ -> cancel ()) [] ])
         @ [ Ui_components.button ~variant:`ghost ~size:`sm
               ~style_class:"ls-comment-submit" ~icon:(`app "send") ~label:(I.t "ui/submit")
               ~disabled:(reactive (fun content saving -> String.trim content = "" || saving <> None)
                 (Signal.value draft) (Signal.value busy))
               ~on_press:(fun _ -> if owns () then Editor_actions.submit_draft uuid) [] ]) ]) ctx parent

let comment_body ~scope ~area_uuid st (comment : Model.block Signal.signal) =
  let uuid = Option.value (Signal.get comment).block_uuid ~default:"" in
  reactive ~equal:(fun a b -> a.editing = b.editing)
    (fun state ->
      if Option.map fst state.editing = Some uuid then
        let activation = snd (Option.get state.editing) in
        let current_activation () = (Runtime.signal_get st).editing = Some (uuid, activation) in
        let finish () = update st (fun s ->
          if s.editing = Some (uuid, activation) then {s with editing = None} else s) in
        editor_box ~comment_uuid:uuid ~scope ~asset_target:area_uuid
          ~activation ~current_activation ~initial:(Signal.get comment).block_title
          ~on_cancel:finish ~on_saved:finish
          (Ops.save_block_parsed uuid)
      else
        reactive (fun (comment : Model.block) ->
          let content = Render.title_block ~self:uuid ~annot:true comment in
          let content = match comment.block_asset_type with
            | Some _ -> Asset_dom.content_view uuid comment :: content
            | None -> content in
          column ~style_class:"ls-comment-body" ~min_width:0
            (content
             @ [reactions_el uuid comment.block_reactions comment.block_reaction_users])) comment)
    (Signal.value st)

let comment_actions st (comment : Model.block) =
  let uuid = Option.value comment.block_uuid ~default:"" in
  let action id icon label callback =
    Ui_components.button ~key:id ~accessibility_identifier:id ~variant:`ghost
      ~width:26 ~height:26 ~min_width:26 ~padding:0 ~corner_radius:9
      ~label ~tooltip:label ~icon ~on_press:(fun _ -> callback ()) [] in
  if Ui_services.env_publishing () then Logseq_el.nothing else
  row ~style_class:"ls-comment-actions" ~gap:1 ~cross:`center
    ~padding:3 ~margin_right:8 ~corner_radius:14 ~border_width:1
    ~border_color:"var(--lx-gray-04-alpha, var(--rx-gray-04-alpha))"
    ~background:"var(--ls-primary-background-color)"
    [ action ("cr-" ^ uuid) (`app "mood-smile") (I.t "command.editor/add-reaction")
        (fun () -> open_reaction_picker uuid ("cr-" ^ uuid))
    ; if Comments_ops.comment_owned_by ~current_user:(Rtc_flows.user_uuid ()) comment then
        row ~gap:1
          [ action ("ce-" ^ uuid) (`app "edit") (I.t "editor/click-to-edit")
              (fun () -> update st (fun s -> {s with editing = Some (uuid, Ui_services.env_random_uuid ())}))
          ; action ("cd-" ^ uuid) (`app "trash") (I.t "ui/delete")
              (fun () -> Comments_ops.delete uuid) ]
      else Logseq_el.nothing ]

let comment_avatar (comment : Model.block) =
  let author = comment.block_created_by in
  let name = Option.value (Option.bind author (fun a -> a.Model.author_name)) ~default:"" in
  match Option.bind author (fun a -> a.Model.author_avatar) with
  | Some url when String.trim url <> "" ->
      image ~style_class:"ls-comment-avatar" ~width:22 ~height:22
        ~corner_radius:11 ~url ~alt:name []
  | _ ->
      let background = Option.map Collaborators.uuid_color
          (Option.bind author (fun a -> a.Model.author_uuid)) in
      typography "0.625rem" 400
        (avatar ~style_class:"ls-comment-avatar" ~width:22 ~height:22
          ~corner_radius:11 ?background ~text:(Collaborators.initials name) ~label:name [])

let comment_row ~scope ~area_uuid st (comment : Model.block Signal.signal) =
  let uuid = Option.value (Signal.get comment).block_uuid ~default:"" in
  overlay ~key:("comment-" ^ uuid) ~min_width:0
    ~accessibility_identifier:("comment-" ^ uuid)
    [ row ~style_class:"ls-comment-row" ~gap:8 ~cross:`start
        ~padding_horizontal:2 ~padding_vertical:6 ~min_width:0
        ((if Rtc_flows.user_uuid () = None then [] else [reactive comment_avatar comment])
        @ [column ~style_class:"ls-comment-main" ~grow:1. ~min_width:0
        [ reactive (fun (comment : Model.block) ->
            let author = Option.bind comment.block_created_by (fun a -> a.Model.author_name) in
            row ~style_class:"ls-comment-meta" ~min_height:28 ~gap:6 ~cross:`center ~flex_wrap:`wrap
              (if Rtc_flows.user_uuid () = None then [] else
              Option.to_list (Option.map (fun name ->
                typography "0.75rem" 600 (text ~value:name [])) author))) comment
        ; comment_body ~scope ~area_uuid st comment ]])
    ; align `top_trailing (reactive (comment_actions st) comment) ]

let add_box ~scope area_uuid : t =
 fun ctx parent ->
  let opened = Signal.state_at ctx.Lui_ui.ui_scheduler ctx.ui_state_scope reply_open_slot None in
  let open_reply () = if Runtime.signal_get opened = None then
    Runtime.signal_set opened (Some (Ui_services.env_random_uuid ())) in
  let initial = load_draft area_uuid in
  (column ~style_class:"ls-comment-add" ~padding:8 ~min_width:0
    ~background:"var(--ls-primary-background-color)"
    ~border_width:1 ~border_color:"var(--lx-gray-04-alpha, var(--rx-gray-04-alpha))"
    [ reactive (function
        | Some activation ->
          editor_box ~area_uuid ~scope ~asset_target:area_uuid
            ~activation ~current_activation:(fun () -> Runtime.signal_get opened = Some activation)
            ~initial:(load_draft area_uuid)
            ~on_cancel:(fun () ->
              if Runtime.signal_get opened = Some activation then Runtime.signal_set opened None)
            ~on_saved:(fun () -> ())
            (fun content ->
              let* block = Ops.block_map_parsed (Ui_services.env_random_uuid ()) content in
              let block = match block with
                | Wire.Map fields -> Wire.Map ((Wire.Keyword "block/tags",
                    Wire.Set [Wire.Keyword Comments_ops.comment_ident]) :: fields)
                | _ -> invalid_arg "Parsed comment must be a block map" in
              Js.Promise.resolve (Ops.insert_blocks ~bottom:true [block] area_uuid ~sibling:false))
        | None ->
          Ui_components.button ~variant:`ghost ~style_class:"ls-comment-reply-placeholder"
            ~min_height:34 ~padding_horizontal:7 ~padding_vertical:5 ~main:`start
            ~on_appear:(fun _ ->
              if Comments_ops.take_reply_focus_request area_uuid then
                open_reply ())
            ~label:(I.t "block.comments/placeholder")
            ~text:(if initial = "" then I.t "block.comments/placeholder" else initial)
            ~on_press:(fun _ ->
              ignore (Comments_ops.take_reply_focus_request area_uuid);
              open_reply ()) [])
        (Signal.value opened) ]) ctx parent

let header ~scope st (block : Model.block) count : t =
 fun ctx parent ->
  let uuid = Option.value block.block_uuid ~default:"" in
  row ~style_class:"ls-comments-header" ~gap:8 ~cross:`center ~min_height:30
    ~padding_horizontal:10 ~padding_vertical:5
    [ reactive (fun editing ->
        if Option.fold ~none:false
            ~some:(fun e -> e.Editor_state.uuid = uuid && e.scope = scope) editing then
          column ~style_class:"ls-comments-title-editor" ~grow:1. ~min_width:0
            [Editor_surface.mount uuid scope]
        else
          typography "0.75rem" 600
            (Ui_components.button ~variant:`ghost ~style_class:"ls-comments-label"
              ~height:20 ~min_width:0 ~padding:0 ~label:(I.t "editor/click-to-edit")
              ~disabled:(Ui_services.env_publishing ())
              ~text:(let title = String.trim block.block_title in
                if title = "" then I.t "block.comments/label" else title)
              ~on_press:(fun _ -> Editor_actions.enter_edit ~scope uuid 0) []))
        (Editor_state.editing_sig ())
    ; typography "0.75rem" 400
        (text ~style_class:"ls-comments-count" ~value:(string_of_int count) [])
    ; spacer ~grow:1. []
    ; reactive (fun state ->
      if Option.fold ~none:false ~some:(fun targets -> List.length targets > 1) state.target_titles then
        Ui_components.button ~variant:`ghost ~height:20 ~padding:0
          ~style_class:"ls-comments-targets-toggle" ~text:(I.t "block.comments/on-those-blocks")
          ~on_press:(fun _ -> update st (fun s -> {s with targets_open = not s.targets_open})) []
      else Logseq_el.nothing) (Signal.value st) ] ctx parent

let load_targets st ids : t =
 fun ctx parent ->
  let repo = Runtime.repo () in
  let alive () = not (Signal.scope_is_disposed ctx.Lui_ui.ui_scope) && Runtime.repo () = repo in
  (let* targets = if ids = [] then Js.Promise.resolve [] else fetch_target_titles ids in
   if alive () then update st (fun s -> {s with target_titles = Some targets});
   Js.Promise.resolve ())
  |> Js.Promise.catch (fun error ->
    if alive () then begin
      update st (fun s -> {s with target_titles = None});
      Ui_services.log_error ("Comment targets failed", error);
      Toast.error (I.t "block.comments/load-targets-error")
    end;
    Js.Promise.resolve ()) |> ignore;
  Logseq_el.nothing ctx parent

let area_el ?(scope = "main") (blocks : Model.block Signal.signal) : t =
 fun ctx parent ->
  let st = Signal.state_at ctx.Lui_ui.ui_scheduler ctx.ui_state_scope area_slot
      { targets_open = false; editing = None; target_titles = None } in
  (reactive ~equal:(fun (a : Model.block) b -> a.block_uuid = b.block_uuid)
    (fun block ->
    let uuid = Option.value block.block_uuid ~default:"" in
    column ~style_class:"ls-comments-area"
      ~accessibility_identifier:("area-" ^ uuid)
      ~on_appear:(fun _ -> Comments_ops.reveal_if_requested uuid)
      ~min_width:0 ~grow:1.
      ~border_width:1 ~border_color:"var(--lx-gray-04-alpha, var(--rx-gray-04-alpha))"
      ~corner_radius:8 ~background:"var(--lx-gray-02, var(--ls-secondary-background-color))"
      [ reactive (fun (block : Model.block) -> load_targets st block.block_comment_target_ids) blocks
      ; reactive (fun (block : Model.block) (collapse : Editor_state.collapse_view) ->
          if Editor_state.effective_collapsed_in_view ~scope uuid block.block_default_collapsed collapse then
            typography "0.75rem" 400
              (Ui_components.button ~variant:`ghost ~style_class:"ls-comments-summary"
                ~min_height:30 ~padding_horizontal:10 ~padding_vertical:5 ~main:`start
                ~text:(collapsed_label block)
                ~on_press:(fun _ -> Editor_state.set_collapsed ~scope uuid false) [])
          else header ~scope st block (List.length (comments_of block))) blocks (Editor_state.collapse_sig ())
      ; if_ ~test:(reactive (fun (block : Model.block) (collapse : Editor_state.collapse_view) ->
            not (Editor_state.effective_collapsed_in_view ~scope uuid block.block_default_collapsed collapse))
            blocks (Editor_state.collapse_sig ()))
        (column ~min_width:0 [
        reactive ~equal:(fun a b -> a.targets_open = b.targets_open && a.target_titles = b.target_titles)
          (fun state -> if not state.targets_open ||
              Option.fold ~none:true ~some:(fun targets -> List.length targets <= 1) state.target_titles
            then Logseq_el.nothing else
            column ~style_class:"ls-comments-targets" ~gap:4 ~padding_horizontal:10
              ~padding_vertical:4
              (List.map (fun (target, title) ->
                Ui_components.button ~key:target ~variant:`ghost ~main:`start
                  ~style_class:"ls-comments-target" ~text:title
                  ~on_press:(fun _ -> Ui_services.nav_set_hash
                    (Runtime.nav_hash ("#/page/" ^ target))) [])
                (Option.value state.target_titles ~default:[])))
          (Signal.value st)
      ; scroll ~orientation:`vertical ~max_height:320
          ~accessibility_identifier:("comments-list-" ^ uuid)
          [ column ~style_class:"ls-comments-list" ~padding_horizontal:8 ~padding_vertical:4
              ~min_width:0
              [ keyed ~source:(reactive (fun (block : Model.block) ->
                    comments_of block) blocks)
                  ~key:(fun (comment : Model.block) -> comment.block_uuid)
                  ~cmp:compare ~mount:(comment_row ~scope ~area_uuid:uuid st)
              ; reactive ~equal:(fun (a : Model.block) b ->
                    List.map (fun c -> c.Model.block_uuid) (comments_of a)
                    = List.map (fun c -> c.Model.block_uuid) (comments_of b))
                  (fun _ -> box ~height:0 ~on_appear:(fun _ ->
                    Option.iter (fun list ->
                      list.Ui_services.set_scroll_top (list.scroll_height ()))
                      (Ui_services.dom_by_id ("comments-list-" ^ uuid))) []) blocks ] ]
      ; if Ui_services.env_publishing () then Logseq_el.nothing else
          reactive ~equal:(fun (a : Model.block) b -> a.block_uuid = b.block_uuid)
            (fun block -> add_box ~scope (Option.value block.block_uuid ~default:"")) blocks ]) ]) blocks)
    ctx parent

let area_el_static ?scope (block : Model.block) : t =
 fun ctx parent -> area_el ?scope (Signal.constant ctx.Lui_ui.ui_scheduler block) ctx parent
