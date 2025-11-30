(ns frontend.components.onboarding.setup-wizard
  "Setup wizard for DB graph configuration"
  (:require [clojure.string :as string]
            [frontend.components.onboarding.shared :as shared]
            [frontend.state :as state]
            [frontend.rum :as frum]
            [frontend.ui :as ui]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defc setup-wizard
  []
  (let [[current-step _] (frum/use-atom-in state/state [:onboarding/current-step])
        [wizard-path _] (frum/use-atom-in state/state [:onboarding/wizard-path])
        [entry-point _] (frum/use-atom-in state/state [:onboarding/entry-point])
        [selected-path set-selected-path!] (hooks/use-state nil)
        [graph-name set-graph-name!] (hooks/use-state "")
        [backup-frequency set-backup-frequency!] (hooks/use-state "daily")
        [enable-sync? set-enable-sync!] (hooks/use-state false)
        [selected-templates set-selected-templates!] (hooks/use-state #{"#Person" "#Meeting" "#Book"})
        [template-translations set-template-translations!] (hooks/use-state {"#Person" "Person" "#Meeting" "Meeting" "#Book" "Book"})
        [import-progress set-import-progress!] (hooks/use-state 0)]
    
    (hooks/use-effect!
     (fn []
       (when (and (>= current-step 6)
                  (not= entry-point "none"))
         (shui/dialog-open!
          (fn []
         (cond
           ;; Step 0: Choose path
           (nil? wizard-path)
           [:div.cp__onboarding-setup-wizard.p-6
            {:style {:max-width "600px"}}
            
            [:h2.text-2xl.font-bold.mb-4
             "How do you want to start with Logseq DB?"]
            
           [:div.space-y-4.mb-6
            [:label.flex.items-center.p-4.border.rounded-lg.cursor-pointer
              {:class (when (= selected-path "import") "border-primary bg-primary/10")}
              [:input.mr-3
               {:type "radio"
                :name "wizard-path"
                :checked (= selected-path "import")
                :on-change #(set-selected-path! "import")}]
              [:div
               [:div.font-semibold "Import existing Markdown graph"]
               [:div.text-sm.opacity-60 "Bring your existing Logseq Markdown graph into DB format."]]]
            
            [:label.flex.items-center.p-4.border.rounded-lg.cursor-pointer
              {:class (when (= selected-path "create_new") "border-primary bg-primary/10")}
              [:input.mr-3
               {:type "radio"
                :name "wizard-path"
                :checked (= selected-path "create_new")
                :on-change #(set-selected-path! "create_new")}]
              [:div
               [:div.font-semibold "Create a new DB graph"]
               [:div.text-sm.opacity-60 "Start fresh with a new database graph."]]]]
            
            [:div.flex.justify-end
             (ui/button
              "Continue"
              :disabled (nil? selected-path)
              :on-click (fn []
                         (state/set-onboarding-wizard-path! selected-path)
                         (if (= selected-path "import")
                           (state/set-onboarding-current-step! 6)
                           (state/set-onboarding-current-step! 10))))])
           
           ;; Path A: Import Markdown
           (= wizard-path "import")
           (cond
             ;; Step 1: Folder picker
             (= current-step 6)
             [:div.cp__onboarding-setup-wizard.p-6
              {:style {:max-width "600px"}}
              
              [:h2.text-2xl.font-bold.mb-4
               "Select your Markdown graph"]
              
              [:p.text-sm.opacity-70.mb-4
               "Choose the folder containing your existing Logseq Markdown graph."]
              
              [:div.mb-6.p-4.border.rounded-lg.bg-gray-50.dark:bg-gray-900
               {:style {:min-height "150px"
                        :display "flex"
                        :align-items "center"
                        :justify-content "center"}}
               (ui/button
                "Choose folder"
                :intent "logseq"
                :on-click (fn []
                           ;; Simulated folder picker
                           (js/setTimeout
                            (fn []
                             (state/set-onboarding-current-step! 7))
                            500)))]
              
              [:div.flex.justify-between
               (ui/button
                "Back"
                :intent "logseq"
                :on-click (fn []
                           (state/set-onboarding-wizard-path! nil)
                           (state/set-onboarding-current-step! 5)))
               
               (ui/button
                "Continue"
                :disabled true
                :on-click (fn []
                           (state/set-onboarding-current-step! 7)))]]
             
             ;; Step 2: Mapping preview
             (= current-step 7)
             [:div.cp__onboarding-setup-wizard.p-6
              {:style {:max-width "600px"}}
              
              [:h2.text-2xl.font-bold.mb-4
               "Review tag mapping"]
              
              [:p.text-sm.opacity-70.mb-4
               "We found these hashtags in your graph. They can become tag classes with properties."]
              
              [:div.mb-6.space-y-2
               [:div.p-3.border.rounded
                [:div.font-semibold "#book"] " → Will create Book class"]
               [:div.p-3.border.rounded
                [:div.font-semibold "#person"] " → Will create Person class"]
               [:div.p-3.border.rounded
                [:div.font-semibold "#meeting"] " → Will create Meeting class"]
               [:div.p-3.border.rounded.opacity-50
                [:div.font-semibold "#project"] " → Will remain as tag (no class)"]]
              
              [:div.flex.justify-between
               (ui/button
                "Back"
                :intent "logseq"
                :on-click (fn []
                           (state/set-onboarding-current-step! 6)))
               
               (ui/button
                "Start import"
                :on-click (fn []
                           (state/set-onboarding-current-step! 8)))]]
             
             ;; Step 3: Progress bar
             (= current-step 8)
             (do
               (when (zero? import-progress)
                 (js/setTimeout
                  (fn []
                    (let [simulate-progress
                          (fn simulate-progress [progress]
                            (if (< progress 1.0)
                              (let [next-progress (min 1.0 (+ progress 0.05))]
                                (set-import-progress! next-progress)
                                (js/setTimeout #(simulate-progress next-progress) 200))
                              (set-import-progress! 1.0)))]
                      (simulate-progress 0.05)))
                  100))
               [:div.cp__onboarding-setup-wizard.p-6
                {:style {:max-width "600px"}}
                
                [:h2.text-2xl.font-bold.mb-4
                 "Importing your graph..."]
                
                [:div.mb-6
                 [:div.w-full.bg-gray-200.rounded-full.h-2.5.dark:bg-gray-700.mb-2
                  [:div.bg-primary.h-2.5.rounded-full
                   {:style {:width (str (* import-progress 100) "%")
                            :transition "width 0.3s"}}]]
                 [:p.text-sm.opacity-70.text-center
                  (str "Processing files... " (int (* import-progress 100)) "%")]]
                
                (when (>= import-progress 1.0)
                  [:div.flex.justify-end
                   (ui/button
                    "Continue"
                    :on-click (fn []
                               (state/set-onboarding-current-step! 9)))])])
             
             ;; Step 4: Import complete
             (= current-step 9)
             [:div.cp__onboarding-setup-wizard.p-6
              {:style {:max-width "600px"}}
              
              [:h2.text-2xl.font-bold.mb-4
               "Import complete!"]
              
              [:div.mb-6.space-y-2
               [:p "Successfully imported your graph."]
               [:ul.list-disc.list-inside.space-y-1.text-sm.opacity-70
                [:li "127 pages imported"]
                [:li "523 blocks imported"]
                [:li "3 tag classes created"]
                [:li "No errors found"]]]
              
              [:div.flex.justify-end
               (ui/button
                "Open my graph"
                :on-click (fn []
                           (state/set-onboarding-status! "completed")
                           (state/reset-onboarding-state!)
                           (shui/dialog-close!)))]]))
           
           ;; Path B: Create New Graph
           (= wizard-path "create_new")
           (cond
             ;; Step 1: Graph name, location, backup, sync
             (= current-step 10)
             [:div.cp__onboarding-setup-wizard.p-6
              {:style {:max-width "600px"}}
              
              [:h2.text-2xl.font-bold.mb-4
               "Configure your new graph"]
              
              [:div.space-y-4.mb-6
               [:div
                [:label.block.text-sm.font-medium.mb-2
                 "Graph name"]
                [:input.w-full.p-2.border.rounded
                 {:type "text"
                  :placeholder "My Knowledge Graph"
                  :value graph-name
                  :on-change #(set-graph-name! (.. % -target -value))}]]
               
               [:div
                [:label.block.text-sm.font-medium.mb-2
                 "Backup location"]
                [:p.text-sm.opacity-70.mb-2
                 "Backups will be stored in: ~/Logseq/Backups"]
                
                [:div.mt-2
                 [:label.block.text-sm.font-medium.mb-2
                  "Backup frequency"]
                [:select.w-full.p-2.border.rounded
                  {:value backup-frequency
                   :on-change #(set-backup-frequency! (.. % -target -value))}
                  [:option {:value "daily"} "Daily"]
                  [:option {:value "weekly"} "Weekly"]
                  [:option {:value "monthly"} "Monthly"]]]
                
                [:div.mt-4.flex.items-center
                 [:input.mr-2
                  {:type "checkbox"
                   :checked enable-sync?
                   :on-change #(set-enable-sync! (.. % -target -checked))}]
                 [:label.text-sm
                  "Enable sync (Realtime Collaboration/End-to-end encrypted)"]]
                
                [:p.text-xs.opacity-50.mt-1
                 "Make this graph available on multiple devices"]]]
              
              [:div.flex.justify-between
               (ui/button
                "Back"
                :intent "logseq"
                :on-click (fn []
                           (state/set-onboarding-wizard-path! nil)
                           (state/set-onboarding-current-step! 5)))
               
               (ui/button
                "Continue"
                :disabled (string/blank? graph-name)
                :on-click (fn []
                           (state/set-onboarding-current-step! 11)))]]
             
             ;; Step 2: Tag/property templates selection
             (= current-step 11)
             [:div.cp__onboarding-setup-wizard.p-6
              {:style {:max-width "600px"}}
              
              [:h2.text-2xl.font-bold.mb-4
               "Choose tag templates"]
              
              [:p.text-sm.opacity-70.mb-6
               "Select which tag templates to add to your graph. You can add more later."]
              
              [:div.space-y-3.mb-6
               (for [template shared/default-tag-templates]
                 [:label.flex.items-start.p-4.border.rounded-lg.cursor-pointer
                  {:key (:tag template)
                   :class (when (contains? selected-templates (:tag template))
                           "border-primary bg-primary/10")}
                  [:input.mr-3.mt-1
                   {:type "checkbox"
                    :checked (contains? selected-templates (:tag template))
                    :on-change (fn [e]
                                (let [checked (.. e -target -checked)]
                                  (set-selected-templates!
                                   (if checked
                                     #(conj % (:tag template))
                                     #(disj % (:tag template))))))}]
                  [:div.flex-1
                   [:div.font-semibold (:label template)]
                   [:div.text-xs.opacity-60.mt-1
                    "Properties: " (string/join ", " (:properties template))]
                   [:div.text-xs.opacity-50.mt-1
                    (:example template)]]])]
              
              [:div.flex.justify-between
               (ui/button
                "Back"
                :intent "logseq"
                :on-click (fn []
                           (state/set-onboarding-current-step! 10)))
               
               (ui/button
                "Continue"
                :on-click (fn []
                           (state/set-onboarding-current-step! 12)))]]
             
             ;; Step 3: Template translation
             (= current-step 12)
             [:div.cp__onboarding-setup-wizard.p-6
              {:style {:max-width "600px"}}
              
              [:h2.text-2xl.font-bold.mb-4
               "Customize tag names"]
              
              [:p.text-sm.opacity-70.mb-6
              "You can translate or rename the tag labels to your language."]
              
              [:div.space-y-4.mb-6
               (for [template (filter #(contains? selected-templates (:tag %))
                                     shared/default-tag-templates)]
                 [:div
                  {:key (:tag template)}
                  [:label.block.text-sm.font-medium.mb-2
                   (:tag template)]
                  [:input.w-full.p-2.border.rounded
                   {:type "text"
                    :value (get template-translations (:tag template) (:label template))
                    :on-change (fn [e]
                                (let [value (.. e -target -value)]
                                  (set-template-translations!
                                   #(assoc % (:tag template) value))))}])]
              
              [:div.flex.justify-between
               (ui/button
                "Back"
                :intent "logseq"
                :on-click (fn []
                           (state/set-onboarding-current-step! 11)))
               
               (ui/button
                "Continue"
                :on-click (fn []
                           (state/set-onboarding-current-step! 13)))]]
             
             ;; Step 4: Summary
             (= current-step 13)
             [:div.cp__onboarding-setup-wizard.p-6
              {:style {:max-width "600px"}}
              
              [:h2.text-2xl.font-bold.mb-4
               "You're ready to use Logseq DB!"]
              
              [:div.mb-6.space-y-3
               [:div
                [:strong "Graph name: "] graph-name]
               [:div
                [:strong "Backup frequency: "] (string/capitalize backup-frequency)]
               [:div
                [:strong "Sync enabled: "] (if enable-sync? "Yes" "No")]
               [:div
                [:strong "Tag templates: "] (count selected-templates)]]
              
              [:div.flex.justify-end
               (ui/button
                "Open my graph"
                :on-click (fn []
                           (state/set-onboarding-status! "completed")
                           (state/reset-onboarding-state!)
                           (shui/dialog-close!)))]]
             
             :else
             nil)))
       {:id :setup-wizard
        :close-btn? true
        :on-close (fn []
                   (state/reset-onboarding-state!))})))
     [current-step wizard-path entry-point])
    [:div {:style {:display "none"}}]))
