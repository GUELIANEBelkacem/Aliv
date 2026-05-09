# JsonToXML — Exhaustive Unit Test Plan

This document specifies every unit test required to fully cover the conversion engine, formatters, validators, and all JSON↔XML incompatibilities.

Tests are organized by module. Each test lists its ID, description, input, expected output, and the rationale (which code path or edge case it covers).

---

## 1. `lib/converter.ts` — `xmlToJson()`

### 1.1 Basic Valid Conversions

| ID | Description | Input XML | Expected JSON | Rationale |
|----|-------------|-----------|---------------|-----------|
| X2J-1 | Single element with text | `<root>hello</root>` | `{"root":"hello"}` | Simplest possible conversion |
| X2J-2 | Nested elements | `<root><a><b>val</b></a></root>` | `{"root":{"a":{"b":"val"}}}` | Nested object mapping |
| X2J-3 | Multiple different children | `<root><a>1</a><b>2</b></root>` | `{"root":{"a":"1","b":"2"}}` | Sibling elements with distinct names |
| X2J-4 | Self-closing element | `<root><empty/></root>` | `{"root":{"empty":""}}` | Self-closing tags produce empty string |
| X2J-5 | Deeply nested (5 levels) | `<a><b><c><d><e>v</e></d></c></b></a>` | `{"a":{"b":{"c":{"d":{"e":"v"}}}}}` | Deep nesting fidelity |
| X2J-6 | Element with only whitespace text | `<root>   </root>` | `{"root":""}` | trimValues: true strips whitespace |

### 1.2 Attributes

| ID | Description | Input XML | Expected JSON | Rationale |
|----|-------------|-----------|---------------|-----------|
| X2J-10 | Single attribute | `<book id="1"/>` | `{"book":{"@_id":"1"}}` | Attribute prefix `@_` default |
| X2J-11 | Multiple attributes | `<book id="1" lang="en"/>` | `{"book":{"@_id":"1","@_lang":"en"}}` | Multiple attributes on one element |
| X2J-12 | Attribute + text content | `<book id="1">Title</book>` | `{"book":{"@_id":"1","#text":"Title"}}` | Attribute alongside text uses `#text` |
| X2J-13 | Attribute + child elements | `<root id="1"><a>v</a></root>` | `{"root":{"@_id":"1","a":"v"}}` | Attribute coexists with child elements |
| X2J-14 | Custom attribute prefix `$` | `<book id="1"/>` with `attributePrefix: "$"` | `{"book":{"$id":"1"}}` | Configurable prefix |
| X2J-15 | Empty attribute value | `<root attr=""/>` | `{"root":{"@_attr":""}}` | Empty string attribute preserved |
| X2J-16 | Attribute with special chars | `<root attr="a&amp;b"/>` | `{"root":{"@_attr":"a&b"}}` | XML entity decoded in attribute |

### 1.3 Repeated Elements (Arrays)

| ID | Description | Input XML | Expected JSON | Rationale |
|----|-------------|-----------|---------------|-----------|
| X2J-20 | Two siblings same name | `<root><item>a</item><item>b</item></root>` | `{"root":{"item":["a","b"]}}` | Repeated siblings become array |
| X2J-21 | Three siblings same name | `<root><i>a</i><i>b</i><i>c</i></root>` | `{"root":{"i":["a","b","c"]}}` | Array length > 2 |
| X2J-22 | Single element (no array) | `<root><item>a</item></root>` | `{"root":{"item":"a"}}` | Single element stays scalar (alwaysArray: false) |
| X2J-23 | Single element (alwaysArray: true) | `<root><item>a</item></root>` with `alwaysArray: true` | `{"root":{"item":["a"]}}` | Forces array even for single element |
| X2J-24 | Mixed siblings — repeated + unique | `<r><a>1</a><b>2</b><a>3</a></r>` | `{"r":{"a":["1","3"],"b":"2"}}` | Repeated `<a>` becomes array, unique `<b>` stays scalar |
| X2J-25 | Repeated elements with attributes | `<r><item id="1">a</item><item id="2">b</item></r>` | `{"r":{"item":[{"@_id":"1","#text":"a"},{"@_id":"2","#text":"b"}]}}` | Array of objects with attributes |
| X2J-26 | Repeated elements with children | `<r><item><name>a</name></item><item><name>b</name></item></r>` | `{"r":{"item":[{"name":"a"},{"name":"b"}]}}` | Array of complex objects |
| X2J-27 | alwaysArray with nested elements | `<r><a><b>v</b></a></r>` with `alwaysArray: true` | All elements wrapped in arrays | Every level is an array |

### 1.4 Type Inference

| ID | Description | Input XML | Options | Expected JSON value type | Rationale |
|----|-------------|-----------|---------|--------------------------|-----------|
| X2J-30 | Number (inferTypes off) | `<r><n>123</n></r>` | `inferTypes: false` | `"123"` (string) | Default: no type coercion |
| X2J-31 | Number (inferTypes on) | `<r><n>123</n></r>` | `inferTypes: true` | `123` (number) | Numeric string → number |
| X2J-32 | Float (inferTypes on) | `<r><n>3.14</n></r>` | `inferTypes: true` | `3.14` (number) | Decimal parsed |
| X2J-33 | Negative number (inferTypes on) | `<r><n>-42</n></r>` | `inferTypes: true` | `-42` (number) | Negative parsed |
| X2J-34 | Boolean true (inferTypes on) | `<r><b>true</b></r>` | `inferTypes: true` | `true` (boolean) | String → boolean |
| X2J-35 | Boolean false (inferTypes on) | `<r><b>false</b></r>` | `inferTypes: true` | `false` (boolean) | String → boolean |
| X2J-36 | Non-numeric string (inferTypes on) | `<r><s>hello</s></r>` | `inferTypes: true` | `"hello"` (string) | Non-parseable stays string |
| X2J-37 | Attribute value inferred | `<r attr="42"/>` | `inferTypes: true` | `42` (number) for `@_attr` | parseAttributeValue: true |
| X2J-38 | Attribute value not inferred | `<r attr="42"/>` | `inferTypes: false` | `"42"` (string) for `@_attr` | parseAttributeValue: false |
| X2J-39 | Scientific notation (inferTypes on) | `<r><n>1e5</n></r>` | `inferTypes: true` | `100000` (number) | Scientific notation handling |

### 1.5 XML Declarations and Processing Instructions

| ID | Description | Input XML | Options | Expected JSON | Rationale |
|----|-------------|-----------|---------|---------------|-----------|
| X2J-40 | Declaration stripped (default) | `<?xml version="1.0"?><r>v</r>` | `preserveDeclaration: false` | `{"r":"v"}` | `?xml` key deleted |
| X2J-41 | Declaration preserved | `<?xml version="1.0"?><r>v</r>` | `preserveDeclaration: true` | Contains `"?xml"` key | `?xml` key kept |
| X2J-42 | Declaration with encoding | `<?xml version="1.0" encoding="UTF-8"?><r/>` | `preserveDeclaration: true` | `?xml` has encoding attr | Full declaration preserved |
| X2J-43 | No declaration present, preserveDeclaration true | `<r>v</r>` | `preserveDeclaration: true` | `{"r":"v"}` | No `?xml` to preserve, no error |

### 1.6 Comments

| ID | Description | Input XML | Options | Expected JSON | Rationale |
|----|-------------|-----------|---------|---------------|-----------|
| X2J-50 | Comments stripped (default) | `<r><!-- note --><a>v</a></r>` | `preserveComments: false` | `{"r":{"a":"v"}}` | No comment key |
| X2J-51 | Comments preserved | `<r><!-- note --><a>v</a></r>` | `preserveComments: true` | Contains `"#comment"` key | Comment content captured |
| X2J-52 | Multiple comments | `<r><!-- one --><!-- two --><a/></r>` | `preserveComments: true` | Multiple comment entries | All comments preserved |

### 1.7 CDATA Sections

| ID | Description | Input XML | Expected JSON | Rationale |
|----|-------------|-----------|---------------|-----------|
| X2J-55 | CDATA with plain text | `<r><![CDATA[hello]]></r>` | `{"r":"hello"}` | CDATA unwrapped to string |
| X2J-56 | CDATA with XML-like content | `<r><![CDATA[<not>xml</not>]]></r>` | `{"r":"<not>xml</not>"}` | Angle brackets preserved as text |
| X2J-57 | CDATA with special characters | `<r><![CDATA[a & b < c]]></r>` | `{"r":"a & b < c"}` | Entities not decoded inside CDATA |

### 1.8 XML Entities

| ID | Description | Input XML | Expected JSON | Rationale |
|----|-------------|-----------|---------------|-----------|
| X2J-60 | Ampersand entity | `<r>a &amp; b</r>` | `{"r":"a & b"}` | `&amp;` decoded |
| X2J-61 | Less-than entity | `<r>a &lt; b</r>` | `{"r":"a < b"}` | `&lt;` decoded |
| X2J-62 | Greater-than entity | `<r>a &gt; b</r>` | `{"r":"a > b"}` | `&gt;` decoded |
| X2J-63 | Quote entity | `<r attr="a&quot;b"/>` | `{"r":{"@_attr":"a\"b"}}` | `&quot;` decoded in attribute |
| X2J-64 | Apostrophe entity | `<r>a &apos; b</r>` | `{"r":"a ' b"}` | `&apos;` decoded |
| X2J-65 | Numeric character reference | `<r>&#65;</r>` | `{"r":"A"}` | `&#65;` → `A` |

### 1.9 Namespaces

| ID | Description | Input XML | Expected JSON | Rationale |
|----|-------------|-----------|---------------|-----------|
| X2J-70 | Prefixed element | `<soap:Envelope xmlns:soap="http://..."><soap:Body/></soap:Envelope>` | Keys are `"soap:Envelope"`, `"soap:Body"` | Namespace prefix preserved in key name |
| X2J-71 | Default namespace | `<root xmlns="http://example.com"><a>v</a></root>` | `{"root":{"@_xmlns":"http://example.com","a":"v"}}` | xmlns treated as attribute |
| X2J-72 | Multiple namespace prefixes | `<r xmlns:a="..." xmlns:b="..."><a:x/><b:y/></r>` | Keys include `"a:x"` and `"b:y"` | All prefixes preserved |

### 1.10 Mixed Content

| ID | Description | Input XML | Expected JSON | Rationale |
|----|-------------|-----------|---------------|-----------|
| X2J-75 | Text + child element | `<p>Hello <b>world</b></p>` | Contains `#text` key with "Hello" | Mixed content splits text and elements |
| X2J-76 | Text before and after child | `<p>A <b>B</b> C</p>` | Both text fragments captured | Multiple text nodes |

### 1.11 Validation Errors (Invalid XML)

| ID | Description | Input | Expected error | Rationale |
|----|-------------|-------|----------------|-----------|
| X2J-80 | Unclosed tag | `<root><a></root>` | Error with line/column | XMLValidator catches unclosed tag |
| X2J-81 | Mismatched tags | `<a></b>` | Error | Tag name mismatch |
| X2J-82 | Missing root element | `text only` | Error | No root element |
| X2J-83 | Duplicate attributes | `<r a="1" a="2"/>` | Error | Duplicate attribute names |
| X2J-84 | Invalid tag name | `<123/>` | Error | Tag name starts with digit |
| X2J-85 | Unescaped ampersand | `<r>a & b</r>` | Error | Bare `&` is invalid |
| X2J-86 | Unescaped less-than | `<r>a < b</r>` | Error | Bare `<` in text is invalid |
| X2J-87 | Empty string input | `""` | `{ output: "", error: null }` | Empty input returns empty output (caught by trim check in hook) |
| X2J-88 | Whitespace-only input | `"   "` | Error or empty | Whitespace is not valid XML |

### 1.12 Edge Cases

| ID | Description | Input XML | Expected | Rationale |
|----|-------------|-----------|----------|-----------|
| X2J-90 | Very deeply nested (100 levels) | `<a><a>...(100 deep)...</a></a>` | Deeply nested JSON object | Stack depth stress test |
| X2J-91 | Very long text content (100KB) | `<r>{100KB string}</r>` | JSON with same text | Large text handling |
| X2J-92 | Many sibling elements (1000) | `<r><i>1</i>...<i>1000</i></r>` | Array of 1000 elements | Large array |
| X2J-93 | Unicode text content | `<r>日本語 🎉 émojis</r>` | Same unicode in JSON | Unicode preservation |
| X2J-94 | Empty root element | `<root/>` | `{"root":""}` | Self-closing root |
| X2J-95 | Attribute-only element | `<r id="1" class="a"/>` | Only `@_` keys | No text or children |
| X2J-96 | Multiline text content | `<r>line1\nline2\nline3</r>` | Preserved newlines | Whitespace within text |

---

## 2. `lib/converter.ts` — `jsonToXml()`

### 2.1 Basic Valid Conversions

| ID | Description | Input JSON | Expected XML | Rationale |
|----|-------------|------------|--------------|-----------|
| J2X-1 | Simple object | `{"root":"hello"}` | `<root>hello</root>` | Simplest conversion |
| J2X-2 | Nested object | `{"a":{"b":{"c":"v"}}}` | `<a><b><c>v</c></b></a>` | Nested elements |
| J2X-3 | Multiple keys | `{"root":{"a":"1","b":"2"}}` | `<root><a>1</a><b>2</b></root>` | Sibling elements |
| J2X-4 | Empty string value | `{"root":""}` | `<root></root>` | Empty text content |
| J2X-5 | Null value | `{"root":{"a":null}}` | `<root><a/></root>` or `<root><a></a></root>` | Null handling |

### 2.2 Top-Level Wrapping

| ID | Description | Input JSON | Expected XML | Rationale |
|----|-------------|------------|--------------|-----------|
| J2X-10 | Top-level array | `[1, 2, 3]` | `<root><item>1</item><item>2</item><item>3</item></root>` | Array wrapped in `<root><item>` |
| J2X-11 | Top-level array of objects | `[{"a":1},{"a":2}]` | `<root><item><a>1</a></item><item><a>2</a></item></root>` | Array of objects wrapped |
| J2X-12 | Top-level string primitive | `"hello"` | `<root>hello</root>` | String wrapped in `<root>` with `#text` |
| J2X-13 | Top-level number primitive | `42` | `<root>42</root>` | Number converted to string, wrapped |
| J2X-14 | Top-level boolean primitive | `true` | `<root>true</root>` | Boolean stringified, wrapped |
| J2X-15 | Top-level null | `null` | `<root>null</root>` | Null stringified, wrapped |
| J2X-16 | Single-key object (no extra wrapping) | `{"data":"v"}` | `<data>v</data>` | Single key becomes root element |
| J2X-17 | Multi-key top-level object | `{"a":"1","b":"2"}` | `<a>1</a><b>2</b>` | Keys become sibling elements (no forced root) |

### 2.3 Attributes

| ID | Description | Input JSON | Expected XML | Rationale |
|----|-------------|------------|--------------|-----------|
| J2X-20 | Single attribute | `{"book":{"@_id":"1"}}` | `<book id="1"/>` or `<book id="1"></book>` | `@_` prefix → XML attribute |
| J2X-21 | Attribute + text | `{"book":{"@_id":"1","#text":"Title"}}` | `<book id="1">Title</book>` | Attribute + text content |
| J2X-22 | Attribute + children | `{"r":{"@_id":"1","child":"v"}}` | `<r id="1"><child>v</child></r>` | Attribute + child elements |
| J2X-23 | Custom prefix `$` | `{"r":{"$id":"1"}}` with `attributePrefix: "$"` | `<r id="1"/>` | Custom prefix honored |
| J2X-24 | Multiple attributes | `{"r":{"@_a":"1","@_b":"2"}}` | `<r a="1" b="2"/>` | Multiple attributes rendered |

### 2.4 Arrays to Repeated Elements

| ID | Description | Input JSON | Expected XML | Rationale |
|----|-------------|------------|--------------|-----------|
| J2X-30 | Simple array | `{"r":{"item":["a","b","c"]}}` | `<r><item>a</item><item>b</item><item>c</item></r>` | Array → repeated sibling elements |
| J2X-31 | Array of objects | `{"r":{"item":[{"n":"a"},{"n":"b"}]}}` | `<r><item><n>a</n></item><item><n>b</n></item></r>` | Array of objects → repeated complex elements |
| J2X-32 | Single-element array | `{"r":{"item":["a"]}}` | `<r><item>a</item></r>` | Single-element array → single element |
| J2X-33 | Empty array | `{"r":{"item":[]}}` | `<r/>` or `<r></r>` | Empty array → no child elements |
| J2X-34 | Nested arrays | `{"r":{"a":[{"b":["x","y"]}]}}` | Nested repeated elements | Multi-level array nesting |
| J2X-35 | Array of mixed types | `{"r":{"item":[1,"two",true,null]}}` | All values as text content | Mixed types all stringified |

### 2.5 XML Declaration

| ID | Description | Input JSON | Options | Expected XML starts with | Rationale |
|----|-------------|------------|---------|--------------------------|-----------|
| J2X-40 | Declaration off (default) | `{"r":"v"}` | `preserveDeclaration: false` | `<r>` | No declaration prepended |
| J2X-41 | Declaration on | `{"r":"v"}` | `preserveDeclaration: true` | `<?xml version="1.0" encoding="UTF-8"?>` | Declaration prepended |

### 2.6 Comments

| ID | Description | Input JSON | Options | Expected XML | Rationale |
|----|-------------|------------|---------|--------------|-----------|
| J2X-45 | Comment property preserved | `{"r":{"#comment":"note","a":"v"}}` | `preserveComments: true` | Contains `<!-- note -->` | `#comment` → XML comment |
| J2X-46 | Comment property stripped | `{"r":{"#comment":"note","a":"v"}}` | `preserveComments: false` | No comment in output | `#comment` key ignored |

### 2.7 Special Characters in Values

| ID | Description | Input JSON | Expected XML | Rationale |
|----|-------------|------------|--------------|-----------|
| J2X-50 | Ampersand in value | `{"r":"a & b"}` | `<r>a &amp; b</r>` | `&` escaped to `&amp;` |
| J2X-51 | Less-than in value | `{"r":"a < b"}` | `<r>a &lt; b</r>` | `<` escaped to `&lt;` |
| J2X-52 | Greater-than in value | `{"r":"a > b"}` | `<r>a &gt; b</r>` | `>` escaped |
| J2X-53 | Quote in attribute value | `{"r":{"@_a":"he said \"hi\""}}` | Attribute properly escaped | `"` escaped in attribute |
| J2X-54 | Unicode in value | `{"r":"日本語 🎉"}` | `<r>日本語 🎉</r>` | Unicode passed through |

### 2.8 Indentation

| ID | Description | Options | Expected | Rationale |
|----|-------------|---------|----------|-----------|
| J2X-60 | 2-space indent | `indentation: "  "` | Each level indented by 2 spaces | Default indent |
| J2X-61 | 4-space indent | `indentation: "    "` | Each level indented by 4 spaces | Custom indent |
| J2X-62 | Tab indent | `indentation: "\t"` | Each level indented by tab | Tab indent |

### 2.9 JSON Parse Errors

| ID | Description | Input | Expected error | Rationale |
|----|-------------|-------|----------------|-----------|
| J2X-70 | Missing closing brace | `{"a": 1` | Error with message | JSON.parse fails |
| J2X-71 | Trailing comma | `{"a": 1,}` | Error | Strict JSON |
| J2X-72 | Single quotes | `{'a': 1}` | Error | Not valid JSON |
| J2X-73 | Unquoted key | `{a: 1}` | Error | Not valid JSON |
| J2X-74 | Empty string | `""` (empty) | `{ output: "", error: null }` | Empty returns empty |
| J2X-75 | Error with position extraction | `{"a": }` | Error with line and column populated | Position regex match branch |
| J2X-76 | Error without position in message | Custom throw | Error with undefined line/column | Position regex miss branch |

### 2.10 Edge Cases

| ID | Description | Input JSON | Expected | Rationale |
|----|-------------|------------|----------|-----------|
| J2X-80 | Very deeply nested (100 levels) | 100-deep nested objects | Deeply nested XML | Stack depth |
| J2X-81 | Very large array (1000 items) | `{"r":{"i":[ ...1000 items ]}}` | 1000 repeated elements | Large output |
| J2X-82 | Key with special XML chars | `{"a&b":"v"}` | Element name handling | Invalid XML tag name from JSON key |
| J2X-83 | Key with spaces | `{"my key":"v"}` | Element name handling | Spaces invalid in XML tag names |
| J2X-84 | Key starting with number | `{"1a":"v"}` | Element name handling | Numbers invalid as tag start |
| J2X-85 | Empty object | `{}` | Empty or minimal output | No content to build |
| J2X-86 | Nested empty objects | `{"r":{"a":{}}}` | `<r><a/></r>` or similar | Empty child |

---

## 3. Round-Trip Fidelity

These tests verify that converting A→B→A produces the original (or documents where it cannot).

### 3.1 JSON → XML → JSON

| ID | Description | Input JSON | Expected after round-trip | Fidelity? | Rationale |
|----|-------------|------------|---------------------------|-----------|-----------|
| RT-1 | Simple object | `{"root":{"a":"1","b":"2"}}` | Same | Yes | No lossy features |
| RT-2 | Object with attributes | `{"r":{"@_id":"1","#text":"v"}}` | Same | Yes | Attributes round-trip via prefix |
| RT-3 | Array | `{"r":{"item":["a","b"]}}` | Same | Yes | Array preserved |
| RT-4 | Single-element array | `{"r":{"item":["a"]}}` | `{"r":{"item":"a"}}` | **No** | Single element collapses to scalar (unless alwaysArray) |
| RT-5 | Single-element array (alwaysArray) | `{"r":{"item":["a"]}}` with alwaysArray | Same | Yes | alwaysArray prevents collapse |
| RT-6 | Numeric value | `{"r":{"n":42}}` | `{"r":{"n":"42"}}` | **No** | XML loses type → number becomes string |
| RT-7 | Numeric value (inferTypes) | `{"r":{"n":42}}` with inferTypes | Same | Yes | Type inference restores number |
| RT-8 | Boolean value | `{"r":{"b":true}}` | `{"r":{"b":"true"}}` | **No** | Boolean becomes string |
| RT-9 | Boolean value (inferTypes) | `{"r":{"b":true}}` with inferTypes | Same | Yes | Type inference restores boolean |
| RT-10 | Null value | `{"r":{"n":null}}` | Lossy | **No** | Null has no XML equivalent |
| RT-11 | Top-level array | `[1,2,3]` | `{"root":{"item":["1","2","3"]}}` | **No** | Wrapping adds structure |

### 3.2 XML → JSON → XML

| ID | Description | Input XML | Expected after round-trip | Fidelity? | Rationale |
|----|-------------|-----------|---------------------------|-----------|-----------|
| RT-20 | Simple element | `<root><a>v</a></root>` | Same (modulo whitespace) | Yes | No lossy features |
| RT-21 | Element with attributes | `<r id="1"><a>v</a></r>` | Same | Yes | Attributes round-trip |
| RT-22 | Repeated elements | `<r><i>a</i><i>b</i></r>` | Same | Yes | Array → repeated elements |
| RT-23 | XML declaration | `<?xml version="1.0"?><r/>` | Declaration lost | **No** | Declaration stripped by default |
| RT-24 | XML declaration (preserve both) | `<?xml version="1.0"?><r/>` with both preserve flags | Same | Yes | Both directions preserve |
| RT-25 | Comments | `<r><!-- note --><a/></r>` | Comments lost | **No** | Comments stripped by default |
| RT-26 | CDATA | `<r><![CDATA[content]]></r>` | `<r>content</r>` | **No** | CDATA wrapper lost |
| RT-27 | Whitespace formatting | `<r>\n  <a>v</a>\n</r>` | Different whitespace | **No** | Re-serialization reformats |
| RT-28 | Mixed content | `<p>Hello <b>world</b></p>` | Structure altered | **No** | Mixed content has no clean JSON representation |
| RT-29 | Namespace prefixes | `<s:Envelope xmlns:s="..."><s:Body/></s:Envelope>` | Prefix preserved, xmlns as attribute | Partial | Prefix in key names, but namespace URI becomes attribute |

---

## 4. `lib/formatter.ts`

### 4.1 `prettifyJson()`

| ID | Description | Input | Indent | Expected | Rationale |
|----|-------------|-------|--------|----------|-----------|
| FJ-1 | Minified JSON, 2-space | `{"a":1,"b":2}` | `"  "` | Pretty-printed with 2-space indent | Basic formatting |
| FJ-2 | Minified JSON, 4-space | `{"a":1}` | `"    "` | 4-space indent | Custom indent |
| FJ-3 | Minified JSON, tab | `{"a":1}` | `"\t"` | Tab indent | Tab indent |
| FJ-4 | Already pretty JSON | `{\n  "a": 1\n}` | `"  "` | Same output | Idempotent |
| FJ-5 | Nested object | `{"a":{"b":{"c":1}}}` | `"  "` | Each level indented | Deep nesting |
| FJ-6 | Array | `[1,2,3]` | `"  "` | Array elements on separate lines | Array formatting |
| FJ-7 | Invalid JSON | `{bad}` | any | Throws | JSON.parse fails |
| FJ-8 | Empty object | `{}` | `"  "` | `{}` | Empty object stays compact |

### 4.2 `minifyJson()`

| ID | Description | Input | Expected | Rationale |
|----|-------------|-------|----------|-----------|
| MJ-1 | Pretty JSON | `{\n  "a": 1\n}` | `{"a":1}` | Whitespace removed |
| MJ-2 | Already minified | `{"a":1}` | `{"a":1}` | Idempotent |
| MJ-3 | Nested with whitespace | Deep pretty JSON | Single line | All whitespace collapsed |
| MJ-4 | Invalid JSON | `{bad}` | Throws | JSON.parse fails |

### 4.3 `prettifyXml()`

| ID | Description | Input | Indent | Expected | Rationale |
|----|-------------|-------|--------|----------|-----------|
| FX-1 | Minified XML | `<r><a>v</a></r>` | `"  "` | Each tag on own line, indented | Basic formatting |
| FX-2 | Self-closing tag | `<r><empty/></r>` | `"  "` | Self-closing on own indented line | Self-closing branch |
| FX-3 | XML declaration | `<?xml version="1.0"?><r/>` | `"  "` | Declaration on first line, no indent | Declaration branch |
| FX-4 | Comment | `<r><!-- note --><a/></r>` | `"  "` | Comment indented on own line | Comment branch |
| FX-5 | Text content inline | `<r><a>text</a></r>` | `"  "` | Text stays inline with opening tag | Text token branch |
| FX-6 | Mixed tags and text | `<r>text<a/></r>` | `"  "` | Text inline, child indented | Mixed text + element |
| FX-7 | Tab indent | `<r><a>v</a></r>` | `"\t"` | Tab indentation | Custom indent |
| FX-8 | Already pretty XML | Formatted XML | `"  "` | Same (idempotent after normalize) | Idempotent |
| FX-9 | Null token match | Non-XML garbage | any | Returns input unchanged | `!tokens` guard |
| FX-10 | Empty text node | `<r>   </r>` | No extra text line | Whitespace-only text trimmed | `if (trimmed)` branch |
| FX-11 | Deeply nested (5 levels) | 5-level nesting | Each level indented more | Depth tracking accuracy |

### 4.4 `minifyXml()`

| ID | Description | Input | Expected | Rationale |
|----|-------------|-------|----------|-----------|
| MX-1 | Pretty XML | `<r>\n  <a>v</a>\n</r>` | `<r><a>v</a></r>` | Whitespace between tags removed |
| MX-2 | Already minified | `<r><a>v</a></r>` | Same | Idempotent |
| MX-3 | Multiple blank lines | `<r>\n\n\n<a/>\n</r>` | `<r><a/></r>` | All newlines removed |
| MX-4 | Leading/trailing whitespace | `  <r/>  ` | `<r/>` | Trimmed |

---

## 5. `lib/validator.ts`

### 5.1 `validateJson()`

| ID | Description | Input | Expected | Rationale |
|----|-------------|-------|----------|-----------|
| VJ-1 | Valid JSON object | `{"a": 1}` | `null` | No error |
| VJ-2 | Valid JSON array | `[1, 2]` | `null` | No error |
| VJ-3 | Valid JSON primitive | `"hello"` | `null` | No error |
| VJ-4 | Missing closing brace | `{"a": 1` | Error with message | Parse failure |
| VJ-5 | Error with position | `{"a": }` | Error with line + column populated | `position N` regex match |
| VJ-6 | Error without position | Depends on engine | Error with undefined line/column | Regex miss branch |
| VJ-7 | Empty string | `` | Error | Not valid JSON |
| VJ-8 | Non-Error throw | N/A (synthetic) | `String(e)` used for message | `e instanceof Error` false branch |

### 5.2 `validateXml()`

| ID | Description | Input | Expected | Rationale |
|----|-------------|-------|----------|-----------|
| VX-1 | Valid XML | `<root><a/></root>` | `null` | No error |
| VX-2 | Self-closing | `<root/>` | `null` | No error |
| VX-3 | With declaration | `<?xml version="1.0"?><r/>` | `null` | No error |
| VX-4 | Unclosed tag | `<root><a>` | Error with line, column, message | Validation fails |
| VX-5 | Mismatched tags | `<a></b>` | Error | Tag mismatch |
| VX-6 | No root element | `plain text` | Error | Not XML |
| VX-7 | Invalid character in tag | `<123/>` | Error | Invalid tag name |
| VX-8 | Unescaped ampersand | `<r>a & b</r>` | Error | Bare `&` |
| VX-9 | Empty string | `` | Error | Not valid XML |

---

## 6. `hooks/useAutoDetect.ts` — `detectFormat()`

| ID | Description | Input | Expected | Rationale |
|----|-------------|-------|----------|-----------|
| AD-1 | Starts with `{` | `{"a":1}` | `"json"` | Object detection |
| AD-2 | Starts with `[` | `[1,2]` | `"json"` | Array detection |
| AD-3 | Starts with `<` | `<root/>` | `"xml"` | XML detection |
| AD-4 | Leading whitespace + `{` | `  \n {"a":1}` | `"json"` | Whitespace trimmed before check |
| AD-5 | Leading whitespace + `<` | `  \n <root/>` | `"xml"` | Whitespace trimmed |
| AD-6 | Starts with letter | `hello` | `"unknown"` | Not JSON or XML |
| AD-7 | Starts with digit | `123` | `"unknown"` | Bare number not detected as JSON |
| AD-8 | Empty string | `` | `"unknown"` | No content |
| AD-9 | Whitespace only | `   ` | `"unknown"` | Trimmed to empty |
| AD-10 | Starts with `"` | `"hello"` | `"unknown"` | String literal not detected (no `{`/`[`/`<`) |

---

## 7. Configuration Options Interaction Tests

These verify that combinations of options work correctly together.

| ID | Description | Options Combination | Input | Verify | Rationale |
|----|-------------|---------------------|-------|--------|-----------|
| OPT-1 | alwaysArray + inferTypes (XML→JSON) | Both true | `<r><n>42</n></r>` | `{"r":{"n":[42]}}` — value is number inside array | Both options applied |
| OPT-2 | preserveComments + preserveDeclaration (XML→JSON) | Both true | `<?xml version="1.0"?><!-- c --><r/>` | Both `?xml` and `#comment` in output | Both preserved |
| OPT-3 | Custom attributePrefix + custom textNodeName | `attributePrefix: "$", textNodeName: "_text"` | `<r id="1">v</r>` | `{"r":{"$id":"1","_text":"v"}}` | Custom conventions |
| OPT-4 | alwaysArray + preserveComments (XML→JSON) | Both true | `<r><!-- c --><a>v</a></r>` | Comments and arrays both present | Combined output |
| OPT-5 | 4-space indent (JSON→XML) | `indentation: "    "` | `{"r":{"a":"v"}}` | Output indented by 4 spaces | Indentation passed to builder |
| OPT-6 | Tab indent (XML→JSON) | `indentation: "\t"` | `<r><a>v</a></r>` | JSON output uses tabs | Indentation passed to JSON.stringify |
| OPT-7 | inferTypes off + attribute with number (XML→JSON) | `inferTypes: false` | `<r count="42"/>` | `"@_count": "42"` (string) | Attribute value stays string |
| OPT-8 | inferTypes on + attribute with number (XML→JSON) | `inferTypes: true` | `<r count="42"/>` | `"@_count": 42` (number) | Attribute value parsed to number |

---

## 8. Test Count Summary

| Module | Test Count |
|--------|------------|
| `xmlToJson()` — basic | 6 |
| `xmlToJson()` — attributes | 7 |
| `xmlToJson()` — arrays | 8 |
| `xmlToJson()` — type inference | 10 |
| `xmlToJson()` — declarations | 4 |
| `xmlToJson()` — comments | 3 |
| `xmlToJson()` — CDATA | 3 |
| `xmlToJson()` — entities | 6 |
| `xmlToJson()` — namespaces | 3 |
| `xmlToJson()` — mixed content | 2 |
| `xmlToJson()` — validation errors | 9 |
| `xmlToJson()` — edge cases | 7 |
| `jsonToXml()` — basic | 5 |
| `jsonToXml()` — wrapping | 8 |
| `jsonToXml()` — attributes | 5 |
| `jsonToXml()` — arrays | 6 |
| `jsonToXml()` — declaration | 2 |
| `jsonToXml()` — comments | 2 |
| `jsonToXml()` — special chars | 5 |
| `jsonToXml()` — indentation | 3 |
| `jsonToXml()` — parse errors | 7 |
| `jsonToXml()` — edge cases | 7 |
| Round-trip JSON→XML→JSON | 11 |
| Round-trip XML→JSON→XML | 10 |
| `prettifyJson()` | 8 |
| `minifyJson()` | 4 |
| `prettifyXml()` | 11 |
| `minifyXml()` | 4 |
| `validateJson()` | 8 |
| `validateXml()` | 9 |
| `detectFormat()` | 10 |
| Options interaction | 8 |
| **Total** | **204** |
