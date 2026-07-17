open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let () =
  Fest.test "DB property identity classifies namespaces and idents" (fun () ->
      expect_equal "logseq root"
        (Property_identity.is_logseq_property_namespace (Some "logseq.property"))
        true;
      expect_equal "logseq nested"
        (Property_identity.is_logseq_property_namespace
           (Some "logseq.property.agent"))
        true;
      expect_equal "unregistered logseq namespace"
        (Property_identity.is_logseq_property_namespace
           (Some "logseq.property.unknown"))
        false;
      expect_equal "missing namespace"
        (Property_identity.is_logseq_property_namespace None)
        false;
      expect_equal "user namespace"
        (Property_identity.is_user_property_namespace "user.property")
        true;
      expect_equal "embedded property namespace"
        (Property_identity.is_user_property_namespace "foo.property.bar")
        true;
      expect_equal "plain namespace"
        (Property_identity.is_user_property_namespace "property")
        false;
      expect_equal "plugin namespace"
        (Property_identity.is_plugin_property_namespace
           (Some "plugin.property.demo"))
        true;
      expect_equal "plugin root namespace"
        (Property_identity.is_plugin_property_namespace (Some "plugin.property"))
        false);
  Fest.test "DB property identity distinguishes internal and visible properties"
    (fun () ->
      expect_equal "internal logseq"
        (Property_identity.is_internal_property
           ~namespace_:(Some "logseq.property.agent")
           ~ident:"logseq.property.agent/session-id" ~is_keyword:true)
        true;
      expect_equal "public DB attribute"
        (Property_identity.is_internal_property ~namespace_:(Some "block")
           ~ident:"block/tags" ~is_keyword:true)
        true;
      expect_equal "private DB attribute"
        (Property_identity.is_internal_property ~namespace_:(Some "block")
           ~ident:"block/title" ~is_keyword:true)
        false;
      expect_equal "visible user property"
        (Property_identity.is_property ~namespace_:(Some "user.property")
           ~ident:"user.property/title" ~is_keyword:true)
        true;
      expect_equal "visible embedded property namespace"
        (Property_identity.is_property ~namespace_:(Some "foo.property.bar")
           ~ident:"foo.property.bar/title" ~is_keyword:true)
        true;
      expect_equal "unqualified ident"
        (Property_identity.is_property ~namespace_:None ~ident:"title"
           ~is_keyword:true)
        false;
      expect_equal "DB attribute symbol"
        (Property_identity.is_property ~namespace_:(Some "block")
           ~ident:"block/tags" ~is_keyword:false)
        false);
  Fest.test "DB property identity validates names and derives i18n keys"
    (fun () ->
      expect_equal "empty name" (Property_identity.valid_property_name "") true;
      expect_equal "normal name"
        (Property_identity.valid_property_name "name")
        true;
      expect_equal "tag name"
        (Property_identity.valid_property_name "#tag")
        false;
      expect_equal "page-ref name"
        (Property_identity.valid_property_name "[[page]]")
        false;
      expect_equal "leading spaces"
        (Property_identity.valid_property_name " [[page]]")
        true;
      expect_equal "block key"
        (Property_identity.built_in_i18n_key ~namespace_:(Some "block")
           ~name:"collapsed?")
        (Some ("property.built-in", "collapsed"));
      expect_equal "nested property"
        (Property_identity.built_in_i18n_key
           ~namespace_:(Some "logseq.property.agent") ~name:"session-id")
        (Some ("property.built-in", "agent-session-id"));
      expect_equal "closed value"
        (Property_identity.built_in_i18n_key
           ~namespace_:(Some "logseq.property") ~name:"status.backlog")
        (Some ("property.status", "backlog"));
      expect_equal "class key"
        (Property_identity.built_in_i18n_key ~namespace_:(Some "logseq.class")
           ~name:"Task")
        (Some ("class.built-in", "task"));
      expect_equal "user key"
        (Property_identity.built_in_i18n_key ~namespace_:(Some "user.property")
           ~name:"title")
        None;
      expect_equal "full built-in ident"
        (Property_identity.built_in_i18n_key_for_ident "logseq.property/status")
        (Some ("property.built-in", "status")));
  Fest.test "DB property identity recognizes built-in ref value types"
    (fun () ->
      expect_equal "status"
        (Property_identity.built_in_has_ref_value "logseq.property/status")
        true;
      expect_equal "created at"
        (Property_identity.built_in_has_ref_value
           "logseq.property/block-created-at")
        false;
      expect_equal "unknown"
        (Property_identity.built_in_has_ref_value "user.property/unknown")
        false);
  Fest.test "DB property identity selects visible property entries" (fun () ->
      let namespace_of key =
        match String.rindex_opt key '/' with
        | None -> None
        | Some index -> Some (String.sub key 0 index)
      in
      expect_equal "visible entries"
        (Property_identity.visible_entries ~namespace_of ~ident_of:Fun.id
           ~is_keyword:(fun _ -> true)
           (Rrbvec.of_array
              [|
                ("block/title", 1);
                ("block/tags", 2);
                ("user.property/score", 3);
              |])
        |> Rrbvec.to_array)
        [| ("block/tags", 2); ("user.property/score", 3) |])
