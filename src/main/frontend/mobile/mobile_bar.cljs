(ns frontend.mobile.mobile-bar
  (:require [dommy.core :as dom]
            [frontend.commands :as commands]
            [frontend.date :as date]
            [frontend.handler.config :as config-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.history :as history]
            [frontend.handler.page :as page-handler]
            [frontend.mobile.camera :as mobile-camera]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [rum.core :as rum]))

(def ^:private icons-keywords
  [:checkbox :brackets :parentheses :command :tag :a-b :list :camera
   :brand-youtube :link :rotate :rotate-clockwise :calendar :code :bold :italic :strikethrough :paint])

(def ^:private commands-stats
  (atom (into {}
              (mapv (fn [name] [name {:counts 0}])
                    icons-keywords))))

(defn set-command-stats [icon]
  (let [key (keyword icon)
        counts (get-in @commands-stats [key :counts])]
    (swap! commands-stats
           assoc-in [key :counts] (inc counts))
    (config-handler/set-config!
     :mobile/toolbar-stats @commands-stats)))

(rum/defc indent-outdent [indent? icon]
  [:div
   [:button.bottom-action
    {:on-mouse-down (fn [e]
                      (util/stop e)
                      (editor-handler/indent-outdent indent?))}
    (ui/icon icon {:size ui/icon-size})]])

(rum/defc command
  [command-handler icon & [count? event?]]
  [:div
   [:button.bottom-action
    {:on-mouse-down (fn [e]
                      (util/stop e)
                      (when count?
                        (set-command-stats icon))
                      (if event?
                        (command-handler e)
                        (command-handler)))}
    (ui/icon icon {:size ui/icon-size})]])

(rum/defc timestamp-submenu
  [parent-id]
  (let [callback (fn [event]
                   (util/stop event)
                   (let [target (.-parentNode (.-target event))]
                     (dom/remove-class! target "show-submenu")))
        command-cp (fn [action description]
                     [:button
                      {:on-mouse-down (fn [e]
                                        (action)
                                        (callback e))}
                      description])]
    [:div
     [:button.bottom-action
      {:on-mouse-down (fn [event]
                        (util/stop event)
                        (set-command-stats :calendar)
                        (let [target (gdom/getNextElementSibling (.-target event))]
                          (dom/add-class! target "show-submenu")))}
      (ui/icon "calendar" {:size ui/icon-size})
      [:div.submenu.fixed.hidden.flex.flex-col.w-full.justify-evenly
       {:style {:bottom @util/keyboard-height}}
       (command-cp #(let [today (page-handler/get-page-ref-text (date/today))]
                      (commands/simple-insert! parent-id today {}))
                   "Today")
       (command-cp #(let [tomorrow (page-handler/get-page-ref-text (date/tomorrow))]
                      (commands/simple-insert! parent-id tomorrow {}))
                   "Tomorrow")
       (command-cp #(let [yesterday (page-handler/get-page-ref-text (date/yesterday))]
                      (commands/simple-insert! parent-id yesterday {}))
                   "Yesterday")
       (command-cp #(let [timestamp (date/get-current-time)]
                      (commands/simple-insert! parent-id timestamp {}))
                   "Time")]]]))

(defn commands
  [parent-id]
  (let [viewport-fn (fn [] (when-let [input (gdom/getElement parent-id)]
                             (util/scroll-editor-cursor input :to-vw-one-quarter? true)
                             (.focus input)))]
    (zipmap icons-keywords
            [(command editor-handler/cycle-todo! "checkbox" true)
             (command #(do (viewport-fn) (editor-handler/toggle-page-reference-embed parent-id)) "brackets" true)
             (command #(do (viewport-fn) (editor-handler/toggle-block-reference-embed parent-id)) "parentheses" true)
             (command #(do (viewport-fn) (commands/simple-insert! parent-id "/" {})) "command" true)
             (command #(do (viewport-fn) (commands/simple-insert! parent-id "#" {})) "tag" true)
             (command editor-handler/cycle-priority! "a-b" true)
             (command editor-handler/toggle-list! "list" true)
             (command #(mobile-camera/embed-photo parent-id) "camera" true)
             (command commands/insert-youtube-timestamp "brand-youtube" true)
             (command editor-handler/html-link-format! "link" true)
             (command history/undo! "rotate" true true)
             (command history/redo! "rotate-clockwise" true true)
             (timestamp-submenu parent-id)
             (command #(commands/simple-insert! parent-id "<" {}) "code" true)
             (command editor-handler/bold-format! "bold" true)
             (command editor-handler/italics-format! "italic" true)
             (command editor-handler/strike-through-format! "strikethrough" true)
             (command editor-handler/highlight-format! "paint" true)])))

(rum/defc mobile-bar < rum/reactive
  []
  (when (and (state/sub :editor/editing?)
             (or (state/sub :mobile/show-toolbar?)
                 (mobile-util/native-ipad?)))
    (when-let [config-toolbar-stats (:mobile/toolbar-stats (state/get-config))]
      (reset! commands-stats config-toolbar-stats))
    (let [parent-id (state/get-edit-input-id)
          commands (commands parent-id)
          sorted-commands (sort-by (comp :counts second) > @commands-stats)]
      [:div#mobile-editor-toolbar.bg-base-2
       [:div.toolbar-commands
        (indent-outdent false "indent-decrease")
        (indent-outdent true "indent-increase")
        (command (editor-handler/move-up-down true) "arrow-bar-to-up")
        (command (editor-handler/move-up-down false) "arrow-bar-to-down")
        (command #(if (state/sub :document/mode?)
                    (editor-handler/insert-new-block! nil)
                    (commands/simple-insert! parent-id "\n" {})) "arrow-back")
        (for [command sorted-commands]
          ((first command) commands))]
       [:div.toolbar-hide-keyboard
        (command #(state/clear-edit!) "keyboard-show")]])))

