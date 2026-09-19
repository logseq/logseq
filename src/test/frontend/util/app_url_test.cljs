(ns frontend.util.app-url-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.util.app-url :as app-url]))

(def renderer-graph-url "lsp://logseq.com/index.html#/graph")

(deftest privileged-renderer-url?-test
  (testing "rejects the privileged renderer origin, including Graph View"
    (is (true? (app-url/privileged-renderer-url? renderer-graph-url)))
    (is (true? (app-url/privileged-renderer-url? "lsp://logseq.com/index.html")))
    (is (true? (app-url/privileged-renderer-url? " lsp://logseq.com/index.html#/graph "))))

  (testing "does not treat legitimate logseq deep links or https URLs as the app origin"
    (is (false? (app-url/privileged-renderer-url? "logseq://graph/my-notes")))
    (is (false? (app-url/privileged-renderer-url? "logseq://x-callback-url/quickCapture?url=https://example.com")))
    (is (false? (app-url/privileged-renderer-url? "https://example.com/article")))
    (is (false? (app-url/privileged-renderer-url? "http://localhost:3001/#/graph")))
    (is (false? (app-url/privileged-renderer-url? nil)))
    (is (false? (app-url/privileged-renderer-url? "")))))

(deftest insertable-block-content?-test
  (is (false? (app-url/insertable-block-content? renderer-graph-url))
      "Renderer origin URLs must not be stored as block titles")
  (is (true? (app-url/insertable-block-content? "https://example.com/article")))
  (is (true? (app-url/insertable-block-content? "logseq://graph/my-notes"))))

(deftest open-url-action-test
  (testing "renderer Graph View URL is not captured as content"
    (is (= :redirect-graph (app-url/open-url-action renderer-graph-url))))
  (testing "other renderer origin URLs are ignored instead of inserted"
    (is (= :ignore (app-url/open-url-action "lsp://logseq.com/index.html"))))
  (testing "normal https and logseq deep links still proceed"
    (is (= :proceed (app-url/open-url-action "https://example.com/article")))
    (is (= :proceed (app-url/open-url-action "logseq://graph/my-notes")))))

(deftest protocol-open-url?-test
  (testing "open-url still accepts legitimate logseq deep links"
    (is (true? (app-url/protocol-open-url? "logseq://graph/my-notes")))
    (is (true? (app-url/protocol-open-url? "logseq://x-callback-url/quickCapture?url=https://example.com"))))
  (testing "open-url recognizes the renderer origin so it can ignore/redirect instead of capturing"
    (is (true? (app-url/protocol-open-url? renderer-graph-url))))
  (testing "ordinary https URLs are not protocol handler targets"
    (is (false? (app-url/protocol-open-url? "https://example.com/article")))))
