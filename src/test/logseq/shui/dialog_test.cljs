(ns logseq.shui.dialog-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]))

(defn- repo-root
  []
  (.cwd js/process))

(defn- source-for
  [relative-file]
  (.toString (fs/readFileSync (node-path/join (repo-root) relative-file) "utf8")))

(deftest dialog-outside-press-dismissal-is-not-canceled-by-overlay-target-check
  (testing "outside press dismissal is controlled by Base UI's backdrop ownership check"
    (let [source (source-for "deps/shui/src/logseq/shui/dialog/core.cljs")]
      (is (not (string/includes? source ".closest \".ui__dialog-overlay\""))
          "Dialog outside press handling must not cancel dismissal just because the native event target is outside the styled overlay."))))

(deftest base-ui-internal-dialog-backdrop-can-receive-pointer-events
  (testing "Base UI's internal backdrop remains interactive while the dialog is open"
    (let [source (source-for "src/main/frontend/shui/index.css")]
      (is (not (re-find #"(?s)\[role=\"presentation\"\]\[data-base-ui-inert\][^{]*\{[^}]*pointer-events:\s*none"
                        source))
          "The internal Base UI backdrop carries data-base-ui-inert even while open, so this selector must not disable its pointer events."))))
