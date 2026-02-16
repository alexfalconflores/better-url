type Primitive = string | number | boolean;
type QueryValue = Primitive | Primitive[] | null | undefined;

export interface URLQueryOptions {
  /**
   * Define cómo se serializan los arrays en la query string.
   * @example
   * "comma"   -> ?ids=1,2
   * "repeat"  -> ?ids=1&ids=2  (Default)
   * "bracket" -> ?ids[]=1&ids[]=2
   */
  arrayFormat?: "comma" | "repeat" | "bracket";
  /** Si es true, ignora valores null (Default: true) */
  skipNull?: boolean;
  /** Si es true, ignora valores undefined (Default: true) */
  skipUndefined?: boolean;
}

/**
 * 🚀 **BetterURL**
 * Una extensión potente de la clase nativa `URL` con métodos para manipulación
 * de query params, construcción de rutas y manejo de inmutabilidad.
 *
 * @template TQueryParams Tipado opcional para los parámetros de búsqueda.
 */
export class BetterURL<
  TQueryParams extends Record<string, QueryValue>,
> extends URL {
  private _options: URLQueryOptions = {
    arrayFormat: "repeat",
    skipNull: true,
    skipUndefined: true,
  };

  /**
   * Crea una nueva instancia de BetterURL.
   * @param url Ruta relativa ("/users") o absoluta ("https://api.com").
   * @param base Base URL requerida si el primer param es relativo.
   *
   * @example
   * // Absoluta
   * new BetterURL("https://api.com/v1");
   * // Relativa con base
   * new BetterURL("/users", "https://api.com");
   */
  constructor(url: string, base?: string | URL) {
    super(url, base);
  }

  /**
   * ⚙️ Configura opciones globales para esta instancia.
   * @param opts Opciones de serialización.
   */
  config(opts: Partial<URLQueryOptions>) {
    this._options = { ...this._options, ...opts };
    return this;
  }

  /**
   * 🔒 Establece autenticación básica (Basic Auth).
   * Codifica automáticamente las credenciales.
   */
  auth(username: string, password: string) {
    this.username = encodeURIComponent(username);
    this.password = encodeURIComponent(password);
    return this;
  }

  /**
   * 🛡️ **Inmutable (Safe Path)**
   * Crea una **NUEVA COPIA** de la URL agregando segmentos al path.
   * La instancia original NO se modifica.
   *
   * @param segments Segmentos de ruta (ej: "users", 123).
   * @returns Una nueva instancia de BetterURL.
   *
   * @example
   * const base = new BetterURL("https://api.com");
   * const usersUrl = base.path("users");
   * // base: "https://api.com"
   * // usersUrl: "https://api.com/users"
   */
  path(...segments: (string | number)[]): BetterURL<TQueryParams> {
    // 1. Clonamos (this se queda intacto)
    const clone = this.clone();

    // 2. Modificamos el clon
    clone.joinPath(...segments);

    // 3. Devolvemos el clon fresco
    return clone;
  }

  /**
   * ✏️ **Mutable (Builder)**
   * Agrega segmentos a la ruta actual modificando la instancia.
   * Normaliza slashes dobles automáticamente.
   *
   * @param paths Segmentos de ruta.
   */
  joinPath(...paths: (string | number)[]) {
    const cleanPaths = paths.map((p) => String(p).replace(/^\/+|\/+$/g, ""));
    const currentPath = this.pathname.replace(/\/+$/, "");

    // Filtramos vacíos para evitar //
    const newPath = [currentPath, ...cleanPaths].filter(Boolean).join("/");

    this.pathname = newPath.startsWith("/") ? newPath : `/${newPath}`;
    return this;
  }

  /**
   * ✏️ **Template Replacement**
   * Reemplaza variables en la ruta estilo Express/Next.js.
   *
   * @param pathTemplate Patrón de ruta (ej: "/users/:id").
   * @param params Objeto con los valores (ej: { id: 123 }).
   *
   * @example
   * url.template("/users/:id/edit", { id: 5 });
   * // Result: "/users/5/edit"
   */
  template(pathTemplate: string, params: Record<string, Primitive>) {
    let finalPath = pathTemplate;
    for (const [key, value] of Object.entries(params)) {
      finalPath = finalPath.replaceAll(`:${key}`, String(value));
    }
    this.pathname = finalPath;
    return this;
  }

  /**
   * ✏️ **Mutable (Append)**
   * Agrega un parámetro. Si la llave ya existe, agrega otro valor (array).
   *
   * @example
   * url.addQuery("tag", "a").addQuery("tag", "b");
   * // ?tag=a&tag=b
   */
  addQuery<K extends keyof TQueryParams>(key: K, value: TQueryParams[K]) {
    this.handleQueryParam(String(key), value, "append");
    return this;
  }

  /**
   * 🛡️ **Inmutable (Safe Add)**
   * Retorna una **COPIA** agregando el valor (sin borrar previos).
   */
  withAddedQuery<K extends keyof TQueryParams>(
    key: K,
    value: TQueryParams[K],
  ): BetterURL<TQueryParams> {
    return this.clone().addQuery(key, value);
  }

  /**
   * ✏️ **Mutable (Set/Overwrite)**
   * Establece un parámetro. Si ya existe, lo sobrescribe por completo.
   * Limpia automáticamente formatos de array previos (ej: `key[]`).
   *
   * @example
   * url.setQuery("page", 1);
   */
  setQuery<K extends keyof TQueryParams>(key: K, value: TQueryParams[K]) {
    const strKey = String(key);

    // Si vamos a setear, primero borramos para garantizar limpieza
    if (this.shouldProcess(value)) {
      // CORRECCIÓN: Borrado inteligente para soportar brackets
      this.searchParams.delete(strKey);
      if (this._options.arrayFormat === "bracket") {
        this.searchParams.delete(`${strKey}[]`);
      }
    }

    this.handleQueryParam(strKey, value, "append");
    return this;
  }

  /**
   * 🛡️ **Inmutable (Safe Set)**
   * Retorna una **COPIA** con el parámetro actualizado.
   * Ideal para React State.
   *
   * @example
   * const newUrl = url.withQuery("page", 2);
   */
  withQuery<K extends keyof TQueryParams>(
    key: K,
    value: TQueryParams[K],
  ): BetterURL<TQueryParams> {
    return this.clone().setQuery(key, value);
  }

  /**
   * 🎛️ **UI Helper (Toggle)**
   * Alterna un valor en un parámetro (Array).
   * - Si existe: Lo elimina.
   * - Si no existe: Lo agrega.
   *
   * @example
   * // ?tags=shoes
   * url.toggleQuery("tags", "shoes"); // -> ? (vacio)
   * url.toggleQuery("tags", "hats");  // -> ?tags=hats
   */
  toggleQuery<K extends keyof TQueryParams>(key: K, value: TQueryParams[K]) {
    const strKey = String(key);
    const strVal = String(value);

    // Obtenemos todos los valores actuales
    // (Nota: getAll devuelve array de strings, si usas 'comma' habría que parsearlo extra,
    // pero asumiendo 'repeat' o 'bracket' que es lo estándar):
    const currentValues = this.searchParams.getAll(strKey);

    // Caso especial para 'comma' separation si lo implementaste complejo
    // Si no, la lógica estándar de URLSearchParams es:

    if (currentValues.includes(strVal)) {
      // Si existe, tenemos que borrar SOLO ese valor.
      // URLSearchParams no tiene "delete value", solo "delete key".
      // Así que reconstruimos el array sin ese valor.
      const newValues = currentValues.filter((v) => v !== strVal);

      // Borramos todo y reinsertamos los que quedaron
      this.removeQuery(key);
      if (newValues.length > 0) {
        this.addQuery(key, newValues as any);
      }
    } else {
      // Si no existe, lo agregamos
      this.addQuery(key, value);
    }

    return this;
  }

  /**
   * 🎨 **UI Helper (Check)**
   * Verifica si un valor específico está presente en los parámetros.
   * Útil para clases CSS "active".
   *
   * @returns `true` si el valor existe.
   */
  hasQueryValue<K extends keyof TQueryParams>(
    key: K,
    value: TQueryParams[K],
  ): boolean {
    const strVal = String(value);
    // getAll maneja repeat y bracket nativamente
    const values = this.searchParams.getAll(String(key));
    // Si usas 'comma', podrías necesitar: values.flatMap(v => v.split(','))
    return values.includes(strVal);
  }

  /**
   * ✏️ **Batch Add**
   * Agrega múltiples parámetros a la vez (Append).
   */
  addQueryParams(params: Partial<TQueryParams>) {
    Object.entries(params).forEach(([key, value]) => {
      this.addQuery(key as any, value);
    });
    return this;
  }

  /**
   * ✏️ **Batch Set**
   * Setea múltiples parámetros a la vez (Sobrescribe).
   */
  setQueryParams(params: Partial<TQueryParams>) {
    Object.entries(params).forEach(([key, value]) => {
      this.setQuery(key as any, value);
    });
    return this;
  }

  /**
   * 🛡️ **Inmutable Batch Set**
   * Retorna una COPIA con múltiples parámetros actualizados.
   */
  withQueryParams(params: Partial<TQueryParams>): BetterURL<TQueryParams> {
    return this.clone().setQueryParams(params);
  }

  /**
   * ✏️ **Delete**
   * Elimina completamente una clave de los parámetros.
   */
  removeQuery<K extends keyof TQueryParams>(key: K) {
    this.searchParams.delete(String(key));
    return this;
  }

  /**
   * ✏️ **Clear All**
   * Elimina todos los parámetros de búsqueda.
   */
  clearQuery() {
    this.search = "";
    return this;
  }

  /** Establece el hash (fragmento) de la URL (#ejemplo) */
  fragment(fragment: string) {
    this.hash = fragment; // URL nativa ya maneja el # automáticamente
    return this;
  }

  /** Establece el puerto de la URL */
  portNumber(port: number | string) {
    this.port = port.toString();
    return this;
  }

  /**
   * 🧹 **Omit (Inmutable)**
   * Retorna una COPIA sin las llaves especificadas.
   * Útil para limpiar la URL antes de enviarla.
   *
   * @example
   * url.omit(["token", "password"]);
   */
  omit(keys: (keyof TQueryParams)[]): BetterURL<TQueryParams> {
    const clone = this.clone();
    keys.forEach((k) => clone.removeQuery(k));
    return clone;
  }

  /**
   * 🧹 **Pick (Inmutable)**
   * Retorna una COPIA conservando SOLO las llaves especificadas.
   * Borra todo lo demás.
   */
  pick(keys: (keyof TQueryParams)[]): BetterURL<TQueryParams> {
    const clone = this.clone();
    // Obtenemos todas las llaves actuales
    const currentKeys = Array.from(clone.searchParams.keys());

    currentKeys.forEach((key) => {
      if (!keys.includes(key as any)) {
        clone.searchParams.delete(key);
      }
    });
    return clone;
  }

  /**
   * ⚡ **Next.js Helper**
   * Devuelve una cadena relativa (Path + Query + Hash).
   * Ignora el dominio. Ideal para `router.push()` o `<Link />`.
   *
   * @example
   * // Instance: https://site.com/users?q=1
   * url.toRelative() // -> "/users?q=1"
   */
  toRelative(): string {
    return this.pathname + this.search + this.hash;
  }

  /**
   * 🧬 **Clone**
   * Crea una copia exacta de esta instancia y su configuración.
   */
  clone(): BetterURL<TQueryParams> {
    const clone = new BetterURL<TQueryParams>(this.toString());
    clone._options = { ...this._options };
    return clone;
  }

  /**
   * 📦 **To Object**
   * Convierte los searchParams a un objeto JS plano.
   * Respeta la configuración de arrays.
   *
   * @example
   * // ?id=1&id=2
   * url.toObject() // -> { id: ["1", "2"] }
   */
  toObject(): Record<string, Primitive | Primitive[]> {
    const out: Record<string, Primitive | Primitive[]> = {};
    const keys = Array.from(this.searchParams.keys());

    // Usamos un Set para no repetir llaves en el loop
    const uniqueKeys = new Set(keys);

    for (const key of uniqueKeys) {
      const values = this.searchParams.getAll(key);

      // Lógica inteligente:
      // Si configuraste "comma", intentamos separar por comas
      if (
        this._options.arrayFormat === "comma" &&
        values.length === 1 &&
        values[0].includes(",")
      ) {
        out[key] = values[0].split(",");
      }
      // Si hay múltiples valores, es un array
      else if (values.length > 1) {
        out[key] = values;
      }
      // Si hay un solo valor y parece número/boolean, lo convertimos (Opcional, o dejar como string)
      else {
        out[key] = values[0];
      }
    }
    return out;
  }

  private shouldProcess(value: any): boolean {
    if (value === null && this._options.skipNull) return false;
    if (value === undefined && this._options.skipUndefined) return false;
    return true;
  }

  private handleQueryParam(key: string, value: any, method: "append" | "set") {
    if (!this.shouldProcess(value)) return;

    if (Array.isArray(value)) {
      this.handleArray(key, value);
    } else {
      this.searchParams[method](key, String(value));
    }
  }

  private handleArray(key: string, values: any[]) {
    if (values.length === 0) return;

    const { arrayFormat } = this._options;

    if (arrayFormat === "comma") {
      this.searchParams.append(key, values.join(","));
    } else if (arrayFormat === "repeat") {
      values.forEach((v) => this.searchParams.append(key, String(v)));
    } else if (arrayFormat === "bracket") {
      values.forEach((v) => this.searchParams.append(`${key}[]`, String(v)));
    }
  }
}

export default BetterURL;
