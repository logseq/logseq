(ns frontend.fs)

(defn mkdir
  [dir]
  (js/pfs.mkdir dir))

(defn readdir
  [dir]
  (js/pfs.readdir dir))

(defn read-file
  [dir path]
  (js/pfs.readFile (str dir "/" path)
                   (clj->js {:encoding "utf8"})))

(defn write-file
  [dir path content]
  (js/pfs.writeFile (str dir "/" path) content))
