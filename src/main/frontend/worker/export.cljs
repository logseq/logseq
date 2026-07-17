(ns frontend.worker.export
  "Export data"
  (:require [logseq.melange.bridge.common.api :as melange-common]
            [datascript.core :as d]
            [frontend.common.export.file :as common-file]
            [logseq.melange.bridge.db.core :as ldb]))

(def get-all-page->content common-file/get-all-page->content)

(defn get-debug-datoms
  [conn]
  (some->> (d/datoms @conn :eavt)
           (keep (fn [{:keys [e a v t]}]
                   (cond
                     (and (= a :block/title) (melange-common/url? v))
                     (d/datom e a "https://logseq.com/debug" t)

                     (and (contains? #{:block/title :block/name} a)
                          (let [entity (d/entity @conn e)]
                            (and (not (:db/ident entity))
                                 (not (ldb/journal? entity))
                                 (not (:logseq.property/built-in? entity))
                                 (not (= :logseq.property/query (:db/ident (:logseq.property/created-from-property entity)))))))
                     (d/datom e a (str "debug " e " " (apply str (repeat (count v) "x"))) t)

                     :else
                     (d/datom e a v t))))))
