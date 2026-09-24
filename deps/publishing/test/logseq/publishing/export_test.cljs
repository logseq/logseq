(ns logseq.publishing.export-test
  (:require [cljs.test :as t :refer [is use-fixtures async]]
            [clojure.string :as string]
            [logseq.publishing.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [logseq.publishing.export :as publish-export]
            [logseq.publishing.page :as publish-page]
            [logseq.publishing.runtime :as publish-runtime]
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

(defn- attr-values
  [html attr]
  (->> (re-seq (re-pattern (str attr "=\"([^\"]+)\"")) html)
       (mapv second)))

(defn- published-html
  []
  (publish-page/index-html "{}" "{}" {:title "t" :name "n"}))

(defn- create-static-dir
  ([dir] (create-static-dir dir {:runtime-files publish-runtime/required-js-runtime-files}))
  ([dir {:keys [runtime-files]}]
   (fs/mkdirSync (path/join dir) #js {:recursive true})
   (mapv #(fs/mkdirSync (path/join dir %)) publish-export/static-dirs)
   (fs/mkdirSync (path/join dir "css" "fonts") #js {:recursive true})
   (fs/writeFileSync (path/join dir "css" "style.css") "style")
   (fs/writeFileSync (path/join dir "css" "fonts" "font.woff2") "font")
   (fs/mkdirSync (path/join dir "js" "publishing"))
   (fs/mkdirSync (path/join dir "js" "pdfjs") #js {:recursive true})
   (mapv #(fs/writeFileSync (path/join dir "js" "publishing" %) %)
         (conj publish-export/js-files "manifest.edn"))
   (doseq [file (conj (vec (js-map-files)) "db-worker.js.map")]
     (fs/writeFileSync (path/join dir "js" file) file))
   (doseq [file runtime-files]
     (let [file-path (path/join dir "js" file)]
       (fs/mkdirSync (path/dirname file-path) #js {:recursive true})
       (fs/writeFileSync file-path file)))
   (doseq [src (map :src publish-runtime/page-js-scripts)]
     (let [file-path (path/join dir (string/replace-first src #"^static/" ""))]
       (fs/mkdirSync (path/dirname file-path) #js {:recursive true})
       (when-not (or (fs/existsSync file-path)
                     (= "custom.js" (path/basename file-path)))
         (fs/writeFileSync file-path (path/basename file-path)))))
   (fs/writeFileSync (path/join dir "404.html") "")))

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

(deftest-async create-export-copies-hosted-runtime-files-and-html-script-srcs
  (create-static-dir "tmp/static")
  (create-logseq-graph "tmp/test-graph")
  (let [html (published-html)
        script-srcs (attr-values html "src")]
    (p/let [_ (create-export "tmp/static" "tmp/test-graph" "tmp/published-graph" {:html html})]
           (is (seq script-srcs))
           (doseq [src script-srcs]
             (is (string/starts-with? src "static/")
                 (str "script src is relative: " src))
             (is (fs/existsSync (path/join "tmp/published-graph" src))
                 (str "exported index.html script exists on disk: " src)))
           (doseq [file publish-runtime/required-js-runtime-files]
             (is (fs/existsSync (path/join "tmp/published-graph" "static" "js" file))
                 (str "required hosted runtime file is copied: " file)))
           (is (fs/existsSync "tmp/published-graph/static/js/main.js"))
           (is (fs/existsSync "tmp/published-graph/static/js/db-worker.js"))
           (is (fs/existsSync "tmp/published-graph/static/js/db-worker-bundle.js"))
           (is (fs/existsSync "tmp/published-graph/static/js/sqlite3.wasm")))))

(deftest-async create-export-fails-when-sqlite-wasm-is-missing
  (create-static-dir "tmp/static" {:runtime-files (remove #{"sqlite3.wasm"} publish-runtime/required-js-runtime-files)})
  (fs/rmSync "tmp/static/js/sqlite3.wasm" #js {:force true})
  (create-logseq-graph "tmp/test-graph")
  (-> (create-export "tmp/static" "tmp/test-graph" "tmp/published-graph" {:html (published-html)})
      (p/then (fn [_]
                (is false "export must fail-fast when sqlite3.wasm is missing")))
      (p/catch (fn [err]
                 (is (string/includes? (str (.-message err) " " err) "sqlite3.wasm")
                     "missing wasm is reported instead of producing a broken export")))))
