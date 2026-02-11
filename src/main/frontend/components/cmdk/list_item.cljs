(ns frontend.components.cmdk.list-item
  (:require
   ["remove-accents" :as remove-accents]
   [clojure.string :as string]
   [frontend.components.icon :as icon-component]
   [frontend.handler.block :as block-handler]
   [goog.string :as gstring]
   [logseq.shui.hooks :as hooks]
   [logseq.shui.ui :as shui]
   [rum.core :as rum]))

(defn- to-string [input]
  (cond
    (string? input) input
    (keyword? input) (name input)
    (symbol? input) (name input)
    (number? input) (str input)
    (uuid? input) (str input)
    (nil? input) ""
    :else (pr-str input)))

(defn- normalize-text [app-config text]
  (cond-> (to-string text)
    ;; :lower-case (string/lower-case)
    :normalize (.normalize "NFKC")
    (:feature/enable-search-remove-accents? app-config) (remove-accents)))

(defn highlight-query* [app-config query text]
  (cond
    (or (vector? text) (object? text))                      ; hiccup
    text

    (string/blank? query)
    [:span (to-string text)]

    :else
    (when-let [text-string (not-empty (to-string text))]
      (let [normal-text (normalize-text app-config text-string)
            normal-query (normalize-text app-config query)
            query-terms (string/replace (gstring/regExpEscape normal-query) #"\s+" "|")
            query-re (js/RegExp. (str "(" query-terms ")") "i")
            highlighted-text (string/replace normal-text query-re "<:hlmarker>$1<:hlmarker>")
            segs (string/split highlighted-text #"<:hlmarker>")]
        (if (seq segs)
          (into [:span {"data-testid" text-string}]
                (map-indexed (fn [i seg]
                               (if (even? i)
                                 [:span seg]
                                 [:mark.p-0.rounded-none seg]))
                             segs))
          [:span normal-text])))))

(def current-page-badge-label "Current Page")

(defn current-page-badge-placement
  [{:keys [current-page? result-type]}]
  (when current-page?
    (case result-type
      :page {:text-badge current-page-badge-label}
      :block {:header-badge current-page-badge-label}
      nil)))

(defn current-page-badge-node
  [label]
  (when-not (string/blank? label)
    [:span.cp__cmdk-current-page-badge label]))

(rum/defc root [{:keys [icon icon-theme query text info shortcut value-label value
                        title highlighted on-highlight on-highlight-dep header on-click
                        hoverable compact rounded on-mouse-enter component-opts source-block] :as props
                 :or {hoverable true rounded true}}
                {:keys [app-config]}]
  (let [ref (hooks/create-ref)
        highlight-query (partial highlight-query* app-config query)
        badge-placement (current-page-badge-placement props)
        text-badge (current-page-badge-node (:text-badge badge-placement))
        header-badge (current-page-badge-node (:header-badge badge-placement))
        [hover? set-hover?] (rum/use-state false)
        mouse-highlighted? (and highlighted hoverable hover?)
        keyboard-highlighted? (and highlighted (not mouse-highlighted?))
        interaction-bg "var(--lx-gray-03, var(--ls-a-chosen-bg, var(--ls-tertiary-background-color, rgba(0,0,0,0.10))))"
        interaction-border "var(--ls-border-color, var(--lx-gray-08, rgba(0,0,0,0.24)))"
        mouse-selected-border "var(--ls-border-color, var(--lx-gray-09, rgba(0,0,0,0.32)))"
        keyboard-ring "var(--lx-accent-09, #3b82f6)"
        keyboard-overlay "rgba(0,0,0,0.07)"]
    (hooks/use-effect!
     (fn []
       (when (and highlighted on-highlight)
         (on-highlight ref)))
     [highlighted on-highlight-dep])
    [:div (merge
           {:style (cond-> {:opacity 1
                            :background-color "transparent"
                            :box-shadow "inset 0 0 0 0 transparent"}
                     (and hover? hoverable (not highlighted))
                     (assoc :background-color interaction-bg
                            :box-shadow (str "inset 0 0 0 1px " interaction-border))
                     mouse-highlighted?
                     (assoc :background-color interaction-bg
                            :box-shadow (str "inset 0 0 0 1px " mouse-selected-border))
                     keyboard-highlighted?
                     (assoc :background-color interaction-bg
                            :box-shadow (str "inset 0 0 0 9999px " keyboard-overlay
                                             ", inset 0 0 0 2px " keyboard-ring)))
            :class (cond-> "flex flex-col transition-colors duration-75 ease-in"
                     hoverable (str " cursor-pointer")
                     rounded (str " rounded-lg")
                     (not compact) (str " py-4 px-6 gap-1")
                     compact (str " py-1.5 px-3 gap-0.5"))
            :ref ref
            :on-click (when on-click on-click)
            :on-mouse-enter (fn [e]
                              (set-hover? true)
                              (when on-mouse-enter
                                (on-mouse-enter e)))
            :on-mouse-leave #(set-hover? false)}
           component-opts)
     ;; header
     (when header
       [:div.text-xs.pl-8.font-light.flex.items-center.gap-2.flex-wrap {:class "-mt-1"
                                      :style {:color "var(--lx-gray-11)"}}
        (highlight-query header)
        header-badge])
     ;; main row
     [:div.flex.items-start.gap-3
      [:div.w-5.h-5.rounded.flex.items-center.justify-center
       {:style {:background (when (#{:gradient} icon-theme) "linear-gradient(-65deg, #8AE8FF, #5373E7, #369EFF, #00B1CC)")
                :box-shadow (when (#{:gradient} icon-theme) "inset 0 0 0 1px rgba(255,255,255,0.3) ")}
        :class (cond-> "w-5 h-5 rounded flex items-center justify-center"
                 (= icon-theme :color) (str
                                        " "
                                        (if highlighted "bg-accent-07-alpha" "bg-gray-05")
                                        " dark:text-white")
                 (= icon-theme :gray) (str " bg-gray-05 dark:text-white"))}
       (if (string? icon)
         (shui/tabler-icon icon {:size "14" :class ""})
         icon)]
      [:div.flex.flex-1.flex-col
       (when title
         [:div.text-sm.pb-2.font-bold.text-gray-11 (highlight-query title)])
       [:div {:class "text-sm font-medium text-gray-12 flex items-center gap-2 flex-wrap"}
        (block-handler/block-title-with-icon source-block
                                             (highlight-query text)
                                             icon-component/icon)
        text-badge
        (when info
          [:span.text-xs.text-gray-11 " — " (highlight-query info)])]]
      (when (or value-label value)
        [:div {:class "text-xs"}
         (when (and value-label value)
           [:span.text-gray-11 (str (to-string value-label) ": ")])
         (when (and value-label (not value))
           [:span.text-gray-11 (str (to-string value-label))])
         (when value
           [:span.text-gray-11 (to-string value)])])
      (when shortcut
        [:div {:class "flex gap-1"
               :style {:opacity (if (or highlighted hover?) 1 0.9)}}
         (shui/shortcut shortcut)])]]))
