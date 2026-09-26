(ns logseq.publishing.html-test
  (:require [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [logseq.db.test.helper :as db-test]
            [logseq.publishing.const :as publish-const]
            [logseq.publishing.html :as publish-html]))

(defn- sample-db []
  @(db-test/create-conn-with-blocks
    [{:page {:block/title "page1"}
      :blocks [{:block/title "hello export"}]}]))

(deftest build-html-keeps-transit-db-out-of-index-html
  (let [{:keys [html db-transit asset-filenames]}
        (publish-html/build-html
         (sample-db)
         {:repo "logseq_db_published"
          :app-state {:ui/theme "light"}
          :repo-config {:publishing/all-pages-public? true}
          :html-options {:title "Published graph"}})]
    (is (string? db-transit))
    (is (pos? (count db-transit))
        "Export returns the graph transit payload as its own artifact")
    (is (string/includes? html "window.logseq_db_url=")
        "Published HTML loads the graph from an external file")
    (is (string/includes? html publish-const/db-transit-file-path))
    (is (not (string/includes? html "window.logseq_db="))
        "Inlining the transit graph in index.html forces the browser to parse and unescape the entire DB on first load")
    (is (not (string/includes? html db-transit))
        "index.html must not contain the transit payload")
    (is (sequential? asset-filenames))))

(deftest build-html-inlines-transit-db-when-requested
  (let [{:keys [html db-transit]}
        (publish-html/build-html
         (sample-db)
         {:repo "logseq_db_published"
          :app-state {:ui/theme "light"}
          :repo-config {:publishing/all-pages-public? true}
          :html-options {:title "Published graph"}
          :inline-db? true})]
    (is (string/includes? html "window.logseq_db=")
        "Standalone HTML download embeds the graph so it can restore without db.transit")
    (is (not (string/includes? html "window.logseq_db_url="))
        "Inline download must not point at a missing external transit file")
    (is (string/includes? html "hello export")
        "Inline HTML must include the transit graph payload")
    (is (nil? db-transit)
        "Inline export must not duplicate the transit payload as a separate artifact")))
