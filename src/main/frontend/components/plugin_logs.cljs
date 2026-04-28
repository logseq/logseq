(ns frontend.components.plugin-logs
  "Viewer panel for a single plugin's logs powered by PluginLogger."
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.notification :as notification]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(def ^:private levels ["DEBUG" "INFO" "WARN" "ERROR"])

(defn- ^js get-plugin-logger
  [pid]
  (when-let [^js core (and pid (.-LSPluginCore js/window))]
    (try (.getPluginLogger core pid) (catch :default _ nil))))

(defn- get-entries
  [pid]
  (when-let [^js logger (get-plugin-logger pid)]
    (->> (.getEntries logger)
         (bean/->clj))))

(defn- format-time
  [ts]
  (let [d (js/Date. ts)]
    (.toLocaleTimeString d)))

(defn- entry->text
  [{:keys [ts level tag message]}]
  (str "[" (format-time ts) "] " level " [" tag "] " message))

(defn- copy-all!
  [entries]
  (-> (string/join "\n" (map entry->text entries))
      (util/copy-to-clipboard!))
  (notification/show! (t :plugin/logs-copied) :success))

(rum/defc ^:large-vars/cleanup-todo plugin-logs-panel
  [{:keys [pid name]}]
  (let [[entries set-entries!] (rum/use-state (or (get-entries pid) []))
        [level-filter set-level-filter!] (rum/use-state nil)
        [keyword-filter set-keyword-filter!] (rum/use-state "")
        ^js logger (get-plugin-logger pid)
        refresh! (hooks/use-callback
                   (fn [] (set-entries! (or (get-entries pid) [])))
                   [pid])]

    (hooks/use-effect!
      (fn []
        (when logger
          (let [h (fn [] (refresh!))]
            (.on logger "change" h)
            #(.off logger "change" h))))
      [logger refresh!])

    (let [filtered (cond->> entries
                     (seq level-filter)
                     (filter #(= (:level %) level-filter))

                     (not (string/blank? keyword-filter))
                     (filter #(string/includes?
                                (string/lower-case (str (:message %)))
                                (string/lower-case keyword-filter)))

                     ;; newest first
                     :always reverse)]
      [:div.cp__plugins-logs.flex.flex-col.gap-3
       {:style {:min-width "720px" :max-width "960px"}}

       ;; Row 1 - title + meta
       [:div.cp__plugins-logs-head.flex.items-center.justify-between.gap-3.flex-wrap
        [:h1.text-lg.font-semibold.flex.items-center.gap-2.m-0
         (ui/icon "file-description")
         [:span (t :plugin/logs-title)]
         (when name
           [:code.opacity-70.text-xs.px-1.5.py-0.5.rounded.bg-gray-03 name])]

        [:div.flex.items-center.gap-3.text-xs.opacity-70
         [:span (str (count filtered) " / " (count entries))]
         (when logger
           [:span.flex.items-center.gap-1
            "level:" [:code (.getLevel logger)]])]]

       ;; Row 2 - controls
       [:div.cp__plugins-logs-toolbar.flex.items-center.gap-2.flex-wrap
        ;; keyword filter (flex-grow)
        [:div.relative.flex-1.min-w-48.flex.items-center
         [:span.absolute.opacity-50.pointer-events-none.flex.items-center
          {:style {:left "8px" :top "0" :bottom "0"}}
          (ui/icon "search" {:size 14})]
         [:input.form-input.text-xs.h-8.w-full
          {:style {:paddingLeft "28px"}
           :placeholder (t :plugin/logs-filter-placeholder)
           :value keyword-filter
           :on-change #(set-keyword-filter! (util/evalue %))}]]

        ;; level filter
        (shui/select
          {:value (or level-filter "*")
           :on-value-change (fn [v] (set-level-filter! (if (= v "*") nil v)))}
          (shui/select-trigger
            {:class "w-32 h-8 text-xs shrink-0"}
            (shui/select-value {:placeholder (t :plugin/logs-level-all)}))
          (shui/select-content
            (shui/select-item {:value "*"} (t :plugin/logs-level-all))
            (for [lvl levels]
              (shui/select-item {:value lvl :key lvl} lvl))))

        [:div.h-5.w-px.bg-gray-05.shrink-0]

        ;; copy (chronological order for readability when pasted)
        (shui/button
          {:size :sm :variant :outline
           :class "h-8 shrink-0"
           :on-click #(copy-all! (reverse filtered))
           :title (t :plugin/logs-copy)}
          (ui/icon "copy" {:size 14})
          [:span.ml-1.5 (t :plugin/logs-copy)])

        ;; clear
        (shui/button
          {:size :sm :variant :outline
           :class "h-8 shrink-0"
           :on-click (fn []
                       (when logger
                         (.clear logger)
                         (refresh!)))
           :title (t :plugin/logs-clear)}
          (ui/icon "trash" {:size 14})
          [:span.ml-1.5 (t :plugin/logs-clear)])]

       ;; Body - log list
       [:div.cp__plugins-logs-body.text-xs.font-mono.rounded.border
        {:style {:height "60vh" :overflow "auto" :padding "8px"
                 :background "var(--ls-secondary-background-color)"}}
        (if (empty? filtered)
          [:div.opacity-60.p-4.text-center (t :plugin/logs-empty)]
          (for [[idx e] (map-indexed vector filtered)]
            [:div.cp__plugins-logs-row.flex.gap-1.py-0.5.items-start
             {:key (str idx "-" (:ts e))
              :data-level (:level e)}
             [:span.opacity-60.shrink-0 {:style {:width "80px"}}
              (format-time (:ts e))]
             [:span.shrink-0.font-bold
              {:style {:width "56px"
                       :color (case (:level e)
                                "ERROR" "var(--ls-error-text-color, #ef4444)"
                                "WARN" "#d97706"
                                "INFO" "var(--ls-active-primary-color)"
                                "DEBUG" "var(--ls-icon-color)"
                                nil)}}
              (:level e)]
             [:span.opacity-70.shrink-0 (str "[" (:tag e) "]")]
             [:span.whitespace-pre-wrap.break-all.flex-1 (:message e)]]))]])))

(defn open-plugin-logs!
  [{:keys [_pid _name] :as opts}]
  (shui/dialog-open!
    (fn [] (plugin-logs-panel opts))
    {:label "plugin-logs-modal"
     :class "lsp-plugin-logs-dialog"
     :content-props {:on-open-auto-focus #(.preventDefault %)}}))




