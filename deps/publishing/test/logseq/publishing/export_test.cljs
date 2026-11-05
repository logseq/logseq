(ns logseq.publishing.export-test
  (:require [cljs.test :as t :refer [deftest is use-fixtures async]]
            [logseq.publishing.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [logseq.publishing.export :as publish-export]
            [promesa.core :as p]
            [clojure.set :as set]
            ["fs" :as fs]
            ["path" :as path]))

(use-fixtures
 :each
 ;; Cleaning tmp/ before leaves last tmp/ after a test run for dev and debugging
 {:before
  #(async done
          (if (fs/existsSync "tmp")
            (fs/rm "tmp" #js {:recursive true} (fn [err]
                                                 (when err (js/console.log err))
                                                 (done)))
            (done)))})

(defn get-dirs [path]
  (->> (fs/readdirSync path)
       (map #(path/join path %))
       (filter #(.isDirectory (fs/statSync %)))))

(defn get-files [path]
  (->> (fs/readdirSync path)
       (map #(path/join path %))
       (filter #(.isFile (fs/statSync %)))))

(defn get-files-recursively [dir]
  (let [dirs (get-dirs dir)]
    (->> dirs
         (map get-files-recursively)
         (reduce concat)
         (concat (get-files dir)))))

(defn- js-map-files []
  (map #(str % ".map") publish-export/js-files))

(defn- create-export
  [static-dir graph-dir output-dir {:keys [html assets]
                                    :or {html "<!DOCTYPE html>"
                                         assets []}}]
  (publish-export/create-export
   html
   static-dir
   graph-dir
   output-dir
   {:asset-filenames assets
    :notification-fn (fn [msg]
                       (if (= "error" (:type msg))
                         (throw (ex-info (:payload msg) {}))
                         (js/console.log (:payload msg))))}))

(def binary-static-bytes
  "PNG-like bytes including NUL and 0xFF so string-based copies would corrupt them."
  (js/Uint8Array. #js [0x89 0x50 0x4e 0x47 0x0d 0x0a 0x1a 0x0a 0x00 0xff 0x00 0x01]))

(defn- create-static-dir [dir]
  (fs/mkdirSync (path/join dir) #js {:recursive true})
  (mapv #(fs/mkdirSync (path/join dir %)) publish-export/static-dirs)
  (fs/mkdirSync (path/join dir "css" "fonts") #js {:recursive true})
  (fs/writeFileSync (path/join dir "css" "style.css") "style")
  (fs/writeFileSync (path/join dir "css" "fonts" "font.woff2") "font")
  (fs/writeFileSync (path/join dir "img" "pixel.bin") binary-static-bytes)
  (fs/mkdirSync (path/join dir "js" "publishing"))
  (mapv #(fs/writeFileSync (path/join dir "js" "publishing" %) %)
        (conj publish-export/js-files "manifest.edn"))
  (doseq [file (conj (vec (js-map-files)) "db-worker.js.map")]
    (fs/writeFileSync (path/join dir "js" file) file))
  (fs/writeFileSync (path/join dir "404.html") "404"))

(defn- create-logseq-graph
  "Creates a minimal graph to test publishing"
  [dir]
  (fs/mkdirSync (path/join dir "logseq") #js {:recursive true})
  (fs/writeFileSync (path/join dir "logseq" "config.edn") "{}")
  (fs/mkdirSync (path/join dir "assets")))

(deftest-async create-export-with-basic-graph
  (create-static-dir "tmp/static")
  (create-logseq-graph "tmp/test-graph")

  (p/let [_ (create-export "tmp/static" "tmp/test-graph" "tmp/published-graph" {:html "<div>WOOT</div>"})]
         (let [original-paths (map path/basename (get-files-recursively "tmp/static"))
               copied-paths (map path/basename (get-files-recursively "tmp/published-graph"))
               new-files (set/difference (set copied-paths) (set original-paths))]
           (is (= #{"index.html" "custom.css" "export.css" "custom.js"}
                  new-files)
               "A published graph has the correct new files")
           (is (= "<div>WOOT</div>"
                  (str (fs/readFileSync "tmp/published-graph/index.html")))
               "index.html is copied correctly")
           (is (= "main.js"
                  (str (fs/readFileSync "tmp/published-graph/static/js/main.js")))
               "cljs frontend compiled as main.js is copied correctly")
           (is (= "style"
                  (str (fs/readFileSync "tmp/published-graph/static/css/style.css")))
               "static files are copied recursively")
           (is (= "font"
                  (str (fs/readFileSync "tmp/published-graph/static/css/fonts/font.woff2")))
               "nested static files are copied recursively")
           (is (= "404"
                  (str (fs/readFileSync "tmp/published-graph/404.html")))
               "404.html is copied from the static dir")
           (is (every? #(fs/existsSync (path/join "tmp/published-graph/static" %))
                       publish-export/static-dirs)
               "static css/icons/img/js dirs are copied")
           (is (.equals (fs/readFileSync "tmp/static/img/pixel.bin")
                        (fs/readFileSync "tmp/published-graph/static/img/pixel.bin"))
               "binary static files are copied byte-for-byte")
           (is (empty? (filter #(.endsWith (path/basename %) ".map")
                               (get-files "tmp/published-graph/static/js")))
               "source maps are not copied"))))

(deftest-async create-export-with-css-files
  (create-static-dir "tmp/static")
  (create-logseq-graph "tmp/test-graph")
  (fs/writeFileSync "tmp/test-graph/logseq/custom.css" ".foo {background-color: blue}")
  (fs/writeFileSync "tmp/test-graph/logseq/export.css" ".foo {background-color: red}")

  (p/let [_ (create-export "tmp/static" "tmp/test-graph" "tmp/published-graph" {})]
         (is (= ".foo {background-color: blue}"
                (str (fs/readFileSync "tmp/published-graph/static/css/custom.css")))
             "custom.css is copied correctly")
         (is (= ".foo {background-color: red}"
                (str (fs/readFileSync "tmp/published-graph/static/css/export.css")))
             "export.css is copied correctly")))

(deftest-async create-export-with-js-files
  (create-static-dir "tmp/static")
  (create-logseq-graph "tmp/test-graph")
  (fs/writeFileSync "tmp/test-graph/logseq/custom.js" "// foo")

  (p/let [_ (create-export "tmp/static" "tmp/test-graph" "tmp/published-graph" {})]
         (is (= "// foo"
                (str (fs/readFileSync "tmp/published-graph/static/js/custom.js")))
             "custom.js is copied correctly")))

(deftest-async create-export-with-assets
  (create-static-dir "tmp/static")
  (create-logseq-graph "tmp/test-graph")
  (fs/writeFileSync "tmp/test-graph/assets/foo.jpg" "foo")
  (fs/writeFileSync "tmp/test-graph/assets/bar.png" "bar")

  (p/let [_ (create-export "tmp/static"
                           "tmp/test-graph"
                           "tmp/published-graph"
                           {:assets ["foo.jpg" "bar.png"]})]
         (is (= "foo"
                (str (fs/readFileSync "tmp/published-graph/assets/foo.jpg")))
             "first asset is copied correctly")
         (is (= "bar"
                (str (fs/readFileSync "tmp/published-graph/assets/bar.png")))
             "second asset is copied correctly")))

(deftest copy-file-uses-read-write-not-copyfile
  ;; nbb's ESM `fs` namespace is not stubbable (copyFileSync is non-configurable),
  ;; so assert the asar-safe copy implementation directly.
  (let [src (str (fs/readFileSync "src/logseq/publishing/export.cljs"))]
    (is (re-find #"fs/writeFileSync to \(fs/readFileSync from\)" src)
        "copy-file! copies by reading bytes and writing them")
    (is (nil? (re-find #"fs/copyFileSync" src))
        "export does not call fs/copyFileSync for asar-safe static copies")
    (is (nil? (re-find #"fs/copyFile\b" src))
        "export does not call fs/copyFile for asar-safe static copies")))

(deftest-async create-export-reports-static-copy-failure
  (create-static-dir "tmp/static")
  (create-logseq-graph "tmp/test-graph")
  (fs/rmSync "tmp/static/404.html")
  (let [notifications (atom [])]
    (p/let [_ (publish-export/create-export
               "<div>WOOT</div>"
               "tmp/static"
               "tmp/test-graph"
               "tmp/published-graph"
               {:notification-fn #(swap! notifications conj %)})]
           (let [msg (first @notifications)]
             (is (= 1 (count @notifications))
                 "a static copy failure is reported once")
             (is (= "error" (:type msg))
                 "a static copy failure is reported as an error")
             (is (re-find #"Export public pages unexpectedly failed" (:payload msg)))
             (is (re-find #"Failed to copy" (:payload msg))
                 "the failed copy names the source and destination")
             (is (re-find #"404\.html" (:payload msg))
                 "the failed copy includes the missing static file")
             (is (not (fs/existsSync "tmp/published-graph/static/css/style.css"))
                 "a static copy failure does not silently continue with the remaining files")))))
