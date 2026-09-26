(ns frontend.handler.editor-context-popup-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.handler.editor :as editor]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(deftest context-menu-popup-pred-test
  (is (true? (#'editor/context-menu-popup?
              {:content-props {:class "w-[280px] ls-context-menu-content"}})))
  (is (false? (#'editor/context-menu-popup?
               {:content-props {:class "ls-preview-popup"}})))
  (is (false? (#'editor/context-menu-popup? {:content-props {:class "something-else"}})))
  (is (false? (#'editor/context-menu-popup? nil))))

(deftest shortcut-cut-and-delete-close-context-popup-test
  (async done
    (let [calls (atom [])
          event #js {:target #js {}}
          context-popup {:id :ls-context-menu-content-test
                         :content-props {:class "w-[280px] ls-context-menu-content"}}
          preview-popup {:id :unrelated-popup
                         :content-props {:class "ls-preview-popup"}}]
      ;; p/with-redefs keeps the stubs until the cut's promise chain ends:
      ;; it clears the selection after the cut, and the real
      ;; clear-selection! needs a DOM.
      (-> (p/with-redefs [state/selection? (constantly true)
                          util/input? (constantly false)
                          util/stop (fn [_])
                          editor/cut-selection-blocks
                          (fn [copy?]
                            (swap! calls conj [:cut copy?])
                            (p/resolved nil))
                          editor/clear-selection! (fn [])
                          shui-popup/get-popups (constantly [preview-popup context-popup])
                          shui/popup-hide! (fn [id]
                                             (swap! calls conj [:popup-hide id]))
                          state/hide-custom-context-menu!
                          (fn []
                            (swap! calls conj :hide-context-menu))]
            (p/do!
             (editor/shortcut-cut event)
             (is (= [[:cut true]
                     :hide-context-menu
                     [:popup-hide :ls-context-menu-content-test]]
                    @calls)
                 "Ctrl+X closes only the block context popup after cutting the selected block.")
             (reset! calls [])
             (editor/delete-selection event)
             (is (= [[:cut false]
                     :hide-context-menu
                     [:popup-hide :ls-context-menu-content-test]]
                    @calls)
                 "Delete closes only the block context popup after removing the selected block.")))
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))

