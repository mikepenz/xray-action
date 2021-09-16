export interface Xray {
  /** Describes if the implementation requires authentication before use */
  requiresAuth: boolean
  /** Authenticates with the API and retrieves a token for further API calls */
  auth(): Promise<void>
  /** Update the test exectuion */
  updateTestExecKey(testExecKey: string): void
  /** Imports the given data into Xray */
  import(data: Buffer, mimeType: string): Promise<string>
}
