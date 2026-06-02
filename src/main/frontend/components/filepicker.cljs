(ns frontend.components.filepicker
  "File picker"
  (:require [cljs-drag-n-drop.core :as dnd]
            [frontend.context.i18n :refer [t]]
            [goog.dom :as gdom]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [io.factorhouse.hsx.core :as hsx]))

(hsx/defc picker
  [{:keys [on-change]}]
  (assert (fn? on-change))
  (let [*input (hooks/use-ref nil)]
    (hooks/use-effect!
     (fn []
       (let [element (gdom/getElement "filepicker")]
         (when element
           (dnd/subscribe!
            element
            :upload-files
            {:drop (fn [e files]
                     (on-change e files))}))
         (when element
           #(dnd/unsubscribe! element :upload-files))))
     [on-change])
    [:div#filepicker.border.border-dashed
     {:on-click (fn [] (.click (hooks/deref *input)))}
     [:div.relative.flex.flex-col.gap-6.overflow-hidden
      [:div {:tabIndex 0
             :class "group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition hover:bg-muted/25 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"}
       [:input.hidden
        {:ref #(hooks/set-ref! *input %)
         :tabIndex -1
         :multiple true
         :type "file"
         :on-change (fn [e]
                      (let [files (array-seq (.-files (.-target e)))]
                        (on-change e files)))}]
       [:div {:class "flex flex-col items-center justify-center gap-4 sm:px-5"}
        [:div {:class "rounded-full border border-dashed p-3"}
         (shui/tabler-icon "upload" {:class "!block text-muted-foreground"
                                     :style {:width 28
                                             :height 28}})]
        [:div {:class "flex flex-col gap-px"}
         [:div {:class "font-medium text-muted-foreground"}
          (t :asset/drop-hint)]]]]]]))
