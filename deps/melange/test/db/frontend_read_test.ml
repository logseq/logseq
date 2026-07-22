open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let () =
  Fest.test "DB frontend read classifies built-in pages and class properties"
    (fun () ->
      expect_equal "class property"
        (Frontend_read.built_in_class_property ~class_built_in:true
           ~class_value:true ~property_built_in:true
           ~property_ident:"logseq.property/status"
           ~schema_properties:
             (Rrbvec.of_list
                [ "logseq.property/status"; "logseq.property/priority" ]))
        true;
      expect_equal "non-class"
        (Frontend_read.built_in_class_property ~class_built_in:true
           ~class_value:false ~property_built_in:true
           ~property_ident:"logseq.property/status"
           ~schema_properties:(Rrbvec.of_list [ "logseq.property/status" ]))
        false;
      expect_equal "private property"
        (Frontend_read.private_built_in_page ~property:true
           ~public_property:false ~class_value:false ~internal_page:false)
        true;
      expect_equal "public property"
        (Frontend_read.private_built_in_page ~property:true
           ~public_property:true ~class_value:false ~internal_page:false)
        false;
      expect_equal "class"
        (Frontend_read.private_built_in_page ~property:false
           ~public_property:false ~class_value:true ~internal_page:false)
        false;
      expect_equal "future built-in"
        (Frontend_read.private_built_in_page ~property:false
           ~public_property:false ~class_value:false ~internal_page:false)
        true);
  Fest.test "DB frontend read formats page ancestry and class membership"
    (fun () ->
      expect_equal "class title"
        (Frontend_read.class_title_with_extends ~title:(Some "Task")
           (Rrbvec.of_list
              [
                ({ title = Some "Task"; built_in = false }
                  : Frontend_read.extend);
                { title = Some "Hidden"; built_in = true };
                { title = Some "Work"; built_in = false };
                { title = Some "Project"; built_in = false };
              ]))
        (Some "Work | Project/Task");
      expect_equal "page title"
        (Frontend_read.page_title
           (Rrbvec.of_list [ "Library"; "Projects" ])
           "Roadmap")
        "Library/Projects/Roadmap";
      expect_equal "direct class"
        (Frontend_read.class_instance ~class_id:"2"
           ~tag_ids:(Rrbvec.of_list [ "1"; "2" ])
           ~parent_ids:Rrbvec.empty)
        true;
      expect_equal "parent class"
        (Frontend_read.class_instance ~class_id:"3"
           ~tag_ids:(Rrbvec.of_list [ "1"; "2" ])
           ~parent_ids:(Rrbvec.of_list [ "3"; "4" ]))
        true;
      expect_equal "unrelated class"
        (Frontend_read.class_instance ~class_id:"5"
           ~tag_ids:(Rrbvec.of_list [ "1"; "2" ])
           ~parent_ids:(Rrbvec.of_list [ "3"; "4" ]))
        false);
  Fest.test "DB frontend read owns inline tag and display mappings" (fun () ->
      expect_equal "inline tag"
        (Frontend_read.inline_tag "before #[[uuid-a]] after" "uuid-a")
        true;
      expect_equal "plain page ref"
        (Frontend_read.inline_tag "before [[uuid-a]] after" "uuid-a")
        false;
      expect_equal "display to class"
        (Frontend_read.class_ident_by_display_type "code")
        (Some "logseq.class/Code-block");
      expect_equal "unknown display"
        (Frontend_read.class_ident_by_display_type "table")
        None;
      expect_equal "class to display"
        (Frontend_read.display_type_by_class_ident "logseq.class/Math-block")
        (Some "math");
      expect_equal "library"
        (Frontend_read.library ~built_in:true ~title:"Library"
           ~library_title:"Library")
        true;
      expect_equal "user page named library"
        (Frontend_read.library ~built_in:false ~title:"Library"
           ~library_title:"Library")
        false)
