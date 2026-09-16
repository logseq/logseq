(ns frontend.components.datepicker-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.components.datepicker :as datepicker]
            [frontend.date :as date]
            [frontend.handler.editor :as editor-handler]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.shui.ui :as shui]))

(deftest date-picker-day-focus-updates-selected-date-without-insert-test
  (let [selected-date (js/Date. 2026 8 16)
        focused-date (js/Date. 2026 8 17)
        app-state* (atom {:date-picker/date selected-date})
        calendar-opts* (atom nil)
        inserted* (atom [])]
    (with-redefs [rfx/use-sub (fn [sub] (get-in @app-state* sub))
                  state/set-state! (fn [k v & _] (swap! app-state* assoc k v) nil)
                  state/clear-editor-action! (fn [] nil)
                  date/js-date->journal-title (constantly "September 17th, 2026")
                  editor-handler/insert-command! (fn [& args]
                                                   (swap! inserted* conj args))
                  ui/nlp-calendar (fn [opts]
                                    (reset! calendar-opts* opts)
                                    (.createElement react "div"))]
      (.renderToStaticMarkup react-dom-server (datepicker/date-picker "edit-block" nil))
      ((:on-day-focus @calendar-opts*) focused-date)
      (let [updated (:date-picker/date @app-state*)]
        (is (= 2026 (.getFullYear updated)))
        (is (= 8 (.getMonth updated)))
        (is (= 17 (.getDate updated))))
      (is (empty? @inserted*)
          "Keyboard focus should move the selected day without inserting a date"))))

(deftest repeated-selected-date-click-inserts-current-date-test
  (let [selected-date (js/Date. 2026 4 20)
        app-state* (atom {:date-picker/date selected-date})
        calendar-opts* (atom nil)
        inserted* (atom [])]
    (with-redefs [rfx/use-sub (fn [sub] (get-in @app-state* sub))
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

(deftest calendar-day-highlight-classes-test
  (let [html (.renderToStaticMarkup
              react-dom-server
              (shui/calendar {:mode "single"
                              :selected (js/Date. 2026 8 16)
                              :today (js/Date. 2026 8 16)}))]
    (is (string/includes? html "data-today"))
    (is (string/includes? html "data-selected"))
    (is (string/includes? html "[&amp;&gt;button]:bg-primary"))
    (is (string/includes? html "[&amp;&gt;button]:bg-accent"))
    (is (string/includes? html "focus-visible:!ring-0"))
    (is (string/includes? html "focus-visible:!ring-offset-0"))))

(deftest date-year-input-fits-caption-without-overlapping-nav-test
  (let [html (.renderToStaticMarkup
              react-dom-server
              (ui/date-year-month-select {:name "years"
                                          :value 2026
                                          :onChange (fn [_])}))]
    (is (string/includes? html "ls-date-year-input"))
    (is (string/includes? html "4.5rem"))
    (is (not (string/includes? html "ml-2")))
    (is (not (string/includes? html "5.75rem")))))

(deftest date-month-select-uses-closable-menu-items-test
  (let [html (.renderToStaticMarkup
              react-dom-server
              (ui/date-year-month-select {:name "months"
                                          :value 8
                                          :onChange (fn [_])}))]
    (is (string/includes? html "ls-date-month-select"))
    (is (string/includes? html "September"))
    (is (string/includes? html "aria-haspopup=\"menu\""))
    (is (not (string/includes? html "menuitemcheckbox")))
    (is (not (string/includes? html "ui__dropdown-menu-checkbox-item")))))

(defn- form-target-event
  [matching-selectors & {:keys [attrs]}]
  (let [hits (set matching-selectors)]
    #js {:target #js {:closest (fn [sel]
                                  (when (some hits
                                              (map string/trim (string/split sel #",")))
                                    #js {:getAttribute (fn [k] (get attrs k))}))}}))

(deftest date-picker-form-target-ignores-enter-in-inputs-test
  (is (true? (ui/date-picker-form-target?
              (form-target-event [".ls-property-date-picker" "input"]))))
  (is (true? (ui/date-picker-form-target?
              (form-target-event [".ls-editor-date-picker" "[role='combobox']"]
                                 :attrs {"aria-expanded" "true"}))))
  (is (false? (ui/date-picker-form-target?
               (form-target-event [".ls-editor-date-picker" "[role='combobox']"]
                                  :attrs {"aria-expanded" "false"})))
      "Enter on a closed repeat select trigger still confirms the date")
  (is (true? (ui/date-picker-form-target?
              (form-target-event [".ls-property-date-picker" "button"]))))
  (is (false? (ui/date-picker-form-target?
               (form-target-event [".ls-property-date-picker" "button" "[role='gridcell']"])))
      "Enter on a calendar day button still confirms the date")
  (is (false? (ui/date-picker-form-target?
               (form-target-event ["input"])))
      "Enter outside the picker is not swallowed")
  (is (false? (ui/date-picker-form-target?
               #js {:target #js {:closest (fn [_] nil)}}))))
