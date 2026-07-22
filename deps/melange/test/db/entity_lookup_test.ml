open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let () =
  Fest.test "DB entity lookup catalogs preserve immutable boundaries" (fun () ->
      expect_equal "nil count" (Rrbvec.length Entity_lookup.nil_idents) 17;
      expect_equal "immutable count"
        (Rrbvec.length Entity_lookup.immutable_idents)
        17;
      expect_equal "known nil" (Entity_lookup.nil_ident "block/uuid") true;
      expect_equal "immutable"
        (Entity_lookup.immutable_ident "block/title")
        true;
      expect_equal "disjoint" (Entity_lookup.immutable_ident "block/uuid") false);
  Fest.test "DB entity lookup plans memoization without hidden fallback"
    (fun () ->
      expect_equal "known nil"
        (Entity_lookup.memo_plan ~qualified:true ~node:false ~cache_enabled:true
           "block/uuid")
        Entity_lookup.Return_none;
      expect_equal "cached"
        (Entity_lookup.memo_plan ~qualified:true ~node:false ~cache_enabled:true
           "block/title")
        Entity_lookup.Cached;
      expect_equal "direct node"
        (Entity_lookup.memo_plan ~qualified:true ~node:true ~cache_enabled:true
           "block/title")
        Entity_lookup.Direct;
      expect_equal "direct dynamic"
        (Entity_lookup.memo_plan ~qualified:true ~node:false
           ~cache_enabled:false "block/title")
        Entity_lookup.Direct);
  Fest.test "DB entity lookup dispatches special attributes" (fun () ->
      expect_equal "journal raw title"
        (Entity_lookup.lookup_action ~db_based:true ~journal:true
           "block/raw-title")
        Entity_lookup.Journal_title;
      expect_equal "file raw title"
        (Entity_lookup.lookup_action ~db_based:false ~journal:true
           "block/raw-title")
        Entity_lookup.Raw_title;
      expect_equal "properties"
        (Entity_lookup.lookup_action ~db_based:true ~journal:false
           "block/properties")
        Entity_lookup.Properties;
      expect_equal "default"
        (Entity_lookup.lookup_action ~db_based:true ~journal:false
           "user.property/value")
        Entity_lookup.Default_lookup;
      expect_equal "checkbox default"
        (Entity_lookup.default_attribute ~checkbox:true)
        "logseq.property/scalar-default-value";
      expect_equal "other default"
        (Entity_lookup.default_attribute ~checkbox:false)
        "logseq.property/default-value")
