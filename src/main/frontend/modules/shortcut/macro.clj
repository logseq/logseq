(ns frontend.modules.shortcut.macro)

(defmacro shortcut-dict
  "All docs for EN are generated from :desc field of shortcut default-config map.
  For all other languages, need manual translation in dict file. "
  [desc category & maps]
  `(medley.core/deep-merge
    {:en ~category}
    {:en ~desc}
    ~@maps))
