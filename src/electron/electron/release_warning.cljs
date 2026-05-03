(ns electron.release-warning)

(def stable-release-url
  "https://github.com/logseq/logseq/releases/latest")

(def nightly-release-url
  "https://github.com/logseq/logseq/releases/tag/nightly")

(defn x64-on-apple-silicon?
  [{:keys [platform arch running-under-arm64-translation?]}]
  (and (= "darwin" platform)
       (= "x64" arch)
       (true? running-under-arm64-translation?)))

(defn selected-release-url
  [response]
  (case response
    0 stable-release-url
    1 nightly-release-url
    nil))

(defn warning-dialog-options
  [t]
  {:type "warning"
   :buttons [(t :electron/wrong-release-open-stable)
             (t :electron/wrong-release-open-nightly)
             (t :electron/cancel)]
   :defaultId 0
   :cancelId 2
   :message (t :electron/wrong-release-warning-title)
   :detail (t :electron/wrong-release-warning-detail)})
