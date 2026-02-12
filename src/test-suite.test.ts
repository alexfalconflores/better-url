import { BetterURL } from "./BetterUrl"; // Asegura que las rutas sean correctas
import { BetterPath } from "./BetterPath";
import { BetterParams } from "./BetterParams";

console.log("🚀 Iniciando Test Suite Maestro: God Mode v2.0\n");

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${label}`);
    if (details) console.error(`   -> ${details}`);
    failed++;
  }
}

try {
  // ==========================================
  // 1. TEST DE BetterParams (El Motor)
  // ==========================================
  console.log("\n🧪 Probando BetterParams...");

  const params = new BetterParams({ sort: "asc", filters: ["a", "b"] });

  // Test Mutabilidad
  params.addQuery("page", 1);
  assert(
    "BetterParams.addQuery (Mutable)",
    params.toString().includes("page=1"),
  );

  // Test Inmutabilidad (withQuery)
  const p2 = params.withQuery("sort", "desc");
  assert(
    "BetterParams.withQuery (Inmutable)",
    params.get("sort") === "asc" && p2.get("sort") === "desc",
    `Original: ${params.get("sort")}, Copia: ${p2.get("sort")}`,
  );

  // Test Omit/Pick
  const pClean = params.omit(["filters"]);
  assert("BetterParams.omit", !pClean.has("filters") && params.has("filters"));

  // Test Toggle
  params.toggleQuery("filters", "a"); // Debería quitar 'a'
  assert(
    "BetterParams.toggleQuery (Quitar)",
    !params.getAll("filters").includes("a"),
  );

  params.toggleQuery("filters", "c"); // Debería agregar 'c'
  assert(
    "BetterParams.toggleQuery (Agregar)",
    params.getAll("filters").includes("c"),
  );

  // ==========================================
  // 2. TEST DE BetterPath (Frontend / Next.js)
  // ==========================================
  console.log("\n🛣️  Probando BetterPath...");

  const path = new BetterPath("/dashboard").joinPath("users");

  // Test Path Building
  assert("BetterPath.joinPath", path.toString() === "/dashboard/users");

  // Test Inmutabilidad (.path)
  const subPath = path.path(123);
  assert(
    "BetterPath.path (Inmutable)",
    path.toString() === "/dashboard/users" &&
      subPath.toString() === "/dashboard/users/123",
  );

  // Test Template
  const tpl = new BetterPath().template("/users/:id/edit", { id: 99 });
  assert("BetterPath.template", tpl.toString() === "/users/99/edit");

  // Test Sincronía de métodos (withAddedQuery)
  const pathQ = path.withAddedQuery("tab", "settings");
  assert(
    "BetterPath.withAddedQuery",
    pathQ.toString().includes("tab=settings"),
  );

  // Test ToAbsolute
  const abs = pathQ.toAbsolute("https://site.com");
  assert(
    "BetterPath.toAbsolute",
    abs.toString() === "https://site.com/dashboard/users?tab=settings",
  );

  // ==========================================
  // 3. TEST DE BetterURL (Backend / API)
  // ==========================================
  console.log("\n🌐 Probando BetterURL...");

  const url = new BetterURL("https://api.com/v1");

  // Test Sincronía (.path en URL)
  const endpoint = url.path("orders");
  assert("BetterURL.path", endpoint.toString() === "https://api.com/v1/orders");

  // Test HasQueryValue
  endpoint.setQuery("status", ["paid", "shipped"]);
  assert(
    "BetterURL.hasQueryValue",
    endpoint.hasQueryValue("status", "paid") === true,
  );

  // Test ToRelative
  assert(
    "BetterURL.toRelative",
    endpoint.toRelative() === "/v1/orders?status=paid&status=shipped",
  );

  // Test Object Conversion (Complex)
  endpoint.config({ arrayFormat: "bracket" }); // Cambiamos config al vuelo
  const obj = endpoint.toObject();
  // Nota: toObject devuelve primitivos, verificamos si 'status' es array
  assert(
    "BetterURL.toObject",
    Array.isArray(obj.status) && obj.status.length === 2,
  );

  // ==========================================
  // RESULTADOS
  // ==========================================
  console.log("\n---------------------------------------------------");
  if (failed === 0) {
    console.log(`🎉  ¡ÉXITO TOTAL! Pasaron ${passed} pruebas.`);
    console.log(
      "    Tu librería es sólida, consistente y está lista para producción.",
    );
  } else {
    console.error(`⚠️  ATENCIÓN: Fallaron ${failed} pruebas. Revisa los logs.`);
  }
  console.log("---------------------------------------------------");
} catch (e) {
  console.error("\n❌ ERROR CRÍTICO DE EJECUCIÓN:");
  console.error(e);
}
