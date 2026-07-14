(ns frontend.handler.block-test
  (:require [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.db.async :as db-async]
            [frontend.handler.block :as block-handler]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.state :as state]
            [logseq.outliner.core :as outliner-core]
            [logseq.db.test.helper :as db-test]
            [promesa.core :as p]))

(deftest block-unique-title-no-truncate-when-disabled
  (testing "disable truncate for cmdk path"
    (let [title (apply str (repeat 300 "a"))
          block {:block/title title}
          result (block-handler/block-unique-title block :truncate? false)]
      (is (= title result))
      (is (= 300 (count result))))))

(deftest block-unique-title-keeps-full-tag-label
  (testing "truncate base title before appending tags"
    (let [base-title (apply str (repeat 252 "a"))
          block {:block/title base-title
                 :block/tags [{:db/ident :user.class/example
                               :block/title "example"}]}
          result (block-handler/block-unique-title block)]
      (is (string/starts-with? result base-title))
      (is (string/ends-with? result "#example"))
      (is (> (count result) 256)))))

(deftest block-unique-title-hides-class-parent-when-title-is-unique
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Project {:block/title "Project"}
                         :Milestone {:block/title "Milestone"
                                     :build/class-extends [:Project]}}})
        milestone (d/entity @conn :user.class/Milestone)]
    (is (= "Milestone" (block-handler/block-unique-title milestone :db @conn)))))

(deftest block-unique-title-shows-class-parent-when-title-conflicts
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Project {:block/title "Project"}
                         :Area {:block/title "Area"}
                         :user.class/Milestone {:block/title "Milestone"
                                                :build/class-extends [:Project]}
                         :other.class/Milestone {:block/title "Milestone"
                                                 :build/class-extends [:Area]}}})
        project-milestone (d/entity @conn :user.class/Milestone)
        area-milestone (d/entity @conn :other.class/Milestone)]
    (is (= "Project/Milestone" (block-handler/block-unique-title project-milestone :db @conn)))
    (is (= "Area/Milestone" (block-handler/block-unique-title area-milestone :db @conn)))))

(deftest block-unique-title-resolves-plain-class-map-before-title-formatting
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Project {:block/title "Project"}
                         :Area {:block/title "Area"}
                         :user.class/Milestone {:block/title "Milestone"
                                                :build/class-extends [:Project]}
                         :other.class/Milestone {:block/title "Milestone"
                                                 :build/class-extends [:Area]}}})
        project-milestone (d/entity @conn :user.class/Milestone)
        plain-class-map {:db/id (:db/id project-milestone)
                         :block/title (:block/title project-milestone)
                         :block/tags [(d/entid @conn :logseq.class/Tag)]}]
    (is (= "Project/Milestone" (block-handler/block-unique-title plain-class-map :db @conn)))))

(deftest get-top-level-blocks-uses-original-block-without-renderer-rehydration-test
  (let [block-id #uuid "11111111-1111-1111-1111-111111111111"
        block {:db/id 1
               :block/uuid block-id
               :block/title "linked block"}
        original {:db/id 2
                  :block/uuid #uuid "22222222-2222-2222-2222-222222222222"
                  :block/title "original block"}]
    (with-redefs [outliner-core/blocks-with-level (fn [_] [(assoc block :block/level 1)])
                  block-handler/get-original-block (fn [b]
                                                     (when (= (:block/uuid b) block-id)
                                                       original))]
      (is (= [original]
             (block-handler/get-top-level-blocks [block]))))))

(deftest edit-block-loads-target-through-worker-test
  (async done
    (let [block-id #uuid "11111111-1111-1111-1111-111111111111"
          loaded-block {:db/id 42
                        :block/uuid block-id
                        :block/title "worker title"}
          calls (atom [])]
      (p/with-redefs [state/get-current-repo (constantly "test")
                      db-async/<get-block
                      (fn [repo id opts]
                        (swap! calls conj [:get-block repo id opts])
                        (p/resolved loaded-block))
                      state/pub-event!
                      (fn [event]
                        (swap! calls conj [:event event]))
                      state/get-edit-block
                      (constantly nil)
                      state/clear-edit!
                      (fn [& args]
                        (swap! calls conj (into [:clear-edit] args)))
                      state/clear-selection!
                      (fn []
                        (swap! calls conj [:clear-selection]))
                      state/get-current-editor-container-id
                      (constantly :test-container)
                      state/set-editing!
                      (fn [& args]
                        (swap! calls conj (into [:set-editing] args)))
                      state/set-editor-last-input-time!
                      (fn [repo _time]
                        (swap! calls conj [:mark-input repo]))]
        (-> (block-handler/edit-block! {:block/uuid block-id
                                         :block/title "stale title"}
                                        :max)
            (p/then
             (fn []
               (is (= [[:get-block "test" block-id {:children? false}]
                       [:event [:editor/save-code-editor]]
                       [:clear-edit {:clear-editing-block? false}]
                       [:clear-selection]
                       [:set-editing
                        (str "edit-block-" block-id)
                        "worker title"
                        loaded-block
                        "worker title"
                        {:container-id :test-container
                         :direction nil
                         :event nil
                         :pos :max}]
                       [:mark-input "test"]]
                      @calls))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally done))))))

(deftest edit-block-with-loaded-data-updates-editor-synchronously-test
  (let [block-id #uuid "11111111-1111-1111-1111-111111111111"
        block {:db/id 42
               :block/uuid block-id
               :block/title "loaded title"}
        editing (atom nil)]
    (with-redefs [state/get-current-repo (constantly "test")
                  state/get-edit-block (constantly block)
                  state/clear-selection! (constantly nil)
                  state/get-current-editor-container-id (constantly :test-container)
                  state/set-editing! (fn [& args]
                                       (reset! editing args))
                  state/set-editor-last-input-time! (constantly nil)]
      (block-handler/edit-block! block 0 {:save-code-editor? false
                                          :skip-load? true})
      (is (= [(str "edit-block-" block-id)
              "loaded title"
              block
              ""
              {:container-id :test-container
               :direction nil
               :event nil
               :pos 0}]
             @editing)
          "Loaded block data should enter editor state before edit-block! returns."))))

(deftest indent-outdent-does-not-use-global-editor-state-test
  (async done
    (let [block-id #uuid "11111111-1111-1111-1111-111111111111"
          block {:db/id 42
                 :block/uuid block-id
                 :block/title "block"}
          calls (atom [])]
      (p/with-redefs [block-handler/get-top-level-blocks (fn [_] [block])
                      state/get-selection-blocks (constantly nil)
                      state/get-edit-block (constantly block)
                      state/set-editing-block-id! (fn [value]
                                                    (swap! calls conj [:set-editing value]))
                      block-handler/page-window-tx-meta (constantly nil)
                      outliner-op/indent-outdent-blocks! (fn [& _] nil)]
        (-> (block-handler/indent-outdent-blocks! [block] true (constantly nil))
            (p/then (fn []
                      (is (empty? @calls))))
            (p/catch (fn [error]
                       (is false (str error))))
            (p/finally done))))))
