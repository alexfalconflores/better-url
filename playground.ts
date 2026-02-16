import { BetterURL } from "./src/BetterUrl";

console.log("--- 🧪 INICIANDO PRUEBAS MANUALES ---");

// 1. Prueba de Path y Templating (Fix de replaceAll)
const url1 = new BetterURL("https://api.com")
  .joinPath("v1", "//users//") // Debería limpiar slashes
  .template("/posts/:id/comments/:id", { id: 999 }); // Debería reemplazar AMBOS

console.log("1. Path & Template:", url1.toString());
// Esperado: https://api.com/posts/999/comments/999

// 2. Prueba de Arrays (Default: Repeat)
const url2 = new BetterURL("https://api.com").setQuery("tags", [
  "news",
  "tech",
]);

console.log("2. Arrays (Repeat):", url2.search);
// Esperado: ?tags=news&tags=tech

// 3. Prueba de Arrays (Comma)
const url3 = new BetterURL("https://api.com")
  .config({ arrayFormat: "comma" })
  .setQuery("ids", [10, 20, 30]);

console.log("3. Arrays (Comma): ", url3.search);
// Esperado: ?ids=10,20,30

// 4. Prueba de Arrays (Bracket + SetQuery Fix)
const url4 = new BetterURL("https://api.com")
  .config({ arrayFormat: "bracket" })
  .setQuery("filters", ["a", "b"]);

// Intentamos SOBRESCRIBIR (El bug anterior agregaba en vez de reemplazar)
url4.setQuery("filters", ["c"]);

console.log("4. Arrays (Bracket):", url4.search);
// Esperado: ?filters[]=c  (NO debería estar a ni b)

// 5. Prueba de Null/Undefined
const url5 = new BetterURL("https://api.com")
  .setQuery("valid", "yes")
  .setQuery("invalid", undefined) // Debería ignorarse
  .setQuery("nullValue", null); // Debería ignorarse

console.log("5. Null/Undefined: ", url5.search);
// Esperado: ?valid=yes

// 6. Prueba de Puerto y Auth
const url6 = new BetterURL("https://mi-servidor.com")
  .portNumber(8080)
  .auth("admin", "1234");

console.log("6. Port & Auth:    ", url6.href);
// Esperado: https://admin:1234@mi-servidor.com:8080/

console.log("--- ✅ FIN ---");
