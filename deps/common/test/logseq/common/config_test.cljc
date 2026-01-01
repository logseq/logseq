(ns logseq.common.config-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            #?(:org.babashka/nbb [nbb.classpath :as cp])
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [logseq.common.config :as common-config]))

(deftest remove-hidden-files
  (let [files ["pages/foo.md" "pages/bar.md"
               "script/README.md" "script/config.edn"
               "dev/README.md" "dev/config.edn"]]
    (is (= ["pages/foo.md" "pages/bar.md"]
           #_:clj-kondo/ignore ;; buggy unresolved var
           (common-config/remove-hidden-files
            files
            {:hidden ["script" "/dev"]}
            identity))
        "Removes hidden relative files")

    (is (= ["/pages/foo.md" "/pages/bar.md"]
           (common-config/remove-hidden-files
            (map #(str "/" %) files)
            {:hidden ["script" "/dev"]}
            identity))
        "Removes hidden files if they start with '/'")))

(defn find-on-classpath [classpath rel-path]
  (some (fn [dir]
          (let [f (node-path/join dir rel-path)]
            (when (fs/existsSync f) f)))
        (string/split classpath #":")))

#?(:org.babashka/nbb
   (deftest create-config-for-db-graph
     (let [original-config (some-> (find-on-classpath (cp/get-classpath) "templates/config.edn") fs/readFileSync str)
           _ (assert original-config "config.edn must not be blank")
           migrated-config (common-config/create-config-for-db-graph original-config)
           forbidden-kws-regex (re-pattern (str (string/join "|" (keys common-config/file-only-config))))]
      ;;  (println migrated-config)
       (is (not (string/includes? migrated-config "== FILE ONLY CONFIG"))
           "No longer includes file config header")
       (assert (re-find forbidden-kws-regex original-config) "File config keys present in original config")
       (is (not (re-find forbidden-kws-regex migrated-config))
           "File config keys no longer present in migrated config"))))