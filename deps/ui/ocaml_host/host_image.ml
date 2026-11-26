external decode_platform : bytes -> int * int * bytes = "logseq_native_decode_platform"

let platform_decode encoded =
  try
    let width,height,pixels=decode_platform encoded in
    Ok (Lui_scene.new_image ~w:width ~h:height pixels)
  with Failure message -> Error message

let sniff_webp encoded =
  Bytes.length encoded >= 12
  && Bytes.sub_string encoded 0 4 = "RIFF"
  && Bytes.sub_string encoded 8 4 = "WEBP"

let heif_brand brand =
  match brand with
  | "avif" | "heic" | "heix" | "mif1" -> true
  | _ -> false

let sniff_heif encoded =
  let length=Bytes.length encoded in
  let be32 position =
    (Bytes.get_uint8 encoded position lsl 24) lor
    (Bytes.get_uint8 encoded (position + 1) lsl 16) lor
    (Bytes.get_uint8 encoded (position + 2) lsl 8) lor
    Bytes.get_uint8 encoded (position + 3) in
  if length < 16 || Bytes.sub_string encoded 4 4 <> "ftyp" then false
  else
    let box_size=be32 0 in
    let box_end=if box_size=0 then length else box_size in
    if box_end < 16 || box_end > length then false
    else
      let major=Bytes.sub_string encoded 8 4 in
      match major with
      | "avis" | "msf1" | "hevc" | "hevx" | "hevm" | "hevs" -> false
      | _ ->
        heif_brand major ||
        (let rec compatible position =
           position + 4 <= box_end &&
           (heif_brand (Bytes.sub_string encoded position 4) || compatible (position + 4)) in
         compatible 16)


let decode encoded =
  match Lui_image.sniff encoded with
  | Some Lui_image.Jpeg -> platform_decode encoded
  | Some _ -> Result.map Lui_image.to_scene_image (Lui_image.decode encoded)
  | None when Host_platform.is_macos || sniff_webp encoded || sniff_heif encoded -> platform_decode encoded
  | None -> Result.map Lui_image.to_scene_image (Lui_image.decode encoded)
