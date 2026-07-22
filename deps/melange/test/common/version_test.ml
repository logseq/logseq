module Version = Melange_common.Version

let fail message =
  Fest.expect |> Fest.equal message "";
  failwith message

let expect_equal label actual expected =
  if actual <> expected then fail (label ^ ": unexpected value")

let () =
  Fest.test "version formatting preserves labels separators and raw values"
    (fun () ->
      [|
        ("unknown", "dev", "Build time: unknown\nRevision: dev");
        ("", "", "Build time: \nRevision: ");
        ( "2026-07-13T08:00:00Z",
          "abc-dirty",
          "Build time: 2026-07-13T08:00:00Z\nRevision: abc-dirty" );
        ("line 1\nline 2", "页面🙂", "Build time: line 1\nline 2\nRevision: 页面🙂");
      |]
      |> Array.iter (fun (build_time, revision, expected) ->
          expect_equal revision
            (Version.format_version ~build_time ~revision)
            expected))
