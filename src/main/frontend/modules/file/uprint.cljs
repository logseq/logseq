(ns frontend.modules.file.uprint)

(defn print-prefix-map* [prefix m print-one writer opts]
  (pr-sequential-writer
    writer
    (fn [e w opts]
      (do (print-one (key e) w opts)
          (-write w \space)
          (print-one (val e) w opts)))
    (str prefix "{") \newline "}"
    opts (seq m)))

(defn ugly-pr-str
  "Ugly printing fast, with newline per block"
  [x]
  (with-redefs [print-prefix-map print-prefix-map*]
    (pr-str x)))
