open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let expect_invalid label f =
  match f () with
  | _ -> failwith (label ^ ": expected Invalid_argument")
  | exception Invalid_argument _ -> ()

let () =
  Fest.test "DB asset digest bytes encode as lowercase hex" (fun () ->
      expect_equal "digest"
        (Asset.digest_hex (Rrbvec.of_list [ 0; 15; 16; 255 ]))
        "000f10ff";
      expect_invalid "invalid digest byte" (fun () ->
          Asset.digest_hex (Rrbvec.of_list [ 256 ])));
  Fest.test "DB asset type preserves Node path extension behavior" (fun () ->
      expect_equal "simple" (Asset.path_type "assets/photo.PNG") "png";
      expect_equal "compound" (Asset.path_type "archive.tar.gz") "gz";
      expect_equal "dotfile" (Asset.path_type ".gitignore") "";
      expect_equal "trailing dot" (Asset.path_type "name.") "";
      expect_equal "directory dot" (Asset.path_type "a.b/file") "");
  Fest.test "DB asset title removes only the final extension" (fun () ->
      expect_equal "simple" (Asset.name_title "photo.png") "photo";
      expect_equal "compound" (Asset.name_title "archive.tar.gz") "archive.tar";
      expect_equal "dotfile" (Asset.name_title ".gitignore") ".gitignore";
      expect_equal "trailing dot" (Asset.name_title "name.") "name";
      expect_equal "path" (Asset.name_title "dir/file.txt") "file");
  Fest.Promise.test "DB asset checksum owns primitive sequencing" (fun () ->
      let calls = ref [] in
      Asset.checksum
        ~buffer_of_value:(fun value ->
          calls := !calls @ [ "buffer:" ^ value ];
          value ^ "-buffer")
        ~sha256:(fun buffer ->
          calls := !calls @ [ "sha256:" ^ buffer ];
          Js.Promise.resolve "digest")
        ~digest_bytes:(fun digest ->
          calls := !calls @ [ "bytes:" ^ digest ];
          Rrbvec.of_list [ 0; 15; 16; 255 ])
        "payload"
      |> Js.Promise.then_ (fun checksum ->
          expect_equal "checksum" checksum "000f10ff";
          expect_equal "calls" !calls
            [ "buffer:payload"; "sha256:payload-buffer"; "bytes:digest" ];
          Js.Promise.resolve ()))
