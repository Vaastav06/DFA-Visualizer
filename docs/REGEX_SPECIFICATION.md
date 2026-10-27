# Supported regular-expression syntax

The visualizer accepts a deliberately small regular-expression grammar suitable for the direct construction walkthrough.

| Form                  | Meaning                  | Example     |
| --------------------- | ------------------------ | ----------- |
| ASCII letter or digit | One literal symbol       | `a`, `7`    |
| `r1r2`                | Implicit concatenation   | `ab`        |
| `r1                   | r2`                      | Alternation | `a   | b`  |
| `r*`                  | Zero or more repetitions | `a*`        |
| `(r)`                 | Grouping                 | `(a         | b)*` |

Precedence, from highest to lowest: `*`, concatenation, `|`. Parentheses override precedence. Whitespace is ignored. Literals are single characters.

The dot `.` is reserved internally to show explicit concatenation and cannot be typed as a literal. The hash `#` is reserved for the compiler's augmented end-marker.

Unsupported forms include `+`, `?`, character classes, escapes, anchors, backreferences, empty alternatives, and empty groups. Unsupported input is reported as a syntax error.
