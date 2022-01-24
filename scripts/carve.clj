#!/usr/bin/env bb
;; This file is copied from
;; https://github.com/borkdude/carve/blob/df552797a198b6701fb2d92390fce7c59205ea77/carve.clj
;; and thus this file is under the same EPL license.
;; The script is modified to run latest clj-kondo and carve versions and to add
;; a more friendly commandline interface through -main

(require '[babashka.pods :as pods])

(pods/load-pod 'clj-kondo/clj-kondo "2021.12.19")
(require '[pod.borkdude.clj-kondo :as clj-kondo])
;; define clj-kondo.core ns which is used by carve
(intern (create-ns 'clj-kondo.core) 'run! clj-kondo/run!)

(require '[babashka.deps :as deps])
(deps/add-deps '{:deps {borkdude/carve ;; {:local/root "."}
                        {:git/url "https://github.com/borkdude/carve"
                         :git/sha "df552797a198b6701fb2d92390fce7c59205ea77"}
                        borkdude/spartan.spec {:git/url "https://github.com/borkdude/spartan.spec"
                                               :sha "12947185b4f8b8ff8ee3bc0f19c98dbde54d4c90"}}})

(require '[spartan.spec]) ;; defines clojure.spec

(with-out-str ;; silence warnings about spartan.spec + with-gen
  (binding [*err* *out*]
    (require '[carve.api :as carve])))

;; again to make clj-kondo happy
(require '[carve.main])
(require '[clojure.edn :as edn])

(defn -main
  "Wrapper around carve.main that defaults to .carve/config.edn and merges
in an optional string of options"
  [args]
  (let [default-opts (slurp ".carve/config.edn")
         opts (if-let [more-opts (first args)]
                (pr-str (merge (edn/read-string default-opts) (edn/read-string more-opts)))
                default-opts)]
    (apply carve.main/-main ["--opts" opts])))

(-main *command-line-args*)
