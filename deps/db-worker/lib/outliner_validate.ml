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

let notification_payload ~message ~i18n_key ~i18n_args : Wire.t =
  Wire.Map
    [ (kw "message", Wire.String message)
    ; (kw "i18n-key", Wire.Keyword i18n_key)
    ; (kw "i18n-args", Wire.Array i18n_args)
    ; (kw "type", Wire.Keyword "warning") ]

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

(* outliner-validate/find-other-ids-with-title-and-tags — query per
   entity shape: property, namespaced (has parent), or plain page. *)
let find_other_ids db ~is_property ~has_parent ~eid ~title ~tag_ids : entity_id list =
  let q =
    if is_property then
      "[:find [?b ...] :in $ ?eid ?title [?tag-id ...] :where \
       [?b :block/title ?title] [?b :block/tags ?tag-id] \
       [(missing? $ ?b :logseq.property/built-in?)] [(not= ?b ?eid)]]"
    else if has_parent then
      "[:find [?b ...] :in $ ?eid ?title [?tag-id ...] :where \
       [?b :block/title ?title] [?b :block/tags ?tag-id] \
       [(not= ?b ?eid)] \
       [?b :block/parent ?bp] [?eid :block/parent ?ep] [(= ?bp ?ep)]]"
    else
      "[:find [?b ...] :in $ ?eid ?title [?tag-id ...] :where \
       [?b :block/title ?title] [?b :block/tags ?tag-id] \
       [(not= ?b ?eid)]]"
  in
  q_string db
    ~inputs:
      [ Arg_scalar (match eid with Some id -> Result_entity id | None -> Result_value Nil)
      ; Arg_scalar (match title with Some t -> Result_value (String t) | None -> Result_value Nil)
      ; Arg_collection (List.map (fun id -> Result_entity id) tag_ids) ]
    q
  |> List.filter_map (function
       | [ Result_entity id ] -> Some id
       | [ Result_value (Int id) ] -> Some id
       | _ -> None)

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
