(ns frontend.components.block.drop-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block.drop :as block-drop]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(defn- file
  [name]
  #js {:name name
       :size 12})

(defn- drop-event
  [types files text]
  (let [prevent-default? (atom false)
        stop-propagation? (atom false)
        data-transfer #js {:types (clj->js types)
                           :files (clj->js files)
                           :getData (fn [type]
                                      (case type
                                        "text/plain" text
                                        ""))}
        event #js {:dataTransfer data-transfer
                   :preventDefault #(reset! prevent-default? true)
                   :stopPropagation #(reset! stop-propagation? true)}]
    {:event event
     :prevent-default? prevent-default?
     :stop-propagation? stop-propagation?}))

(deftest handle-data-transfer-drop-files-test
  (testing "file drop into a block is saved as an asset and consumes the browser default"
    (let [calls (atom [])
          target-block {:block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                        :block/title "Drop target"}
          dropped-file (file "demo.pdf")
          {:keys [event prevent-default? stop-propagation?]}
          (drop-event ["Files"] [dropped-file] "")]
      (with-redefs [state/get-current-repo (constantly "test-repo")
                    editor-handler/db-based-save-assets! (fn [repo files & opts]
                                                           (swap! calls conj [repo files opts])
                                                           (p/resolved :saved))]
        (block-drop/handle-data-transfer-drop! event (:block/uuid target-block) target-block nil)
        (is (= [["test-repo" [dropped-file] [:last-edit-block target-block]]] @calls))
        (is (true? @prevent-default?))
        (is (true? @stop-propagation?)))))

  (testing "file drop wins over text/plain from OS file drags"
    (let [asset-calls (atom 0)
          text-calls (atom 0)
          target-block {:block/uuid #uuid "00000000-0000-0000-0000-000000000002"
                        :block/title "Drop target"}
          dropped-file (file "demo.png")
          {:keys [event]}
          (drop-event ["Files" "text/plain"] [dropped-file] "C:\\Users\\me\\demo.png")]
      (with-redefs [state/get-current-repo (constantly "test-repo")
                    editor-handler/db-based-save-assets! (fn [& _]
                                                           (swap! asset-calls inc)
                                                           (p/resolved :saved))
                    editor-handler/api-insert-new-block! (fn [& _]
                                                           (swap! text-calls inc))]
        (block-drop/handle-data-transfer-drop! event (:block/uuid target-block) target-block nil)
        (is (= 1 @asset-calls))
        (is (zero? @text-calls))))))
