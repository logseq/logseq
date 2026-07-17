open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let () =
  Fest.test "DB validation identity classifies property and class idents"
    (fun () ->
      expect_equal "user property"
        (Validation_identity.is_user_property_ident
           ~namespace_:(Some "user.property") ~qualified:true)
        true;
      expect_equal "embedded user property"
        (Validation_identity.is_user_property_ident
           ~namespace_:(Some "foo.property.bar") ~qualified:true)
        true;
      expect_equal "unqualified user property"
        (Validation_identity.is_user_property_ident ~namespace_:None
           ~qualified:false)
        false;
      expect_equal "user class"
        (Validation_identity.is_class_ident ~namespace_:(Some "user.class")
           ~qualified:true)
        true;
      expect_equal "embedded class marker"
        (Validation_identity.is_class_ident
           ~namespace_:(Some "plugin.class.extra") ~qualified:true)
        true;
      expect_equal "plain namespace"
        (Validation_identity.is_class_ident ~namespace_:(Some "class")
           ~qualified:true)
        false);
  Fest.test "DB validation identity recognizes internal idents" (fun () ->
      expect_equal "DB attribute"
        (Validation_identity.is_internal_ident ~namespace_:(Some "block")
           ~ident:"block/title")
        true;
      expect_equal "Logseq class"
        (Validation_identity.is_internal_ident ~namespace_:(Some "logseq.class")
           ~ident:"logseq.class/Task")
        true;
      expect_equal "Logseq KV"
        (Validation_identity.is_internal_ident ~namespace_:(Some "logseq.kv")
           ~ident:"logseq.kv/import-type")
        true;
      expect_equal "user property"
        (Validation_identity.is_internal_ident
           ~namespace_:(Some "user.property") ~ident:"user.property/score")
        false;
      expect_equal "missing namespace"
        (Validation_identity.is_internal_ident ~namespace_:None ~ident:"score")
        false)
