(* Faithful port of the validate-unique-by-name-and-tags chain in
   logseq.outliner.validate — the only validation the property
   endpoints reach. Raises [Notification payload] for cljs
   (throw (ex-info _ {:type :notification :payload payload})). *)

open Datascript

exception Notification of Wire.t

let kw s = Wire.Keyword s

let pr_str_title (t : string option) : string =
  (* cljs (pr-str s) for a plain string adds quotes *)
  match t with
  | Some s -> Printf.sprintf "\"%s\"" s
  | None -> "nil"

(* cljs ex-data shape: {:type :notification :payload {...}} *)
let notification_payload ~message ~i18n_key ~i18n_args : Wire.t =
  Wire.Map
    [ (kw "type", Wire.Keyword "notification")
    ; (kw "payload",
       Wire.Map
         [ (kw "message", Wire.String message)
         ; (kw "i18n-key", Wire.Keyword i18n_key)
         ; (kw "i18n-args", Wire.Array i18n_args)
         ; (kw "type", Wire.Keyword "warning") ]) ]

(* entity predicates over an effective tag set — the endpoint calls this
   with the block's tags plus the candidate tag, mirroring cljs
   (update block :block/tags (fnil conj #{}) tag). *)

let has_tag_ident (tags : entity list) (ident : string) : bool =
  List.exists (fun (t : entity) -> Ldb.ident_of t = Some ident) tags

let is_class_tags tags = has_tag_ident tags "logseq.class/Tag"
let is_property_tags tags = has_tag_ident tags "logseq.class/Property"

let is_page_tags tags =
  has_tag_ident tags "logseq.class/Page"
  || has_tag_ident tags "logseq.class/Journal"
  || has_tag_ident tags "logseq.class/Tag"
  || has_tag_ident tags "logseq.class/Property"

(* outliner-validate/find-other-ids-with-title-and-tags — the three cljs
   query variants: built-in exclusion for properties, same-parent when
   the entity has a parent, plain otherwise. Note: entity :in args must
   be passed as Result_value (Ref e); the engine drops
   Arg_scalar (Result_entity e) bindings. *)
let find_other_ids db ~is_property ~has_parent ~eid ~title ~tag_ids : entity_id list =
  let q =
    if is_property then
      "[:find [?b ...] :in $ ?eid ?title [?tag-id ...] :where \
       [?b :block/title ?title] \
       [?b :block/tags ?tag-id] \
       [(missing? $ ?b :logseq.property/built-in?)] \
       [(not= ?b ?eid)]]"
    else if has_parent then
      "[:find [?b ...] :in $ ?eid ?title [?tag-id ...] :where \
       [?b :block/title ?title] \
       [?b :block/tags ?tag-id] \
       [(not= ?b ?eid)] \
       [?b :block/parent ?bp] \
       [?eid :block/parent ?ep] \
       [(= ?bp ?ep)]]"
    else
      "[:find [?b ...] :in $ ?eid ?title [?tag-id ...] :where \
       [?b :block/title ?title] \
       [?b :block/tags ?tag-id] \
       [(not= ?b ?eid)]]"
  in
  q_string db q
    ~inputs:
      [ Arg_scalar
          (match eid with
           | Some id -> Result_value (Ref id)
           | None -> Result_value Nil)
      ; Arg_scalar
          (match title with
           | Some t -> Result_value (String t)
           | None -> Result_value Nil)
      ; Arg_collection (List.map (fun id -> Result_value (Ref id)) tag_ids) ]
  |> List.filter_map
       (fun row -> match row with [ Result_entity b ] -> Some b | _ -> None)

(* outliner-validate/validate-unique-for-page *)
let validate_unique_for_page db (new_title : string option) ~is_property ~is_class ~has_parent ~eid
    (tags : entity list) : unit =
  match tags with
  | [] -> ()
  | _ ->
      let tag_ids = List.map (fun (t : entity) -> t.id) tags in
      (match find_other_ids db ~is_property ~has_parent ~eid ~title:new_title ~tag_ids with
       | [] -> ()
       | another_id :: _ ->
           let another = Ldb.ent_of_id db another_id in
           let this_tag_idents =
             List.filter_map Ldb.ident_of tags |> List.sort_uniq String.compare
           in
           let another_tag_idents =
             match another with
             | Some a ->
                 List.filter_map Ldb.ident_of (Ldb.ref_ents a "block/tags")
                 |> List.sort_uniq String.compare
             | None -> []
           in
           let common_tag_idents =
             List.filter (fun i -> List.mem i another_tag_idents) this_tag_idents
           in
           if
             common_tag_idents = [ "logseq.class/Page" ]
             && List.length this_tag_idents > 1
             && List.length another_tag_idents > 1
           then ()
           else if is_property then
             let title_arg =
               match new_title with Some t -> Wire.String t | None -> Wire.Nil
             in
             raise
               (Notification
                  (notification_payload
                     ~message:
                       ("Another property named " ^ pr_str_title new_title
                        ^ " already exists.")
                     ~i18n_key:"property.validation/duplicate"
                     ~i18n_args:[ title_arg ]))
           else if is_class then
             let title_arg =
               match new_title with Some t -> Wire.String t | None -> Wire.Nil
             in
             raise
               (Notification
                  (notification_payload
                     ~message:
                       ("Another tag named " ^ pr_str_title new_title
                        ^ " already exists.")
                     ~i18n_key:"class.validation/duplicate"
                     ~i18n_args:[ title_arg ]))
           else
             let tag_titles =
               List.filter_map
                 (fun ident ->
                    match Ldb.ent_of_ref db (Ident ident) with
                    | Some e -> Ldb.string_value e "block/title"
                    | None -> None)
                 common_tag_idents
             in
             let tags_str =
               String.concat ", " (List.map (fun t -> "#" ^ t) tag_titles)
             in
             let title_arg =
               match new_title with Some t -> Wire.String t | None -> Wire.Nil
             in
             raise
               (Notification
                  (notification_payload
                     ~message:
                       ("Another page named " ^ pr_str_title new_title
                        ^ " already exists for tags: " ^ tags_str)
                     ~i18n_key:"page.validation/duplicate"
                     ~i18n_args:[ title_arg; Wire.String tags_str ])))

(* outliner-validate/validate-unique-by-name-and-tags.
   [entity] is the block being tagged (may be absent, matching cljs
   (update nil :block/tags (fnil conj #{}) tag) → plain map);
   [extra_tag] is the tag entity being added (may be absent). *)
let validate_unique_by_name_and_tags db (new_title : string option)
    (entity : entity option) (extra_tag : entity option) : unit =
  let existing_tags =
    match entity with
    | Some e -> Ldb.ref_ents e "block/tags"
    | None -> []
  in
  let tags =
    match extra_tag with
    | Some t ->
        (* cljs conj on a set dedupes by identity *)
        if List.exists (fun (x : entity) -> x.id = t.id) existing_tags then existing_tags
        else existing_tags @ [ t ]
    | None -> existing_tags
  in
  if is_page_tags tags then begin
    let eid = Option.map (fun (e : entity) -> e.id) entity in
    let has_parent =
      match entity with
      | Some e -> Option.is_some (Ldb.value e "block/parent")
      | None -> false
    in
    validate_unique_for_page db new_title
      ~is_property:(is_property_tags tags) ~is_class:(is_class_tags tags)
      ~has_parent ~eid tags
  end

(* ---------- remaining fns from outliner/validate.cljs ---------- *)

let notif ?(i18n_key = "") ?(i18n_args = []) ?(kind = "error") (message : string)
    : exn =
  Notification
    (Wire.Map
       [ (kw "type", Wire.Keyword "notification")
       ; (kw "payload",
          Wire.Map
            [ (kw "message", Wire.String message)
            ; (kw "i18n-key", Wire.Keyword i18n_key)
            ; (kw "i18n-args", Wire.Array i18n_args)
            ; (kw "type", Wire.Keyword kind) ]) ])

(* outliner-validate/validate-page-title-no-hashtag *)
let validate_page_title_no_hashtag (page_title : string) : unit =
  if String.contains page_title '#' then
    raise
      (notif ~kind:"warning" ~i18n_key:"page.validation/name-no-hash"
         "Page name can't include \"#\".")

(* outliner-validate/validate-page-title-characters *)
let validate_page_title_characters (page_title : string) : unit =
  validate_page_title_no_hashtag page_title;
  if String.contains page_title '/'
     && not (Date_time_util.valid_journal_title page_title)
  then
    raise
      (notif ~kind:"warning" ~i18n_key:"page.validation/name-no-slash"
         "Page name can't include \"/\".")

(* outliner-validate/validate-page-title *)
let validate_page_title (page_title : string) : unit =
  if String.trim page_title = "" then
    raise
      (notif ~kind:"warning" ~i18n_key:"page.validation/name-blank"
         "Page name can't be blank.")

(* outliner-validate/validate-disallow-page-with-journal-name *)
let validate_disallow_page_with_journal_name (new_title : string)
    (entity : entity) : unit =
  if Ldb.is_page entity && not (Ldb.is_journal entity)
     && Date_time_util.valid_journal_title new_title
  then
    raise
      (notif ~kind:"warning" ~i18n_key:"journal/page-cant-convert-warning"
         "This page can't be changed to a journal page")

(* outliner-validate/validate-block-title *)
let validate_block_title db (new_title : string) (existing_block : entity option)
    : unit =
  validate_unique_by_name_and_tags db (Some new_title) existing_block None;
  match existing_block with
  | Some e -> validate_disallow_page_with_journal_name new_title e
  | None -> ()

(* db-property/valid-property-name? *)
let valid_property_name (s : string) : bool =
  not (String.length s > 0 && (s.[0] = '#' || String.length s > 1 && s.[0] = '[' && s.[1] = '['))

(* outliner-validate/validate-property-title *)
let validate_property_title (new_title : string) : unit =
  if not (valid_property_name new_title) then
    raise
      (notif ~kind:"error" ~i18n_key:"property.validation/invalid-name"
         "This is an invalid property name. A property name cannot start with \
          page reference characters '#' or '[['.")

(* outliner-validate/built-in-entity? *)
let built_in_entity (ent : entity) : bool =
  Ldb.built_in ent
  || Option.is_some (Ldb.value ent "file/path")
  || (match Ldb.ident_of ent with
      | Some ident -> Db_schema.internal_ident ident
      | None -> false)

(* outliner-validate/validate-editing-built-in-property *)
let validate_editing_built_in_property (entity : entity)
    (attribute_map_to_update : Wire.t) : unit =
  let allowed = [ "logseq.property/hide-empty-value"; "logseq.property/description" ] in
  if Ldb.built_in entity then begin
    let disallowed =
      List.filter (fun k -> not (List.mem k allowed)) (Cljs_map.keys attribute_map_to_update)
    in
    match disallowed with
    | [] -> ()
    | _ ->
        raise
          (Notification
             (Wire.Map
                [ (kw "type", Wire.Keyword "notification")
                ; (kw "payload",
                   Wire.Map
                     [ (kw "message",
                        Wire.String
                          "Can't change the given attributes for a built-in property")
                     ; (kw "type", Wire.Keyword "error") ])
                ; (kw "property",
                   (match Ldb.ident_of entity with
                    | Some s -> Wire.Keyword s
                    | None -> Wire.Nil))
                ; (kw "disallowed-attributes",
                   Wire.Set (List.map (fun k -> Wire.Keyword k) disallowed)) ]))
  end

(* outliner-validate/validate-extends-property-have-correct-type *)
let validate_extends_property_have_correct_type (parent_ent : entity option)
    (child_ents : entity list) : unit =
  let is_class e = Ldb.is_class e in
  let ok_parent =
    match parent_ent with Some p -> is_class p | None -> false
  in
  if (not ok_parent) || not (List.for_all is_class child_ents) then
    raise
      (notif ~kind:"error" ~i18n_key:"class.validation/invalid-extends-type"
         "Can't extend this page since either it is not a tag or is extending \
          from a page that is not a tag")

(* outliner-validate/disallow-built-in-class-extends-change *)
let disallow_built_in_class_extends_change (child_ents : entity list) : unit =
  if
    List.exists
      (fun e ->
         match Ldb.ident_of e with
         | Some ident -> Option.is_some (Db_class.built_in_class ident)
         | None -> false)
      child_ents
  then
    raise
      (notif ~kind:"error" ~i18n_key:"class.validation/built-in-extends-change"
         "Can't change the extends of a built-in tag")

(* outliner-validate/disallow-extends-cycle *)
let disallow_extends_cycle db (parent_ent : entity) (child_ents : entity list)
    : unit =
  List.iter
    (fun child ->
       let children_ids =
         child.id :: Db_class.get_structured_children db child.id
       in
       if List.mem parent_ent.id children_ids then
         raise
           (notif ~kind:"error" ~i18n_key:"class.validation/extends-cycle"
              "Tag extends cycle"))
    child_ents

(* outliner-validate/validate-extends-property *)
let validate_extends_property ?(built_in = true) db (parent_ent : entity)
    (child_ents : entity list) : unit =
  if built_in then disallow_built_in_class_extends_change child_ents;
  disallow_extends_cycle db parent_ent child_ents;
  validate_extends_property_have_correct_type (Some parent_ent) child_ents

(* outliner-validate/disallow-tagging-a-built-in-entity *)
let disallow_tagging_a_built_in_entity ?(delete = false) db
    (block_eids : entity_id list) : unit =
  let built_in_ent =
    List.find_map
      (fun eid ->
         match Ldb.ent_of_id db eid with
         | Some e when built_in_entity e -> Some e
         | _ -> None)
      block_eids
  in
  match built_in_ent with
  | None -> ()
  | Some ent ->
      let title = Option.value (Ldb.string_value ent "block/title") ~default:"nil" in
      let msg =
        (if delete then "Can't remove tag" else "Can't add tag")
        ^ " on built-in \"" ^ title ^ "\""
      in
      raise
        (notif ~kind:"error"
           ~i18n_key:
             (if delete then "class.validation/cant-remove-tag-on-built-in"
              else "class.validation/cant-add-tag-on-built-in")
           ~i18n_args:[ Wire.String title ] msg)

(* outliner-validate/disallow-node-cant-tag-with-private-tags *)
let disallow_node_cant_tag_with_private_tags ?(delete = false) db
    (block_eids : entity_id list) (v : entity_id) : unit =
  let tag_ent = Ldb.ent_of_id db v in
  let tag_ident =
    match tag_ent with Some e -> Ldb.ident_of e | None -> None
  in
  let is_private =
    match tag_ident with
    | Some "logseq.class/Page" -> false
    | Some ident -> List.mem ident Db_class.private_tags
    | None -> false
  in
  let all_assets_with_asset_tag =
    tag_ident = Some "logseq.class/Asset"
    && List.for_all
         (fun id ->
            match Ldb.ent_of_id db id with
            | Some e -> Ldb.asset e
            | None -> false)
         block_eids
  in
  if is_private && not all_assets_with_asset_tag then
    let tag_title =
      match tag_ent with
      | Some e -> Option.value (Ldb.string_value e "block/title") ~default:"nil"
      | None -> "nil"
    in
    let msg =
      (if delete then "Can't remove tag" else "Can't set tag")
      ^ " with built-in #" ^ tag_title
    in
    raise
      (Notification
         (Wire.Map
            [ (kw "type", Wire.Keyword "notification")
            ; (kw "payload",
               Wire.Map
                 [ (kw "message", Wire.String msg)
                 ; (kw "i18n-key",
                    Wire.Keyword
                      (if delete then "class.validation/cant-remove-tag-built-in"
                       else "class.validation/cant-set-tag-built-in"))
                 ; (kw "i18n-args", Wire.Array [ Wire.String tag_title ])
                 ; (kw "type", Wire.Keyword "error") ])
            ; (kw "property-id", Wire.Keyword "block/tags")
            ; (kw "property-value", Wire.Int v) ]))

(* outliner-validate/disallow-removing-page-tag *)
let disallow_removing_page_tag db (eids : entity_id list) (v : entity_id) : unit =
  let tag_ident =
    match Ldb.ent_of_id db v with Some e -> Ldb.ident_of e | None -> None
  in
  if tag_ident = Some "logseq.class/Page" then begin
    let library_page =
      (* ldb/get-library-page *)
      Ldb.ent_of_ref db
        (Lookup_ref
           ("block/uuid",
            Uuid (Common_uuid.gen_uuid "builtin-block-uuid" "Library")))
    in
    List.iter
      (fun eid ->
         match Ldb.ent_of_id db eid with
         | None -> ()
         | Some entity ->
             if Ldb.internal_page entity then begin
               let title =
                 Option.value (Ldb.string_value entity "block/title") ~default:"nil"
               in
               (match Ldb.value entity "block/parent" with
                | None ->
                    raise
                      (Notification
                         (Wire.Map
                            [ (kw "type", Wire.Keyword "notification")
                            ; (kw "payload",
                               Wire.Map
                                 [ (kw "message",
                                    Wire.String
                                      ("Page \"" ^ title
                                       ^ "\" cannot be converted to a block"))
                                 ; (kw "type", Wire.Keyword "error")
                                 ; (kw "i18n-key",
                                    Wire.Keyword "page.convert/cant-be-block")
                                 ; (kw "i18n-args", Wire.Array [ Wire.String title ])
                                 ; (kw "property", Wire.Keyword "block/tags") ]) ]))
                | Some _ ->
                    (match library_page, Ldb.ref_ent entity "block/parent" with
                     | Some lp, Some p when lp.id = p.id ->
                         raise
                           (Notification
                              (Wire.Map
                                 [ (kw "type", Wire.Keyword "notification")
                                 ; (kw "payload",
                                    Wire.Map
                                      [ (kw "message",
                                         Wire.String
                                           ("Page \"" ^ title
                                            ^ "\" cannot be converted to a \
                                               block, please move it to another \
                                               page first"))
                                      ; (kw "type", Wire.Keyword "error")
                                      ; (kw "i18n-key",
                                         Wire.Keyword
                                           "page.convert/cant-be-block-move-first")
                                      ; (kw "i18n-args",
                                         Wire.Array [ Wire.String title ])
                                      ; (kw "property",
                                         Wire.Keyword "block/tags") ]) ]))
                     | _ ->
                         (* has page children? (:block/_parent) *)
                         let children =
                           List.of_seq
                             (datoms db Aevt ~a:"block/parent" ~v:(Ref eid) ())
                           |> List.filter_map (fun d -> Ldb.ent_of_id db d.e)
                         in
                         if List.exists Ldb.is_page children then
                           raise
                             (Notification
                                (Wire.Map
                                   [ (kw "type", Wire.Keyword "notification")
                                   ; (kw "payload",
                                      Wire.Map
                                        [ (kw "message",
                                           Wire.String
                                             ("Page \"" ^ title
                                              ^ "\" cannot be converted to a \
                                                 block because it has page \
                                                 children"))
                                        ; (kw "type", Wire.Keyword "error")
                                        ; (kw "i18n-key",
                                           Wire.Keyword
                                             "page.convert/cant-be-block-has-children")
                                        ; (kw "i18n-args",
                                           Wire.Array [ Wire.String title ])
                                        ; (kw "property",
                                           Wire.Keyword "block/tags") ]) ]))))
             end)
      eids
  end

(* outliner-validate/validate-block-can-tag-with-page-tag *)
let validate_block_can_tag_with_page_tag db (eids : entity_id list)
    (v : entity_id) : unit =
  let tag_ident =
    match Ldb.ent_of_id db v with Some e -> Ldb.ident_of e | None -> None
  in
  if tag_ident = Some "logseq.class/Page" then
    List.iter
      (fun eid ->
         match Ldb.ent_of_id db eid with
         | None -> ()
         | Some block ->
             (match Ldb.ref_ent block "block/parent" with
              | Some parent ->
                  let title =
                    Option.value (Ldb.string_value block "block/title") ~default:""
                  in
                  validate_page_title title;
                  validate_page_title_characters title;
                  let from_property =
                    Option.is_some
                      (Ldb.value block "logseq.property/created-from-property")
                  in
                  if (not (Ldb.is_page parent)) || from_property then begin
                    let message, i18n_key =
                      if from_property then
                        ( "Can't convert property value to page."
                        , "page.convert/property-value-to-page" )
                      else
                        ( "Can't convert this block to page since its parent is \
                           not a page."
                        , "page.convert/block-parent-not-page" )
                    in
                    raise
                      (Notification
                         (Wire.Map
                            [ (kw "type", Wire.Keyword "notification")
                            ; (kw "payload",
                               Wire.Map
                                 [ (kw "message", Wire.String message)
                                 ; (kw "i18n-key", Wire.Keyword i18n_key)
                                 ; (kw "type", Wire.Keyword "error") ]) ]))
                  end
              | None -> ()))
      eids

(* outliner-validate/disallow-node-cant-tag-with-built-in-non-tags *)
let disallow_node_cant_tag_with_built_in_non_tags db (v : entity_id) : unit =
  match Ldb.ent_of_id db v with
  | Some tag_ent
    when Ldb.built_in tag_ent && not (Ldb.is_class tag_ent) ->
      let title =
        Option.value (Ldb.string_value tag_ent "block/title") ~default:"nil"
      in
      raise
        (notif ~kind:"error" ~i18n_key:"class.validation/tag-with-non-tag"
           ~i18n_args:[ Wire.String title ]
           ("Can't set tag with built-in page that isn't a tag \"" ^ title ^ "\""))
  | _ -> ()

(* outliner-validate/validate-tags-property *)
let validate_tags_property db (block_eids : entity_id list) (v : entity_id) : unit =
  disallow_tagging_a_built_in_entity db block_eids;
  disallow_node_cant_tag_with_private_tags db block_eids v;
  validate_block_can_tag_with_page_tag db block_eids v;
  disallow_node_cant_tag_with_built_in_non_tags db v

(* outliner-validate/validate-tags-property-deletion *)
let validate_tags_property_deletion db (block_eids : entity_id list)
    (v : entity_id) : unit =
  disallow_tagging_a_built_in_entity ~delete:true db block_eids;
  disallow_node_cant_tag_with_private_tags ~delete:true db block_eids v;
  disallow_removing_page_tag db block_eids v

(* outliner-validate/disallow-editing-private-built-in-nodes *)
let disallow_editing_private_built_in_nodes (entities : entity list) : unit =
  List.iter
    (fun entity ->
       if built_in_entity entity && Ldb.private_built_in_page entity then
         raise
           (notif ~kind:"error" "Built-in private nodes can't be modified"))
    entities
