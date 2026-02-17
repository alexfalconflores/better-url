<h1 align="center">
  BetterURL
  <br />
  <img src="https://github.com/alexfalconflores/better-url/blob/87e177f3c85b79299b7a6b8bbe3f0a7f342e77e8/logo.svg" alt="BetterURL logo" width="150"/>
</h1>

<p align="center">
<strong>Fluent API to build more readable, stringable and expressive URLs and paths.</strong><br />  
TypeScript utilities on top of the native <code>URL</code> and <code>URLSearchParams</code> with chainable, immutable-friendly methods to handle paths, queries, authentication and fragments easily.
</p>

---

## 🚀 Installation

```bash
npm install @alexfalconflores/better-url
// or
bun install @alexfalconflores/better-url
```

## ✨  Features

- Based on native `URL` and `URLSearchParams`
- Fluent, chainable API (mutable and immutable variants)
- Basic Auth support (`auth`)
- Dynamic paths with normalization and templates
- Powerful query params handling:
  - Arrays with configurable formats: `"repeat"`, `"comma"`, `"bracket"`
  - Append / set / toggle helpers
  - Strong typing for query params
- URL fragments and hash helpers
- Relative path builder for frontend routing (`BetterPath`)
- Standalone query params helper (`BetterParams`)

## 📚 Packages / Main APIs

BetterURL exports three main building blocks:

- **BetterURL<TQueryParams>**: Wrapper around the native `URL` for absolute/relative URLs, ideal for backend, API clients, SSR, etc.
- **BetterParams**: Enhanced `URLSearchParams` with array formats, immutable helpers and UI utilities.
- **BetterPath<TQueryParams>**: Relative path builder for frontend routing (Next.js / React Router).

All of them are written in TypeScript and support generics for your query parameters.

## 🌐 BetterURL – URL builder

### Create a new instance
```ts
import BetterURL from "@alexfalconflores/better-url";

type Params = {
  search?: string;
  page?: number;
  sort?: "asc" | "desc";
  tags?: string[];
};

const url = new BetterURL<Params>("https://example.com");
```

You can also use a relative URL with a base:

```ts
const users = new BetterURL<Params>("/users", "https://example.com");
```

### 🔐 Basic auth
```ts
url.auth("admin", "1234");
// https://admin:1234@example.com
```

### 🔧 portNumber and path
```ts
url.portNumber(8080).path("api", "v1", "users");
// https://admin:1234@example.com:8080/api/v1/users
```

`path(...)` is `immutable` (returns a new instance), while ‎`joinPath(...)` `mutates` the current URL:
```ts
const base = new BetterURL<Params>("https://example.com");
const users = base.path("users");     // base keeps "/"
base.joinPath("status");             // base is now "/status"
```

### 🧩 Template paths
```ts
url.template("/users/:id/edit", { id: 5 });
// https://.../users/5/edit
```

### 🔍 Query parameters with typing

BetterURL works with `TQueryParams` for suggestions and type safety.
```ts
type QueryParams = {
  search: string;
  page?: number;
  sort?: "asc" | "desc";
  tags?: string[];
};

const url = new BetterURL<QueryParams>("https://example.com/users");
```

### ➕ addQuery (append)
```ts 
url.addQuery("search", "john").addQuery("sort", "asc");
// https://example.com/users?search=john&sort=asc
```

### ♻ setQuery (overwrite)
```ts
url.setQuery("search", "doe").setQuery("page", 2);
// ?search=doe&page=2
```

### 🧲 toggleQuery (UI helper)

Ideal for checkbox filters or active tags.
```ts
// ?tags=shoes
url.toggleQuery("tags", "shoes"); // -> ? (empty)
url.toggleQuery("tags", "hats");  // -> ?tags=hats
```

### ✅ hasQueryValue
```ts
url.setQuery("tags", ["a", "b"]);
url.hasQueryValue("tags", "a"); // true
```

### 🧺 Batch helpers
```ts
url.addQueryParams({ search: "john", sort: "asc" });
// ?search=john&sort=asc

url.setQueryParams({ page: 2, tags: ["a", "b"] });
// ?search=john&sort=asc&page=2&tags=a&tags=b
```

### 🧹 Omit / Pick
```ts
const clean = url.omit(["page", "sort"]);
const onlyPaging = url.pick(["page"]);
```

Both methods return a new instance (`immutable`).

### ⚙ Array formats and options

You can configure how arrays are serialized:
```ts
const url = new BetterURL<QueryParams>("https://example.com/users")
  .config({ arrayFormat: "bracket" });
url.setQuery("tags", ["a", "b"]);
// ?tags[]=a&tags[]=b
```

Supported `arrayFormat` values:

- `"repeat"` (default): `?tags=a&tags=b`
- `"comma"`: `?tags=a,b`

- `"bracket"`: `?tags[]=a&tags[]=b`

You can also skip `null` / `undefined` values globally:
```ts
url.config({
  skipNull: true,
  skipUndefined: true,
});
```

## 🧭 Relative paths for Next.js / React Router – **BetterPath**

When working on the frontend, you often only need a relative path (`/users?page=2`) without a domain. That's what `BetterPath` is for.
```ts
import { BetterPath } from "@alexfalconflores/better-url";

type UsersQuery = {
  page?: number;
  search?: string;
  tags?: string[];
};

const base = new BetterPath<UsersQuery>("/users");
```

### 🔀 Inmutable vs mutable
```ts
const detail = base.path(123);

// base -> "/users"
// detail -> "/users/123"

base.joinPath("active");

// base -> "/users/active"
```

- `path(...)` → returns a new copy.

- `joinPath(...)` → changes the current path.

### 🧩 Template routes

```ts
const edit = new BetterPath("/users").template("/users/:id/edit", { id: 10 });
// "/users/10/edit"
```

### 🔍 Query helpers

**BetterPath** uses **BetterParams** internally, with the same array features and UI helpers.
```ts
const list = new BetterPath<UsersQuery>("/users")
  .config({ arrayFormat: "repeat" })
  .withQuery("page", 2)
  .withAddedQuery("tags", ["a", "b"]);
list.toString();
// "/users?page=2&tags=a&tags=b"
```

Typical use in Next.js:
```ts
import Link from "next/link";
const base = new BetterPath<UsersQuery>("/users");

<Link href={(base.withQuery("page", 2).toString()) as Route}>Next page</Link>;
```

## 🧪 BetterParams – enhanced URLSearchParams

`BetterParams` is an extension of `URLSearchParams` for when you only want to handle queries:
```ts
import { BetterParams } from "@alexfalconflores/better-url";

const params = new BetterParams({ tags: ["a", "b"], search: "john" });

// tags=a&tags=b&search=john

params
  .config({ arrayFormat: "bracket" })
  .setQuery("tags", ["a", "b", "c"]);

params.toString();

// tags[]=a&tags[]=b&tags[]=c&search=john
```

### 🔁 Immutable helpers
```ts
const next = params.withQuery("page", 2);
// params remains the same, `next` is a copy with `page=2`.
const filtered = params.omit(["search"]);
const onlyTags = params.pick(["tags"]);
```


### 📦 toObject
```ts
const obj = params.toObject();
// { tags: ["a", "b", "c"], search: "john" }
```

### 🔁 Immutable patterns recap

Most methods offer two flavors:

- **Mutable**: modify the current instance (useful in simple builders).
- **Inmutable**: return a new copy (ideal for React state, reducers, etc.).

Typical pattern:
```ts
const url = new BetterURL<Params>("https://example.com/users");

// Mutable
url.setQuery("page", 2);

// Immutable
const newUrl = url.withQuery("page", 3);
```

En `BetterPath`:
```ts
const base = new BetterPath<UsersQuery>("/users");
const page2 = base.withQuery("page", 2); // base intact
```

### 🧠 Strong typing
```ts
type QueryParams = {
  search: string;
  page: number;
};

const url = new BetterURL<QueryParams>("https://example.com/users");

url.addQuery("search", "hello"); // ✅
url.addQuery("unknown", "value"); // ❌ TypeScript error: 'unknown' is not in QueryParams
```

---

## 🧰 Summary of main methods (BetterURL)

|Método                      |Descripción                                        |
|----------------------------|---------------------------------------------------|
|`.auth(user, pass)`         |Adds credentials to the URL (Basic Auth)           |
|`.portNumber(port)`         |Defines the port                                   |
|`.path(...segments)`        |Immutable path builder (returns a new URL)         |
|`.joinPath(...segments)`    |Mutable path builder                               |
|`.template(pattern, params)`|Replaces `:params` in the path                     |
|`.addQuery(key, value)`     |Appends a query param (array-friendly)             |
|`.withAddedQuery(k, v)`     |Immutable append                                   |
|`.setQuery(key, value)`     |Sets / overwrites a query param                    |
|`.withQuery(k, v)`          |Immutable set                                      |
|`.toggleQuery(k, v)`        |Toggles one value in an array-like param           |
|`.addQueryParams(obj)`      |Batch append from object                           |
|`.setQueryParams(obj)`      |Batch set from object                              |
|`.withQueryParams(obj)`     |Immutable batch set                                |
|`.removeQuery(key)`         |Removes a query param                              |
|`.clearQuery()`             |Clears all query params                            |
|`.omit(keys)`               |Returns a new URL without given keys               |
|`.pick(keys)`               |Returns a new URL keeping only given keys          |
|`.fragment(str)`            |Sets the hash fragment (`#fragment`)               |
|`.toRelative()`             |Returns `pathname + search + hash`                 |
|`.toObject()`               |Returns query params as a JS object                |
|`.clone()`                  |Creates a deep copy of the instance and its options|

---

## 🧰 Summary of main methods (BetterPath)

| Method                            | Description                                                   |
| --------------------------------- | ------------------------------------------------------------- |
| `new BetterPath(path)`            | Creates a new relative path (normalizes leading `/`)         |
| `.path(...segments)`             | Immutable: returns a new BetterPath with extra segments      |
| `.joinPath(...segments)`         | Mutable: appends segments to the current path                |
| `.template(pattern, params)`     | Replaces `:params` in the path (e.g. `/users/:id`)           |
| `.config(options)`               | Sets serialization options (e.g. `arrayFormat`)              |
| `.addQuery(key, value)`          | Mutable: appends a query param                               |
| `.withAddedQuery(key, value)`    | Immutable append of a query param                            |
| `.setQuery(key, value)`          | Mutable: sets/overwrites a query param                       |
| `.withQuery(key, value)`         | Immutable: returns copy with updated param                   |
| `.toggleQuery(key, value)`       | Mutable: toggles a value in an array-like param              |
| `.hasQueryValue(key, value)`     | Checks if a value exists for a given key                     |
| `.removeQuery(key)`              | Deletes a query param (and `key[]` when using brackets)      |
| `.omit(keys)`                    | Immutable: returns copy without given keys                   |
| `.pick(keys)`                    | Immutable: returns copy keeping only given keys              |
| `.clearQuery()`                  | Clears all query params                                      |
| `.toString()`                    | Returns `pathname + ?query` as a relative string             |
| `.toAbsolute(baseUrl)`           | Builds a BetterURL from this path and a base URL             |
| `.toObject()`                    | Returns query params as a JS object                          |

---

## 🧰 Summary of main methods (BetterParams)

| Method                            | Description                                                   |
| --------------------------------- | ------------------------------------------------------------- |
| `new BetterParams(init?)`        | Creates params from string, object, URLSearchParams, etc.    |
| `.config(options)`               | Sets `arrayFormat` and other options                         |
| `.addQuery(key, value)`          | Mutable: appends a value (handles arrays)                    |
| `.withAddedQuery(key, value)`    | Immutable: returns copy with appended value                  |
| `.setQuery(key, value)`          | Mutable: sets/overwrites value and cleans old formats        |
| `.withQuery(key, value)`         | Immutable: returns copy with value set                       |
| `.hasQueryValue(key, value)`     | Checks if a specific value is present for a key              |
| `.toggleQuery(key, value)`       | Mutable: toggles a value in an array-like param              |
| `.deleteKeys(keys)`              | Mutable: deletes multiple keys                               |
| `.deleteKeysExcept(keysToKeep)`  | Mutable: keeps only the given keys, deletes the rest         |
| `.omit(keys)`                    | Immutable: returns copy without the given keys               |
| `.pick(keys)`                    | Immutable: returns copy keeping only the given keys          |
| `.toObject()`                    | Returns params as JS object (arrays preserved)               |
| `.clone()`                       | Deep clone, preserving configuration                         |
| `.toString()`                    | Serializes to a query string using current options           |

## 👤 Author

Alex Stefano Falcon Flores

- 🐙 GitHub: [alexfalconflores](https://github.com/alexfalconflores)
- 💼 LinkedIn: [alexfalconflores](https://www.linkedin.com/in/alexfalconflores/)
- 🌐 Website: [alexfalconflores](https://www.alexfalconflores.com/)

---

## 📄 License

This project is licensed under the MIT license. See the LICENSE ↗ file for more details.

<p align="center">
⭐ <strong>Find it useful?</strong> Give it a star on GitHub.<br />
Built with ❤️ in Peru 🇵🇪
</p>
