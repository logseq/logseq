open Lui_protocol

let check name condition=if not condition then failwith name
let png () =
  let image=Image.create_rgb ~alpha:true ~max_val:255 4 3 in
  for y=0 to 2 do for x=0 to 3 do Image.write_rgba image x y 10 20 30 255 done done;
  let encoded=Buffer.create 256 in
  ImageLib.PNG.write (ImageUtil.chunk_writer_of_buffer encoded) image;
  Buffer.to_bytes encoded
let batch ops={generation=1;ops}
let add id url=[CreateNode (id,Image);SetProp (id,UrlValue,StringValue url)]

let () =
  let execute,pump=Lui_resource.executor_queued () in
  let loads=ref 0 and changed=ref [] in
  let images=Host_images.create ~executor:execute
    ~source:(fun url -> incr loads;Lui_resource_loaders.Bytes (if url="bad" then Bytes.of_string "invalid" else png ()))
    ~on_change:(fun id -> changed:=id::!changed) () in
  let store=Lui_store.create () in
  let apply ops=let batch=batch ops in Lui_store.apply_batch store batch;Host_images.sync_batch images store batch in
  apply (add 1 "cover" @ add 2 "cover");
  check "one shared decoded entry" (Host_images.resource_count images=1 && Host_images.owner_count images=2);
  check "no image before executor" (Host_images.image_of images 1=None);
  check "shared owners start one decode task" (pump ()=1);
  check "decode alone cannot publish" (Host_images.image_of images 1=None && !changed=[]);
  Host.drain ();
  let image=Option.get (Host_images.image_of images 1) in
  check "decoded PNG dimensions" (image.Lui_scene.iw=4 && image.ih=3);
  check "two nodes share one bitmap" (Host_images.image_of images 2=Some image);
  check "foreground notifies both owners" (List.sort Int.compare !changed=[1;2]);
  apply [DropNode 1];
  check "remaining owner keeps resource" (Host_images.resource_count images=1 && Host_images.owner_count images=1);
  apply [DropNode 2];
  check "last owner retires resource" (Host_images.resource_count images=0 && Host_images.owner_count images=0);
  changed:=[];
  apply (add 3 "first");apply [SetProp (3,UrlValue,StringValue "second")];
  ignore (pump ());Host.drain ();
  check "replaced source cannot notify stale owner" (!changed=[3] && Host_images.resource_count images=1);
  apply [SetProp (3,UrlValue,StringValue "pending")];
  apply [DropNode 3];
  ignore (pump ());Host.drain ();
  check "dropped pending resource cannot publish" (Host_images.resource_count images=0 && Host_images.image_of images 3=None);
  apply (add 4 "bad");ignore (pump ());Host.drain ();
  check "decode failure stays empty" (Host_images.image_of images 4=None);
  let attempts= !loads in
  for _=1 to 20 do ignore (Host_images.image_of images 4) done;
  check "painting never retries failed loads" (!loads=attempts);
  apply [DropNode 4];
  apply (add 5 "same");
  apply ([DropNode 5] @ add 5 "same");
  ignore (pump ());Host.drain ();
  check "reused node id owns a fresh generation" (Option.is_some (Host_images.image_of images 5));
  apply ([CreateNode (10,Box)] @ add 11 "nested" @ [InsertChild (10,11,0)]);
  apply [CreateNode (10,Box)];
  check "recreating a parent releases image descendants" (Host_images.owner_count images=1);
  apply (add 11 "nested" @ [InsertChild (10,11,0)]);
  apply [DropNode 10];
  check "dropping a parent releases image descendants" (Host_images.owner_count images=1);
  apply [CreateNode (5,Box)];
  check "replacing an image with a container releases its owner" (Host_images.owner_count images=0);
  apply (add 5 "restored");
  apply [SetProp (5,ImageIdValue,IntValue 99)];
  check "registered image source releases URL ownership" (Host_images.owner_count images=0);
  apply [RemoveProp (5,ImageIdValue)];
  check "removing registered source restores URL ownership" (Host_images.owner_count images=1);
  apply (add 6 "late");Host_images.dispose images;
  ignore (pump ());Host.drain ();
  check "dispose releases all owners" (Host_images.owner_count images=0 && Host_images.resource_count images=0);
  Printf.printf "native image ownership, decoding and foreground publication: OK\n%!"

let () =
  let executor,pump=Lui_resource.executor_queued () in
  let images=Host_images.create ~executor ~source:(fun _ -> Lui_resource_loaders.Bytes (png ()))
    ~on_change:(fun _ -> ()) () in
  let store=Lui_store.create () in
  let apply ops=let batch=batch ops in Lui_store.apply_batch store batch;Host_images.sync_batch images store batch in
  apply (add 1 "cover" @ add 2 "cover");ignore (pump ());Host.drain ();
  let image=Option.get (Host_images.image_of images 1) in
  apply ([DropNode 1;DropNode 2] @ add 3 "cover");
  check "atomic owner transfer does not restart decoding" (pump ()=0);
  check "atomic owner transfer preserves the decoded bitmap" (Host_images.image_of images 3=Some image);
  apply [DropNode 3];
  check "transfer still releases the last owner" (Host_images.resource_count images=0);
  Host_images.dispose images;
  Printf.printf "native atomic image ownership transfer: OK\n%!"


let () =
  let path = Filename.temp_file "native image café 中文 # %20 " ".png" in
  Fun.protect ~finally:(fun () -> Sys.remove path) (fun () ->
    Out_channel.with_open_bin path (fun output -> output_bytes output (png ()));
    let encoded = String.split_on_char '/' path |> List.map Uri.pct_encode |> String.concat "/" in
    let url = Uri.to_string (Uri.make ~scheme:"file" ~path:encoded ()) in
    let executor,pump = Lui_resource.executor_queued () and changes = ref [] in
    let images = Host_images.create ~executor ~on_change:(fun id -> changes := id :: !changes) () in
    Fun.protect ~finally:(fun () -> Host_images.dispose images) (fun () ->
      let store = Lui_store.create () in
      let apply ops = let patch=batch ops in
        Lui_store.apply_batch store patch;Host_images.sync_batch images store patch in
      let canonical = Platform_native.resource_url path in
      let decoded = Uri.pct_decode (Uri.path (Uri.of_string canonical)) in
      check (Printf.sprintf "Resource URL must preserve the path: %S -> %S, expected %S" canonical decoded path)
        (decoded = path);
      let local = Uri.to_string (Uri.make ~scheme:"file" ~host:"localhost" ~path:encoded ()) in
      apply (add 1 url @ add 2 canonical @ add 3 local);
      check "Local file URI forms share one decoded resource" (Host_images.resource_count images=1);
      check "File URL owners share one decode task" (pump ()=1);
      check "File URL decoding publishes on the application thread" (!changes=[]);
      Host.drain ();
      let image = Host_images.image_of images 1 in
      check "Encoded Unicode file URLs must decode through the production image source"
        (match image with Some image -> image.Lui_scene.iw=4 && image.ih=3 | None -> false);
      check "File URL owners retain the same decoded bitmap"
        (Host_images.image_of images 2=image && Host_images.image_of images 3=image);
      check "File URL readiness notifies every mounted owner" (List.sort Int.compare !changes=[1;2;3]);
      apply [DropNode 1;DropNode 2;DropNode 3];
      check "File URL pixels release with their final owner"
        (Host_images.resource_count images=0 && Host_images.owner_count images=0);
      let missing = Uri.to_string (Uri.make ~scheme:"file" ~path:(encoded ^ ".missing") ()) in
      apply (add 4 missing);ignore (pump ());Host.drain ();
      check "A missing file URL fails without publishing a bitmap" (Host_images.image_of images 4=None)));
  print_endline "native file URL decoding, Unicode paths and ownership: OK"


let bytes_of_hex value =
  Bytes.init (String.length value / 2) (fun index ->
    Char.chr (int_of_string ("0x" ^ String.sub value (index * 2) 2)))
let jpeg_baseline () = bytes_of_hex (String.concat ""
  [ "ffd8ffe000104a46494600010100000100010000ffdb0043000101010101010101010101010101010101010101010101";
    "0101010101010101010101010101010101010101010101010101010101010101010101010101010101ffdb0043010101";
    "010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101";
    "0101010101010101010101010101ffc00011080008001003011100021101031101ffc4001f0000010501010101010100";
    "000000000000000102030405060708090a0bffc400b5100002010303020403050504040000017d010203000411051221";
    "31410613516107227114328191a1082342b1c11552d1f02433627282090a161718191a25262728292a3435363738393a";
    "434445464748494a535455565758595a636465666768696a737475767778797a838485868788898a9293949596979899";
    "9aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1";
    "f2f3f4f5f6f7f8f9faffc4001f0100030101010101010101010000000000000102030405060708090a0bffc400b51100";
    "020102040403040705040400010277000102031104052131061241510761711322328108144291a1b1c109233352f015";
    "6272d10a162434e125f11718191a262728292a35363738393a434445464748494a535455565758595a63646566676869";
    "6a737475767778797a82838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4";
    "c5c6c7c8c9cad2d3d4d5d6d7d8d9dae2e3e4e5e6e7e8e9eaf2f3f4f5f6f7f8f9faffda000c03010002110311003f00fc";
    "47ff0085cdff0052dffe563ffbd75fe827fc50affeb293ff00388fff0095d3fd64ff008aea7fd62dff00e76eff00f244";
    "7f619ff0c45ff553bff2cbff00f0b2bfe25ffe2657fea8bffcd8ff00fc027fccbffc520bfeb21bff003937ff0094c3ff";
    "d9" ])
let jpeg_progressive () = bytes_of_hex (String.concat ""
  [ "ffd8ffe000104a46494600010100000100010000ffdb0043000101010101010101010101010101010101010101010101";
    "0101010101010101010101010101010101010101010101010101010101010101010101010101010101ffdb0043010101";
    "010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101";
    "0101010101010101010101010101ffc20011080008001003011100021101031101ffc400150001010000000000000000";
    "0000000000000809ffc4001501010100000000000000000000000000000809ffda000c0301000210031000000111a096";
    "561a25ccbfffc400161001010100000000000000000000000000001516ffda0008010100010502b2c43fffc400181100";
    "020300000000000000000000000000001867a6e6ffda0008010301013f017aa2dbbe4450643a9e98ffc4001c11000103";
    "050000000000000000000000000017186567a5a6e4e6ffda0008010201013f0162b54b08eb852a16e3a07fffc4001a10";
    "00010501000000000000000000000000003435a3a4e3e4ffda0008010100063f024d36439d2eb3ffc400141001000000";
    "00000000000000000000000010ffda0008010100013f21213fffda000c0301000200030000001003ffc4001411010000";
    "0000000000000000000000000010ffda0008010301013f1006bfffc40014110100000000000000000000000000000010";
    "ffda0008010201013f1006bfffc40014100100000000000000000000000000000010ffda0008010100013f10023fffd9" ])
let jpeg_gray () = bytes_of_hex (String.concat ""
  [ "ffd8ffe000104a46494600010100000100010000ffdb0043000101010101010101010101010101010101010101010101";
    "0101010101010101010101010101010101010101010101010101010101010101010101010101010101ffc0000b080003";
    "000701011100ffc4001f0000010501010101010100000000000000000102030405060708090a0bffc400b51000020103";
    "03020403050504040000017d01020300041105122131410613516107227114328191a1082342b1c11552d1f024336272";
    "82090a161718191a25262728292a3435363738393a434445464748494a535455565758595a636465666768696a737475";
    "767778797a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9";
    "cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9faffda0008010100003f00f89ebfffd9" ])

let oriented_jpeg encoded orientation =
  let header=bytes_of_hex "ffe1002245786966000049492a0008000000010012010300010000000100000000000000" in
  Bytes.set_uint8 header 28 orientation;
  Bytes.concat Bytes.empty [Bytes.sub encoded 0 2;header;Bytes.sub encoded 2 (Bytes.length encoded-2)]

let () = begin
  let errors=ref [] in
  let expect message condition=if not condition then errors:=message::!errors in
  let colors=[|(240,20,30);(20,220,40);(30,40,230);(230,220,30)|] in
  let orders=[|[|0;1;2;3|];[|1;0;3;2|];[|3;2;1;0|];[|2;3;0;1|];
    [|0;2;1;3|];[|2;0;3;1|];[|3;1;2;0|];[|1;3;0;2|]|] in
  let load name encoded accept =
    let executor,pump=Lui_resource.executor_queued () in
    let images=Host_images.create ~executor ~source:(fun _ -> Lui_resource_loaders.Bytes encoded)
      ~on_change:(fun _ -> ()) () in
    let store=Lui_store.create () in
    Fun.protect ~finally:(fun () -> Host_images.dispose images) (fun () ->
      let initial=batch (add 1 name @ add 2 name) in
      Lui_store.apply_batch store initial;Host_images.sync_batch images store initial;
      expect (name ^ ": one decode task") (pump ()=1);
      expect (name ^ ": publication waits for foreground") (Host_images.image_of images 1=None);
      Host.drain ();
      (match Host_images.image_of images 1 with
       | None -> expect (name ^ ": JPEG does not publish a decoded bitmap") false
       | Some image ->
         expect (name ^ ": both owners share the decoded bitmap") (Host_images.image_of images 2=Some image);
         accept image);
      let removed=batch [DropNode 1;DropNode 2] in
      Lui_store.apply_batch store removed;Host_images.sync_batch images store removed;
      expect (name ^ ": last owner releases the resource")
        (Host_images.resource_count images=0 && Host_images.owner_count images=0)) in
  List.iter (fun (name,fixture) ->
    for orientation=1 to 8 do
      let label=Printf.sprintf "%s orientation %d" name orientation in
      load label (oriented_jpeg (fixture ()) orientation) (fun image ->
        let width,height=if orientation<=4 then 16,8 else 8,16 in
        expect (label ^ ": EXIF-adjusted dimensions") (image.Lui_scene.iw=width && image.ih=height);
        if image.iw=width && image.ih=height then
          List.iteri (fun quadrant (x,y) ->
            let offset=(y*width+x)*4 in
            let red,green,blue=colors.(orders.(orientation-1).(quadrant)) in
            expect (label ^ ": top-left RGBA pixel order and orientation")
              (abs (Bytes.get_uint8 image.ipix offset-red)<=8 &&
               abs (Bytes.get_uint8 image.ipix (offset+1)-green)<=8 &&
               abs (Bytes.get_uint8 image.ipix (offset+2)-blue)<=8 &&
               Bytes.get_uint8 image.ipix (offset+3)=255))
            [width/4,height/4;3*width/4,height/4;width/4,3*height/4;3*width/4,3*height/4])
    done) ["baseline",jpeg_baseline;"progressive",jpeg_progressive];
  load "grayscale" (jpeg_gray ()) (fun image ->
    expect "Grayscale JPEG dimensions" (image.Lui_scene.iw=7 && image.ih=3);
    expect "Grayscale JPEG expands to opaque RGBA"
      (Bytes.length image.ipix=7*3*4 && Bytes.get_uint8 image.ipix 0=101 &&
       Bytes.get_uint8 image.ipix 1=101 && Bytes.get_uint8 image.ipix 2=101 && Bytes.get_uint8 image.ipix 3=255));
  List.iter (fun encoded ->
    let executor,pump=Lui_resource.executor_queued () in
    let images=Host_images.create ~executor ~source:(fun _ -> Lui_resource_loaders.Bytes encoded)
      ~on_change:(fun _ -> expect "Malformed JPEG must not publish a bitmap" false) () in
    Fun.protect ~finally:(fun () -> Host_images.dispose images) (fun () ->
      let store=Lui_store.create () and initial=batch (add 1 "malformed-jpeg") in
      Lui_store.apply_batch store initial;Host_images.sync_batch images store initial;
      ignore (pump ());Host.drain ();
      expect "Truncated and malformed JPEG reject without a bitmap" (Host_images.image_of images 1=None)))
    (let without_end_marker encoded = Bytes.sub encoded 0 (Bytes.length encoded - 2) in
     let strict_truncation = if Host_platform.is_macos then [] else [without_end_marker (jpeg_baseline ())] in
     [Bytes.sub (jpeg_baseline ()) 0 200] @ strict_truncation @
     [bytes_of_hex "ffd8ffe000104a46494600"]);
  let path=Filename.temp_file "native-jpeg-file" ".jpg" in
  Fun.protect ~finally:(fun () -> Sys.remove path) (fun () ->
    Out_channel.with_open_bin path (fun output -> output_bytes output (jpeg_baseline ()));
    let local=try Some (Host_icons.file_image path) with _ -> None in
    expect "Local file images use the same JPEG decoder"
      (match local with Some image -> image.Lui_scene.iw=16 && image.ih=8 | None -> false));
  let webp=bytes_of_hex "52494646220000005745425056503820160000003001009d012a010001000ec0fe25a400037000000000" in
  expect "platform decoder handles WebP outside the bundled codec set"
    (match Host_image.decode webp with
     | Ok image -> image.Lui_scene.iw=1 && image.ih=1 && Bytes.length image.ipix=4
     | Error _ -> false);
  expect "truncated WebP rejects without a bitmap"
    (match Host_image.decode (Bytes.sub webp 0 (Bytes.length webp - 2)) with
     | Ok _ -> false
     | Error _ -> true);
  let oriented_webp=bytes_of_hex "524946465200000057454250565038580a000000080000000100000000005650384c110000002f010000000fb0fff31ff31f1532a2ff0100455849461a00000049492a0008000000010012010300010000000600000000000000" in
  expect "WebP EXIF orientation rotates dimensions and pixels"
    (match Host_image.decode oriented_webp with
     | Ok image ->
       let pixel offset channel = Bytes.get_uint8 image.Lui_scene.ipix (offset + channel) in
       image.Lui_scene.iw=1 && image.ih=2 &&
       pixel 0 0 > 200 && pixel 0 1 < 80 &&
       pixel 4 1 > 200 && pixel 4 0 < 80
     | Error _ -> false);
  if not Host_platform.is_macos then begin
    let without_exif_flag = Bytes.copy oriented_webp in
    Bytes.set without_exif_flag 20 '\000';
    expect "Linux WebP ignores EXIF without the VP8X feature flag"
      (match Host_image.decode without_exif_flag with
       | Ok image -> image.Lui_scene.iw=2 && image.ih=1
       | Error _ -> false);
    let exif_outside_riff = Bytes.copy oriented_webp in
    Bytes.set exif_outside_riff 4 (Char.chr 48);
    Bytes.set exif_outside_riff 5 '\000';
    Bytes.set exif_outside_riff 6 '\000';
    Bytes.set exif_outside_riff 7 '\000';
    expect "Linux WebP ignores EXIF outside the RIFF boundary"
      (match Host_image.decode exif_outside_riff with
       | Ok image -> image.Lui_scene.iw=2 && image.ih=1
       | Error _ -> false);
    let avif=bytes_of_hex "0000001c667479706176696600000000617669666d6966316d696166000000ea6d657461000000000000002168646c72000000000000000070696374000000000000000000000000000000000e7069746d00000000000100000022696c6f630000000044400001000100000000010e000100000000000000230000002369696e6600000000000100000015696e6665020000000001000061763031000000006a697072700000004b6970636f00000013636f6c726e636c78000200020006800000000c6176314381000c000000001469737065000000000000001000000010000000107069786900000000030808080000001769706d610000000000000001000104818203840000002b6d64617412000a09180cffda204040d0803214441000001000047fba5bdd381b9f2b8c1b5f6e80" in
    let heic=bytes_of_hex "0000001c6674797068656963000000006d696631686569636d696166000001ad6d657461000000000000002168646c72000000000000000070696374000000000000000000000000000000000e7069746d0000000000020000001069646174000000000010001000000038696c6f630100000044400002000100000000000001d1000100000000000000c100020001000000000000000100000000000000080000003869696e6600000000000200000015696e66650200000100010000687663310000000015696e666502000000000200006772696400000000d869707270000000b66970636f00000076687663430103700000000000000000001ef000fcfdf8f800000f03200001001840010c01ffff03700000030090000003000003001eba0240210001002a42010103700000030090000003000003001ea020810596eaae9ae6e04040c0800000030080000003008422000100064401c173c18900000014697370650000000000000010000000100000001469737065000000000000004000000040000000107069786900000000030808080000001a69706d610000000000000002000102810300020202840000001a69726566000000000000000e64696d67000200010001000000c96d646174000000bd2801af06b21b3d658066d61b1dfc768ffffa339f21ec28eb53eec489ffdefdfffb2beb03eba121d7d76ae2a21c33f2558f530eacb8785a59678e5ee77aa86ab6231964ecadcd580c89ddaea2a2b1999c0e04577415ced99b1b6f5d07008944c4a07df994f6ab978c4574f7c2d2aa3eea8664edcf5172baaa72b2c2886a5f412f6f203a8c6d5cd9fc5f40d64be2b9f394904c970f47596d5650a2b85c47ed8fed02e3ddd9068330434f075349a26aec57321622ae1889768e298ade08c0" in
    let alpha_avif=bytes_of_hex "0000001c667479706176696600000000617669666d6966316d696166000001986d657461000000000000002168646c72000000000000000070696374000000000000000000000000000000000e7069746d00000000000100000034696c6f63000000004440000200020000000001bc0001000000000000001700010000000001d3000100000000000000230000003869696e6600000000000200000015696e66650200000000010000617630310000000015696e666502000000000200006176303100000000d769707270000000b16970636f00000013636f6c726e636c78000200020006800000000c6176314381001c0000000014697370650000000000000010000000100000000e7069786900000000010800000038617578430000000075726e3a6d7065673a6d706567423a636963703a73797374656d733a617578696c696172793a616c706861000000000c6176314381000c000000001469737065000000000000001000000010000000107069786900000000030808080000001e69706d61000000000000000200010481860788000204820384850000001a69726566000000000000000e6175786c000200010001000000426d64617412000a05180cffda54320c441000004004a5dc11d82d9512000a09180cffda204040d0803214441000001000047fba5bdd381b9f2b8c1b5f6e80" in
    let validate label encoded =
      expect label
        (match Host_image.decode encoded with
         | Ok image ->
           let pixel x y channel = Bytes.get_uint8 image.Lui_scene.ipix ((y * image.Lui_scene.iw + x) * 4 + channel) in
           image.Lui_scene.iw=16 && image.ih=16 &&
           pixel 4 8 0 > pixel 4 8 1 + 40 &&
           pixel 12 8 1 > pixel 12 8 0 + 40
         | Error _ -> false) in
    validate "Linux libheif decodes AVIF images" avif;
    validate "Linux libheif decodes HEIC images" heic;
    expect "Linux libheif premultiplies AVIF alpha"
      (match Host_image.decode alpha_avif with
       | Ok image ->
         let pixel x y channel = Bytes.get_uint8 image.Lui_scene.ipix ((y * image.Lui_scene.iw + x) * 4 + channel) in
         image.Lui_scene.iw=16 && image.ih=16 &&
         pixel 4 8 0 >= 110 && pixel 4 8 0 <= 140 &&
         pixel 4 8 3 >= 120 && pixel 4 8 3 <= 136 &&
         pixel 12 8 1 > 200 && pixel 12 8 3 = 255
       | Error _ -> false);
    expect "truncated AVIF/HEIC reject without a bitmap"
      (List.for_all (fun encoded ->
         match Host_image.decode encoded with Ok _ -> false | Error _ -> true)
         [Bytes.sub avif 0 (Bytes.length avif / 2); Bytes.sub heic 0 (Bytes.length heic / 2)])
  end;
  List.iter prerr_endline (List.rev !errors);
  check "Native JPEG decode, orientation, source ownership and local files" (!errors=[]);
  print_endline "native JPEG baseline/progressive, EXIF orientation, grayscale and local file: OK"
end

let () = match Sys.getenv_opt "LOGSEQ_NATIVE_IMAGE_PROBE_URL" with
  | None -> ()
  | Some url ->
      let foreground=Domain.self () and notices=ref 0 in
      let images=Host_images.create ~on_change:(fun _ ->
        check "network completion stays on foreground" (Domain.self ()=foreground);incr notices) () in
      let store=Lui_store.create () in
      let initial=batch (add 1 url) in
      Lui_store.apply_batch store initial;Host_images.sync_batch images store initial;
      let deadline=Unix.gettimeofday () +. 35. in
      while Host_images.image_of images 1=None && Unix.gettimeofday ()<deadline do
        Host.drain ();Thread.delay 0.005
      done;
      let bitmap=Option.get (Host_images.image_of images 1) in
      check "real HTTPS image publishes once" (!notices=1);
      List.iter (fun scale ->
        let hooks={Lui_paint.default_hooks with image_of=Host_images.image_of images} in
        let host=Lui_host.create ~hooks ~layout:(module Lui_layout)
          ~renderer:{name="image-probe";render=(fun _ -> Bytes.empty)}
          ~width:300 ~height:300 ~scale () in
        ignore (Lui_host.apply_batch host (batch
          ([CreateNode (10,Root);CreateNode (20,Column);InsertChild (10,20,0)] @
           add 1 url @ [InsertChild (20,1,0);SetProp (1,WidthValue,IntValue 70)])));
        ignore (Lui_host.repaint host);
        let rect=Option.get (Lui_host.layout_rect host 1) in
        check "HTTPS image has natural rendered height" (abs_float (rect.h -. Float.round
          (70. *. float_of_int bitmap.ih /. float_of_int bitmap.iw *. scale))<0.01);
        check "HTTPS image paints through native scene" (List.exists (function
          | Lui_scene.Image op -> op.iimage=bitmap | _ -> false) (Lui_host.scene host).ops);
        Printf.printf "native HTTPS bitmap=%dx%d scale=%.0f frame=%.2fx%.2f\n%!"
          bitmap.iw bitmap.ih scale (rect.w /. scale) (rect.h /. scale)) [1.;2.];
      Host_images.dispose images
