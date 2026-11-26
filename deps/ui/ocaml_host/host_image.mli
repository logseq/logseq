(* Decode host images to owned premultiplied RGBA8 pixels. JPEGs use the
   platform decoder, including their display orientation. Other formats use
   the shared headless decoder. No native decoder object is retained. *)
val decode : bytes -> (Lui_scene.image, string) result
