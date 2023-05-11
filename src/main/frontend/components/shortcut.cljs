(ns frontend.components.shortcut
  (:require [clojure.string :as str]
            [frontend.context.i18n :refer [t]]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.modules.shortcut.data-helper :as dh]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.extensions.latex :as latex]
            [frontend.extensions.highlight :as highlight]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [rum.core :as rum]))

(rum/defcs customize-shortcut-dialog-inner <
  (rum/local "")
  (shortcut/record!)
  [state k action-name current-binding]
  (let [keypress (:rum/local state)
        keyboard-shortcut (if (= "" @keypress) current-binding @keypress)]
    [:div
     [:div
      [:p.mb-4 "Press any sequence of keys to set the shortcut for the " [:b action-name] " action."]
      [:p.mb-4.mt-4
       (ui/render-keyboard-shortcut (-> keyboard-shortcut
                                        (str/trim)
                                        (str/lower-case)
                                        (str/split  #" |\+")))
       " "
       [:a.text-sm
        {:style {:margin-left "12px"}
         :on-click (fn []
                     (dh/remove-shortcut k)
                     (shortcut/refresh!)
                     (swap! keypress (fn [] "")) ;; Clear local state
                     )}
        "Reset"]]]
     [:div.cancel-save-buttons.text-right.mt-4
      (ui/button "Save" :on-click state/close-modal!)
      [:a.ml-4
       {:on-click (fn []
                    (reset! keypress (dh/binding-for-storage current-binding))
                    (state/close-modal!))} "Cancel"]]]))

(defn customize-shortcut-dialog [k action-name displayed-binding]
  (fn [_]
    (customize-shortcut-dialog-inner k action-name displayed-binding)))

(rum/defc shortcut-col [k binding configurable? action-name]
  (let [conflict?         (dh/potential-conflict? k)
        displayed-binding (dh/binding-for-display k binding)
        disabled?         (str/includes? displayed-binding "system default")]
    (if (not configurable?)
      [:td.text-right displayed-binding]
      [:td.text-right
       (ui/button
        displayed-binding
        :class "text-sm p-1"
        :style {:cursor (if disabled? "not-allowed" "pointer")}
        :title (if conflict?
                 "Shortcut conflict!"
                 (if disabled? "Cannot override system default" "Click to modify"))
        :background (if conflict? "pink" (when disabled? "gray"))
        :on-click (when-not disabled?
                    #(state/set-modal! (customize-shortcut-dialog k action-name displayed-binding))))])))

(rum/defc shortcut-table < rum/reactive
  ([name]
   (shortcut-table name false))
  ([name configurable?]
   (let [shortcut-config (rum/cursor-in
                          state/state
                          [:config (state/get-current-repo) :shortcuts])
         _ (rum/react shortcut-config)]
     [:div
      [:table
       [:thead
        [:tr
         [:th.text-left [:b (t name)]]
         [:th.text-right]]]
       [:tbody
        (map (fn [[k {:keys [binding]}]]
               [:tr {:key (str k)}
                [:td.text-left (t (dh/decorate-namespace k))]
                (shortcut-col k binding configurable? (t (dh/decorate-namespace k)))])
          (dh/binding-by-category name))]]])))

(rum/defc trigger-table []
  [:table
   [:thead
    [:tr
     [:th.text-left [:b (t :help/shortcuts-triggers)]]
     [:th.text-right [:b (t :help/shortcut)]]]]
   [:tbody
    [:tr
     [:td.text-left (t :help/slash-autocomplete)]
     [:td.text-right [:code "/"]]]
    [:tr
     [:td.text-left (t :help/block-content-autocomplete)]
     [:td.text-right [:code "<"]]]
    [:tr
     [:td.text-left (t :help/reference-autocomplete)]
     [:td.text-right [:code page-ref/left-and-right-brackets]]]
    [:tr
     [:td.text-left (t :help/block-reference)]
     [:td.text-right [:code block-ref/left-and-right-parens]]]
    [:tr
     [:td.text-left (t :help/open-link-in-sidebar)]
     [:td.text-right (ui/render-keyboard-shortcut ["shift" "click"])]]
    [:tr
     [:td.text-left (t :help/context-menu)]
     [:td.text-right (ui/render-keyboard-shortcut ["right" "click"])]]]])

(defn markdown-and-orgmode-syntax []
  (let [list [:bold :italics :del :mark :latex :code :link :pre :img]

        preferred-format (state/get-preferred-format) ; markdown/org

        title (case preferred-format
                :markdown (t :help/markdown-syntax)
                :org (t :help/org-mode-syntax))

        learn-more (case preferred-format
                     :markdown "https://www.markdownguide.org/basic-syntax"
                     :org "https://orgmode.org/worg/dev/org-syntax.html")

        raw (case preferred-format
              :markdown {:bold (str "**" (t :bold) "**")
                         :italics (str "_" (t :italics) "_")
                         :link "[Link](https://www.example.com)"
                         :del (str "~~" (t :strikethrough) "~~")
                         :mark (str "^^" (t :highlight) "^^")
                         :latex "$$E = mc^2$$"
                         :code (str "`" (t :code) "`")
                         :pre "```clojure\n  (println \"Hello world!\")\n```"
                         :img "![image](https://asset.logseq.com/static/img/logo.png)"}
              :org {:bold (str "*" (t :bold) "*")
                    :italics (str "/" (t :italics) "/")
                    :del (str "+" (t :strikethrough) "+")
                    :pre [:pre "#+BEGIN_SRC clojure\n  (println \"Hello world!\")\n#+END_SRC"]
                    :link "[[https://www.example.com][Link]]"
                    :mark (str "^^" (t :highlight) "^^")
                    :latex "$$E = mc^2$$"
                    :code "~Code~"
                    :img "[[https://asset.logseq.com/static/img/logo.png][image]]"})

        rendered {:italics [:i (t :italics)]
                  :bold [:b (t :bold)]
                  :link [:a {:href "https://www.example.com"} "Link"]
                  :del [:del (t :strikethrough)]
                  :mark [:mark (t :highlight)]
                  :latex (latex/latex "help-latex" "E = mc^2" true false)
                  :code [:code (t :code)]
                  :pre (highlight/highlight "help-highlight" {:data-lang "clojure"} "(println \"Hello world!\")")
                  :img [:img {:style {:float "right" :width 32 :height 32}
                              :src "https://asset.logseq.com/static/img/logo.png"
                              :alt "image"}]}]

    [:table
     [:thead
      [:tr
       [:th.text-left [:b title]]
       [:th.text-right [:a {:href learn-more} "Learn more →"]]]]
     [:tbody
      (map (fn [name]
             [:tr
              [:td.text-left [(if (= :pre name) :pre :code) (get raw name)]]
              [:td.text-right (get rendered name)]])
        list)]]))

(rum/defc shortcut
  [{:keys [show-title?]
    :or {show-title? true}}]
  [:div
   (when show-title? [:h1.title (t :help/shortcut-page-title)])
   (trigger-table)
   (markdown-and-orgmode-syntax)
   (shortcut-table :shortcut.category/basics true)
   (shortcut-table :shortcut.category/navigating true)
   (shortcut-table :shortcut.category/block-editing true)
   (shortcut-table :shortcut.category/block-command-editing true)
   (shortcut-table :shortcut.category/block-selection true)
   (shortcut-table :shortcut.category/formatting true)
   (shortcut-table :shortcut.category/toggle true)
   (when (state/enable-whiteboards?) (shortcut-table :shortcut.category/whiteboard true))
   (shortcut-table :shortcut.category/others true)])
