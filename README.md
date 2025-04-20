<h1 align="center">
  BetterURL
  <br />
  <img src="https://github.com/alexfalconflores/better-url/blob/87e177f3c85b79299b7a6b8bbe3f0a7f342e77e8/logo.svg" alt="BetterURL logo" width="150"/>
</h1>

<p align="center">
  <strong>Fluent API to build more readable, stringable and expressive URLs.</strong><br />
  Native object extension <code>URL</code> in TypeScript with chainable methods to handle paths, queries, authentication and fragments easily.
</p>

---

## 🚀 Installation

```bash
npm install @alexfalconflores/better-url
```

✨ Features

- Based on native object URL
- Seamless API with method chaining
- Authentication support (auth)
- Dynamic paths with normalization
- Query parameters (query, setQuery, tryQuery, etc.)
- Fragments (#anchor)
- Generic typing for your query parameters

## 📦 Examples of use

### ⚙️ Create a new instance

```ts
import BetterURL from "@alexfalconflores/better-url";

type Params = {
  search: string;
  page?: number;
  sort?: "asc" | "desc";
};

const url = new BetterURL<Params>("https://example.com");
```

### 🔐 auth

```ts
url.auth("admin", "1234");
// https://admin:1234@example.com
```

### 🔧 portNumber y path

```ts
url.portNumber(8080).path("api/v1/users");
// https://admin:1234@example.com:8080/api/v1/users
```

### 🧭 query

```ts
url.query("search", "john").query("sort", "asc");
// https://.../api/v1/users?search=john&sort=asc
```

### ❔tryQuery

```ts
const optionalPage = undefined;

url.tryQuery("page", optionalPage); // No se añade nada
```

### 🔁 (setQuery, trySetQuery)

```ts
url.setQuery("search", "doe").trySetQuery("page", 2);
// ?search=doe&page=2
```

### ❌ (removeQuery, clearQuery)

```ts
url.removeQuery("sort");
url.clearQuery();
// ? (queda vacío)
```

### 🧩 (fragment)

```ts
url.fragment("top");
// #top
```

### 🧪 Final result

```ts
console.log(url.toString());
// https://admin:1234@example.com:8080/api/v1/users?search=doe&page=2#top
```

## 🧠 Strong typing

```ts
type QueryParams = {
  search: string;
  page: number;
};

url.query("search", "hello"); // ✅
url.query("unknown", "value"); // ❌ Error: 'unknown' no está en Params
```

## 🧰 Available methods

| Method               | Description                                         |
| -------------------- | --------------------------------------------------- |
| `.auth(user, pass)`  | Add credentials to the URL                          |
| `.portNumber(port)`  | Defines the port                                    |
| `.path(path)`        | Add routes (normalize `/`)                          |
| `.query(key, value)` | Add a query param (use `TQueryParams` typing)       |
| `.tryQuery(...)`     | Add a query only if the value is not null/undefined |
| `.setQuery(...)`     | Sets or replaces a query                            |
| `.trySetQuery(...)`  | Same as `.setQuery` but conditional                 |
| `.removeQuery(key)`  | Removes a query parameter                           |
| `.clearQuery() `     | Deletes all parameters                              |
| `.fragment(str)`     | Add or replace a `#fragment`                        |

## 👤 Autor

Alex Stefano Falcon Flores

- 🐙 GitHub: [alexstefano](https://github.com/alexfalconflores)
- 💼 LinkedIn: [alexsfalconflores](https://www.linkedin.com/in/alexfalconflores/)

## 📄 License

This project is licensed under the MIT license. See the [LICENSE](./LICENSE) file for more details.

## ⭐ Do you like it?

Give the repo a star to support the project!
And if you use it in your projects, I'd love to see it! 🎉
