- [[About Shui]]
- [[shui/components]]
	- beta
		- [[shui/components/table]]
	- up next
		- [[shui/components/button]]
		- [[shui/components/input]]
		- [[shui/components/tooltip]]
		- [[shui/components/text]]
	- future
		- [[shui/components/icon]]
		- [[shui/components/tag]]
		- [[shui/components/toggle]]
		- [[shui/components/context-menu]]
		- [[shui/components/right-sidebar]]
		- [[shui/components/modal]]
		- [[shui/components/properties]]
- [[shui/colors]]
	- We want to switch to radix varaibles
	- We want to make it easy to customize with themes
	- We want to support as much old themes as possible
	- var(--shui-button-color,
	  collapsed:: true
		- var(--logseq-button-primary-color,
		  collapsed:: true
			- var(--lx-color-6)))
	- light and dark variants
	- ```css
	  :root {
	    --lx-blue-1: #123456;
	  }
	  ```
	- ```
	  (js/document.style.setProperty "--lx-blue-1" ""#abcdef")
	  ```
	-
- [[shui/inline]]
	-
-