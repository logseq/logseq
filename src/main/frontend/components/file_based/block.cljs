(ns frontend.components.file-based.block
  (:require [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.components.file-based.datetime :as datetime-comp]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.file-based.repeated :as repeated]
            [frontend.hooks :as hooks]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.file-based.clock :as clock]
            [frontend.util.file-based.drawer :as drawer]
            [logseq.shui.ui :as shui]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(defn marker-switch
  [{:block/keys [marker] :as block}]
  (when (contains? #{"NOW" "LATER" "TODO" "DOING"} marker)
    (let [set-marker-fn (fn [new-marker]
                          (fn [e]
                            (util/stop e)
                            (editor-handler/set-marker block new-marker)))
          next-marker (case marker
                        "NOW" "LATER"
                        "LATER" "NOW"
                        "TODO" "DOING"
                        "DOING" "TODO")]
      [:a
       {:class (str "marker-switch block-marker " marker)
        :title (util/format "Change from %s to %s" marker next-marker)
        :on-pointer-down (set-marker-fn next-marker)}
       marker])))

(defn block-checkbox
  [block class]
  (let [marker (:block/marker block)
        [class checked?] (cond
                           (nil? marker)
                           nil
                           (contains? #{"NOW" "LATER" "DOING" "IN-PROGRESS" "TODO" "WAIT" "WAITING"} marker)
                           [class false]
                           (= "DONE" marker)
                           [(str class " checked") true])]
    (when class
      (ui/checkbox {:class class
                    :style {:margin-right 5}
                    :checked checked?
                    :on-pointer-down (fn [e]
                                       (util/stop-propagation e))
                    :on-change (fn [_e]
                                 (if checked?
                                   (editor-handler/uncheck block)
                                   (editor-handler/check block)))}))))

(defn marker-cp
  [{:block/keys [pre-block? marker] :as _block}]
  (when-not pre-block?
    (when (contains? #{"IN-PROGRESS" "WAIT" "WAITING"} marker)
      [:span {:class (str "task-status block-marker " (string/lower-case marker))
              :style {:margin-right 3.5}}
       (string/upper-case marker)])))

(rum/defc set-priority
  [block priority]
  [:div
   (let [priorities (sort (remove #(= priority %) ["A" "B" "C"]))]
     (for [p priorities]
       [:a.mr-2.text-base.tooltip-priority {:key (str (random-uuid))
                                            :priority p
                                            :on-click (fn [] (editor-handler/set-priority block p))}]))])

(rum/defc priority-text
  [priority]
  [:a.opacity-50.hover:opacity-100
   {:class "priority"
    :href (rfe/href :page {:name priority})
    :style {:margin-right 3.5}}
   (util/format "[#%s]" (str priority))])

(defn priority-cp
  [{:block/keys [pre-block? priority] :as block}]
  (when (and (not pre-block?) priority)
    (ui/tippy
     {:interactive true
      :html (set-priority block priority)}
     (priority-text priority))))

(defn clock-summary-cp
  [block body]
  (when (and (state/enable-timetracking?)
             (or (= (:block/marker block) "DONE")
                 (contains? #{"TODO" "LATER"} (:block/marker block))))
    (let [summary (clock/clock-summary body true)]
      (when (and summary
                 (not= summary "0m")
                 (not (string/blank? summary)))
        [:div {:style {:max-width 100}}
         (ui/tippy {:html        (fn []
                                   (when-let [logbook (drawer/get-logbook body)]
                                     (let [clocks (->> (last logbook)
                                                       (filter #(string/starts-with? % "CLOCK:"))
                                                       (remove string/blank?))]
                                       [:div.p-4
                                        [:div.font-bold.mb-2 "LOGBOOK:"]
                                        [:ul
                                         (for [clock (take 10 (reverse clocks))]
                                           [:li clock])]])))
                    :interactive true
                    :in-editor?  true
                    :delay       [1000, 100]}
                   [:div.text-sm.time-spent.ml-1 {:style {:padding-top 3}}
                    [:a.fade-link
                     summary]])]))))

(rum/defc timestamp-editor
  [ast *show-datapicker?]
  (let [*trigger-ref (rum/use-ref nil)]
    (hooks/use-effect!
     (fn []
       (let [pid (shui/popup-show!
                  (.closest (rum/deref *trigger-ref) "a")
                  (datetime-comp/date-picker nil nil (repeated/timestamp->map ast))
                  {:id :timestamp-editor
                   :align :start
                   :root-props {:onOpenChange #(reset! *show-datapicker? %)}
                   :content-props {:onEscapeKeyDown #(reset! *show-datapicker? false)}})]
         #(do (shui/popup-hide! pid)
              (reset! *show-datapicker? false))))
     [])
    [:i {:ref *trigger-ref}]))

(rum/defcs timestamp-cp
  < rum/reactive
  (rum/local false ::show-datepicker?)
  [state block typ ast]
  (let [ts-block-id (get-in (state/sub [:editor/set-timestamp-block]) [:block :block/uuid])
        _active? (= (get block :block/uuid) ts-block-id)
        *show-datapicker? (get state ::show-datepicker?)]
    [:div.flex.flex-col.gap-4.timestamp
     [:div.text-sm.flex.flex-row
      [:div.opacity-50.font-medium.timestamp-label
       (str typ ": ")]
      [:a.opacity-80.hover:opacity-100
       {:on-pointer-down (fn [e]
                           (util/stop e)
                           (state/clear-editor-action!)
                           (editor-handler/escape-editing)
                           (reset! *show-datapicker? true)
                           (reset! commands/*current-command typ)
                           (state/set-timestamp-block! {:block block
                                                        :typ typ}))}
       [:span.time-start "<"] [:time (repeated/timestamp->text ast)] [:span.time-stop ">"]
       (when (and _active? @*show-datapicker?)
         (timestamp-editor ast *show-datapicker?))]]]))
