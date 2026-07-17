open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let ancestor ?id ?(hidden = false) ?(deleted = false) () : Entity_read.ancestor
    =
  { id; hidden; deleted }

type value =
  | Nil
  | Text of string
  | Keyword of string
  | Bool of bool
  | Id of int
  | Values of value array
  | Node of (string * value) list

let get value field =
  match value with
  | Node fields -> Option.value ~default:Nil (List.assoc_opt field fields)
  | _ -> Nil

let truthy = function Nil | Bool false -> false | _ -> true

let value_to_string = function
  | Text value -> value
  | Keyword value -> ":" ^ value
  | Bool value -> string_of_bool value
  | Id value -> string_of_int value
  | Nil -> ""
  | Values _ | Node _ -> "object"

let () =
  Fest.test "DB entity read classifies page tags" (fun () ->
      let tags =
        Rrbvec.of_list
          [ "logseq.class/Page"; "logseq.class/Tag"; "user.class/Other" ]
      in
      expect_equal "page tag"
        (Entity_read.has_tag tags "logseq.class/Page")
        true;
      expect_equal "property tag"
        (Entity_read.has_tag tags "logseq.class/Property")
        false;
      expect_equal "entity types"
        (Entity_read.entity_types tags |> Rrbvec.to_list)
        [ Entity_read.Class; Entity_read.Page ];
      let tag_entity = Node [ ("db/ident", Keyword "logseq.class/Tag") ] in
      let entity =
        Node
          [
            ( "block/tags",
              Values [| Keyword "logseq.class/Page"; tag_entity; Nil |] );
          ]
      in
      expect_equal "typed tag extraction"
        (Entity_read.tag_ident_texts_with ~get
           ~collection_to_array:(function Values values -> values | _ -> [||])
           ~is_collection:(function Values _ -> true | _ -> false)
           ~is_keyword:(function Keyword _ -> true | _ -> false)
           ~keyword_to_string:(function
             | Keyword value -> value | _ -> assert false)
           ~resolve_tag:(fun value -> value)
           entity
        |> Rrbvec.to_list)
        [ "logseq.class/Page"; "logseq.class/Tag" ];
      let scalar_entity =
        Node [ ("block/tags", Id 191) ]
      in
      expect_equal "scalar entity tag extraction"
        (Entity_read.tag_ident_texts_with ~get
           ~collection_to_array:(function Values values -> values | _ -> [||])
           ~is_collection:(function Values _ -> true | _ -> false)
           ~is_keyword:(function Keyword _ -> true | _ -> false)
           ~keyword_to_string:(function
             | Keyword value -> value | _ -> assert false)
           ~resolve_tag:(function Id 191 -> tag_entity | value -> value)
           scalar_entity
        |> Rrbvec.to_list)
        [ "logseq.class/Tag" ]);
  Fest.test "DB entity read preserves hidden ancestry boundaries" (fun () ->
      expect_equal "internal name"
        (Entity_read.hidden ~page_name:(Some "$$$internal") ~recognized:false
           ~root_hidden:false ~root_deleted:false Rrbvec.empty)
        true;
      expect_equal "root hidden"
        (Entity_read.hidden ~page_name:None ~recognized:true ~root_hidden:true
           ~root_deleted:false Rrbvec.empty)
        true;
      expect_equal "hidden ancestor"
        (Entity_read.hidden ~page_name:None ~recognized:true ~root_hidden:false
           ~root_deleted:false
           (Rrbvec.of_list [ ancestor ~id:"1" ~hidden:true () ]))
        true;
      expect_equal "missing ancestor id"
        (Entity_read.hidden ~page_name:None ~recognized:true ~root_hidden:false
           ~root_deleted:false
           (Rrbvec.of_list [ ancestor ~hidden:true () ]))
        false;
      expect_equal "cycle boundary"
        (Entity_read.hidden ~page_name:None ~recognized:true ~root_hidden:false
           ~root_deleted:false
           (Rrbvec.of_list
              [ ancestor ~id:"1" (); ancestor ~id:"1" ~hidden:true () ]))
        false);
  Fest.test "DB entity read preserves recycled ancestry boundaries" (fun () ->
      expect_equal "unrecognized"
        (Entity_read.recycled ~recognized:false ~root_deleted:true Rrbvec.empty)
        false;
      expect_equal "root recycled"
        (Entity_read.recycled ~recognized:true ~root_deleted:true Rrbvec.empty)
        true;
      expect_equal "recycled ancestor"
        (Entity_read.recycled ~recognized:true ~root_deleted:false
           (Rrbvec.of_list [ ancestor ~id:"2" ~deleted:true () ]))
        true);
  Fest.test "DB entity read owns normalized page-name datom lookup" (fun () ->
      let calls = ref Rrbvec.empty in
      let result =
        Entity_read.pages_by_name_with
          ~datoms:(fun attribute value ->
            calls := Rrbvec.push_back !calls (attribute, value);
            [| 10; 20 |])
          ~name_attribute:"block/name"
          ~normalize:(fun value -> String.lowercase_ascii value)
          "Mixed Case"
      in
      expect_equal "page datoms" result [| 10; 20 |];
      expect_equal "normalized lookup" (Rrbvec.to_array !calls)
        [| ("block/name", "mixed case") |]);
  Fest.test "DB entity read owns value and ancestry inspection" (fun () ->
      let hidden_parent =
        Node
          [
            ("db/id", Text "parent");
            ("logseq.property/hide?", Bool true);
            ("logseq.property/deleted-at", Nil);
            ("block/parent", Nil);
          ]
      in
      let page =
        Node
          [
            ("db/id", Text "page");
            ("logseq.property/hide?", Nil);
            ("logseq.property/deleted-at", Nil);
            ("block/parent", hidden_parent);
          ]
      in
      let common =
        ( get,
          (function Nil -> true | _ -> false),
          (function Text _ -> true | _ -> false),
          (function Text value -> value | _ -> assert false),
          (function Node _ -> true | _ -> false),
          truthy,
          value_to_string )
      in
      let ( get,
            is_nil,
            is_string,
            string_from_value,
            entity_like,
            truthy,
            value_to_string ) =
        common
      in
      expect_equal "hidden value"
        (Entity_read.hidden_value_with ~get ~is_nil ~is_string
           ~string_from_value ~entity_like ~truthy ~value_to_string page)
        true;
      expect_equal "recycled value"
        (Entity_read.recycled_value_with ~get ~is_nil ~entity_like ~truthy
           ~value_to_string page)
        false;
      expect_equal "internal string"
        (Entity_read.hidden_value_with ~get ~is_nil ~is_string
           ~string_from_value ~entity_like ~truthy ~value_to_string
           (Text "$$$internal"))
        true)
