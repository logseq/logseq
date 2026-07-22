type hidden_ref_input = {
  self : bool;
  page_self : bool;
  view_self : bool;
  hidden_page : bool;
  hidden_block : bool;
  class_match : bool;
  ident_property : bool;
}

module Int_set = Set.Make (Int)

type load_status = Full | Children | Self

let oldest_id ids =
  Rrbvec.fold_left
    (fun result id ->
      match result with
      | None -> Some id
      | Some current -> Some (min current id))
    None ids

let oldest_matching_id_with ~datoms ~datom_id ~eligible =
  datoms ()
  |> Array.fold_left
       (fun result datom ->
         let id = datom_id datom in
         if not (eligible id) then result
         else
           match result with
           | None -> Some id
           | Some current -> Some (min current id))
       None

let expand_children ~include_collapsed ~collapsed ~page =
  include_collapsed || (not collapsed) || page

let hidden_ref input =
  input.self || input.page_self || input.view_self || input.hidden_page
  || input.hidden_block || input.class_match || input.ident_property

let child_load_status ~collapsed ~large_page ~all_children_loaded =
  if (not collapsed) && ((not large_page) || all_children_loaded) then Full
  else Self

let block_load_status ~children ~include_collapsed ~properties_empty =
  if children && include_collapsed && properties_empty then Full
  else if children && properties_empty then Children
  else Self

let journal ~day ~today ~journal ~id_present ~recycled =
  day <= today && journal && id_present && not recycled

let recent_page ~has_page_datom ~blank_title ~page ~hidden =
  (not has_page_datom) && (not blank_title) && page && not hidden

let blank = function
  | None -> true
  | Some value ->
      let whitespace = function
        | ' ' | '\t' | '\n' | '\r' | '\012' -> true
        | _ -> false
      in
      let rec loop index =
        index = String.length value
        || (whitespace value.[index] && loop (index + 1))
      in
      loop 0

let recent_pages_with ~updated_datoms ~datom_entity ~has_page_datom ~title
    ~entity ~page ~hidden =
  let datoms = updated_datoms () in
  let rec collect index count result =
    if index < 0 || count = 15 then Rrbvec.to_array result
    else
      let datom = datoms.(index) in
        let id = datom_entity datom in
        let has_page_datom = has_page_datom id in
        let title = title id in
        let value = entity id in
        let included =
          recent_page ~has_page_datom ~blank_title:(blank title)
            ~page:(page value) ~hidden:(hidden value)
        in
        if included then
          collect (index - 1) (count + 1) (Rrbvec.push_back result value)
        else collect (index - 1) count result
  in
  collect (Array.length datoms - 1) 0 Rrbvec.empty

let latest_journals_with ~datoms ~datom_entity ~datom_day ~entity ~entity_id
    ~journal_entity ~recycled ~id_equal ~today =
  let pending = datoms () in
  let rec collect index seen result =
    if index < 0 then Rrbvec.to_array result
    else
      let datom = pending.(index) in
      (
        match entity (datom_entity datom) with
        | None -> collect (index - 1) seen result
        | Some value -> (
            let id = entity_id value in
            let included =
              journal ~day:(datom_day datom) ~today
                ~journal:(journal_entity value) ~id_present:(Option.is_some id)
                ~recycled:(recycled value)
            in
            match id with
            | Some id
              when included
                   && not
                        (Rrbvec.exists (fun seen_id -> id_equal id seen_id) seen)
              ->
                collect (index - 1) (Rrbvec.push_back seen id)
                  (Rrbvec.push_back result value)
            | Some _ | None -> collect (index - 1) seen result))
  in
  collect (Array.length pending - 1) Rrbvec.empty Rrbvec.empty

let distinct_values id_equal values =
  values
  |> Array.fold_left
       (fun result value ->
         if Rrbvec.exists (id_equal value) result then result
         else Rrbvec.push_back result value)
       Rrbvec.empty
  |> Rrbvec.to_array

let with_reference_context ~aliases ~entity ~entity_id ~ident ~class_entity
    ~structured_children ~page ~view_for ~hidden ~tags ~has_ident ~id_equal root
    consume =
  let target = entity root in
  let target_ident = Option.bind target ident in
  let class_ids =
    match target with
    | Some value when class_entity value ->
        distinct_values id_equal
          (Array.append [| root |] (structured_children root))
        |> Option.some
    | Some _ | None -> None
  in
  let alias_ids =
    Array.append [| root |] (aliases root) |> distinct_values id_equal
  in
  let id_matches value =
    match entity_id value with Some id -> id_equal root id | None -> false
  in
  let hidden_candidate value =
    let page_value = page value in
    let view_value = view_for value in
    let class_match =
      match class_ids with
      | None -> false
      | Some ids ->
          tags value
          |> Array.exists (fun tag ->
              match entity_id tag with
              | None -> false
              | Some tag_id -> Array.exists (id_equal tag_id) ids)
    in
    hidden_ref
      {
        self = id_matches value;
        page_self = Option.fold ~none:false ~some:id_matches page_value;
        view_self = Option.fold ~none:false ~some:id_matches view_value;
        hidden_page = Option.fold ~none:false ~some:hidden page_value;
        hidden_block = hidden value;
        class_match;
        ident_property =
          Option.fold ~none:false ~some:(has_ident value) target_ident;
      }
  in
  consume alias_ids hidden_candidate

let block_refs_with ~aliases ~entity ~entity_id ~ident ~class_entity
    ~structured_children ~references ~page ~view_for ~hidden ~tags ~has_ident
    ~id_equal root =
  with_reference_context ~aliases ~entity ~entity_id ~ident ~class_entity
    ~structured_children ~page ~view_for ~hidden ~tags ~has_ident ~id_equal root
    (fun alias_ids hidden_candidate ->
      alias_ids
      |> Array.fold_left
           (fun result alias_id ->
             match entity alias_id with
             | None -> result
             | Some alias ->
                 references alias
                 |> Array.fold_left
                      (fun result value ->
                        if hidden_candidate value then result
                        else Rrbvec.push_back result value)
                      result)
           Rrbvec.empty
      |> Rrbvec.to_array)

let block_refs_count_with ~aliases ~entity ~entity_id ~ident ~class_entity
    ~structured_children ~ref_datoms ~datom_entity ~page ~view_for ~hidden ~tags
    ~has_ident ~id_equal root =
  with_reference_context ~aliases ~entity ~entity_id ~ident ~class_entity
    ~structured_children ~page ~view_for ~hidden ~tags ~has_ident ~id_equal root
    (fun alias_ids hidden_candidate ->
      let cache = ref Rrbvec.empty in
      let entity_cached id =
        match
          Rrbvec.find_opt (fun (cached_id, _) -> id_equal id cached_id) !cache
        with
        | Some (_, value) -> value
        | None ->
            let value = entity id in
            cache := Rrbvec.push_back !cache (id, value);
            value
      in
      alias_ids
      |> Array.fold_left
           (fun total alias_id ->
             ref_datoms alias_id
             |> Array.fold_left
                  (fun total datom ->
                    match entity_cached (datom_entity datom) with
                    | Some value when not (hidden_candidate value) -> total + 1
                    | Some _ | None -> total)
                  total)
           0)

let related_ids_query relation =
  let result_symbol, input_symbol =
    match relation with
    | "alias" -> ("?e", "?eid")
    | "parent" -> ("?c", "?id")
    | value -> invalid_arg ("DB initial reads: unknown relation " ^ value)
  in
  let open Datalog_form in
  vector_form
    [|
      keyword "find";
      vector_form [| symbol result_symbol; symbol "..." |];
      keyword "in";
      symbol "$";
      symbol input_symbol;
      symbol "%";
      keyword "where";
      list_form [| symbol relation; symbol input_symbol; symbol result_symbol |];
    |]

let related_ids_with ~encode_form ~query ~collection_to_array ~value_equals
    ~relation ~root ~rule =
  query (encode_form (related_ids_query relation)) [| root; rule |]
  |> collection_to_array
  |> Array.fold_left
       (fun result value ->
         if Rrbvec.exists (value_equals value) result then result
         else Rrbvec.push_back result value)
       Rrbvec.empty
  |> Rrbvec.to_array

let children_ids_with ~root ~entity ~entity_id ~collapsed ~page ~children
    ~include_collapsed =
  match root () with
  | None -> None
  | Some root_entity ->
      let rec expand pending expanded result =
        match Rrbvec.pop_front pending with
        | None ->
            result |> Int_set.to_seq |> Rrbvec.of_seq |> Rrbvec.to_array
        | Some (value, rest) ->
            let id = entity_id value in
            if Int_set.mem id expanded then expand rest expanded result
            else
              let expanded = Int_set.add id expanded in
              if
                not
                  (expand_children ~include_collapsed
                     ~collapsed:(collapsed value) ~page:(page value))
              then expand rest expanded result
              else
                let child_ids = children value in
                let result =
                  Array.fold_left
                    (fun result child_id -> Int_set.add child_id result)
                    result child_ids
                in
                let child_entities =
                  child_ids |> Rrbvec.of_array |> Rrbvec.map entity
                in
                expand (Rrbvec.append rest child_entities) expanded result
      in
      Some
        (expand (Rrbvec.singleton root_entity) Int_set.empty Int_set.empty)

let excluded_initial_attributes =
  Rrbvec.of_array
    [|
      "block/created-at";
      "block/updated-at";
      "block/tx-id";
      "logseq.property/created-by-ref";
    |]

let include_initial_attribute attribute =
  not (Rrbvec.mem attribute excluded_initial_attributes)

let large_page count = count >= 100
