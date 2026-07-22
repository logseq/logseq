open Melange_db

type entity = {
  id : string;
  title : string;
  parent : string option;
  page : string option;
  view_for : string option;
  refs : string Rrbvec.t;
  refs_to : string Rrbvec.t;
  tags : string Rrbvec.t;
  children : string Rrbvec.t;
  includes : string Rrbvec.t;
  excludes : string Rrbvec.t;
  ident : string option;
  attributes : string Rrbvec.t;
  hidden : bool;
  class_ : bool;
  page_entity : bool;
}

let make ?(title = "") ?parent ?page ?view_for ?(refs = []) ?(refs_to = [])
    ?(tags = []) ?(children = []) ?(includes = []) ?(excludes = []) ?ident
    ?(attributes = []) ?(hidden = false) ?(class_ = false)
    ?(page_entity = false) id =
  {
    id;
    title;
    parent;
    page;
    view_for;
    refs = Rrbvec.of_list refs;
    refs_to = Rrbvec.of_list refs_to;
    tags = Rrbvec.of_list tags;
    children = Rrbvec.of_list children;
    includes = Rrbvec.of_list includes;
    excludes = Rrbvec.of_list excludes;
    ident;
    attributes = Rrbvec.of_list attributes;
    hidden;
    class_;
    page_entity;
  }

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let expect_invalid label f =
  match f () with
  | exception Invalid_argument _ -> ()
  | _ -> failwith (label ^ ": expected invalid argument")

let entity_ids values =
  values |> Rrbvec.map (fun (value : entity) -> value.id) |> Rrbvec.to_list

let page_counts values =
  values
  |> Option.map (fun entries ->
      entries
      |> Rrbvec.map (fun (entry : string Reference_workflow.page_count) ->
          (entry.label, entry.count))
      |> Rrbvec.to_list)

let capabilities entities aliases structured_children :
    (string, entity, string) Reference_workflow.capabilities =
  let entity id =
    entities |> Rrbvec.find_opt (fun (value : entity) -> value.id = id)
  in
  let required id =
    match entity id with
    | Some value -> value
    | None -> invalid_arg ("missing entity: " ^ id)
  in
  let entities ids = Rrbvec.map required ids in
  let rec descendants pending seen result =
    match Rrbvec.pop_front pending with
    | None -> result
    | Some (id, rest) ->
        if Rrbvec.mem id seen then descendants rest seen result
        else
          let children = (required id).children in
          descendants
            (Rrbvec.append rest children)
            (Rrbvec.push_back seen id)
            (Rrbvec.append result children)
  in
  let rec parents value seen result =
    match value.parent with
    | None -> result
    | Some id when Rrbvec.mem id seen -> result
    | Some id ->
        let parent = required id in
        parents parent (Rrbvec.push_back seen id)
          (Rrbvec.push_back result parent)
  in
  {
    entity;
    entity_id = (fun value -> value.id);
    equal_id = String.equal;
    id_text = (fun value -> value);
    aliases =
      (fun id ->
        aliases
        |> Rrbvec.find_opt (fun (candidate, _) -> candidate = id)
        |> Option.fold ~none:Rrbvec.empty ~some:snd);
    structured_children =
      (fun id ->
        structured_children
        |> Rrbvec.find_opt (fun (candidate, _) -> candidate = id)
        |> Option.fold ~none:Rrbvec.empty ~some:snd);
    children_ids =
      (fun value -> descendants value.children Rrbvec.empty value.children);
    direct_children = (fun value -> entities value.children);
    parents = (fun value -> parents value Rrbvec.empty Rrbvec.empty);
    parent = (fun value -> Option.map required value.parent);
    page = (fun value -> Option.map required value.page);
    view_for = (fun value -> Option.map required value.view_for);
    references = (fun value -> entities value.refs);
    references_to = (fun value -> entities value.refs_to);
    tags = (fun value -> entities value.tags);
    filter_includes = (fun value -> entities value.includes);
    filter_excludes = (fun value -> entities value.excludes);
    ident = (fun value -> value.ident);
    has_ident_field = (fun value ident -> Rrbvec.mem ident value.attributes);
    hidden = (fun value -> value.hidden);
    class_entity = (fun value -> value.class_);
    page_entity = (fun value -> value.page_entity);
    title = (fun value -> value.title);
  }

let () =
  Fest.test
    "DB linked references expand aliases filter hidden blocks and count pages"
    (fun () ->
      let values =
        Rrbvec.of_list
          [
            make ~title:"Target"
              ~refs_to:[ "hidden"; "page-hidden" ]
              ~page_entity:true "target";
            make ~refs_to:[ "ref"; "ref" ] "alias";
            make ~title:"Reference" ~page:"page-a" ~refs:[ "page-b" ]
              ~children:[ "child" ] "ref";
            make ~refs:[ "page-b" ] "child";
            make ~hidden:true "hidden";
            make ~page:"hidden-page" "page-hidden";
            make ~title:"Hidden page" ~hidden:true ~page_entity:true
              "hidden-page";
            make ~title:"Page A" ~page_entity:true "page-a";
            make ~title:"Page B" ~page_entity:true "page-b";
          ]
      in
      let result =
        Reference_workflow.linked_with
          (capabilities values
             (Rrbvec.singleton ("target", Rrbvec.singleton "alias"))
             Rrbvec.empty)
          "target"
      in
      expect_equal "reference blocks" (entity_ids result.ref_blocks) [ "ref" ];
      expect_equal "page counts"
        (page_counts result.ref_pages_count)
        (Some [ ("Page B", 2); ("Page A", 1) ]);
      expect_equal "unfiltered child metadata" result.ref_matched_children_ids
        None);
  Fest.test "DB linked reference filters retain only matching child paths"
    (fun () ->
      let values =
        Rrbvec.of_list
          [
            make ~includes:[ "include" ] ~excludes:[ "exclude" ]
              ~refs_to:[ "ref" ] ~page_entity:true "target";
            make ~children:[ "matching"; "excluded" ] "ref";
            make ~parent:"ref" ~refs:[ "include" ] "matching";
            make ~parent:"ref" ~refs:[ "exclude" ] "excluded";
            make ~title:"Include" ~page_entity:true "include";
            make ~title:"Exclude" ~page_entity:true "exclude";
          ]
      in
      let result =
        Reference_workflow.linked_with
          (capabilities values Rrbvec.empty Rrbvec.empty)
          "target"
      in
      expect_equal "filtered blocks" (entity_ids result.ref_blocks) [ "ref" ];
      expect_equal "matched children" result.ref_matched_children_ids
        (Some (Rrbvec.singleton "matching")));
  Fest.test "DB linked references exclude target class objects and fail fast"
    (fun () ->
      let values =
        Rrbvec.of_list
          [
            make ~class_:true ~refs_to:[ "class-object"; "visible" ] "target";
            make ~class_:true "child-class";
            make ~tags:[ "child-class" ] "class-object";
            make "visible";
          ]
      in
      let capabilities =
        capabilities values Rrbvec.empty
          (Rrbvec.singleton ("target", Rrbvec.singleton "child-class"))
      in
      let result = Reference_workflow.linked_with capabilities "target" in
      expect_equal "class-filtered blocks"
        (entity_ids result.ref_blocks)
        [ "visible" ];
      expect_invalid "missing target" (fun () ->
          Reference_workflow.linked_with capabilities "missing"))
