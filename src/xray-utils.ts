import {XrayImportOptions} from './processor.js'
import * as core from '@actions/core'
import {extension} from 'mime-types'

/**
 *
 */
export function createSearchParams(
  xrayImportOptions: XrayImportOptions
): URLSearchParams {
  // prepare params
  const elements: string[][] = [['projectKey', xrayImportOptions.projectKey]]
  if (xrayImportOptions.testExecKey) {
    elements.push(['testExecKey', xrayImportOptions.testExecKey])
  }
  if (xrayImportOptions.testPlanKey) {
    elements.push(['testPlanKey', xrayImportOptions.testPlanKey])
  }
  if (xrayImportOptions.testEnvironments) {
    elements.push(['testEnvironments', xrayImportOptions.testEnvironments])
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
export function updateTestExecJson(
  xrayImportOptions: XrayImportOptions,
  testExecutionJson: Object
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const testExecJson: any = testExecutionJson
  if (!testExecJson['fields']) {
    testExecJson['fields'] = {}
  }
  if (!testExecJson['fields']['project']) {
    testExecJson['fields']['project'] = {}
  }

  if (xrayImportOptions.projectKey) {
    testExecJson['fields']['project']['key'] = xrayImportOptions.projectKey
  } else {
    core.debug(
      `No "projectKey" passed via configuration. Using ${JSON.stringify(
        testExecJson['fields']['project']
      )}`
    )
  }

  xrayImportOptions.testExecutionJson = testExecJson
}

/**
 * only the cloud API uses the `xrayFields` to define test exec key, test plan key, etc.
 *
 * CLOUD
 * https://docs.getxray.app/display/XRAYCLOUD/Import+Execution+Results+-+REST#ImportExecutionResultsREST-XrayJSONresultsMultipart
 *
 * SERVER
 * https://docs.getxray.app/display/XRAY/Import+Execution+Results+-+REST#ImportExecutionResultsREST-XrayJSONresultsMultipart
 */
export function updateTestExecJsonCloud(
  xrayImportOptions: XrayImportOptions,
  testExecutionJson: Object
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const testExecJson: any = testExecutionJson

  if (!testExecJson['xrayFields']) {
    testExecJson['xrayFields'] = {}
  }
  if (xrayImportOptions.testExecKey) {
    testExecJson['xrayFields']['testExecKey'] = xrayImportOptions.testExecKey
  }
  if (xrayImportOptions.testPlanKey) {
    testExecJson['xrayFields']['testPlanKey'] = xrayImportOptions.testPlanKey
  }
  if (xrayImportOptions.testEnvironments) {
    testExecJson['xrayFields']['testEnvironments'] =
      xrayImportOptions.testEnvironments
  }
  if (xrayImportOptions.revision) {
    testExecJson['xrayFields']['revision'] = xrayImportOptions.revision
  }
  if (xrayImportOptions.fixVersion) {
    testExecJson['xrayFields']['fixVersion'] = xrayImportOptions.fixVersion
  }

  xrayImportOptions.testExecutionJson = testExecJson
}

/**
 *
 */
export function updateTestJson(
  xrayImportOptions: XrayImportOptions,
  testJson: Object | undefined
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tJson: any

  if (
    xrayImportOptions.projectKey ||
    (tJson &&
      tJson['fields'] &&
      tJson['fields']['project'] &&
      tJson['fields']['project']['key'])
  ) {
    if (testJson === undefined) {
      tJson = {}
    } else {
      tJson = testJson
    }
    if (!tJson['fields']) {
      tJson['fields'] = {}
    }
    if (!tJson['fields']['project']) {
      tJson['fields']['project'] = {}
    }
    if (xrayImportOptions.projectKey) {
      tJson['fields']['project']['key'] = xrayImportOptions.projectKey
    } else {
      core.debug(
        `No "projectKey" passed via configuration. Using ${JSON.stringify(
          tJson['fields']['project']
        )}`
      )
    }
    xrayImportOptions.testJson = tJson
  } else {
    core.debug(`No "projectKey" passed via configuration nor test json.`)
  }
}

/**
 * Resolves the file extension based on the mime type.
 * Falls back to xml if not identified.
 */
export function retrieveFileExtension(mimeType: string): string {
  return extension(mimeType) || 'xml'
}
