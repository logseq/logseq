(ns frontend.components.onboarding.quick-tour
  (:require [promesa.core :as p]
            [cljs-bean.core :as bean]
            [frontend.state :as state]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.util :as util]
            [frontend.handler.route :as route-handler]
            [frontend.handler.command-palette :as command-palette]
            [hiccups.runtime :as h]
            [dommy.core :as d]))

(defn- load-base-assets$
  []
  (util/js-load$ (str util/JS_ROOT "/shepherd.min.js")))

(defn- make-skip-fns
  [^js jsTour]
  (let [^js el (js/document.createElement "button")]
    (.add (.-classList el) "cp__onboarding-skip-quick-tour")
    (set! (.-innerHTML el) (h/render-html [:span [:i.ti.ti-player-skip-forward] (t :on-boarding/quick-tour-btn-skip)]))
    (.addEventListener el "click" #(.cancel jsTour))
    [#(.appendChild js/document.body el)
     #(.removeChild js/document.body el)]))

(defn- wait-target
  [fn-or-selector time]
  (p/let [action (if (string? fn-or-selector)
                   #(d/sel1 fn-or-selector)
                   fn-or-selector)
          _ (action)
          _ (p/delay time)]))

(defn- inject-steps-indicator
  [current total]

  (h/render-html
   [:div.steps
    [:strong (str (t :on-boarding/quick-tour-steps) current)]
    [:ul (for [i (range total)] [:li {:class (when (= current (inc i)) "active")} i])]]))

(defn- create-steps! [^js jsTour]
  [
   ;; step 1
   {:id                "nav-help"
    :text              (h/render-html [:section [:h2 (t :on-boarding/quick-tour-help-title)]
                                       [:p (t :on-boarding/quick-tour-help-desc)]])
    :attachTo          {:element ".cp__sidebar-help-btn" :on "top"}
    :beforeShowPromise #(if (state/sub :ui/sidebar-open?)
                          (wait-target state/hide-right-sidebar! 700)
                          (p/resolved true))
    :canClickTarget    true
    :buttons           [{:text (t :on-boarding/quick-tour-btn-next) :action (.-next jsTour)}]
    :popperOptions     {:modifiers [{:name    "preventOverflow"
                                     :options {:padding 20}}
                                    {:name    "offset"
                                     :options {:offset [0, 10]}}]}}

   ;; step 2
   {:id                "nav-journal-page"
    :text              (h/render-html [:section [:h2 (t :on-boarding/quick-tour-journal-page-title)]
                                       [:p
                                        [:span (t :on-boarding/quick-tour-journal-page-desc-1)]
                                        [:a (t :on-boarding/quick-tour-journal-page-desc-2)]
                                        [:span (t :on-boarding/quick-tour-journal-page-desc-3)]]])

    :attachTo          {:element ".page.is-journals .page-title" :on "top-end"}
    :beforeShowPromise #(if-not (= (util/safe-lower-case (state/get-current-page))
                                   (util/safe-lower-case (date/today)))
                          (wait-target (fn []
                                         (route-handler/redirect-to-page! (date/today))
                                         (util/scroll-to-top)) 200)
                          (p/resolved true))
    :buttons           [{:text (t :on-boarding/quick-tour-btn-back) :classes "back" :action (.-back jsTour)}
                        {:text (t :on-boarding/quick-tour-btn-next) :action (.-next jsTour)}]
    :popperOptions     {:modifiers [{:name    "preventOverflow"
                                     :options {:padding 63}}
                                    {:name    "offset"
                                     :options {:offset [10, 10]}}]}}

   ;; step 3
   {:id                "nav-left-sidebar"
    :text              (h/render-html [:section [:h2 (t :on-boarding/quick-tour-left-sidebar-title)]
                                       [:p [:span (t :on-boarding/quick-tour-left-sidebar-desc)]]])

    :attachTo          {:element "#left-menu" :on "top"}
    :beforeShowPromise #(p/resolved true)
    :buttons           [{:text (t :on-boarding/quick-tour-btn-back) :classes "back" :action (.-back jsTour)}
                        {:text (t :on-boarding/quick-tour-btn-next) :action (.-next jsTour)}]
    :popperOptions     {:modifiers [{:name    "preventOverflow"
                                     :options {:padding 20}}
                                    {:name    "offset"
                                     :options {:offset [10, 10]}}]}}

   ;; step 4
   {:id                "nav-favorites"
    :text              (h/render-html [:section [:h2 (t :on-boarding/quick-tour-favorites-title)]
                                       [:p (t :on-boarding/quick-tour-favorites-desc-1)]
                                       [:p (t :on-boarding/quick-tour-favorites-desc-2)]])
    :beforeShowPromise #(if-not (state/sub :ui/left-sidebar-open?)
                          (wait-target state/toggle-left-sidebar! 500)
                          (p/resolved true))
    :attachTo          {:element ".nav-content-item.favorites" :on "right"}
    :buttons           [{:text (t :on-boarding/quick-tour-btn-back) :classes "back" :action (.-back jsTour)}
                        {:text (t :on-boarding/quick-tour-btn-finish) :action (.-complete jsTour)}]}
   ])

(defn- create-steps-file-sync! [^js jsTour]
  [
   ;; initiate graph
   {:id             "sync-initiate"
    :text           (h/render-html [:section [:h2 "🚀 Initiate synchronization of your current graph"]
                                    [:p "Clicking here will start the process of uploading your local files to an encrypted remote graph."]])
    :attachTo       {:element ".cp__file-sync-indicator" :on "bottom"}
    :canClickTarget true
    :buttons        [{:text "Cancel" :classes "bg-gray" :action (fn [] (.hide jsTour))}
                     {:text "Continue" :action (fn []
                                                 (some->> (js/document.querySelector ".cp__file-sync-indicator a.button")
                                                          (.click))
                                                 (.hide jsTour))}]
    :popperOptions  {:modifiers [{:name    "preventOverflow"
                                  :options {:padding 20}}
                                 {:name    "offset"
                                  :options {:offset [0, 15]}}]}}

   ;; learn
   {:id             "sync-learn"
    :text           (h/render-html [:section [:h2 "💡 Learn about your sync status"]
                                    [:p "Click here to see the progress of your local graph being synced with the cloud."]])
    :attachTo       {:element ".cp__file-sync-indicator" :on "bottom"}
    :canClickTarget true
    :buttons        [{:text "Got it!" :action (fn []
                                                (.hide jsTour)
                                                (js/setTimeout #(state/pub-event! [:file-sync/maybe-onboarding-show :congrats]) 3000))}]
    :popperOptions  {:modifiers [{:name    "preventOverflow"
                                  :options {:padding 20}}
                                 {:name    "offset"
                                  :options {:offset [0, 15]}}]}}

   ;; history
   {:id                "sync-history"
    :text              (h/render-html [:section [:h2 "⏱ Go back in time!"]
                                       [:p "With file sync you can now go through older versions of this page and revert back to them if you like!"]])
    :attachTo          {:element ".cp__btn_history_version" :on (if (util/mobile?) "bottom" "left")}
    :beforeShowPromise #(when-let [^js target (js/document.querySelector ".toolbar-dots-btn")]
                          (.click target)
                          (p/delay 300))
    :canClickTarget    true
    :buttons           [{:text "Got it!" :action (.-hide jsTour)}]
    :popperOptions     {:modifiers [{:name    "preventOverflow"
                                     :options {:padding 20}}
                                    {:name    "offset"
                                     :options {:offset [0, 15]}}]}}])

(defn- create-steps-whiteboard! [^js jsTour]
  [;; step 1
   {:id                "whiteboard-home"
    :text              (h/render-html [:section [:h2  (t :on-boarding/tour-whiteboard-home "🖼")]
                                       [:p (t :on-boarding/tour-whiteboard-home-description)]])
    :attachTo          {:element ".nav-header .whiteboard" :on "right"}
    :beforeShowPromise (fn []
                         (when-not (state/sub :ui/left-sidebar-open?)
                           (state/toggle-left-sidebar!))
                         (wait-target ".nav-header .whiteboard" 500)
                         (util/scroll-to-top))
    :canClickTarget    true
    :buttons           [{:text (t :on-boarding/tour-whiteboard-btn-next) :action (.-next jsTour)}]
    :popperOptions     {:modifiers [{:name    "preventOverflow"
                                     :options {:padding 20}}
                                    {:name    "offset"
                                     :options {:offset [0, 10]}}]}}

   ;; step 2
   {:id                "whiteboard-new"
    :text              (h/render-html [:section [:h2 (t :on-boarding/tour-whiteboard-new "🆕️")]
                                       [:p (t :on-boarding/tour-whiteboard-new-description)]])
    :beforeShowPromise (fn []
                         (route-handler/redirect-to-whiteboard-dashboard!)
                         (wait-target ".dashboard-create-card" 500))
    :attachTo          {:element ".dashboard-create-card" :on "bottom"}
    :buttons           [{:text (t :on-boarding/tour-whiteboard-btn-back) :classes "back" :action (.-back jsTour)}
                        {:text (t :on-boarding/tour-whiteboard-btn-finish) :action (.-complete jsTour)}]
    :popperOptions     {:modifiers [{:name    "preventOverflow"
                                     :options {:padding 20}}
                                    {:name    "offset"
                                     :options {:offset [0, 10]}}]}}])

(defn start
  []
  (let [^js jsTour (js/Shepherd.Tour.
                    (bean/->js
                     {:useModalOverlay    true
                      :defaultStepOptions {:classes  "cp__onboarding-quick-tour"
                                           :scrollTo false}}))
        steps      (create-steps! jsTour)
        steps      (map-indexed #(assoc %2 :text (str (:text %2) (inject-steps-indicator (inc %1) (count steps)))) steps)
        [show-skip! hide-skip!] (make-skip-fns jsTour)]

    ;; events
    (doto jsTour
      (.on "show" show-skip!)
      (.on "hide" hide-skip!)
      (.on "complete" hide-skip!)
      (.on "cancel" hide-skip!))

    (doseq [step steps]
      (.addStep jsTour (bean/->js step)))

    (.start jsTour)))

(defn start-file-sync
  [type]
  (let [^js jsTour (state/sub :file-sync/jstour-inst)
        ^js jsTour (or jsTour
                       (let [^js inst (js/Shepherd.Tour.
                                       (bean/->js
                                        {:useModalOverlay    true
                                         :defaultStepOptions {:classes  "cp__onboarding-quick-tour ignore-outside-event"
                                                              :scrollTo false}}))
                             steps    (create-steps-file-sync! inst)]

                         (.on inst "show"
                              (fn []
                                (js/setTimeout
                                 #(let [step (.-currentStep inst)]
                                    (when-let [^js overlay (and step (.contains (.-classList (.-el step)) "ignore-outside-event")
                                                                (js/document.querySelector ".shepherd-modal-overlay-container"))]
                                      (.add (.-classList overlay) "ignore-outside-event")
                                      (some-> (.-target step)
                                              (.addEventListener "click" (fn [] (.hide inst))))))
                                 1000)))

                         (doseq [step steps]
                           (.addStep inst (bean/->js step)))

                         (state/set-state! :file-sync/jstour-inst inst)

                         inst))]

    (js/setTimeout
     #(.show jsTour (name type)) 200)

    ;(.start jsTour)
    ))

(defn start-whiteboard
  []
  (let [^js jsTour (js/Shepherd.Tour.
                    (bean/->js
                     {:useModalOverlay    true
                      :defaultStepOptions {:classes  "cp__onboarding-quick-tour"
                                           :scrollTo false}}))
        steps      (create-steps-whiteboard! jsTour)
        steps      (map-indexed #(assoc %2 :text (str (:text %2) (inject-steps-indicator (inc %1) (count steps)))) steps)
        [show-skip! hide-skip!] (make-skip-fns jsTour)]

    ;; events
    (doto jsTour
      (.on "show" show-skip!)
      (.on "hide" hide-skip!)
      (.on "complete" hide-skip!)
      (.on "cancel" hide-skip!))

    (doseq [step steps]
      (.addStep jsTour (bean/->js step)))

    (.start jsTour)))

(defn ready
  [callback]
  (p/then
   (if (nil? js/window.Shepherd)
     (load-base-assets$) (p/resolved true))
   callback))

(def should-guide? false)

(defn init []
  (command-palette/register {:id     :document/quick-tour
                             :desc   (t :on-boarding/command-palette-quick-tour)
                             :action #(ready start)})

  ;; TODO: fix logic
  (when should-guide?
    (ready start)))
