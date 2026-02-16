type Primitive = string | number | boolean;
type QueryValue = Primitive | Primitive[] | null | undefined;

/**
 * Opciones de configuración para la serialización de parámetros.
 */
export interface ParamsQueryOptions {
  /**
   * Define cómo se serializan los arrays en la query string.
   * @example
   * "comma"   -> key=1,2
   * "repeat"  -> key=1&key=2  (Default)
   * "bracket" -> key[]=1&key[]=2
   */
  arrayFormat?: "comma" | "repeat" | "bracket";
}

/**
 * 🛠️ **BetterParams**
 * Una extensión supervitaminada de la clase nativa `URLSearchParams`.
 *
 * Soluciona las limitaciones nativas permitiendo:
 * - Pasar objetos con arrays en el constructor: `{ ids: [1, 2] }`.
 * - Serialización configurable (brackets, commas).
 * - Métodos inmutables y utilidades de UI (Toggle, Pick, Omit).
 */
export class BetterParams extends URLSearchParams {
  private _options: ParamsQueryOptions = { arrayFormat: "repeat" };

  /**
   * Inicializa los parámetros de búsqueda.
   * Acepta objetos planos, strings o instancias existentes.
   *
   * @param init Datos iniciales. Soporta `{ key: [1, 2] }` nativamente.
   *
   * @example
   * // Nativo fallaría, BetterParams lo hace bien:
   * new BetterParams({ tags: ["a", "b"] }); // -> tags=a&tags=b
   */
  constructor(
    init?:
      | string
      | Record<string, any>
      | URLSearchParams
      | string[][]
      | Iterable<[string, any]>,
  ) {
    const isPlainObject =
      init &&
      typeof init === "object" &&
      !Array.isArray(init) &&
      !(init instanceof URLSearchParams) &&
      !(init as any)[Symbol.iterator];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(isPlainObject ? undefined : (init as any));

    if (isPlainObject) {
      Object.entries(init as Record<string, any>).forEach(([k, v]) =>
        this.addQuery(k, v),
      );
    }
  }

  /**
   * ⚙️ Configura opciones de serialización para esta instancia.
   * @param opts Opciones (ej: arrayFormat).
   */
  config(opts: ParamsQueryOptions) {
    this._options = { ...this._options, ...opts };
    return this;
  }

  /**
   * ✏️ **Mutable (Append)**
   * Agrega un valor. Si la llave existe, añade otro valor (array).
   * Maneja arrays de entrada inteligentemente según la configuración.
   */
  addQuery(key: string, value: QueryValue) {
    if (value === undefined || value === null) return this;
    if (Array.isArray(value)) {
      this.handleArray(key, value);
    } else {
      this.append(key, String(value));
    }
    return this;
  }

  /**
   * 🛡️ **Inmutable (Safe Add)**
   * Retorna una **COPIA** agregando el valor.
   * No modifica la instancia actual.
   */
  withAddedQuery(key: string, value: QueryValue): BetterParams {
    return this.clone().addQuery(key, value);
  }

  /**
   * ✏️ **Mutable (Set/Overwrite)**
   * Establece un valor, eliminando cualquier valor previo de esa llave.
   * Limpia automáticamente formatos de array previos (ej: `key[]`).
   */
  setQuery(key: string, value: QueryValue) {
    if (value === undefined || value === null) {
      this.delete(key);
      return this;
    }
    this.delete(key);
    if (this._options.arrayFormat === "bracket") this.delete(`${key}[]`);
    this.addQuery(key, value);
    return this;
  }

  /**
   * 🛡️ **Inmutable (Safe Set)**
   * Retorna una **COPIA** con el valor establecido.
   * Útil para manipular filtros sin efectos secundarios.
   */
  withQuery(key: string, value: QueryValue): BetterParams {
    return this.clone().setQuery(key, value);
  }

  /**
   * 🎨 **UI Helper (Check)**
   * Verifica si un valor específico está presente en una llave.
   * Útil para inputs de tipo Checkbox.
   *
   * @example
   * params.setQuery("tags", ["a", "b"]);
   * params.hasQueryValue("tags", "a"); // true
   */
  hasQueryValue(key: string, value: Primitive): boolean {
    const strVal = String(value);
    const values = this.getAll(key);
    // Si usas comma, esto es básico, pero funcional para repeat/bracket
    return values.includes(strVal);
  }

  /**
   * 🎛️ **UI Helper (Toggle)**
   * Alterna un valor:
   * - Si existe -> Lo elimina.
   * - Si no existe -> Lo agrega.
   *
   * @example
   * // tags=shoes
   * params.toggleQuery("tags", "shoes"); // -> (vacio)
   * params.toggleQuery("tags", "hats");  // -> tags=hats
   */
  toggleQuery(key: string, value: Primitive) {
    const strKey = String(key);
    const strVal = String(value);
    const currentValues = this.getAll(strKey);

    if (currentValues.includes(strVal)) {
      // Filtrar y reconstruir
      const newValues = currentValues.filter((v) => v !== strVal);
      this.delete(strKey);
      if (this._options.arrayFormat === "bracket") this.delete(`${strKey}[]`);

      if (newValues.length > 0) {
        this.addQuery(strKey, newValues);
      }
    } else {
      this.addQuery(strKey, value);
    }
    return this;
  }

  /**
   * ✏️ **Mutable (Batch Delete)**
   * Elimina múltiples llaves a la vez.
   */
  deleteKeys(keys: string[]) {
    keys.forEach((k) => this.delete(k));
    return this;
  }

  /**
   * ✏️ **Mutable (Batch Keep)**
   * Elimina TODAS las llaves EXCEPTO las indicadas.
   */
  deleteKeysExcept(keysToKeep: string[]) {
    const keep = new Set(keysToKeep);
    Array.from(this.keys()).forEach((key) => {
      if (!keep.has(key)) this.delete(key);
    });
    return this;
  }

  /**
   * 📦 **To Object**
   * Convierte los parámetros a un objeto JS plano.
   * Preserva arrays correctamente, a diferencia de `Object.fromEntries`.
   *
   * @example
   * // id=1&id=2
   * params.toObject(); // -> { id: ["1", "2"] }
   */
  toObject(): Record<string, Primitive | Primitive[]> {
    const out: Record<string, Primitive | Primitive[]> = {};
    const keys = Array.from(new Set(this.keys()));

    for (const key of keys) {
      const values = this.getAll(key);
      if (values.length === 0) continue;
      // Si solo hay uno, es primitivo. Si hay varios, es array.
      // (Nota: Esto es una simplificación, a veces quieres array de 1 elemento)
      out[key] = values.length === 1 ? values[0] : values;
    }
    return out;
  }

  /**
   * 🧬 **Clone**
   * Crea una copia profunda de esta instancia y su configuración.
   */
  clone(): BetterParams {
    const clone = new BetterParams(this);
    clone.config({ ...this._options });
    return clone;
  }

  /**
   * 🧹 **Omit (Inmutable)**
   * Retorna una COPIA excluyendo las llaves indicadas.
   */
  omit(keys: string[]): BetterParams {
    return this.clone().deleteKeys(keys);
  }

  /**
   * 🧹 **Pick (Inmutable)**
   * Retorna una COPIA manteniendo SOLO las llaves indicadas.
   */
  pick(keys: string[]): BetterParams {
    return this.clone().deleteKeysExcept(keys);
  }

  // --- Privado ---
  private handleArray(key: string, values: any[]) {
    const { arrayFormat } = this._options;
    if (arrayFormat === "comma") {
      this.append(key, values.join(","));
    } else if (arrayFormat === "bracket") {
      values.forEach((v) => this.append(`${key}[]`, String(v)));
    } else {
      // repeat
      values.forEach((v) => this.append(key, String(v)));
    }
  }
}
