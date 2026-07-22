type orphan_candidate = {
  empty_refs : bool;
  empty_or_placeholder : bool;
  built_in : bool;
  property : bool;
  namespaced_non_journal : bool;
  has_properties : bool;
  hidden : bool;
}

type ('entity, 'id) library_capabilities = {
  library_page : unit -> 'entity option;
  eligible_page : 'entity -> bool;
  library_entity_id : 'entity -> 'id;
  library_equal_id : 'id -> 'id -> bool;
  library_parent : 'entity -> 'entity option;
}

type ('entity, 'lookup) page_lookup_capabilities = {
  page_by_id : 'lookup -> 'entity option;
  page_by_uuid : 'lookup -> 'entity option;
  oldest_page_by_name : string -> 'lookup option;
  oldest_page_by_title : string -> 'lookup option;
  parse_page_uuid : string -> 'lookup option;
}

type 'lookup page_reference =
  | Page_id of 'lookup
  | Page_uuid of 'lookup
  | Page_name of string

type ('entity, 'lookup) direct_child_capabilities = {
  direct_lookup : ('entity, 'lookup) page_lookup_capabilities;
  direct_children : 'entity -> 'entity Rrbvec.t;
  direct_children_present : 'entity -> bool;
  direct_collapsed : 'entity -> bool;
  direct_order : 'entity -> string;
  direct_id : 'entity -> 'lookup;
}

type ('entity, 'reference) orphan_capabilities = {
  orphan_default_pages : unit -> 'reference Rrbvec.t;
  orphan_resolve_page : 'reference -> 'entity option;
  orphan_empty_refs : 'entity -> bool;
  orphan_direct_children : 'entity -> 'entity Rrbvec.t;
  orphan_page_children_count : 'entity -> int;
  orphan_name : 'entity -> string;
  orphan_title : 'entity -> string;
  orphan_order : 'entity -> string;
  orphan_property : 'entity -> bool;
  orphan_journal : 'entity -> bool;
  orphan_has_properties : 'entity -> bool;
  orphan_hidden : 'entity -> bool;
}

type ('entity, 'id) page_order_capabilities = {
  order_entity : 'id -> 'entity option;
  order_id : 'entity -> 'id;
  order_equal_id : 'id -> 'id -> bool;
  order_page : 'entity -> 'entity option;
  order_parent : 'entity -> 'entity option;
  order_left_sibling : 'entity -> 'entity option;
  order_right_sibling : 'entity -> 'entity option;
  ordered_page_blocks : 'id -> 'entity Rrbvec.t;
}

let case_sensitive_page_lookup tags =
  Rrbvec.length tags > 0
  && Rrbvec.fold_left
       (fun result tag ->
         result && (tag = "logseq.class/Tag" || tag = "logseq.class/Property"))
       true tags

let orphan candidate =
  candidate.empty_refs && candidate.empty_or_placeholder
  && (not candidate.built_in) && (not candidate.property)
  && (not candidate.namespaced_non_journal)
  && (not candidate.has_properties)
  && not candidate.hidden

let alias_source_page_with ~entity ~aliases alias_id =
  Option.bind (Option.bind alias_id entity) (fun value ->
      Rrbvec.nth_opt (aliases value) 0)

let page_alias_set ~equal page_id aliases =
  Rrbvec.fold_left
    (fun result alias ->
      if Rrbvec.exists (equal alias) result then result
      else Rrbvec.push_back result alias)
    (Rrbvec.singleton page_id) aliases

let hidden_or_internal_tag ~hidden ~internal_ident entity =
  hidden entity || internal_ident entity

let orphaned_pages_with capabilities ~pages ~built_in_pages_names =
  let built_in_pages_names =
    Rrbvec.map String.lowercase_ascii built_in_pages_names
  in
  let placeholder_page page =
    let children = capabilities.orphan_direct_children page in
    if Rrbvec.is_empty children then false
    else
      let first_child =
        Rrbvec.nth_opt
          (Tree_workflow.sort_with ~order:capabilities.orphan_order children)
          0
      in
      match first_child with
      | None -> false
      | Some child ->
          capabilities.orphan_page_children_count page = 1
          && Rrbvec.mem
               (String.trim (capabilities.orphan_title child))
               (Rrbvec.of_array [| ""; "-"; "*" |])
  in
  let eligible page =
    let name = capabilities.orphan_name page in
    let empty_or_placeholder =
      Rrbvec.is_empty (capabilities.orphan_direct_children page)
      || placeholder_page page
    in
    orphan
      {
        empty_refs = capabilities.orphan_empty_refs page;
        empty_or_placeholder;
        built_in = Rrbvec.mem name built_in_pages_names;
        property = capabilities.orphan_property page;
        namespaced_non_journal =
          String.contains name '/' && not (capabilities.orphan_journal page);
        has_properties = capabilities.orphan_has_properties page;
        hidden = capabilities.orphan_hidden page;
      }
  in
  let candidates =
    match pages with
    | Some values -> values
    | None -> capabilities.orphan_default_pages ()
  in
  candidates
  |> Rrbvec.filter_map capabilities.orphan_resolve_page
  |> Rrbvec.filter eligible

let required_page_id capabilities block =
  capabilities.order_page block |> Option.map capabilities.order_id |> function
  | Some id -> id
  | None -> invalid_arg "DB core reads: block page is missing"

let sort_page_random_blocks_with capabilities blocks =
  let first =
    match Rrbvec.nth_opt blocks 0 with
    | Some value -> value
    | None -> invalid_arg "DB core reads: blocks must not be empty"
  in
  let page_id = required_page_id capabilities first in
  if
    not
      (Rrbvec.for_all
         (fun block ->
           capabilities.order_equal_id page_id
             (required_page_id capabilities block))
         blocks)
  then invalid_arg "Blocks must to be in a same page.";
  capabilities.ordered_page_blocks page_id
  |> Rrbvec.filter_map (fun ordered ->
      let ordered_id = capabilities.order_id ordered in
      blocks |> Rrbvec.rev
      |> Rrbvec.find_opt (fun block ->
          capabilities.order_equal_id ordered_id (capabilities.order_id block)))

let last_child_block_with capabilities ~parent_id ~child_id =
  let rec visit seen current_id =
    if Rrbvec.exists (capabilities.order_equal_id current_id) seen then
      invalid_arg "DB core reads: cycle in block parent ancestry"
    else
      match capabilities.order_entity current_id with
      | None -> None
      | Some child ->
          if capabilities.order_equal_id parent_id current_id then Some true
          else if Option.is_some (capabilities.order_right_sibling child) then
            Some false
          else
            Option.bind (capabilities.order_parent child) (fun parent ->
                visit
                  (Rrbvec.push_back seen current_id)
                  (capabilities.order_id parent))
  in
  visit Rrbvec.empty child_id

let same_page capabilities left right =
  match (capabilities.order_page left, capabilities.order_page right) with
  | Some left_page, Some right_page ->
      capabilities.order_equal_id
        (capabilities.order_id left_page)
        (capabilities.order_id right_page)
  | Some _, None | None, Some _ | None, None -> false

let consecutive_blocks capabilities left right =
  let adjacent first second =
    same_page capabilities first second
    &&
    match capabilities.order_left_sibling second with
    | Some previous
      when capabilities.order_equal_id
             (capabilities.order_id previous)
             (capabilities.order_id first) ->
        true
    | Some previous ->
        last_child_block_with capabilities
          ~parent_id:(capabilities.order_id previous)
          ~child_id:(capabilities.order_id first)
        = Some true
    | None -> false
  in
  adjacent left right || adjacent right left

let non_consecutive_blocks_with capabilities blocks =
  let length = Rrbvec.length blocks in
  let rec collect index result =
    if index + 1 >= length then result
    else
      match
        (Rrbvec.nth_opt blocks index, Rrbvec.nth_opt blocks (index + 1))
      with
      | Some block, Some next ->
          let result =
            if consecutive_blocks capabilities block next then result
            else Rrbvec.push_back result block
          in
          collect (index + 1) result
      | Some _, None | None, Some _ | None, None ->
          invalid_arg "DB core reads: invalid block index"
  in
  collect 0 Rrbvec.empty

let page_in_library ~library_id parent_ids =
  Rrbvec.fold_left
    (fun result parent_id -> result || parent_id = library_id)
    false parent_ids

let page_in_library_with (capabilities : ('entity, 'id) library_capabilities)
    page =
  if not (capabilities.eligible_page page) then false
  else
    match capabilities.library_page () with
    | None -> false
    | Some library ->
        let library_id = capabilities.library_entity_id library in
        let rec visit seen = function
          | None -> false
          | Some parent ->
              let parent_id = capabilities.library_entity_id parent in
              if capabilities.library_equal_id library_id parent_id then true
              else if
                Rrbvec.exists (capabilities.library_equal_id parent_id) seen
              then invalid_arg "DB core reads: cycle in page parent ancestry"
              else
                visit
                  (Rrbvec.push_back seen parent_id)
                  (capabilities.library_parent parent)
        in
        visit Rrbvec.empty (capabilities.library_parent page)

let lookup_oldest lookup entity text = Option.bind (lookup text) entity

let page_with capabilities = function
  | Page_id id -> capabilities.page_by_id id
  | Page_uuid uuid -> capabilities.page_by_uuid uuid
  | Page_name name -> (
      match capabilities.parse_page_uuid name with
      | Some uuid -> capabilities.page_by_uuid uuid
      | None ->
          lookup_oldest capabilities.oldest_page_by_name capabilities.page_by_id
            name)

let journal_page_with capabilities name =
  lookup_oldest capabilities.oldest_page_by_name capabilities.page_by_id name

let journal_page_value_with ~decode_name capabilities value =
  Option.bind (decode_name value) (journal_page_with capabilities)

let case_page_with capabilities = function
  | Page_id id -> capabilities.page_by_id id
  | Page_uuid uuid -> capabilities.page_by_uuid uuid
  | Page_name name -> (
      match capabilities.parse_page_uuid name with
      | Some uuid -> capabilities.page_by_uuid uuid
      | None ->
          lookup_oldest capabilities.oldest_page_by_title
            capabilities.page_by_id name)

let resolve_direct_child capabilities = function
  | Page_id id -> capabilities.direct_lookup.page_by_id id
  | Page_uuid uuid -> capabilities.direct_lookup.page_by_uuid uuid
  | Page_name name ->
      lookup_oldest capabilities.direct_lookup.oldest_page_by_name
        capabilities.direct_lookup.page_by_id name

let page_empty_with capabilities reference =
  match resolve_direct_child capabilities reference with
  | None -> true
  | Some page -> Rrbvec.is_empty (capabilities.direct_children page)

let has_children_with capabilities reference =
  match resolve_direct_child capabilities reference with
  | None -> false
  | Some entity -> capabilities.direct_children_present entity

let last_direct_child_id_with capabilities ~not_collapsed reference =
  match resolve_direct_child capabilities reference with
  | None -> None
  | Some entity ->
      let children = capabilities.direct_children entity in
      if
        not_collapsed
        && capabilities.direct_collapsed entity
        && capabilities.direct_children_present entity
      then None
      else
        let children =
          Tree_workflow.sort_with ~order:capabilities.direct_order children
        in
        let length = Rrbvec.length children in
        if length = 0 then None
        else
          Rrbvec.nth_opt children (length - 1)
          |> Option.map capabilities.direct_id

let search_last_child ~not_collapsed ~collapsed ~has_children =
  (not not_collapsed) || not (collapsed && has_children)

let page_blocks_with ~datoms ~datom_entity ~pull_many ~attribute ~pattern
    page_id =
  datoms attribute page_id |> Array.map datom_entity |> pull_many pattern

let page_blocks_count_with ~datoms ~attribute page_id =
  datoms attribute page_id |> Array.length

let journal_page_by_day_with ~datoms ~datom_entity ~entity ~attribute day =
  let values = datoms attribute day in
  if Array.length values = 0 then None
  else entity (datom_entity (Array.get values 0))

let key_value_with ~entity ~value key =
  match entity key with None -> None | Some record -> value record

let page_exists_query case_sensitive =
  let open Datalog_form in
  vector_form
    [|
      keyword "find";
      vector_form [| symbol "?p"; symbol "..." |];
      keyword "in";
      symbol "$";
      symbol "?name";
      vector_form [| symbol "?tag-ident"; symbol "..." |];
      keyword "where";
      vector_form
        [|
          symbol "?p";
          keyword (if case_sensitive then "block/title" else "block/name");
          symbol "?name";
        |];
      vector_form [| symbol "?p"; keyword "block/tags"; symbol "?tag" |];
      vector_form [| symbol "?tag"; keyword "db/ident"; symbol "?tag-ident" |];
    |]

let page_exists_with ~encode_form ~query ~collection_to_array ~string_to_value
    ~case_sensitive ~page_name ~normalized_name ~tags =
  let name = if case_sensitive then page_name else normalized_name in
  query
    (encode_form (page_exists_query case_sensitive))
    [| string_to_value name; tags |]
  |> collection_to_array

let pages_query =
  let open Datalog_form in
  vector_form
    [|
      keyword "find";
      symbol "?page-title";
      keyword "where";
      vector_form
        [| symbol "?page"; keyword "block/name"; symbol "?page-name" |];
      vector_form
        [|
          list_form
            [|
              symbol "get-else";
              symbol "$";
              symbol "?page";
              keyword "block/title";
              symbol "?page-name";
            |];
          symbol "?page-title";
        |];
    |]

let pages_with ~encode_form ~query ~collection_to_array ~row_first ~hidden =
  query (encode_form pages_query)
  |> collection_to_array |> Array.map row_first |> Rrbvec.of_array
  |> Rrbvec.filter (fun value -> not (hidden value))
  |> Rrbvec.to_array

let all_pages_with ~datoms ~datom_entity ~entity ~hidden ~internal =
  datoms ()
  |> Array.fold_left
       (fun result datom ->
         match entity (datom_entity datom) with
         | Some value when not (hidden value || internal value) ->
             Rrbvec.push_back result value
         | Some _ | None -> result)
       Rrbvec.empty
  |> Rrbvec.to_array

let parents_with ~entity ~parent ~uuid ~depth root =
  let rec collect current level result =
    if level > depth then Rrbvec.to_array result
    else
      match entity current with
      | None -> Rrbvec.to_array result
      | Some value -> (
          match parent value with
          | None -> Rrbvec.to_array result
          | Some parent_value ->
              collect (uuid parent_value) (level + 1)
                (Rrbvec.push_front result parent_value))
  in
  collect root 1 Rrbvec.empty

let pages_relation_query with_journal =
  let open Datalog_form in
  let base =
    [|
      keyword "find";
      symbol "?p";
      symbol "?ref-page";
      keyword "where";
      vector_form [| symbol "?block"; keyword "block/page"; symbol "?p" |];
    |]
  in
  let page_filter =
    if with_journal then [||]
    else
      [|
        vector_form [| symbol "?p"; keyword "block/tags" |];
        list_form
          [|
            symbol "not";
            vector_form
              [|
                symbol "?p";
                keyword "block/tags";
                keyword "logseq.class/Journal";
              |];
          |];
      |]
  in
  let relation =
    [|
      vector_form
        [| symbol "?block"; keyword "block/refs"; symbol "?ref-page" |];
    |]
  in
  vector_form (Array.append (Array.append base page_filter) relation)

let pages_relation_with ~encode_form ~query ~with_journal =
  query (encode_form (pages_relation_query with_journal))

let all_tagged_pages_query =
  let open Datalog_form in
  vector_form
    [|
      keyword "find";
      symbol "?page";
      symbol "?tag";
      keyword "where";
      vector_form [| symbol "?page"; keyword "block/tags"; symbol "?tag" |];
    |]

let all_tagged_pages_with ~encode_form ~query =
  query (encode_form all_tagged_pages_query)
