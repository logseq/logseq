(ns frontend.components.filepicker
  "File picker"
  (:require [rum.core :as rum]
            [logseq.shui.ui :as shui]
            [cljs-drag-n-drop.core :as dnd]
            [goog.dom :as gdom]))

(rum/defcs picker <
  (rum/local nil ::input)
  {:did-mount (fn [state]
                (let [on-change (:on-change (first (:rum/args state)))]
                  (when-let [element (gdom/getElement "filepicker")]
                    (dnd/subscribe!
                     element
                     :upload-files
                     {:drop (fn [e files]
                              (on-change e files))})))
                state)
   :will-unmount (fn [state]
                   (when-let [el (gdom/getElement "filepicker")]
                     (dnd/unsubscribe! el :upload-files))
                   state)}
  [state {:keys [on-change]}]
  (assert (fn? on-change))
  (let [*input (::input state)]
    [:div#filepicker.border.border-dashed
     {:on-click (fn [] (.click @*input))}
     [:div.relative.flex.flex-col.gap-6.overflow-hidden
      [:div {:tabIndex 0
             :class "group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition hover:bg-muted/25 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"}
       [:input.hidden
        {:ref #(reset! *input %)
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
          "Drag 'n' drop files here, or click to select files"]]]]]]))
