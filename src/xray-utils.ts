import { XrayImportOptions } from './processor'

/**
 * 
 */
export function createSearchParams(xrayImportOptions: XrayImportOptions): URLSearchParams {
  // prepare params
  const elements: string[][] = [
    ['projectKey', xrayImportOptions.projectKey]
  ]
  if (xrayImportOptions.testExecKey) {
    elements.push(['testExecKey', xrayImportOptions.testExecKey])
  }
  if (xrayImportOptions.testPlanKey) {
    elements.push(['testPlanKey', xrayImportOptions.testPlanKey])
  }
  if (xrayImportOptions.testEnvironments) {
    elements.push([
      'testEnvironments',
      xrayImportOptions.testEnvironments
    ])
  }
  if (xrayImportOptions.revision) {
    elements.push(['revision', xrayImportOptions.revision])
  }
  if (xrayImportOptions.fixVersion) {
    elements.push(['fixVersion', xrayImportOptions.fixVersion])
  }
  return new URLSearchParams(elements)
}

/**
 * 
 */
export function updateTestExecJson(xrayImportOptions: XrayImportOptions, testExecutionJson: Object): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const testExecJson: any = testExecutionJson
  if (!testExecJson['fields']) {
    testExecJson['fields'] = {}
  }
  if (!testExecJson['fields']['project']) {
    testExecJson['fields']['project'] = {}
  }
  testExecJson['fields']['project']['key'] = xrayImportOptions.projectKey

  if (!testExecJson['xrayFields']) {
    testExecJson['xrayFields'] = {}
  }
  if (xrayImportOptions.testExecKey) {
    testExecJson['xrayFields'][
      'testExecKey'
    ] = xrayImportOptions.testExecKey
  }
  if (xrayImportOptions.testPlanKey) {
    testExecJson['xrayFields'][
      'testPlanKey'
    ] = xrayImportOptions.testPlanKey
  }
  if (xrayImportOptions.testEnvironments) {
    testExecJson['xrayFields'][
      'testEnvironments'
    ] = xrayImportOptions.testEnvironments
  }
  if (xrayImportOptions.revision) {
    testExecJson['xrayFields']['revision'] = xrayImportOptions.revision
  }
  if (xrayImportOptions.fixVersion) {
    testExecJson['xrayFields'][
      'fixVersion'
    ] = xrayImportOptions.fixVersion
  }
}
