open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

type node = {
  uuid : string option;
  title : string option;
  raw_title : string option;
  page : bool;
  valid_ref : bool;
  tags : node Rrbvec.t;
  refs : node Rrbvec.t;
}

let node ?uuid ?title ?raw_title ?(page = false) ?(valid_ref = true)
    ?(tags = Rrbvec.empty) ?(refs = Rrbvec.empty) () =
  { uuid; title; raw_title; page; valid_ref; tags; refs }

let () =
  Fest.test "DB content scanning returns distinct lowercase UUID references"
    (fun () ->
      let uuid_a = "11111111-1111-1111-1111-111111111111" in
      let uuid_b = "22222222-2222-2222-2222-222222222222" in
      expect_equal "ordered distinct references"
        (Content.matched_ids
           ("before [[" ^ uuid_a ^ "]] duplicate [[" ^ uuid_a ^ "]] tag #[["
          ^ uuid_b ^ "]] after"))
        (Rrbvec.of_array [| uuid_a; uuid_b |]);
      expect_equal "no references" (Content.matched_ids "no ids") Rrbvec.empty;
      expect_equal "invalid hexadecimal"
        (Content.matched_ids "[[11111111-1111-1111-1111-11111111111g]]")
        Rrbvec.empty;
      expect_equal "uppercase UUID"
        (Content.matched_ids "[[AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA]]")
        Rrbvec.empty);
  Fest.test "DB content replacement preserves JavaScript replacement tokens"
    (fun () ->
      let refs : Content.ref_entry Rrbvec.t =
        Rrbvec.of_array
          [|
            { Content.target = "[[uuid-a]]"; title = "Page A" };
            { Content.target = "[[uuid-b]]"; title = "$&" };
            { Content.target = "[[uuid-c]]"; title = "$$" };
          |]
      in
      expect_equal "ordered replacements"
        (Content.replace_id_refs
           "[[uuid-a]] then [[uuid-a]] and [[uuid-b]] and [[uuid-c]]" refs)
        "Page A then Page A and [[uuid-b]] and $";
      expect_equal "no matching ref"
        (Content.replace_id_refs "unchanged [[missing]]" refs)
        "unchanged [[missing]]");
  Fest.test "DB content tag conversion preserves legacy ordering and matching"
    (fun () ->
      let tags : Content.tag_entry Rrbvec.t =
        Rrbvec.of_array
          [|
            { Content.title = "foo"; id = "foo" };
            { Content.title = "foo-bar"; id = "foo-bar" };
          |]
      in
      expect_equal "overlapping tags"
        (Content.replace_tags_with_id_refs "string #foo string2 #foo-bar" tags)
        "string [[foo]] string2 [[foo-bar]]";
      expect_equal "case insensitive and trimmed"
        (Content.replace_tags_with_id_refs "  #FOO #[[foo]] #Foo-Bar  " tags)
        "[[foo]] [[foo]] [[foo-bar]]";
      let literal_tags : Content.tag_entry Rrbvec.t =
        Rrbvec.of_array
          [|
            { Content.title = "a.b"; id = "dot-id" };
            { Content.title = "Page With Space"; id = "space-id" };
          |]
      in
      expect_equal "page refs and regexp metacharacters"
        (Content.replace_tags_with_id_refs
           "#[[Page With Space]] and #a.b but #axb" literal_tags)
        "[[space-id]] and [[dot-id]] but #axb";
      expect_equal "tag refs to page refs"
        (Content.replace_tag_refs_with_page_refs
           "  #[[foo]] and #[[FOO]] and [[other]]  " tags)
        "[[foo]] and [[foo]] and [[other]]";
      expect_equal "plain tags remain unchanged"
        (Content.replace_tag_refs_with_page_refs "unchanged #plain" tags)
        "unchanged #plain");
  Fest.test "DB content title references convert to internal IDs" (fun () ->
      let refs : Content.title_ref_entry Rrbvec.t =
        Rrbvec.of_array
          [|
            {
              Content.title = "page1";
              id = "11111111-1111-1111-1111-111111111111";
              original_title = None;
            };
            {
              Content.title = "Jun 15th, 2026";
              id = "22222222-2222-2222-2222-222222222222";
              original_title = Some "2026-06-15";
            };
            {
              Content.title = "ignored original";
              id = "33333333-3333-3333-3333-333333333333";
              original_title = Some "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA";
            };
          |]
      in
      expect_equal "page and original titles"
        (Content.replace_title_refs
           "[[page1]] [[2026-06-15]] [[ignored original]]" refs
           ~replace_tags:true)
        "[[11111111-1111-1111-1111-111111111111]] \
         [[22222222-2222-2222-2222-222222222222]] \
         [[33333333-3333-3333-3333-333333333333]]";
      expect_equal "plain and page-ref tags"
        (Content.replace_title_refs "#page1 #[[2026-06-15]]" refs
           ~replace_tags:true)
        "#[[11111111-1111-1111-1111-111111111111]] #[[2026-06-15]]";
      expect_equal "tag replacement disabled"
        (Content.replace_title_refs "#page1 #[[2026-06-15]]" refs
           ~replace_tags:false)
        "#page1 #[[2026-06-15]]";
      expect_equal "markdown hashtag target"
        (Content.replace_title_refs "alias [Page](#page1)" refs
           ~replace_tags:true)
        "alias [Page](#[[11111111-1111-1111-1111-111111111111]])";
      expect_equal "hashtag token boundary"
        (Content.replace_title_refs "#page1-extra (#page1), #page1." refs
           ~replace_tags:true)
        "#page1-extra (#[[11111111-1111-1111-1111-111111111111]]), \
         #[[11111111-1111-1111-1111-111111111111]].";
      let hash_tag_ref : Content.title_ref_entry Rrbvec.t =
        Rrbvec.of_array
          [|
            {
              Content.title = "HashTag-topic";
              id = "44444444-4444-4444-4444-444444444444";
              original_title = None;
            };
          |]
      in
      expect_equal "HashTag page-name normalization"
        (Content.replace_title_refs "[[#topic]]" hash_tag_ref ~replace_tags:true)
        "[[44444444-4444-4444-4444-444444444444]]");
  Fest.test "DB content UUID titles expand recursively" (fun () ->
      let uuid_a = "11111111-1111-1111-1111-111111111111" in
      let uuid_b = "22222222-2222-2222-2222-222222222222" in
      let uuid_c = "33333333-3333-3333-3333-333333333333" in
      let entries : Content.uuid_title_entry Rrbvec.t =
        Rrbvec.of_array
          [|
            { Content.uuid = uuid_a; title = Content.page_ref uuid_b };
            { Content.uuid = uuid_b; title = "Leaf Page" };
            { Content.uuid = uuid_c; title = "simple-tag" };
          |]
      in
      expect_equal "recursive replacement"
        (Content.replace_uuid_refs (Content.page_ref uuid_a) entries
           ~max_depth:10)
        "[[[[Leaf Page]]]]";
      expect_equal "one replacement pass"
        (Content.replace_uuid_refs (Content.page_ref uuid_a) entries
           ~max_depth:1)
        (Content.page_ref (Content.page_ref uuid_b));
      expect_equal "simple hashtag title"
        (Content.replace_uuid_refs
           ("#" ^ Content.page_ref uuid_c)
           entries ~max_depth:10)
        "#simple-tag";
      expect_equal "spaced hashtag title"
        (Content.replace_uuid_refs
           ("#" ^ Content.page_ref uuid_b)
           entries ~max_depth:10)
        "#[[Leaf Page]]";
      expect_equal "unknown and uppercase UUIDs"
        (Content.replace_uuid_refs
           "[[44444444-4444-4444-4444-444444444444]] \
            [[AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA]]"
           entries ~max_depth:10)
        "[[44444444-4444-4444-4444-444444444444]] \
         [[AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA]]");
  Fest.test "DB content internal IDs convert to titles" (fun () ->
      let uuid_a = "11111111-1111-1111-1111-111111111111" in
      let uuid_b = "22222222-2222-2222-2222-222222222222" in
      let refs : Content.uuid_title_entry Rrbvec.t =
        Rrbvec.of_array
          [|
            {
              Content.uuid = uuid_a;
              title = "Outer " ^ Content.page_ref uuid_b;
            };
            { Content.uuid = uuid_b; title = "Inner Page" };
          |]
      in
      expect_equal "nested titles and hashtags"
        (Content.replace_id_refs_with_titles
           ("#" ^ Content.page_ref uuid_a ^ " " ^ Content.page_ref uuid_a ^ " #"
          ^ Content.page_ref uuid_b)
           refs)
        "#[[Outer [[Inner Page]]]] [[Outer [[Inner Page]]]] #[[Inner Page]]";
      let simple_ref : Content.uuid_title_entry Rrbvec.t =
        Rrbvec.of_array [| { Content.uuid = uuid_a; title = "simple-tag" } |]
      in
      expect_equal "simple hashtag"
        (Content.replace_id_refs_with_titles
           ("#" ^ Content.page_ref uuid_a)
           simple_ref)
        "#simple-tag";
      let replacement_ref : Content.uuid_title_entry Rrbvec.t =
        Rrbvec.of_array [| { Content.uuid = uuid_a; title = "$&" } |]
      in
      expect_equal "JavaScript replacement token"
        (Content.replace_id_refs_with_titles (Content.page_ref uuid_a)
           replacement_ref)
        (Content.page_ref (Content.page_ref uuid_a)));
  Fest.test "DB content classifies page references from tags" (fun () ->
      let page_tag = node ~page:true () in
      let property_tag = node ~page:false () in
      let reference = node ~tags:(Rrbvec.singleton page_tag) () in
      let non_page = node ~tags:(Rrbvec.singleton property_tag) () in
      let page_ref value =
        Content.page_ref_entity_with ~tags:(fun value -> value.tags)
          ~tag_ident:Fun.id ~is_page_ident:(fun value -> value.page)
          value
      in
      expect_equal "page reference" (page_ref reference) true;
      expect_equal "non-page reference" (page_ref non_page) false);
  Fest.test "DB content collects recursive UUID titles with a depth bound"
    (fun () ->
      let leaf = node ~uuid:"uuid-b" ~title:"Leaf" () in
      let nested =
        node ~uuid:"uuid-a" ~title:"[[uuid-b]]"
          ~refs:(Rrbvec.singleton leaf) ()
      in
      let root = node ~refs:(Rrbvec.singleton nested) () in
      let entries =
        Content.uuid_title_entries_with ~refs:(fun value -> value.refs)
          ~uuid:(fun value -> value.uuid)
          ~title:(fun value -> value.title)
          ~page_ref:(fun value -> value.page)
          ~is_ref:(fun value -> value.valid_ref) ~equal:String.equal
          ~stringify:Fun.id ~max_depth:10 ~replace_block_refs:true root
        |> Rrbvec.to_array
      in
      expect_equal "recursive UUID titles" entries
        [|
          { Content.uuid = "uuid-a"; title = "[[uuid-b]]" };
          { Content.uuid = "uuid-b"; title = "Leaf" };
        |]);
  Fest.test "DB content selects page title refs and excludes duplicate names"
    (fun () ->
      let page = node ~uuid:"page" ~raw_title:"Same" ~page:true () in
      let block = node ~uuid:"block" ~raw_title:"Block" () in
      let refs = Rrbvec.of_array [| page; block |] in
      let selected =
        Content.select_id_title_entries_with ~refs
          ~page_ref:(fun value -> value.page)
          ~uuid:(fun value -> value.uuid)
          ~raw_title:(fun value -> value.raw_title)
          ~duplicate_title:(String.equal "Same") ~replace_block_ids:false
          ~replace_pages_with_same_name:false
        |> Rrbvec.to_array
      in
      expect_equal "duplicate and block refs excluded" selected [||])
