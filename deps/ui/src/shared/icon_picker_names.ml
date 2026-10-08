(* Icon picker name table — the [display, kebab] pair list compiled in
   from assets/icon-names.json by a single generation rule in this dir
   (previously the web fetched it as a lazy chunk while the native copy
   generated its own table). *)

let items : (string * string) array = Icon_names_data.items
