(ns logseq.publishing.html-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.db.test.helper :as db-test]
            [logseq.publishing.html :as publish-html]))

(defn- published-script-srcs
  []
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Home"}
                :blocks [{:block/title "welcome"}]}])
        {:keys [html]} (publish-html/build-html
                        @conn
                        {:repo "logseq_db_published"
                         :app-state {:ui/theme "light"}
                         :repo-config {:publishing/all-pages-public? true}
                         :html-options {:title "Published"}})]
    (set (map second (re-seq #"<script [^>]*src=\"([^\"]+)\"" html)))))

(deftest published-html-loads-tabler-ext-js
  (let [srcs (published-script-srcs)]
    (is (contains? srcs "static/js/main.js")
        "Sanity check: the app script is listed")
    (is (contains? srcs "static/js/tabler.ext.js")
        "Status icons such as Todo and InProgress50 are defined only in tabler.ext.js, so the exported page must load it")))
