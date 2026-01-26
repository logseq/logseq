(ns frontend.worker.export
  "Export data"
  (:require [datascript.core :as d]
            [logseq.cli.common.file :as common-file]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]))

(def get-all-page->content common-file/get-all-page->content)

(defn get-debug-datoms
  [conn]
  (some->> (d/datoms @conn :eavt)
           (keep (fn [{:keys [e a v t]}]
                   (cond
                     (and (= a :block/title) (common-util/url? v))
                     (d/datom e a "https://logseq.com/debug" t)

                     (and (contains? #{:block/title :block/name} a)
                          (let [entity (d/entity @conn e)]
                            (and (not (:db/ident entity))
                                 (not (ldb/journal? entity))
                                 (not (:logseq.property/built-in? entity))
                                 (not (= :logseq.property/query (:db/ident (:logseq.property/created-from-property entity)))))))
                     (d/datom e a (str "debug " e) t)

                     :else
                     (d/datom e a v t))))))
