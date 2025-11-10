(ns mobile.bottom-tabs
  "iOS bottom tabs"
  (:require ["stay-liquid" :refer [TabsBar]]
            [cljs-bean.core :as bean]
            [frontend.handler.editor :as editor-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [mobile.state :as mobile-state]
            [promesa.core :as p]))

(defn- tab-options
  [theme visible?]
  {:visible visible?
   :initialId "home"
   :items [{:id "home"
            :title "Journals"
            :systemIcon "house"}

           {:id "search"
            :title "Search"
            :systemIcon "magnifyingglass"}

           {:id "quick-add"
            :title "Quick add"
            :systemIcon "plus"}

           {:id "settings"
            :title "Settings"
            :systemIcon "gear"}]
   :selectedIconColor (if (= "light" theme)
                        "rgb(0, 105, 182)"
                        "#8ec2c2")
   :unselectedIconColor "#8E8E93"
   :titleOpacity 0.7})

(defn- configure-tabs
  [theme visible?]
  (.configure ^js TabsBar
              (bean/->js
               (tab-options theme visible?))))

(defn configure
  []
  (p/do!
   (configure-tabs (:ui/theme @state/state) true)
   (.addListener ^js TabsBar
                 "selected"
                 (fn [^js data]
                   (let [tab (.-id data)
                         ;; interaction (.-interaction data)
                         ]
                     (when-not (= tab "quick-add")
                       (mobile-state/set-tab! tab))
                     (case tab
                       "home"
                       (util/scroll-to-top false)
                       "quick-add"
                       (editor-handler/show-quick-add)
                       ;; TODO: support longPress detection
                       ;; (if (= "longPress" interaction)
                       ;;   (state/pub-event! [:mobile/start-audio-record])
                       ;;   (editor-handler/show-quick-add))
                       nil)))))

  ;; Update selected icon color according to current theme
  (add-watch state/state
             :theme-changed
             (fn [_ _ old new]
               (when-not (= (:ui/theme old) (:ui/theme new))
                 (configure-tabs (:ui/theme new) true)))))

(defn hide!
  []
  (when (mobile-util/native-ios?)
    (.hide ^js TabsBar)))

(defn show!
  []
  (when (mobile-util/native-ios?)
    (.show ^js TabsBar)))
