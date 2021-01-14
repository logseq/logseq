(ns frontend.components.project
  (:require [rum.core :as rum]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.handler.project :as project-handler]
            [frontend.handler.config :as config-handler]
            [clojure.string :as string]))

(rum/defcs add-project <
  (rum/local "" ::project)
  [state close-fn]
  (let [project (get state ::project)]
    [:div
     [:div.sm:flex.sm:items-start
      [:div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-red-100.sm:mx-0.sm:h-10.sm:w-10
       [:svg.h-6.w-6.text-red-600
        {:stroke "currentColor", :view-box "0 0 24 24", :fill "none"}
        [:path
         {:d
          "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
          :stroke-width "2",
          :stroke-linejoin "round",
          :stroke-linecap "round"}]]]
      [:div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left
       [:h3#modal-headline.text-lg.leading-6.font-medium.text-gray-900
        "Setup a public project on Logseq"]
       [:div.mt-2
        [:p.text-sm.leading-5.text-gray-500
         "All published pages will be located under "
         [:b "/project/"]
         "."]]]]

     [:input.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
      {:auto-focus true
       :style {:color "#000"}
       :on-change (fn [e]
                    (reset! project (util/evalue e)))}]

     [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
      [:span.flex.w-full.rounded-md.shadow-sm.sm:ml-3.sm:w-auto
       [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
        {:type "button"
         :on-click (fn []
                     (let [value @project]
                       (when (and value (>= (count value) 2))
                         (project-handler/add-project! value
                                                       config-handler/set-project!))))}
        "Submit"]]
      [:span.mt-3.flex.w-full.rounded-md.shadow-sm.sm:mt-0.sm:w-auto
       [:button.inline-flex.justify-center.w-full.rounded-md.border.border-gray-300.px-4.py-2.bg-white.text-base.leading-6.font-medium.text-gray-700.shadow-sm.hover:text-gray-500.focus:outline-none.focus:border-blue-300.focus:shadow-outline-blue.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
        {:type "button"
         :on-click close-fn}
        "Cancel"]]]]))
