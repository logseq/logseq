(ns frontend.components.datepicker-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is]]
            [frontend.commands :as commands]
            [frontend.components.datepicker :as datepicker]
            [frontend.date :as date]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]))

(deftest repeated-selected-date-click-inserts-current-date-test
  (let [selected-date (js/Date. 2026 4 20)
        app-state* (atom {:date-picker/date selected-date})
        calendar-opts* (atom nil)
        inserted* (atom [])]
    (with-redefs [state/state app-state*
                  state/set-state! (fn [k v & _] (swap! app-state* assoc k v) nil)
                  state/clear-editor-action! (fn [] nil)
                  date/js-date->journal-title (constantly "May 20th, 2026")
                  editor-handler/insert-command! (fn [& args]
                                                   (swap! inserted* conj args))
                  ui/nlp-calendar (fn [opts]
                                    (reset! calendar-opts* opts)
                                    (.createElement react "div"))]
      (.renderToStaticMarkup react-dom-server (datepicker/date-picker "edit-block" nil))
      (reset! commands/*current-command :date-picker)
      ((:on-select @calendar-opts*) nil)
      (is (= [["edit-block" "[[May 20th, 2026]]" nil {:command :page-ref}]]
             @inserted*))
      (is (nil? @commands/*current-command)))))
