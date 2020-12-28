export interface Xray {
  auth(): Promise<void>;
  updateTestExecKey(testExecKey: string): URLSearchParams;
  import(data: Buffer): Promise<string>;
}
