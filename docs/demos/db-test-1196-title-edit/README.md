# Demo: title edits do not remount the page tree

Recorded against PR tip `ebf0ab9cbd` in the web app.

On a page with nested children and a `greet()` snippet, the title is renamed twice. The tree stays mounted; no blank remount or code-block flash.

- Video: [title_edit_no_tree_flicker_demo.mp4](./title_edit_no_tree_flicker_demo.mp4)
- Before (`Nested Code Page`): [title_edit_before_nested_code_page.png](./title_edit_before_nested_code_page.png)
- After first rename (`Renamed Nested Page`): [title_edit_after_first_rename.png](./title_edit_after_first_rename.png)
- After second rename (`Renamed Nested Page 2`): [title_edit_after_second_rename.png](./title_edit_after_second_rename.png)
