let () =
  List.iter
    (fun (html, expected) ->
      let actual = Html_to_md.convert html in
      if actual <> expected then
        failwith
          (Printf.sprintf "HTML paste %S: expected %S, got %S" html
             (Option.value expected ~default:"<none>")
             (Option.value actual ~default:"<none>")))
    [ ("", None)
    ; ("<p>A</p><p>B</p>", Some "A\n\nB")
    ; ("<ul><li>A<ul><li>Nested</li></ul></li><li>B</li></ul>",
       Some "- A\n\t- Nested\n- B")
    ; ("<ol><li>First</li><li>Second</li></ol>", Some "- First\n- Second")
    ; ("<ul>\n  <li>A</li>\n  <li>B</li>\n</ul>", Some "- A\n- B")
    ; ("<p><a href='https://example.com/?a=1&amp;b=2'>Link</a></p>",
       Some "[Link](https://example.com/?a=1&b=2)")
    ; ("<div>A<br>B &amp; &#x4e2d; &#39;C&#39;</div>", Some "A\nB & 中 'C'")
    ; ("<meta charset='windows-1252'><p>中&nbsp;文</p>", Some "中 文")
    ; ("<script>hidden()</script><style>p{}</style><p>Visible</p>", Some "Visible")
    ; ("<p><strong>Bold</strong> <em>italic</em> <code>x</code></p>",
       Some "**Bold** *italic* `x`")
    ; ("<pre><code>a\n  b</code></pre>", Some "```\na\n  b\n```")
    ; ("<p>A<p>B", Some "A\n\nB")
    ]
