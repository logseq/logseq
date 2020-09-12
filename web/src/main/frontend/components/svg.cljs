(ns frontend.components.svg
  (:require [rum.core :as rum]))

(rum/defc arrow-down
  []
  [:svg
   {:aria-hidden "true",
    :height "16",
    :width "10",
    :version "1.1",
    :view-box "0 0 10 16"
    :fill "currentColor"
    :display "inline-block"}
   [:path
    {:d "M5 11L0 6l1.5-1.5L5 8.25 8.5 4.5 10 6l-5 5z",
     :fill-rule "evenodd"}]])

(rum/defc arrow-right
  []
  [:svg
   {:aria-hidden "true",
    :height "16",
    :width "10",
    :version "1.1",
    :view-box "0 0 10 16"
    :fill "currentColor"
    :display "inline-block"}
   [:path
    {:d "M7.5 8l-5 5L1 11.5 4.75 8 1 4.5 2.5 3l5 5z",
     :fill-rule "evenodd"}]])

(rum/defc big-arrow-right
  []
  [:svg
   {:fill "none", :view-box "0 0 24 24", :height "24", :width "24"}
   [:path
    {:stroke-linejoin "round",
     :stroke-linecap "round",
     :stroke-width "2",
     :stroke "currentColor",
     :d "M14 5L21 12M21 12L14 19M21 12L3 12"}]])

(rum/defc big-arrow-left
  []
  [:svg
   {:fill "none", :view-box "0 0 24 24", :height "24", :width "24"}
   [:path
    {:stroke-linejoin "round",
     :stroke-linecap "round",
     :stroke-width "2",
     :stroke "currentColor",
     :d "M10 19L3 12M3 12L10 5M3 12L21 12"}]])

(defonce arrow-right-v2
  [:svg.h-3.w-3
   {:version "1.1",
    :view-box "0 0 128 128"
    :fill "currentColor"
    :display "inline-block"
    :style {:margin-top -3}}
   [:path
    {:d
     "M99.069 64.173c0 2.027-.77 4.054-2.316 5.6l-55.98 55.98a7.92 7.92 0 01-11.196 0c-3.085-3.086-3.092-8.105 0-11.196l50.382-50.382-50.382-50.382a7.92 7.92 0 010-11.195c3.086-3.085 8.104-3.092 11.196 0l55.98 55.98a7.892 7.892 0 012.316 5.595z"}]])

(defonce arrow-down-v2
  [:svg.h-3.w-3
   {:version "1.1",
    :view-box "0 0 128 128"
    :fill "currentColor"
    :display "inline-block"
    :style {:margin-top -3}}
   [:path
    {:d
     "M64.177 100.069a7.889 7.889 0 01-5.6-2.316l-55.98-55.98a7.92 7.92 0 010-11.196c3.086-3.085 8.105-3.092 11.196 0l50.382 50.382 50.382-50.382a7.92 7.92 0 0111.195 0c3.086 3.086 3.092 8.104 0 11.196l-55.98 55.98a7.892 7.892 0 01-5.595 2.316z"}]])
(defn- hero-icon
  ([d]
   (hero-icon d {}))
  ([d options]
   [:svg (merge {:fill "currentColor", :view-box "0 0 24 24", :height "24", :width "24"}
                options)
    [:path
     {:stroke-linejoin "round"
      :stroke-linecap "round"
      :stroke-width "2"
      :stroke "currentColor"
      :d d}]]))

(def user
  [:svg
   {:stroke-linejoin "round",
    :stroke-linecap "round",
    :fill "none",
    :stroke "currentColor",
    :stroke-width "2",
    :view-box "0 0 24 24",
    :height "24",
    :width "24"}
   [:path {:d "M0 0h24v24H0z", :stroke "none"}]
   [:circle {:r "4", :cy "7", :cx "12"}]
   [:path {:d "M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"}]])

(def close (hero-icon "M6 18L18 6M6 6L18 18"))
(def plus (hero-icon "M12 4v16m8-8H4"))
(def folder (hero-icon "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"))
(defn vertical-dots
  [options]
  (hero-icon "M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" options))
(def external-link
  [:svg {:fill "none", :view-box "0 0 24 24", :height "21", :width "21"
         :stroke "currentColor"}
   [:path
    {:stroke-linejoin "round"
     :stroke-linecap "round"
     :stroke-width "2"
     :d "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"}]]
  )

(def save
  [:svg
   {:fill "currentColor", :view-box "0 0 448 512", :height "24", :width "24"}
   [:path
    {:stroke-linejoin "round"
     :stroke-linecap "round"
     :stroke-width "2"
     :stroke "currentColor"
     :d "M433.941 129.941l-83.882-83.882A48 48 0 0 0 316.118 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V163.882a48 48 0 0 0-14.059-33.941zM224 416c-35.346 0-64-28.654-64-64 0-35.346 28.654-64 64-64s64 28.654 64 64c0 35.346-28.654 64-64 64zm96-304.52V212c0 6.627-5.373 12-12 12H76c-6.627 0-12-5.373-12-12V108c0-6.627 5.373-12 12-12h228.52c3.183 0 6.235 1.264 8.485 3.515l3.48 3.48A11.996 11.996 0 0 1 320 111.48z"}]])

(rum/defc note
  []
  [:svg.h-8.w-8.svg-shadow.note
   {:view-box "0 0 512 512"
    :fill "currentColor"}
   [:path
    {:d
     "M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"}]])

(rum/defc tip
  []
  [:svg.h-8.w-8.tip-shadow.tip
   {:view-box "0 0 352 512"
    :fill "currentColor"}
   [:path
    {:d
     "M96.06 454.35c.01 6.29 1.87 12.45 5.36 17.69l17.09 25.69a31.99 31.99 0 0 0 26.64 14.28h61.71a31.99 31.99 0 0 0 26.64-14.28l17.09-25.69a31.989 31.989 0 0 0 5.36-17.69l.04-38.35H96.01l.05 38.35zM0 176c0 44.37 16.45 84.85 43.56 115.78 16.52 18.85 42.36 58.23 52.21 91.45.04.26.07.52.11.78h160.24c.04-.26.07-.51.11-.78 9.85-33.22 35.69-72.6 52.21-91.45C335.55 260.85 352 220.37 352 176 352 78.61 272.91-.3 175.45 0 73.44.31 0 82.97 0 176zm176-80c-44.11 0-80 35.89-80 80 0 8.84-7.16 16-16 16s-16-7.16-16-16c0-61.76 50.24-112 112-112 8.84 0 16 7.16 16 16s-7.16 16-16 16z"}]])

(rum/defc important
  []
  [:svg.h-8.w-8.svg-shadow.important
   {:view-box "0 0 512 512"
    :fill "currentColor"
    :color "#bf0000"}
   [:path
    {:d
     "M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zm-248 50c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"}]])

(rum/defc caution
  []
  [:svg.h-8.w-8.svg-shadow.caution
   {:view-box "0 0 384 512"
    :fill "currentColor"
    :color "#bf3400"}
   [:path
    {:d
     "M216 23.86c0-23.8-30.65-32.77-44.15-13.04C48 191.85 224 200 224 288c0 35.63-29.11 64.46-64.85 63.99-35.17-.45-63.15-29.77-63.15-64.94v-85.51c0-21.7-26.47-32.23-41.43-16.5C27.8 213.16 0 261.33 0 320c0 105.87 86.13 192 192 192s192-86.13 192-192c0-170.29-168-193-168-296.14z"}]])

(rum/defc warning
  []
  [:svg.h-8.w-8.svg-shadow.warning
   {:view-box "0 0 576 512"
    :fill "currentColor"
    :color "#bf6900"}
   [:path
    {:d
     "M569.517 440.013C587.975 472.007 564.806 512 527.94 512H48.054c-36.937 0-59.999-40.055-41.577-71.987L246.423 23.985c18.467-32.009 64.72-31.951 83.154 0l239.94 416.028zM288 354c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"}]])

(rum/defc caret-down
  []
  [:svg.h-4.w-4
   {:aria-hidden "true",
    :version "1.1",
    :view-box "0 0 192 512"
    :fill "currentColor"
    :display "inline-block"}
   [:path
    {:d "M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z",
     :fill-rule "evenodd"}]])

(rum/defc caret-right
  []
  [:svg.h-4.w-4
   {:aria-hidden "true",
    :version "1.1",
    :view-box "0 0 192 512"
    :fill "currentColor"
    :display "inline-block"
    :style {:margin-left 2}}
   [:path
    {:d "M0 384.662V127.338c0-17.818 21.543-26.741 34.142-14.142l128.662 128.662c7.81 7.81 7.81 20.474 0 28.284L34.142 398.804C21.543 411.404 0 402.48 0 384.662z",
     :fill-rule "evenodd"}]])

(rum/defc menu
  [class]
  [:svg
   {:fill "none", :view-box "0 0 20 20", :height "20", :width "20"
    :class class}
   [:path
    {:fill "currentColor",
     :d
     "M3 5C3 4.44772 3.44772 4 4 4H16C16.5523 4 17 4.44772 17 5C17 5.55228 16.5523 6 16 6H4C3.44772 6 3 5.55228 3 5Z",
     :clip-rule "evenodd",
     :fill-rule "evenodd"}]
   [:path
    {:fill "currentColor"
     :d
     "M3 10C3 9.44772 3.44772 9 4 9H16C16.5523 9 17 9.44772 17 10C17 10.5523 16.5523 11 16 11H4C3.44772 11 3 10.5523 3 10Z",
     :clip-rule "evenodd",
     :fill-rule "evenodd"}]
   [:path
    {:fill "currentColor",
     :d
     "M3 15C3 14.4477 3.44772 14 4 14H16C16.5523 14 17 14.4477 17 15C17 15.5523 16.5523 16 16 16H4C3.44772 16 3 15.5523 3 15Z",
     :clip-rule "evenodd",
     :fill-rule "evenodd"}]])

(defn excalidraw-logo
  []
  [:svg
   {:preserve-aspect-ratio "xMidYMid meet",
    :view-box "0 0 109.000000 269.000000",
    :height 24,
    :width 24,
    :version "1.0"
    :style {:display "inline"}}
   [:g
    {:stroke "none",
     :fill "currentColor",
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
      "M1050 2180 c0 -5 -6 -10 -13 -10 -6 0 -23 -28 -36 -62 -40 -104 -440 -895 -441 -870 0 13 -6 22 -16 22 -14 0 -16 -8 -10 -47 6 -45 2 -55 -140 -331 -80 -157 -166 -321 -191 -365 -26 -46 -46 -96 -48 -117 -3 -36 1 -41 88 -116 50 -44 114 -99 142 -124 126 -115 185 -161 201 -158 24 4 395 393 396 415 0 10 -18 162 -40 338 -38 300 -74 651 -70 685 3 21 -12 127 -23 173 -9 36 -5 51 67 215 42 97 97 216 121 264 23 48 43 90 43 93 0 3 -7 5 -15 5 -8 0 -15 -4 -15 -10z m-230 -747 c11 -70 33 -238 49 -373 31 -248 67 -523 77 -593 6 -35 2 -42 -63 -114 -113 -127 -233 -252 -274 -284 l-38 -30 -195 182 c-180 166 -195 183 -184 203 6 11 57 104 113 206 56 102 130 238 164 302 35 65 67 121 73 124 7 4 9 -97 7 -312 -4 -321 -3 -322 29 -315 4 0 7 162 7 359 l0 358 105 210 c58 116 106 209 108 208 2 -1 12 -60 22 -131z"}]]]
  )

(rum/defc logo
  [dark?]
  [:svg.svg-shadow
   {:fill (if dark? "currentColor" "#002B36"), :view-box "0 0 21 21", :height "21", :width "21"
    :style {:margin-top 2}}
   [:ellipse
    {:transform
     "matrix(0.987073 0.160274 -0.239143 0.970984 11.7346 2.59206)",
     :ry "2.04373",
     :rx "3.29236"}]
   [:ellipse
    {:transform
     "matrix(-0.495846 0.868411 -0.825718 -0.564084 3.97209 5.54515)",
     :ry "3.37606",
     :rx "2.95326"}]
   [:ellipse
    {:transform
     "matrix(0.987073 0.160274 -0.239143 0.970984 13.0843 14.72)",
     :ry "6.13006",
     :rx "7.78547"}]])

(def discord
  [:svg
   {:view-box "0 0 448 512",
    :preserve-aspect-ratio "xMidYMid meet",
    :style
    {"msTransform" "rotate(360deg)"
     "WebkitTransform" "rotate(360deg)"
     "transform" "rotate(360deg)"}
    :height "1em",
    :width "0.88em",
    :focusable "false",
    :aria-hidden "true"
    :fill "currentColor"}
   [:path
    {:d
     "M297.216 243.2c0 15.616-11.52 28.416-26.112 28.416c-14.336 0-26.112-12.8-26.112-28.416s11.52-28.416 26.112-28.416c14.592 0 26.112 12.8 26.112 28.416zm-119.552-28.416c-14.592 0-26.112 12.8-26.112 28.416s11.776 28.416 26.112 28.416c14.592 0 26.112-12.8 26.112-28.416c.256-15.616-11.52-28.416-26.112-28.416zM448 52.736V512c-64.494-56.994-43.868-38.128-118.784-107.776l13.568 47.36H52.48C23.552 451.584 0 428.032 0 398.848V52.736C0 23.552 23.552 0 52.48 0h343.04C424.448 0 448 23.552 448 52.736zm-72.96 242.688c0-82.432-36.864-149.248-36.864-149.248c-36.864-27.648-71.936-26.88-71.936-26.88l-3.584 4.096c43.52 13.312 63.744 32.512 63.744 32.512c-60.811-33.329-132.244-33.335-191.232-7.424c-9.472 4.352-15.104 7.424-15.104 7.424s21.248-20.224 67.328-33.536l-2.56-3.072s-35.072-.768-71.936 26.88c0 0-36.864 66.816-36.864 149.248c0 0 21.504 37.12 78.08 38.912c0 0 9.472-11.52 17.152-21.248c-32.512-9.728-44.8-30.208-44.8-30.208c3.766 2.636 9.976 6.053 10.496 6.4c43.21 24.198 104.588 32.126 159.744 8.96c8.96-3.328 18.944-8.192 29.44-15.104c0 0-12.8 20.992-46.336 30.464c7.68 9.728 16.896 20.736 16.896 20.736c56.576-1.792 78.336-38.912 78.336-38.912z"}]]
  )

(def slideshow
  [:svg
   {:view-box "0 0 24 24"
    :height 23
    :width 23
    :fill "currentColor"
    :display "inline-block"}
   [:path
    {:d "M10 8v8l5-4-5-4zm9-5H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"}]])

(def indent-block 
  [:svg.h-6.w-6
   {:stroke "currentColor", :view-box "0 0 24 24", :fill "none"}
   [:path
    {:d "M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
     :fill-rule "evenodd"
     :clip-rule "evenodd"
     :stroke-width "2"
     :stroke-linejoin "round"
     :stroke-linecap "round"}]
   [:path
    {:d "M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
     :fill-rule "evenodd"
     :clip-rule "evenodd"
     :stroke-width "2"
     :stroke-linejoin "round"
     :stroke-linecap "round"}]])

(def outdent-block
  [:svg.h-6.w-6
   {:stroke "currentColor", :view-box "0 0 24 24", :fill "none"}
   [:path
    {:d "M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z"
     :fill-rule "evenodd"
     :clip-rule "evenodd"
     :stroke-width "2"
     :stroke-linejoin "round"
     :stroke-linecap "round"}]])

(def move-up-block
  [:svg.h-6.w-6
   {:stroke "currentColor", :view-box "0 0 24 24", :fill "none"}
   [:path
    {:d "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
     :fill-rule "evenodd"
     :clip-rule "evenodd"
     :stroke-width "2"
     :stroke-linejoin "round"
     :stroke-linecap "round"}]])

(def move-down-block
  [:svg.h-6.w-6
   {:stroke "currentColor", :view-box "0 0 24 24", :fill "none"}
   [:path
    {:d "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
     :fill-rule "evenodd"
     :clip-rule "evenodd"
     :stroke-width "2"
     :stroke-linejoin "round"
     :stroke-linecap "round"}]])

(def multi-line-input
  [:svg.h-6.w-6
   {:stroke "currentColor", :view-box "0 0 24 24", :fill "none"}
   [:path
    {:d "M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"
     :fill-rule "evenodd"
     :clip-rule "evenodd"
     :stroke-width "2"
     :stroke-linejoin "round"
     :stroke-linecap "round"}]])