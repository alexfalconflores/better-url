import { BetterParams, type ParamsQueryOptions } from "./BetterParams";
import BetterURL from "./BetterUrl";

type Primitive = string | number | boolean;
type QueryValue = Primitive | Primitive[] | null | undefined;

/**
 * 🛣️ **BetterPath**
 * Una clase especializada en la manipulación de rutas relativas (Frontend Routing).
 * A diferencia de `BetterURL`, no requiere un dominio ni protocolo.
 *
 * Ideal para construir props de `href` en Next.js (`<Link>`) o React Router.
 *
 * @template TQueryParams Tipado opcional para los parámetros.
 */
export class BetterPath<
  TQueryParams extends Record<string, QueryValue> = Record<string, any>,
> {
  private _pathname: string;
  private _searchParams: BetterParams;

  /**
   * Inicializa una ruta relativa.
   * Normaliza automáticamente el slash inicial.
   *
   * @param path Ruta base (ej: "/dashboard" o "dashboard").
   */
  constructor(path: string = "/") {
    this._pathname = path.startsWith("/") ? path : `/${path}`;
    this._searchParams = new BetterParams();
  }

  /**
   * 🧬 **Clone**
   * Crea una copia profunda de la ruta y sus parámetros actuales.
   * Fundamental para operaciones inmutables.
   */
  clone(): BetterPath<TQueryParams> {
    const clone = new BetterPath<TQueryParams>(this._pathname);
    // Inyectamos una copia de los params
    clone._searchParams = this._searchParams.clone();
    return clone;
  }

  /**
   * 🛡️ **Inmutable (Safe Path)**
   * Crea una **NUEVA COPIA** agregando segmentos a la ruta.
   * Ideal para navegación anidada sin ensuciar la ruta base.
   *
   * @example
   * const base = new BetterPath("/users");
   * const detail = base.path(123); // -> "/users/123"
   * // base sigue siendo "/users"
   */
  path(...segments: (string | number)[]): BetterPath<TQueryParams> {
    const clone = this.clone();
    clone.joinPath(...segments);
    return clone;
  }

  /**
   * ✏️ **Mutable (Join)**
   * Modifica la instancia actual agregando segmentos.
   *
   * @example
   * path.joinPath("settings", "profile");
   */
  joinPath(...paths: (string | number)[]) {
    const cleanPaths = paths.map((p) => String(p).replace(/^\/+|\/+$/g, ""));
    const currentPath = this._pathname.replace(/\/+$/, "");
    const newPath = [currentPath, ...cleanPaths]
      .filter((p) => p !== "")
      .join("/");
    this._pathname = newPath.startsWith("/") ? newPath : `/${newPath}`;
    return this;
  }

  /**
   * ✏️ **Template Replacement**
   * Reemplaza variables en la ruta (`:id`) por valores reales.
   *
   * @example
   * // Ruta actual: /users
   * path.template("/users/:id/edit", { id: 5 });
   * // Resultado: /users/5/edit
   */
  template(pathTemplate: string, params: Record<string, Primitive>) {
    let finalPath = pathTemplate;
    for (const [key, value] of Object.entries(params)) {
      finalPath = finalPath.replaceAll(`:${key}`, String(value));
    }
    // Si el template no empieza con /, se lo ponemos
    this._pathname = finalPath.startsWith("/") ? finalPath : `/${finalPath}`;
    return this;
  }

  /**
   * ⚙️ Configura opciones de serialización (coma, brackets, etc).
   */
  config(opts: ParamsQueryOptions) {
    this._searchParams.config(opts);
    return this;
  }

  /**
   * ✏️ **Mutable (Append)**
   * Agrega un parámetro a la ruta.
   */
  addQuery<K extends keyof TQueryParams>(key: K, value: TQueryParams[K]) {
    this._searchParams.addQuery(String(key), value);
    return this;
  }

  /**
   * 🛡️ **Inmutable (Safe Add)**
   * Retorna una **COPIA** agregando el valor (sin borrar previos).
   */
  withAddedQuery<K extends keyof TQueryParams>(
    key: K,
    value: TQueryParams[K],
  ): BetterPath<TQueryParams> {
    const clone = this.clone();
    clone.addQuery(key, value);
    return clone;
  }

  /**
   * ✏️ **Mutable (Set/Overwrite)**
   * Establece un parámetro, sobrescribiendo el anterior.
   */
  setQuery<K extends keyof TQueryParams>(key: K, value: TQueryParams[K]) {
    this._searchParams.setQuery(String(key), value);
    return this;
  }

  /**
   * 🛡️ **Inmutable (Safe Set)**
   * Retorna una **COPIA** con el parámetro actualizado.
   * Perfecto para actualizar filtros en React sin mutar props.
   *
   * @example
   * <Link href={path.withQuery("page", 2).toString()} />
   */
  withQuery<K extends keyof TQueryParams>(
    key: K,
    value: TQueryParams[K],
  ): BetterPath<TQueryParams> {
    const clone = this.clone();
    clone.setQuery(key, value);
    return clone;
  }

  /**
   * 🎛️ **UI Helper (Toggle)**
   * Alterna un valor (lo pone si no está, lo quita si está).
   * Modifica la instancia actual.
   */
  toggleQuery<K extends keyof TQueryParams>(key: K, value: TQueryParams[K]) {
    // Ya implementado en BetterParams, solo delegamos
    this._searchParams.toggleQuery(String(key), value as Primitive);
    return this;
  }

  /**
   * 🎨 **UI Helper (Check)**
   * Verifica si un valor existe en los parámetros.
   */
  hasQueryValue<K extends keyof TQueryParams>(
    key: K,
    value: TQueryParams[K],
  ): boolean {
    return this._searchParams.hasQueryValue(String(key), value as Primitive);
  }

  /**
   * ✏️ **Mutable (Remove)**
   * Elimina un parámetro específico.
   */
  removeQuery<K extends keyof TQueryParams>(key: K) {
    this._searchParams.delete(String(key));
    // Limpieza profunda de brackets
    this._searchParams.delete(`${String(key)}[]`);
    return this;
  }

  /**
   * 🧹 **Omit (Inmutable)**
   * Retorna una COPIA excluyendo las llaves indicadas.
   */
  omit(keys: (keyof TQueryParams)[]): BetterPath<TQueryParams> {
    const clone = this.clone();
    clone._searchParams.deleteKeys(keys as string[]);
    return clone;
  }

  /**
   * 🧹 **Pick (Inmutable)**
   * Retorna una COPIA manteniendo SOLO las llaves indicadas.
   */
  pick(keys: (keyof TQueryParams)[]): BetterPath<TQueryParams> {
    const clone = this.clone();
    clone._searchParams.deleteKeysExcept(keys as string[]);
    return clone;
  }

  /**
   * ✏️ **Mutable (Clear)**
   * Elimina todos los parámetros de la ruta.
   */
  clearQuery() {
    // Reiniciamos la instancia
    const opts = (this._searchParams as any)._options; // Preservar opciones si es posible
    this._searchParams = new BetterParams();
    if (opts) this._searchParams.config(opts);
    return this;
  }

  /**
   * 📤 **To String**
   * Genera la cadena completa de la ruta relativa.
   * @example "/dashboard/users?sort=asc"
   */
  toString(): string {
    const qs = this._searchParams.toString();
    return qs ? `${this._pathname}?${qs}` : this._pathname;
  }

  /**
   * 🔗 **To Absolute**
   * Convierte esta ruta relativa en una instancia completa de `BetterURL`.
   * Requiere una URL base ya que BetterPath no tiene dominio.
   *
   * @param baseUrl Dominio base (ej: "https://api.com")
   */
  toAbsolute(baseUrl: string): BetterURL<TQueryParams> {
    // Evitamos import circular usando la clase nativa o inyectando
    // Pero conceptualmente es esto:
    const url = new BetterURL<TQueryParams>(baseUrl);
    // Uniríamos el path y los params...
    // Para simplificar, devolvemos el string completo
    return new BetterURL<TQueryParams>(baseUrl)
      .joinPath(this._pathname)
      .addQueryParams(this._searchParams.toObject() as any);
  }

  /**
   * 📦 **To Object**
   * Devuelve los parámetros como objeto JS.
   */
  toObject() {
    return this._searchParams.toObject();
  }
}
