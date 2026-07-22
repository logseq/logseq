open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let () =
  Fest.test "DB schema versions parse compatible text" (fun () ->
      expect_equal "major"
        (Schema_version.parse "10" |> Schema_version.major)
        10;
      expect_equal "minor"
        (Schema_version.parse "10.1" |> Schema_version.minor)
        (Some 1);
      expect_equal "extra component"
        (Schema_version.parse "10.1.9" |> Schema_version.to_string)
        "10.1");
  Fest.test "DB schema versions compare missing and present minors" (fun () ->
      expect_equal "same"
        (Schema_version.compare
           (Schema_version.make 10 None)
           (Schema_version.make 10 None))
        0;
      expect_equal "minor"
        (Schema_version.compare
           (Schema_version.make 10 None)
           (Schema_version.make 10 (Some 1)))
        (-1);
      expect_equal "major"
        (Schema_version.compare
           (Schema_version.make 11 None)
           (Schema_version.make 10 (Some 9)))
        1);
  Fest.test "DB schema version preserves the current catalog version" (fun () ->
      expect_equal "version"
        (Schema_version.to_string Schema_version.version)
        "65.33")
