(ns frontend.util.url)

;; Keep same as electron/core.cljs
(def LSP_SCHEME "logseq")
(def encoder js/encodeURIComponent)

(defn get-logseq-url-by-uuid
  "Only the name of repo is required (not full path)"
  [host repo-name uuid]
  (str LSP_SCHEME "://" host "/open?graph=" (encoder repo-name) "&block-id=" uuid))

(defn get-local-logseq-url-by-uuid
  "Ensure repo-name and uuid are valid string before hand.
   Only the name of repo is required (not full path)"
  [repo-name uuid]
  (get-logseq-url-by-uuid "local" repo-name uuid))