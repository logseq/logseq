open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let extend ?title ?(built_in = false) () : Block_title.extend =
  { title; built_in }

let () =
  Fest.test "DB block title preserves built-in and missing titles" (fun () ->
      expect_equal "built-in"
        (Block_title.unique_title ~built_in:true ~stored_title:(Some "Built in")
           ~class_:false ~class_conflict:false ~extends:Rrbvec.empty
           ~display_title:None ~truncate:true ~tag_titles:Rrbvec.empty
           ~alias:(Some "ignored"))
        (Some "Built in");
      expect_equal "missing"
        (Block_title.unique_title ~built_in:false ~stored_title:None
           ~class_:false ~class_conflict:false ~extends:Rrbvec.empty
           ~display_title:None ~truncate:true ~tag_titles:Rrbvec.empty
           ~alias:None)
        None);
  Fest.test "DB block title disambiguates conflicting classes" (fun () ->
      expect_equal "single parent"
        (Block_title.unique_title ~built_in:false ~stored_title:(Some "Task")
           ~class_:true ~class_conflict:true
           ~extends:(Rrbvec.of_list [ extend ~title:"Work" () ])
           ~display_title:None ~truncate:true ~tag_titles:Rrbvec.empty
           ~alias:None)
        (Some "Work/Task");
      expect_equal "eligible parents"
        (Block_title.unique_title ~built_in:false ~stored_title:(Some "Task")
           ~class_:true ~class_conflict:true
           ~extends:
             (Rrbvec.of_list
                [
                  extend ~title:"Task" ();
                  extend ~title:"Hidden" ~built_in:true ();
                  extend ~title:"Work" ();
                  extend ~title:"Project" ();
                  extend ~title:"Ignored" ();
                ])
           ~display_title:None ~truncate:true ~tag_titles:Rrbvec.empty
           ~alias:None)
        (Some "Work | Project/Task"));
  Fest.test "DB block title appends tags aliases and truncates" (fun () ->
      expect_equal "tags and alias"
        (Block_title.unique_title ~built_in:false ~stored_title:(Some "Block")
           ~class_:false ~class_conflict:false ~extends:Rrbvec.empty
           ~display_title:None ~truncate:true
           ~tag_titles:(Rrbvec.of_list [ "One"; "Two" ])
           ~alias:(Some "Alias"))
        (Some "Block #One, #Two -> alias: Alias");
      let long_title = String.make 257 'x' in
      expect_equal "truncate"
        (Block_title.unique_title ~built_in:false
           ~stored_title:(Some long_title) ~class_:false ~class_conflict:false
           ~extends:Rrbvec.empty ~display_title:None ~truncate:true
           ~tag_titles:Rrbvec.empty ~alias:None)
        (Some (String.make 256 'x')))
