(ns logseq.publishing.export-test
  (:require [cljs.test :as t :refer [is use-fixtures async]]
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

(defn- create-static-dir [dir]
  (fs/mkdirSync (path/join dir) #js {:recursive true})
  (mapv #(fs/mkdirSync (path/join dir %)) publish-export/static-dirs)
  (fs/mkdirSync (path/join dir "js" "publishing"))
  (mapv #(fs/writeFileSync (path/join dir "js" "publishing" %) %)
        (conj publish-export/js-files "manifest.edn"))
  (fs/writeFileSync (path/join dir "404.html") ""))

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
               "cljs frontend compiled as main.js is copied correctly"))))

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
