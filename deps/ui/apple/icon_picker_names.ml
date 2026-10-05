(* Native twin of src/icon/icon_picker_names.ml — the web version lazy-
   fetches assets/icon-names.json as a vite chunk; on apple the same
   table is compiled in by tools/icon_names_gen.exe (icon_names_data.ml
   is a generated sibling). *)

let items : (string * string) array ref = ref Icon_names_data.items
