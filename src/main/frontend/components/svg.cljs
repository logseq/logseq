(ns frontend.components.svg
  (:require [rum.core :as rum]))

(rum/defc arrow-down
  []
  [:svg
   {:aria-hidden "true"
    :height      "16"
    :width       "10"
    :version     "1.1"
    :view-box    "0 0 10 16"
    :fill        "currentColor"
    :display     "inline-block"}
   [:path
    {:d         "M5 11L0 6l1.5-1.5L5 8.25 8.5 4.5 10 6l-5 5z"
     :fill-rule "evenodd"}]])

(rum/defc arrow-right-2
  []
  [:svg
   {:aria-hidden "true"
    :height      "16"
    :width       "10"
    :version     "1.1"
    :view-box    "0 0 10 16"
    :fill        "currentColor"
    :display     "inline-block"}
   [:path
    {:d         "M7.5 8l-5 5L1 11.5 4.75 8 1 4.5 2.5 3l5 5z"
     :fill-rule "evenodd"}]])

(rum/defc arrow-left
  []
  [:svg.w-6.h-6
   {:viewBox "0 0 24 24", :stroke "currentColor", :fill "none"}
   [:path
    {:d               "M15 19l-7-7 7-7",
     :stroke-width    "2",
     :stroke-linejoin "round",
     :stroke-linecap  "round"}]])

(rum/defc arrow-right
  []
  [:svg.w-6.h-6
   {:viewBox "0 0 24 24", :stroke "currentColor", :fill "none"}
   [:path
    {:d               "M9 5l7 7-7 7",
     :stroke-width    "2",
     :stroke-linejoin "round",
     :stroke-linecap  "round"}]])

(rum/defc big-arrow-right
  []
  [:svg
   {:fill "none", :view-box "0 0 24 24", :height "24", :width "24"}
   [:path
    {:stroke-linejoin "round"
     :stroke-linecap  "round"
     :stroke-width    "2"
     :stroke          "currentColor"
     :d               "M14 5L21 12M21 12L14 19M21 12L3 12"}]])

(rum/defc big-arrow-left
  []
  [:svg
   {:fill "none", :view-box "0 0 24 24", :height "24", :width "24"}
   [:path
    {:stroke-linejoin "round"
     :stroke-linecap  "round"
     :stroke-width    "2"
     :stroke          "currentColor"
     :d               "M10 19L3 12M3 12L10 5M3 12L21 12"}]])

(def arrow-narrow-left
  [:svg.h-6.w-6 {:xmlns "http://www.w3.org/2000/svg" :fill "none" :view-box "0 0 24 24" :stroke "currentColor"} [:path {:stroke-linecap "round" :stroke-linejoin "round" :stroke-width "2" :d "M7 16l-4-4m0 0l4-4m-4 4h18"}]])

(def arrow-narrow-right
  [:svg.h-6.w-6 {:xmlns "http://www.w3.org/2000/svg" :fill "none" :view-box "0 0 24 24" :stroke "currentColor"} [:path {:stroke-linecap "round" :stroke-linejoin "round" :stroke-width "2" :d "M17 8l4 4m0 0l-4 4m4-4H3"}]])

(defonce arrow-right-v2
         [:svg.h-3.w-3
          {:version  "1.1"
           :view-box "0 0 128 128"
           :fill     "currentColor"
           :display  "inline-block"
           :style    {:margin-top -3}}
          [:path
           {:d
            "M99.069 64.173c0 2.027-.77 4.054-2.316 5.6l-55.98 55.98a7.92 7.92 0 01-11.196 0c-3.085-3.086-3.092-8.105 0-11.196l50.382-50.382-50.382-50.382a7.92 7.92 0 010-11.195c3.086-3.085 8.104-3.092 11.196 0l55.98 55.98a7.892 7.892 0 012.316 5.595z"}]])

(defonce arrow-down-v2
         [:svg.h-3.w-3
          {:version  "1.1"
           :view-box "0 0 128 128"
           :fill     "currentColor"
           :display  "inline-block"
           :style    {:margin-top -3}}
          [:path
           {:d
            "M64.177 100.069a7.889 7.889 0 01-5.6-2.316l-55.98-55.98a7.92 7.92 0 010-11.196c3.086-3.085 8.105-3.092 11.196 0l50.382 50.382 50.382-50.382a7.92 7.92 0 0111.195 0c3.086 3.086 3.092 8.104 0 11.196l-55.98 55.98a7.892 7.892 0 01-5.595 2.316z"}]])

(defonce loading
         [:svg.h-5.w-5.animate-spin
          {:version  "1.1"
           :view-box "0 0 24 24"
           :fill     "none"
           :display  "inline-block"}
          [:circle.opacity-25 {:cx 12 :cy 12 :r 10 :stroke "currentColor" :stroke-width 4}]
          [:path.opacity-75 {:fill "currentColor"
                             :d    "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"}]])

(defonce minus
         [:svg.w-6.h-6
          {:viewBox "0 0 24 24", :stroke "currentColor", :fill "none"}
          [:path
           {:d               "M20 12H4"
            :stroke-width    "2"
            :stroke-linejoin "round"
            :stroke-linecap  "round"}]])

(defonce rectangle
         [:svg.w-6.h-6
          {:viewBox "0 0 24 24", :stroke "currentColor", :fill "none"}
          [:path
           {:d            "M3.16580358,18.5038125 L20.5529464,18.5038125 C22.6525178,18.5038125 23.7072321,17.4593839 23.7072321,15.3902411 L23.7072321,3.12495537 C23.7072321,1.0558125 22.6525178,0.0113839219 20.5529464,0.0113839219 L3.16580358,0.0113839219 C1.07651787,0.0118125 0.0115178672,1.04638392 0.0115178672,3.12495537 L0.0115178672,15.3906696 C0.0115178672,17.4696696 1.07651787,18.5042411 3.16580358,18.5042411 L3.16580358,18.5038125 Z M3.19580358,16.8868125 C2.19123216,16.8868125 1.62894642,16.3545268 1.62894642,15.3096696 L1.62894642,3.20638392 C1.62894642,2.16152679 2.19123213,1.62924108 3.19580358,1.62924108 L20.5229464,1.62924108 C21.5172321,1.62924108 22.0898036,2.16152679 22.0898036,3.20638392 L22.0898036,15.3092411 C22.0898036,16.3540982 21.5172322,16.8863839 20.5229464,16.8863839 L3.19580358,16.8868125 Z"
            :stroke-width "2"}]])

(defn- hero-icon
  ([d]
   (hero-icon d {}))
  ([d options]
   [:svg (merge {:fill "currentColor", :viewBox "0 0 24 24", :height "24", :width "24"}
                options)
    [:path
     {:stroke-linejoin "round"
      :stroke-linecap  "round"
      :stroke-width    "2"
      :stroke          "currentColor"
      :d               d}]]))

(def refresh
  (hero-icon "M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15"
             {:fill "none"}))

(def user
  [:svg
   {:stroke-linejoin "round"
    :stroke-linecap  "round"
    :fill            "none"
    :stroke          "currentColor"
    :stroke-width    "2"
    :view-box        "0 0 24 24"
    :height          "24"
    :width           "24"}
   [:path {:d "M0 0h24v24H0z", :stroke "none"}]
   [:circle {:r "4", :cy "7", :cx "12"}]
   [:path {:d "M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"}]])

(def close (hero-icon "M6 18L18 6M6 6L18 18"))
(def plus (hero-icon "M12 4v16m8-8H4"))

(def plus-circle
  [:svg.add-button
   {:viewBox "0 0 20 20"}
   [:circle.circle {:fill "#dce0e2", :r "9", :cy "10.5", :cx "10.5"}]
   [:line
    {:stroke-width "1"
     :stroke       "#868c90"
     :y2           "10.5"
     :x2           "15"
     :y1           "10.5"
     :x1           "6"}]
   [:line
    {:stroke-width "1"
     :stroke       "#868c90"
     :y2           "15"
     :x2           "10.5"
     :y1           "6"
     :x1           "10.5"}]])

(def graph-sm [:div {:style {:transform "rotate(90deg)"}} (hero-icon "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" {:height "16" :width "16"})])

(def folder-add
  [:svg
   {:stroke "currentColor", :view-box "0 0 24 24", :fill "none" :width 24 :height 24 :display "inline-block"}
   [:path
    {:d
                      "M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
     :stroke-width    "2"
     :stroke-linejoin "round"
     :stroke-linecap  "round"}]])

(def folder-add-large
  [:svg
   {:stroke "currentColor", :view-box "0 0 24 24", :fill "none" :width 64 :height 64 :display "inline-block"}
   [:path
    {:d
                      "M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
     :stroke-width    "2"
     :stroke-linejoin "round"
     :stroke-linecap  "round"}]])

(def folder (hero-icon "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"))
(def folder-sm (hero-icon "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" {:height "16" :width "16"}))
(def pages-sm [:svg {:viewBox "0 0 20 20", :fill "currentColor", :height "16", :width "16"}
               [:path {:d "M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z"}]
               [:path {:d "M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"}]])
(def repos-sm [:svg {:viewBox "0 0 20 20", :fill "currentColor", :height "16", :width "16"}
               [:path {:d "M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z"}]
               [:path {:d "M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z"}]
               [:path {:d "M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z"}]])
(def settings-sm [:svg {:viewBox "0 0 20 20", :fill "currentColor", :height "20", :width "20"}
                  [:path {:fill-rule "evenodd", :d "M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z", :clip-rule "evenodd"}]])
(def calendar-sm [:svg {:viewBox "0 0 20 20", :fill "currentColor", :height "16", :width "16"}
                  [:path {:fill-rule "evenodd", :d "M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z", :clip-rule "evenodd"}]])
(def import-sm [:svg {:viewBox "0 0 20 20", :fill "currentColor", :height "16", :width "16"}
                [:path {:fill-rule "evenodd", :d "M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z", :clip-rule "evenodd"}]])
(def logout-sm [:svg {:viewBox "0 0 20 20", :fill "currentColor", :height "18", :width "18"}
                [:path {:fill-rule "evenodd", :d "M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z", :clip-rule "evenodd"}]])
(def trash-sm [:svg {:viewBox "0 0 20 20", :fill "currentColor", :height "16", :width "16"}
               [:path {:fill-rule "evenodd", :d "M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z", :clip-rule "evenodd"}]])
(def sort-asc-sm [:svg {:viewBox "0 0 16 16", :fill "currentColor"}
                  [:path {:d "M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z"}]])
(defn vertical-dots
  [options]
  (hero-icon "M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" options))

(defn horizontal-dots
  [options]
  (hero-icon "M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" options))

(def external-link
  [:svg {:fill   "none", :view-box "0 0 24 24", :height "21", :width "21"
         :stroke "currentColor"}
   [:path
    {:stroke-linejoin "round"
     :stroke-linecap  "round"
     :stroke-width    "2"
     :d               "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"}]])
(def save
  [:svg
   {:fill "currentColor", :view-box "0 0 448 512", :height "24", :width "24"}
   [:path
    {:stroke-linejoin "round"
     :stroke-linecap  "round"
     :stroke-width    "2"
     :stroke          "currentColor"
     :d               "M433.941 129.941l-83.882-83.882A48 48 0 0 0 316.118 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V163.882a48 48 0 0 0-14.059-33.941zM224 416c-35.346 0-64-28.654-64-64 0-35.346 28.654-64 64-64s64 28.654 64 64c0 35.346-28.654 64-64 64zm96-304.52V212c0 6.627-5.373 12-12 12H76c-6.627 0-12-5.373-12-12V108c0-6.627 5.373-12 12-12h228.52c3.183 0 6.235 1.264 8.485 3.515l3.48 3.48A11.996 11.996 0 0 1 320 111.48z"}]])

(rum/defc note
  []
  [:svg.h-8.w-8.svg-shadow.note
   {:view-box "0 0 512 512"
    :fill     "currentColor"}
   [:path
    {:d
     "M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"}]])

(rum/defc tip
  []
  [:svg.h-8.w-8.tip
   {:view-box "0 0 352 512"
    :fill     "currentColor"}
   [:path
    {:d
     "M96.06 454.35c.01 6.29 1.87 12.45 5.36 17.69l17.09 25.69a31.99 31.99 0 0 0 26.64 14.28h61.71a31.99 31.99 0 0 0 26.64-14.28l17.09-25.69a31.989 31.989 0 0 0 5.36-17.69l.04-38.35H96.01l.05 38.35zM0 176c0 44.37 16.45 84.85 43.56 115.78 16.52 18.85 42.36 58.23 52.21 91.45.04.26.07.52.11.78h160.24c.04-.26.07-.51.11-.78 9.85-33.22 35.69-72.6 52.21-91.45C335.55 260.85 352 220.37 352 176 352 78.61 272.91-.3 175.45 0 73.44.31 0 82.97 0 176zm176-80c-44.11 0-80 35.89-80 80 0 8.84-7.16 16-16 16s-16-7.16-16-16c0-61.76 50.24-112 112-112 8.84 0 16 7.16 16 16s-7.16 16-16 16z"}]])

(rum/defc important
  []
  [:svg.h-8.w-8.svg-shadow.important
   {:view-box "0 0 512 512"
    :fill     "currentColor"
    :color    "#bf0000"}
   [:path
    {:d
     "M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zm-248 50c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"}]])

(rum/defc caution
  []
  [:svg.h-8.w-8.svg-shadow.caution
   {:view-box "0 0 384 512"
    :fill     "currentColor"
    :color    "#bf3400"}
   [:path
    {:d
     "M216 23.86c0-23.8-30.65-32.77-44.15-13.04C48 191.85 224 200 224 288c0 35.63-29.11 64.46-64.85 63.99-35.17-.45-63.15-29.77-63.15-64.94v-85.51c0-21.7-26.47-32.23-41.43-16.5C27.8 213.16 0 261.33 0 320c0 105.87 86.13 192 192 192s192-86.13 192-192c0-170.29-168-193-168-296.14z"}]])

(defn warning
  ([]
   (warning nil))
  ([opts]
   [:svg.h-8.w-8.svg-shadow.warning
    (merge
      {:view-box "0 0 576 512"
       :fill     "currentColor"
       :color    "#bf6900"}
      opts)
    [:path
     {:d
      "M569.517 440.013C587.975 472.007 564.806 512 527.94 512H48.054c-36.937 0-59.999-40.055-41.577-71.987L246.423 23.985c18.467-32.009 64.72-31.951 83.154 0l239.94 416.028zM288 354c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"}]]))

(rum/defc pinned
  []
  [:svg.h-8.w-8.pinned
   {:view-box "0 0 352 512"
    :fill     "currentColor"}
   [:path
    {:d
     "M322.397,252.352l75.068-75.067c19.346,5.06,40.078,3.441,58.536-4.873L339.589,56c-8.313,18.458-9.933,39.189-4.873,58.536
        l-75.066,75.067c-35.168-16.745-76.173-17.14-111.618-1.176l65.009,65.01L55.999,456l202.563-157.041l65.01,65.01
        C339.535,328.526,339.142,287.519,322.397,252.352z M201.513,216.553c0,0-16.568-16.568-21.323-21.035
        c37.027-10.806,61.375,4.323,61.375,4.323C218.946,192.781,201.513,216.553,201.513,216.553z"}]])


(rum/defc caret-up
  []
  [:svg.h-4.w-4
   {:aria-hidden "true"
    :version     "1.1"
    :view-box    "0 0 320 512"
    :fill        "currentColor"
    :display     "inline-block"}
   [:path {:d "M288.662 352H31.338c-17.818 0-26.741-21.543-14.142-34.142l128.662-128.662c7.81-7.81 20.474-7.81 28.284 0l128.662 128.662c12.6 12.599 3.676 34.142-14.142 34.142z"}]])


(rum/defc caret-down
  []
  [:svg.h-4.w-4
   {:aria-hidden "true"
    :version     "1.1"
    :view-box    "0 0 192 512"
    :fill        "currentColor"
    :display     "inline-block"}
   [:path
    {:d         "M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z"
     :fill-rule "evenodd"}]])

(rum/defc caret-right
  []
  [:svg.h-4.w-4
   {:aria-hidden "true"
    :version     "1.1"
    :view-box    "0 0 192 512"
    :fill        "currentColor"
    :display     "inline-block"
    :style       {:margin-left 2}}
   [:path
    {:d         "M0 384.662V127.338c0-17.818 21.543-26.741 34.142-14.142l128.662 128.662c7.81 7.81 7.81 20.474 0 28.284L34.142 398.804C21.543 411.404 0 402.48 0 384.662z"
     :fill-rule "evenodd"}]])

(rum/defc menu
  [class]
  [:svg
   {:fill  "none", :view-box "0 0 20 20", :height "20", :width "20"
    :class class}
   [:path
    {:fill      "currentColor"
     :d
                "M3 5C3 4.44772 3.44772 4 4 4H16C16.5523 4 17 4.44772 17 5C17 5.55228 16.5523 6 16 6H4C3.44772 6 3 5.55228 3 5Z"
     :clip-rule "evenodd"
     :fill-rule "evenodd"}]
   [:path
    {:fill      "currentColor"
     :d
                "M3 10C3 9.44772 3.44772 9 4 9H16C16.5523 9 17 9.44772 17 10C17 10.5523 16.5523 11 16 11H4C3.44772 11 3 10.5523 3 10Z"
     :clip-rule "evenodd"
     :fill-rule "evenodd"}]
   [:path
    {:fill      "currentColor"
     :d
                "M3 15C3 14.4477 3.44772 14 4 14H16C16.5523 14 17 14.4477 17 15C17 15.5523 16.5523 16 16 16H4C3.44772 16 3 15.5523 3 15Z"
     :clip-rule "evenodd"
     :fill-rule "evenodd"}]])

(defn excalidraw-logo
  []
  [:svg
   {:preserve-aspect-ratio "xMidYMid meet"
    :view-box              "0 0 109.000000 269.000000"
    :height                24
    :width                 24
    :version               "1.0"
    :style                 {:display "inline"}}
   [:g
    {:stroke "none"
     :fill   "currentColor"
     :transform
             "translate(0.000000,269.000000) scale(0.100000,-0.100000)"}
    [:path
     {:d
      "M393 2643 c-74 -59 -188 -159 -278 -245 l-71 -67 13 -88 c7 -48 20 -142 28 -208 9 -66 18 -128 21 -137 4 -12 0 -18 -11 -18 -19 0 -20 5 32 -160 19 -63 37 -121 39 -127 2 -7 10 -10 19 -7 9 4 14 12 11 19 -3 8 2 16 10 19 11 4 10 12 -7 41 -27 45 -96 429 -100 553 -3 88 -3 89 34 139 36 49 119 123 247 217 36 27 72 57 82 67 15 18 22 13 148 -121 73 -77 154 -156 180 -176 l48 -36 -37 -78 c-20 -42 -101 -204 -181 -358 -167 -324 -133 -293 -327 -296 l-126 -1 -42 -48 c-44 -51 -50 -70 -29 -102 8 -11 14 -29 14 -40 0 -18 7 -21 47 -23 25 -1 48 -4 51 -7 3 -3 7 -65 10 -138 l4 -132 -67 -144 c-111 -240 -155 -350 -155 -386 0 -19 4 -35 8 -35 10 0 10 1 417 850 189 394 368 765 398 826 30 61 57 117 59 125 2 9 -67 78 -177 175 -99 88 -186 168 -194 177 -23 28 -57 19 -118 -30z m34 -1150 c-46 -89 -48 -90 -174 -96 -111 -6 -113 -5 -113 16 0 12 -4 28 -9 36 -6 9 -2 25 12 47 l22 34 100 0 c55 1 118 5 140 9 22 4 41 6 43 5 2 -1 -8 -24 -21 -51z m-84 -160 c-8 -21 -29 -65 -46 -98 -28 -56 -31 -58 -38 -35 -4 14 -7 55 -8 92 -1 73 -3 72 81 77 l27 1 -16 -37z"}]
    [:path
     {:d
      "M423 2405 c-18 -13 -23 -26 -23 -59 0 -39 3 -45 30 -56 27 -11 34 -10 65 11 41 28 42 35 12 80 -26 39 -52 46 -84 24z m57 -36 c16 -28 6 -49 -24 -49 -27 0 -39 27 -24 54 12 22 35 20 48 -5z"}]
    [:path
     {:d
      "M1050 2180 c0 -5 -6 -10 -13 -10 -6 0 -23 -28 -36 -62 -40 -104 -440 -895 -441 -870 0 13 -6 22 -16 22 -14 0 -16 -8 -10 -47 6 -45 2 -55 -140 -331 -80 -157 -166 -321 -191 -365 -26 -46 -46 -96 -48 -117 -3 -36 1 -41 88 -116 50 -44 114 -99 142 -124 126 -115 185 -161 201 -158 24 4 395 393 396 415 0 10 -18 162 -40 338 -38 300 -74 651 -70 685 3 21 -12 127 -23 173 -9 36 -5 51 67 215 42 97 97 216 121 264 23 48 43 90 43 93 0 3 -7 5 -15 5 -8 0 -15 -4 -15 -10z m-230 -747 c11 -70 33 -238 49 -373 31 -248 67 -523 77 -593 6 -35 2 -42 -63 -114 -113 -127 -233 -252 -274 -284 l-38 -30 -195 182 c-180 166 -195 183 -184 203 6 11 57 104 113 206 56 102 130 238 164 302 35 65 67 121 73 124 7 4 9 -97 7 -312 -4 -321 -3 -322 29 -315 4 0 7 162 7 359 l0 358 105 210 c58 116 106 209 108 208 2 -1 12 -60 22 -131z"}]]])

(rum/defc logo
  [dark?]
  [:svg
   {:fill (if dark? "currentColor" "#002B36"), :view-box "0 0 21 21", :height "21", :width "21"}
   [:ellipse
    {:transform
         "matrix(0.987073 0.160274 -0.239143 0.970984 11.7346 2.59206)"
     :ry "2.04373"
     :rx "3.29236"}]
   [:ellipse
    {:transform
         "matrix(-0.495846 0.868411 -0.825718 -0.564084 3.97209 5.54515)"
     :ry "3.37606"
     :rx "2.95326"}]
   [:ellipse
    {:transform
         "matrix(0.987073 0.160274 -0.239143 0.970984 13.0843 14.72)"
     :ry "6.13006"
     :rx "7.78547"}]])

(def discord
  [:svg
   {:view-box              "0 0 448 512"
    :height                15
    :width                 15
    :preserve-aspect-ratio "xMidYMid meet"
    :style
                           {"msTransform"     "rotate(360deg)"
                            "WebkitTransform" "rotate(360deg)"
                            "transform"       "rotate(360deg)"}
    :focusable             "false"
    :aria-hidden           "true"
    :fill                  "currentColor"}
   [:path
    {:d
     "M297.216 243.2c0 15.616-11.52 28.416-26.112 28.416c-14.336 0-26.112-12.8-26.112-28.416s11.52-28.416 26.112-28.416c14.592 0 26.112 12.8 26.112 28.416zm-119.552-28.416c-14.592 0-26.112 12.8-26.112 28.416s11.776 28.416 26.112 28.416c14.592 0 26.112-12.8 26.112-28.416c.256-15.616-11.52-28.416-26.112-28.416zM448 52.736V512c-64.494-56.994-43.868-38.128-118.784-107.776l13.568 47.36H52.48C23.552 451.584 0 428.032 0 398.848V52.736C0 23.552 23.552 0 52.48 0h343.04C424.448 0 448 23.552 448 52.736zm-72.96 242.688c0-82.432-36.864-149.248-36.864-149.248c-36.864-27.648-71.936-26.88-71.936-26.88l-3.584 4.096c43.52 13.312 63.744 32.512 63.744 32.512c-60.811-33.329-132.244-33.335-191.232-7.424c-9.472 4.352-15.104 7.424-15.104 7.424s21.248-20.224 67.328-33.536l-2.56-3.072s-35.072-.768-71.936 26.88c0 0-36.864 66.816-36.864 149.248c0 0 21.504 37.12 78.08 38.912c0 0 9.472-11.52 17.152-21.248c-32.512-9.728-44.8-30.208-44.8-30.208c3.766 2.636 9.976 6.053 10.496 6.4c43.21 24.198 104.588 32.126 159.744 8.96c8.96-3.328 18.944-8.192 29.44-15.104c0 0-12.8 20.992-46.336 30.464c7.68 9.728 16.896 20.736 16.896 20.736c56.576-1.792 78.336-38.912 78.336-38.912z"}]])

(def slideshow
  [:svg
   {:view-box "0 0 24 24"
    :height   24
    :width    24
    :fill     "currentColor"}
   [:path
    {:d "M10 8v8l5-4-5-4zm9-5H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"}]])

(def indent-block
  [:svg.h-6.w-6
   {:stroke "currentColor", :view-box "0 0 24 24", :fill "none"}
   [:path
    {:d               "M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
     :fill-rule       "evenodd"
     :clip-rule       "evenodd"
     :stroke-width    "2"
     :stroke-linejoin "round"
     :stroke-linecap  "round"}]
   [:path
    {:d               "M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
     :fill-rule       "evenodd"
     :clip-rule       "evenodd"
     :stroke-width    "2"
     :stroke-linejoin "round"
     :stroke-linecap  "round"}]])

(def outdent-block
  [:svg.h-6.w-6
   {:stroke "currentColor", :view-box "0 0 24 24", :fill "none"}
   [:path
    {:d               "M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z"
     :fill-rule       "evenodd"
     :clip-rule       "evenodd"
     :stroke-width    "2"
     :stroke-linejoin "round"
     :stroke-linecap  "round"}]])

(def move-up-block
  [:svg.h-6.w-6
   {:stroke "currentColor", :view-box "0 0 24 24", :fill "none"}
   [:path
    {:d               "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
     :fill-rule       "evenodd"
     :clip-rule       "evenodd"
     :stroke-width    "2"
     :stroke-linejoin "round"
     :stroke-linecap  "round"}]])

(def move-down-block
  [:svg.h-6.w-6
   {:stroke "currentColor", :view-box "0 0 24 24", :fill "none"}
   [:path
    {:d               "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
     :fill-rule       "evenodd"
     :clip-rule       "evenodd"
     :stroke-width    "2"
     :stroke-linejoin "round"
     :stroke-linecap  "round"}]])

(def multi-line-input
  [:svg.h-6.w-6
   {:stroke "currentColor", :view-box "0 0 24 24", :fill "none"}
   [:path
    {:d               "M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"
     :fill-rule       "evenodd"
     :clip-rule       "evenodd"
     :stroke-width    "2"
     :stroke-linejoin "round"
     :stroke-linecap  "round"}]])

(def checkbox
  [:svg.h-6.w-6
   {:stroke "currentColor", :view-box "0 0 24 24", :fill "none"}
   [:path
    {:d               "M11.167 16.167l-4.167-4.416 1.166-1.192 2.978 3.113 5.477-5.839 1.213 1.169-6.667 7.164zm9.167-12.5v16.667h-16.667v-16.667h16.667zm1.667-1.667h-20v20h20v-20z"
     :fill-rule       "evenodd"
     :clip-rule       "evenodd"
     :stroke-width    "2"
     :stroke-linejoin "round"
     :stroke-linecap  "round"}]])

(def page
  [:svg.h-5.w-4 {:viewBox "0 0 24 24", :fill "none", :xmlns "http://www.w3.org/2000/svg"}
   [:path {:d "M2 0.5H6.78272L13.5 7.69708V18C13.5 18.8284 12.8284 19.5 12 19.5H2C1.17157 19.5 0.5 18.8284 0.5 18V2C0.5 1.17157 1.17157 0.5 2 0.5Z", :fill "var(--ls-active-primary-color)"}]
   [:path {:d "M7 5.5V0L14 7.5H9C7.89543 7.5 7 6.60457 7 5.5Z", :fill "var(--ls-active-secondary-color)"}]])

(def clock
  [:svg.h-5.w-5
   {:fill "currentColor", :viewBox "0 0 20 20"}
   [:path
    {:clip-rule "evenodd",
     :d
     "M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z",
     :fill-rule "evenodd"}]])

(def online
  (hero-icon "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"))

(rum/defc filter-icon
  [class]
  [:svg
   {:stroke   "currentColor"
    :fill     "currentColor"
    :view-box "0 0 16.06 16.06"
    :width    "16"
    :height   "16"
    :class    class}
   [:path
    {:d "M.53.53h15l-5 7v8h-5v-8z" :stroke-width "1.06" :stroke-linejoin "round"}]])

(def collapse-right
  (hero-icon "M4 6h16M4 12h16m-7 6h7"))

(def search
  [:svg.h-5.w-5
   {:view-box "0 0 20 20", :fill "currentColor"}
   [:path
    {:d
                "M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
     :clip-rule "evenodd"
     :fill-rule "evenodd"}]])

(def edit
  [:svg.h-6.w-6
   {:stroke "currentColor", :view-box "0 0 24 24", :fill "none"}
   [:path
    {:d
                      "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
     :stroke-width    "2",
     :stroke-linejoin "round",
     :stroke-linecap  "round"}]])


(defn github
  ([] (github nil))
  ([opts]
   [:svg.icon
    (merge {:stroke  "currentColor"
            :fill    "currentColor"
            :viewBox "0 0 1024 1024"
            :width   "20"
            :height  "20"} opts)
    [:path {:d "M512 12.63616c-282.74688 0-512 229.21216-512 512 0 226.22208 146.69824 418.14016 350.12608 485.82656 25.57952 4.73088 35.00032-11.10016 35.00032-24.63744 0-12.20608-0.47104-52.55168-0.69632-95.31392-142.4384 30.96576-172.50304-60.416-172.50304-60.416-23.28576-59.16672-56.85248-74.91584-56.85248-74.91584-46.44864-31.78496 3.50208-31.1296 3.50208-31.1296 51.4048 3.60448 78.47936 52.75648 78.47936 52.75648 45.6704 78.27456 119.76704 55.64416 149.01248 42.55744 4.58752-33.09568 17.85856-55.68512 32.50176-68.46464-113.72544-12.94336-233.2672-56.85248-233.2672-253.0304 0-55.88992 20.00896-101.5808 52.75648-137.4208-5.3248-12.9024-22.85568-64.96256 4.95616-135.49568 0 0 43.008-13.74208 140.84096 52.49024 40.83712-11.34592 84.64384-17.03936 128.16384-17.24416 43.49952 0.2048 87.32672 5.87776 128.24576 17.24416 97.73056-66.2528 140.65664-52.49024 140.65664-52.49024 27.87328 70.53312 10.3424 122.59328 5.03808 135.49568 32.82944 35.86048 52.69504 81.53088 52.69504 137.4208 0 196.64896-119.78752 239.94368-233.79968 252.6208 18.37056 15.89248 34.73408 47.04256 34.73408 94.80192 0 68.5056-0.59392 123.63776-0.59392 140.51328 0 13.6192 9.216 29.5936 35.16416 24.576 203.32544-67.76832 349.83936-259.62496 349.83936-485.76512 0-282.78784-229.23264-512-512-512z"}]]))

(def git
  [:svg.icon.git {:width 24 :height 24 :viewbox "0 0 24 24" :stroke-width "2" :stroke "currentColor" :fill "none" :stroke-linecap "round" :stroke-linejoin "round"} [:path {:stroke "none" :d "M0 0h24v24H0z" :fill "none"}] [:circle {:cx "12" :cy "18" :r "2"}] [:circle {:cx "7" :cy "6" :r "2"}] [:circle {:cx "17" :cy "6" :r "2"}] [:path {:d "M7 8v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2 -2v-2"}] [:line {:x1 "12" :y1 "12" :x2 "12" :y2 "16"}]])


(defn info []
  [:svg {:class "info" :view-box "0 0 16 16" :width "16px" :height "16px"}
   [:g [:path {:style {:transform "scale(0.25)"} :d "m32 2c-16.568 0-30 13.432-30 30s13.432 30 30 30 30-13.432 30-30-13.432-30-30-30m5 49.75h-10v-24h10v24m-5-29.5c-2.761 0-5-2.238-5-5s2.239-5 5-5c2.762 0 5 2.238 5 5s-2.238 5-5 5"}]]])

(defn play []
  [:svg
   {:stroke                "currentColor"
    :view-box              "0 0 24 24"
    :preserve-aspect-ratio "none"
    :fill                  "none"}
   [:path
    {:d
                      "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
     :stroke-width    "2"
     :stroke-linejoin "round"
     :stroke-linecap  "round"}]
   [:path
    {:d               "M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
     :stroke-width    "2"
     :stroke-linejoin "round"
     :stroke-linecap  "round"}]])

(def home
  [:svg.h-6.w-6 {:fill "none" :viewBox "0 0 24 24" :stroke "currentColor"}
   [:path {:stroke-linecap "round" :stroke-linejoin "round" :stroke-width "2" :d "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"}]])

(defn zoom-in
  ([] (zoom-in 16))
  ([size]
   [:svg {:xmlns "http://www.w3.org/2000/svg" :width size :height size :fill "none" :viewBox "0 0 24 24" :stroke "currentColor"}
    [:path {:stroke-linecap "round" :stroke-linejoin "round" :stroke-width "2" :d "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"}]]))

(defn zoom-out
  ([] (zoom-out 16))
  ([size]
   [:svg {:fill "none" :width size :height size :viewBox "0 0 24 24" :stroke "currentColor"}
    [:path {:stroke-linecap "round" :stroke-linejoin "round" :stroke-width "2" :d "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"}]]))

(defn icon-area
  ([] icon-area 16)
  ([size]
   [:svg {:viewBox "0 0 1024 1024" :version "1.1" :width size :height size :stroke "currentColor"}
    [:path {:d "M844.992 115.008H179.008c-35.328 0-64 28.672-64 64v665.984c0 35.328 28.672 64 64 64h665.984c35.328 0 64-28.672 64-64V179.008c0-35.328-28.672-64-64-64zM364.672 844.992H217.6L844.992 217.6v147.072l-480.32 480.32z m480.32-401.152v147.2l-254.016 253.952H443.84l401.152-401.152z m-187.648-264.832h147.072l-625.408 625.408V657.28l478.336-478.336zM179.008 578.112V431.04l252.032-252.032h147.136L179.008 578.112z m172.864-399.104l-172.864 172.8v-172.8h172.864z m318.272 665.984l174.848-174.848v174.848h-174.848z" :fill "currentColor"}]]))

(defn icon-info
  ([] (icon-info 16))
  ([size]
   [:svg {:viewBox "0 0 1024 1024" :width size :height size :stroke "currentColor"}
    [:path {:d "M512 981.333333C253.866667 981.333333 42.666667 770.133333 42.666667 512S253.866667 42.666667 512 42.666667s469.333333 211.2 469.333333 469.333333-211.2 469.333333-469.333333 469.333333z m0-844.8c-206.506667 0-375.466667 168.96-375.466667 375.466667 0 206.506667 168.96 375.466667 375.466667 375.466667 206.506667 0 375.466667-168.96 375.466667-375.466667 0-206.506667-168.96-375.466667-375.466667-375.466667z" :fill "currentColor"}]
    [:path {:d "M512 796.714667a46.08 46.08 0 0 1-46.933333-46.933334v-269.056c0-26.624 20.352-46.933333 46.933333-46.933333 26.581333 0 46.933333 20.309333 46.933333 46.933333v269.056c0 26.624-20.352 46.933333-46.933333 46.933334zM512 364.928a46.08 46.08 0 0 1-46.933333-46.933333V274.218667c0-26.624 20.352-46.933333 46.933333-46.933334 26.581333 0 46.933333 20.309333 46.933333 46.933334v43.776c0 26.624-21.888 46.933333-46.933333 46.933333z" :fill "currentColor"}]]))

(defn icon-cmd
  ([] (icon-cmd 16))
  ([size]
   [:svg.cmd {:viewBox "0 0 1024 1024" :width size :height size}
    [:path {:d "M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32z m-40 728H184V184h656v656z" :fill "currentColor"}]
    [:path {:d "M370.8 554.4c-54.6 0-98.8 44.2-98.8 98.8s44.2 98.8 98.8 98.8 98.8-44.2 98.8-98.8v-42.4h84.7v42.4c0 54.6 44.2 98.8 98.8 98.8s98.8-44.2 98.8-98.8-44.2-98.8-98.8-98.8h-42.4v-84.7h42.4c54.6 0 98.8-44.2 98.8-98.8 0-54.6-44.2-98.8-98.8-98.8s-98.8 44.2-98.8 98.8v42.4h-84.7v-42.4c0-54.6-44.2-98.8-98.8-98.8S272 316.2 272 370.8s44.2 98.8 98.8 98.8h42.4v84.7h-42.4z m42.4 98.8c0 23.4-19 42.4-42.4 42.4s-42.4-19-42.4-42.4 19-42.4 42.4-42.4h42.4v42.4z m197.6-282.4c0-23.4 19-42.4 42.4-42.4s42.4 19 42.4 42.4-19 42.4-42.4 42.4h-42.4v-42.4z m0 240h42.4c23.4 0 42.4 19 42.4 42.4s-19 42.4-42.4 42.4-42.4-19-42.4-42.4v-42.4zM469.6 469.6h84.7v84.7h-84.7v-84.7z m-98.8-56.4c-23.4 0-42.4-19-42.4-42.4s19-42.4 42.4-42.4 42.4 19 42.4 42.4v42.4h-42.4z" :fill "currentColor"}]]))

(defn icon-editor
  ([] (icon-editor 16))
  ([size]
   [:svg {:viewBox "0 0 1024 1024" :width size :height size}
    [:path {:d "M934.443 258.719L496.176 696.983h-157.92V539.059L776.523 100.8c6.165-6.165 14.235-9.175 22.315-9.175 8.1 0 16.185 3.01 22.35 9.175l113.255 113.247c6.17 6.17 9.175 14.24 9.175 22.335 0 8.072-3.005 16.17-9.175 22.337z m-135.585-74.977L417.216 565.378v52.65h52.64l381.642-381.647-52.64-52.639z m-289.519 39.485H180.337v631.676h631.681V525.899c0-21.79 17.665-39.475 39.48-39.475 21.805 0 39.48 17.685 39.48 39.475v355.324c0 29.075-23.57 52.645-52.64 52.645H154.017c-29.07 0-52.64-23.57-52.64-52.645V196.902c0-29.07 23.57-52.64 52.64-52.64h355.322c21.805 0 39.48 17.685 39.48 39.48s-17.675 39.485-39.48 39.485z" :fill "currentColor"}]]))

(defn icon-cli
  ([] (icon-cli 16))
  ([size]
   [:svg {:viewBox "0 0 1024 1024" :width size :height size}
    [:path {:d "M324.608 312.32l-60.416 60.416 140.288 140.288-139.264 139.264 60.416 60.416 199.68-199.68-200.704-200.704z m193.536 345.088h235.52v97.28h-235.52v-97.28zM28.672 76.8v870.4h967.68v-870.4H28.672z m870.4 774.144H124.928V173.056h774.144v677.888z" :fill "currentColor"}]]))

(defn view-list
  ([] (view-list 16))
  ([size]
   [:svg.icon {:viewBox "0 0 1024 1024" :width size :height size :fill "none" :stroke "currentColor"}
    [:path {:d "M134.976 853.312H89.6c-26.56 0-46.912-20.928-46.912-48.256 0-27.392 20.352-48.32 46.912-48.32h45.376c26.624 0 46.912 20.928 46.912 48.32 0 27.328-20.288 48.256-46.912 48.256zM134.976 560.32H89.6C63.04 560.32 42.688 539.392 42.688 512s20.352-48.32 46.912-48.32h45.376c26.624 0 46.912 20.928 46.912 48.32s-20.288 48.32-46.912 48.32zM134.976 267.264H89.6c-26.56 0-46.912-20.928-46.912-48.32 0-27.328 20.352-48.256 46.912-48.256h45.376c26.624 0 46.912 20.928 46.912 48.256 0 27.392-20.288 48.32-46.912 48.32zM311.744 853.312c-26.56 0-46.912-20.928-46.912-48.256 0-27.392 20.352-48.32 46.912-48.32h622.72c26.56 0 46.848 20.928 46.848 48.32 0 27.328-20.288 48.256-46.912 48.256H311.744c1.6 0 1.6 0 0 0zM311.744 560.32c-26.56 0-46.912-20.928-46.912-48.32s20.352-48.32 46.912-48.32h622.72c26.56 0 46.848 20.928 46.848 48.32s-20.288 48.32-46.912 48.32H311.744c1.6 0 1.6 0 0 0zM311.744 267.264c-26.56 0-46.912-20.928-46.912-48.32 0-27.328 20.352-48.256 46.912-48.256h622.72c26.56 0 46.848 20.928 46.848 48.256 0 27.392-20.288 48.32-46.912 48.32H311.744c1.6 0 1.6 0 0 0z" :fill "currentColor"}]]))

(defn adjustments
  ([] (adjustments 16))
  ([size]
   [:svg.icon {:fill "none" :width size :height size :viewBox "0 0 24 24" :stroke "currentColor"}
    [:path {:stroke-linecap "round" :stroke-linejoin "round" :stroke-width "2" :d "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"}]]))

(defn check
  ([] (check 16))
  ([size]
   [:svg.icon {:fill "none" :width size :height size :viewBox "0 0 24 24" :stroke "currentColor"}
    [:path {:stroke-linecap "round" :stroke-linejoin "round" :stroke-width "2" :d "M5 13l4 4L19 7"}]]))

(defn cloud-down
  ([] (cloud-down 16))
  ([size]
   [:svg.icon {:width size :height size :viewBox "0 0 24 24" :stroke-width "2" :stroke "currentColor" :fill "none" :stroke-linecap "round" :stroke-linejoin "round"}
    [:path {:stroke "none" :d "M0 0h24v24H0z" :fill "none"}]
    [:path {:d "M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4"}]
    [:line {:x1 "12" :y1 "13" :x2 "12" :y2 "22"}]
    [:polyline {:points "9 19 12 22 15 19"}]]))

(defn star
  ([] (star 16))
  ([size]
   [:svg.icon {:width size :height size :viewBox "0 0 24 24" :stroke-width "2" :stroke "currentColor" :fill "none" :stroke-linecap "round" :stroke-linejoin "round"}
    [:path {:stroke "none" :d "M0 0h24v24H0z" :fill "none"}]
    [:path {:d "M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z"}]]))

(defn apps
  ([] (apps 16))
  ([size]
   [:svg.icon-apps {:width size :height size :viewBox "0 0 24 24" :stroke-width "2" :stroke "currentColor" :fill "none" :stroke-linecap "round" :stroke-linejoin "round"}
    [:path {:stroke "none" :d "M0 0h24v24H0z" :fill "none"}]
    [:rect {:x "4" :y "4" :width "6" :height "6" :rx "1"}]
    [:rect {:x "4" :y "14" :width "6" :height "6" :rx "1"}]
    [:rect {:x "14" :y "14" :width "6" :height "6" :rx "1"}]
    [:line {:x1 "14" :y1 "7" :x2 "20" :y2 "7"}]
    [:line {:x1 "17" :y1 "4" :x2 "17" :y2 "10"}]]))

(defn reload
  ([] (reload 16))
  ([size]
   [:svg.icon-reload {:width size :height size :viewBox "0 0 24 24" :stroke-width "2" :stroke "currentColor" :fill "none" :stroke-linecap "round" :stroke-linejoin "round"}
    [:path {:stroke "none" :d "M0 0h24v24H0z" :fill "none"}]
    [:path {:d "M4.05 11a8 8 0 1 1 .5 4m-.5 5v-5h5"}]]))

(defn settings
  ([] (settings 16))
  ([size]
   [:svg.icon-settings {:width size :height size :viewBox "0 0 24 24" :stroke-width "2" :stroke "currentColor" :fill "none" :stroke-linecap "round" :stroke-linejoin "round"}
    [:path {:stroke "none" :d "M0 0h24v24H0z" :fill "none"}]
    [:path {:d "M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"}]
    [:circle {:cx "12" :cy "12" :r "3"}]]))

(defn offline
  ([] (offline 16))
  ([size]
   [:svg.icon-offline {:viewBox "0 0 1024 1024" :width size :height size}
    [:path {:d "M512 183.466667c149.333333 0 292.266667 46.933333 409.6 132.266666 19.2 12.8 23.466667 40.533333 8.533333 59.733334-12.8 19.2-40.533333 23.466667-59.733333 8.533333-102.4-74.666667-228.266667-115.2-358.4-115.2-130.133333 0-256 40.533333-358.4 115.2-19.2 12.8-44.8 8.533333-59.733333-8.533333-12.8-19.2-8.533333-44.8 8.533333-59.733334 119.466667-85.333333 260.266667-132.266667 409.6-132.266666z m0 170.666666c108.8 0 211.2 32 298.666667 91.733334 19.2 12.8 23.466667 40.533333 10.666666 59.733333-12.8 19.2-40.533333 23.466667-59.733333 10.666667-72.533333-51.2-160-78.933333-251.733333-78.933334-91.733333 0-177.066667 27.733333-249.6 76.8-19.2 12.8-44.8 8.533333-59.733334-10.666666-12.8-19.2-8.533333-44.8 10.666667-59.733334 89.6-57.6 192-89.6 300.8-89.6z m0 168.533334c23.466667 0 42.666667 19.2 42.666667 42.666666s-19.2 42.666667-42.666667 42.666667c-51.2 0-100.266667 14.933333-142.933333 40.533333-19.2 12.8-46.933333 6.4-57.6-14.933333-12.8-19.2-6.4-46.933333 14.933333-57.6 53.333333-34.133333 117.333333-53.333333 185.6-53.333333z m0 189.866666c34.133333 0 64 27.733333 64 64 0 34.133333-27.733333 64-64 64s-64-27.733333-64-64c0-34.133333 27.733333-64 64-64z m164.266667-106.666666l89.6 89.6 89.6-89.6c17.066667-17.066667 42.666667-17.066667 59.733333 0 17.066667 17.066667 17.066667 42.666667 0 59.733333l-89.6 89.6 89.6 89.6c17.066667 17.066667 17.066667 42.666667 0 59.733333-17.066667 17.066667-42.666667 17.066667-59.733333 0l-89.6-89.6-89.6 89.6c-17.066667 17.066667-42.666667 17.066667-59.733334 0-17.066667-17.066667-17.066667-42.666667 0-59.733333l89.6-89.6-89.6-89.6c-17.066667-17.066667-17.066667-42.666667 0-59.733333 14.933333-17.066667 42.666667-17.066667 59.733334 0z" :fill "currentColor"}]]))

(defn annotations
  ([] (annotations 16))
  ([size]
   [:svg.icon {:viewBox "0 0 1024 1024" :width size :height size}
    [:path {:d "M866.368 64 157.632 64C105.984 64 64 105.984 64 157.632l0 522.112c0 51.648 41.984 93.632 93.632 93.632l111.744 0 132.736 174.08C408.192 955.392 417.536 960 427.584 960s19.392-4.608 25.408-12.544l132.736-174.08 280.64 0c51.648 0 93.632-41.984 93.632-93.632L960 157.632C960 105.984 918.016 64 866.368 64zM429.504 234.624 318.72 599.808C313.408 617.536 295.36 627.52 278.528 622.4 261.632 617.344 252.16 598.848 257.472 581.376l110.72-365.312c5.312-17.472 23.36-27.584 40.32-22.464C425.408 198.72 434.816 217.216 429.504 234.624zM827.2 391.04c-3.2 5.504-6.656 9.088-10.176 10.624-33.152 12.992-69.632 22.592-109.376 28.48 7.232 6.592 16.064 15.488 26.624 26.496 10.496 11.136 16.064 17.024 16.512 17.728 3.904 5.376 9.28 12.032 16.192 19.968 6.912 8 11.776 14.208 14.464 18.688 2.688 4.544 4.032 9.92 4.032 16.384 0 8.192-3.072 15.424-9.28 21.568-6.144 6.208-14.144 9.28-23.872 9.28S731.648 552.704 719.36 537.6c-12.16-15.104-27.968-42.368-47.168-81.664C652.672 491.328 639.552 514.752 632.96 526.08 626.24 537.28 619.84 545.792 613.696 551.616c-6.208 5.76-13.184 8.704-21.184 8.704-9.472 0-17.408-3.264-23.744-9.792C562.56 543.936 559.36 536.896 559.36 529.472c0-6.912 1.28-12.16 3.84-15.744 23.616-32.064 48.256-60.032 73.984-83.584C615.616 426.816 596.352 423.04 579.456 419.008 562.496 414.784 544.448 408.896 525.504 400.896c-3.136-1.536-6.144-5.12-9.088-10.624C513.408 384.832 512 379.712 512 375.04c0-8.96 3.264-16.512 9.792-22.528 6.592-6.144 14.08-9.088 22.592-9.088 6.208 0 13.824 1.856 23.104 5.568 9.216 3.776 20.928 9.152 35.2 16.192s30.528 14.912 48.768 23.68c-3.392-16.192-6.144-34.752-8.32-55.616-2.176-20.928-3.264-35.264-3.264-43.008 0-9.472 3.008-17.536 9.024-24.448 6.144-6.784 13.824-10.176 23.296-10.176 9.344 0 16.896 3.392 22.912 10.176 6.08 6.848 9.088 15.872 9.088 27.2 0 3.072-0.512 9.152-1.344 18.304-0.832 9.152-2.176 20.096-3.84 33.088-1.664 12.992-3.584 27.904-5.568 44.48 16.576-7.68 32.64-15.424 47.744-23.04 15.104-7.744 27.264-13.44 36.16-17.024 8.96-3.52 16.128-5.376 21.568-5.376 8.96 0 16.704 2.944 23.232 9.088C828.736 358.592 832 366.144 832 375.04 832 380.16 830.4 385.536 827.2 391.04z" :fill "currentColor"}]]))

(defn up-narrow
  ([] (up-narrow 16))
  ([size]
   [:svg.icon {:width size :height size :viewBox "0 0 24 24" :stroke-width "2" :stroke "currentColor" :fill "none" :stroke-linecap "round" :stroke-linejoin "round"}
    [:path {:stroke "none" :d "M0 0h24v24H0z" :fill "none"}]
    [:line {:x1 "12" :y1 "5" :x2 "12" :y2 "19"}]
    [:line {:x1 "16" :y1 "9" :x2 "12" :y2 "5"}]
    [:line {:x1 "8" :y1 "9" :x2 "12" :y2 "5"}]]))

(defn down-narrow
  ([] (down-narrow 16))
  ([size]
   [:svg.icon {:width size :height size :viewBox "0 0 24 24" :stroke-width "2" :stroke "currentColor" :fill "none" :stroke-linecap "round" :stroke-linejoin "round"}
    [:path {:stroke "none" :d "M0 0h24v24H0z" :fill "none"}]
    [:line {:x1 "12" :y1 "5" :x2 "12" :y2 "19"}]
    [:line {:x1 "16" :y1 "15" :x2 "12" :y2 "19"}]
    [:line {:x1 "8" :y1 "15" :x2 "12" :y2 "19"}]]))

(defn maximize
  ([] (maximize 16))
  ([size]
   [:svg.icon {:width size :height size :viewBox "0 0 24 24" :stroke-width "2" :stroke "currentColor" :fill "none" :stroke-linecap "round" :stroke-linejoin "round"}
    [:path {:stroke "none" :d "M0 0h24v24H0z" :fill "none"}]
    [:path {:d "M4 8v-2a2 2 0 0 1 2 -2h2"}]
    [:path {:d "M4 16v2a2 2 0 0 0 2 2h2"}]
    [:path {:d "M16 4h2a2 2 0 0 1 2 2v2"}]
    [:path {:d "M16 20h2a2 2 0 0 0 2 -2v-2"}]]))

(def arrow-expand
  (hero-icon "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"))
