(* Decode host images to owned premultiplied RGBA8 pixels. JPEGs use the
   platform decoder, including their display orientation. Formats recognized by
   the shared headless decoder use that decoder; on macOS, otherwise unrecognized
   formats fall back to ImageIO so platform codecs such as WebP/HEIC/AVIF can
   decode. No native decoder object is retained. *)
val decode : bytes -> (Lui_scene.image, string) result
