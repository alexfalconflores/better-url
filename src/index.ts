export class BetterURL<TQueryParams extends Record<string, any>> extends URL {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  auth(username: string, password: string) {
    this.username = username;
    this.password = password;
    return this;
  }

  portNumber(port: number) {
    this.port = port.toString();
    return this;
  }

  path(path: string) {
    // Normaliza la ruta y la une con la existente
    this.pathname =
      this.pathname.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
    return this;
  }

  query<K extends keyof TQueryParams>(
    key: K,
    value: NonNullable<TQueryParams[K]>,
  ) {
    this.searchParams.append(key.toString(), String(value));
    return this;
  }

  tryQuery<K extends keyof TQueryParams>(key: K, value: TQueryParams[K]) {
    if (this.isDefined(value)) {
      this.query(key, value as NonNullable<TQueryParams[K]>);
    }
    return this;
  }

  setQuery<K extends keyof TQueryParams>(
    key: K,
    value: NonNullable<TQueryParams[K]>,
  ) {
    this.searchParams.set(key.toString(), String(value));
    return this;
  }

  trySetQuery<K extends keyof TQueryParams>(
    key: K,
    value: TQueryParams[K] | null | undefined,
  ) {
    if (this.isDefined(value)) {
      this.setQuery(key, value as NonNullable<TQueryParams[K]>);
    }
    return this;
  }

  removeQuery<K extends keyof TQueryParams>(key: K) {
    this.searchParams.delete(key.toString());
    return this;
  }

  clearQuery() {
    this.search = "";
    return this;
  }

  fragment(fragment: string) {
    this.hash = `#${fragment.replace(/^#/, "")}`;
    return this;
  }

  private isDefined<T>(value: T | null | undefined): value is NonNullable<T> {
    return value !== null && value !== undefined;
  }
}

export default BetterURL;
