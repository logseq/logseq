(ns frontend.modules.file.uprint
  "A fast pprint alternative.")

(defn print-prefix-map* [prefix m print-one writer opts]
  (pr-sequential-writer
    writer
    (fn [e w opts]
      (print-one (key e) w opts)
      (-write w \space)
      (print-one (val e) w opts))
    (str prefix "\n{") \newline "}"
    opts (seq m)))

(defn ugly-pr-str
  "Ugly printing fast, with newlines so that git diffs are smaller"
  [x]
  (with-redefs [print-prefix-map print-prefix-map*]
    (pr-str x)))
