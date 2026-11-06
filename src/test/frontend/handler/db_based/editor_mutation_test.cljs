(ns frontend.handler.db-based.editor-mutation-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.db.async :as db-async]
            [frontend.handler.db-based.editor :as db-editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.ui :as ui-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(def ^:private ref-uuid #uuid "11111111-1111-1111-1111-111111111111")

(defn- warnings-for-saved-refs
  "Wraps a block that refs the block `ref-uuid` and the page bar (a map ref).
   The worker knows the blocks in `existing`. Returns a promise of the
   notifications shown."
  [existing]
  (let [shown (atom [])]
    (p/with-redefs [state/get-state (constantly [])
                    state/get-current-repo (constantly "repo")
                    db-async/<get-blocks (fn [_repo ids & _]
                                           (p/resolved (mapv (fn [id] {:id id :block (when (contains? existing id) {:block/uuid id})})
                                                             ids)))
                    notification/show! (fn [& args] (swap! shown conj (vec args)))]
      (p/let [result (db-editor-handler/wrap-parse-block
                      {:block/uuid #uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
                       :block/title (str "((" ref-uuid ")) [[bar]]")})
              _ (p/delay 20)]
        (is (= #{[:block/uuid ref-uuid] "bar"}
               (set (map #(if (map? %) (:block/name %) %) (:block/refs result)))))
        @shown))))

;; Fails if, in `warn-missing-uuid-refs!`, `when` becomes `when-not`, `=` becomes `not=`, `first` becomes `last` or `nil?` becomes `some?`.
(deftest saving-a-block-ref-warns-only-when-the-referenced-block-is-missing-test
  (async done
    (-> (p/let [when-present (warnings-for-saved-refs #{ref-uuid})
                when-missing (warnings-for-saved-refs #{})]
          (is (= [] when-present) "an existing ref (and the page ref) give no warning")
          (is (= 1 (count when-missing)) "a missing block ref gives one warning")
          (is (= :warning (second (first when-missing)))))
        (p/catch (fn [e] (is (nil? e))))
        (p/finally (fn [& _] (done))))))

;; Fails if, in `save-file!`, `=` becomes `not=`.
(deftest saving-custom-css-applies-the-style-test
  (async done
    (let [added (atom 0)]
      (-> (p/with-redefs [state/get-current-repo (constantly "repo")
                          state/<invoke-db-worker (fn [& _] (p/resolved nil))
                          ui-handler/add-style-if-exists! #(swap! added inc)]
            (p/let [_ (db-editor-handler/save-file! "logseq/custom.css" "body {}")
                    css @added
                    _ (db-editor-handler/save-file! "pages/other.md" "text")]
              (is (= 1 css) "saving custom.css applies the style")
              (is (= 1 @added) "saving another file does not")))
          (p/catch (fn [e] (is (nil? e))))
          (p/finally (fn [& _] (done)))))))

;; Fails if, in `markdown-hashtag-link-target`, `and` becomes `or`.
(deftest only-a-hashtag-link-target-refs-the-cached-tag-test
  (let [tag-uuid #uuid "5c6cd067-c602-4955-96b8-74b62e08113c"
        tag-page {:db/id 12
                  :block/title "Tag1"
                  :block/name "tag1"
                  :block/uuid tag-uuid
                  :block/tags [{:db/ident :logseq.class/Tag}]}]
    (with-redefs [state/get-state (fn [k] (case k :editor/block-refs #{tag-page} nil))]
      (is (= [tag-uuid]
             (map :block/uuid (:block/refs (db-editor-handler/wrap-parse-block {:block/title "see [label](#Tag1)"}))))
          "a #Tag1 link target refs the tag")
      (is (empty? (:block/refs (db-editor-handler/wrap-parse-block {:block/title "see [label](xTag1)"})))
          "a link target without # is not a hashtag: no ref to Tag1"))))
