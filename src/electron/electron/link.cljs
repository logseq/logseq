(ns electron.link)

(def shell-open-protocols
  #{"https:" "http:" "mailto:" "logseq:"})

(defn shell-open-url?
  [^js/URL parsed-url]
  (contains? shell-open-protocols (.-protocol parsed-url)))
