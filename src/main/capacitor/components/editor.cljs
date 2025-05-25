(ns capacitor.components.editor
  (:require [capacitor.components.ui :as ui]
            [capacitor.ionic :as ion]
            [cljs-bean.core :as bean]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [rum.core :as rum]))

(rum/defc editor-aux
  [content {:keys [on-outside! on-save! on-delete! on-focused! on-keydown! on-keyup! on-bounded!]}]

  (let [*input (rum/use-ref nil)]

    (rum/use-layout-effect!
     (fn []
       (js/requestAnimationFrame
        (fn []
          (when-let [^js input (some-> (rum/deref *input))]
            (.focus input)
            (when on-focused!
              (on-focused! input))
              ;(.scrollIntoView input #js {:behavior "smooth", :block "start"})
            )))
       #())
     [])

    (rum/use-effect!
     (fn []
       (let [handle-outside! (fn [^js e]
                               (when-not (some-> e (.-target) (.closest ".editor-aux-input"))
                                 (on-outside! e)))]
         (js/window.addEventListener "pointerdown" handle-outside!)
         #(js/window.removeEventListener "pointerdown" handle-outside!)))
     [])

    (let [save-handle!
          (fn [opts]
            (when-let [content (some-> (rum/deref *input) (.-value))]
              (when on-save!
                (prn :debug "save block content:" content opts)
                (on-save! content opts))))
          delete-handle! (fn [opts]
                           (let [content (.-value (rum/deref *input))]
                             (when on-delete!
                               (prn :debug "delete block:" content opts)
                               (on-delete! content opts))))
          debounce-save-handle! (util/debounce save-handle! 128)]
      (ui/textarea
       {:class "editor-aux-input bg-gray-200 border-none resize-none"
        :ref *input
        :on-change (fn [] (debounce-save-handle!))
        :on-key-down (fn [^js e]
                       (let [ekey (.-key e)
                             target (.-target e)
                             enter? (= ekey "Enter")
                             esc? (= ekey "Escape")
                             backspace? (= ekey "Backspace")
                             arrow-up? (= ekey "ArrowUp")
                             arrow-down? (= ekey "ArrowDown")]

                         (when (or (nil? on-keydown!)
                                   (not (false? (on-keydown! e))))
                           (cond
                             (or arrow-up? arrow-down?)
                             (when-let [{:keys [isFirstLine isLastLine]} (some-> (.checkCursorLine js/window.externalsjs target) (bean/->clj))]
                               (when (and on-bounded! (or (and arrow-up? isFirstLine)
                                                          (and arrow-down? isLastLine)))
                                 (on-bounded! (if arrow-up? :up :down) target)
                                 (util/stop e)))

                             (or (and enter? (cursor/end? target)) esc?)
                             (do (save-handle! {:enter? enter? :esc? esc?})
                                 (util/stop e))

                             (and backspace?
                                  (cursor/start? target)
                                  (not (util/input-text-selected? target)))
                             (do (delete-handle! {})
                                 (util/stop e))))))
        :on-key-up (fn [^js e]
                     (when on-keyup!
                       (on-keyup! e)))
        :default-value content}))))

(rum/defc content-aux
  [content & opts]

  [:div.content-aux-container content])
