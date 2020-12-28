export interface Xray {
  auth(): Promise<void>
  updateTestExecKey(testExecKey: string): void
  import(data: Buffer): Promise<string>
}
