/** An OPDS catalog the user has added in Browse. */
export interface Source {
  id: string;
  name: string;
  url: string;
  username?: string;
  /** Kept in the OS keystore, loaded into memory at startup. */
  password?: string;
}
