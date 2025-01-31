<div align="center">
  :octocat:
</div>
<h1 align="center">
  xray-action
</h1>

<p align="center">
    ... a GitHub action to import test results into "Xray" - A complete Test Management tool for Jira.
</p>

<div align="center">
  <a href="https://github.com/mikepenz/xray-action/actions">
		<img src="https://github.com/mikepenz/xray-action/workflows/CI/badge.svg"/>
	</a>
</div>
<br />

-------

<p align="center">
    <a href="#setup">Setup 🛠️</a> &bull;
    <a href="#contribute-">Contribute 🧬</a> &bull;
    <a href="#license">License 📓</a>
</p>

-------

## Setup

### Configure the workflow

Specify the action as part of your GitHub actions workflow, using a [Xray API key](https://docs.getxray.app/display/XRAYCLOUD/Global+Settings%3A+API+Keys) (i.e. a pair of client id and client secret):

<details open>
<summary>Xray Cloud</summary>
<p>

```yml
- name: "Import results to Xray"
  uses: mikepenz/xray-action@{latest-release}
  with:
    username: ${{ secrets.XRAY_CLIENT_ID }}
    password: ${{ secrets.XRAY_CLIENT_SECRET }}
    testFormat: "junit"
    testPaths: "**/test/*.xml"
    testExecKey: "TEST-1"
    projectKey: "TEST"
```

</p>
</details>


<details>
<summary>Xray Server/DC</summary>
<p>

If you're using Xray Server/DC, you'll need to set `xrayCloud` as "false", use Jira credentials for authentication, and specify additional parameters.

 ```yml
- name: "Import results to Xray"
  uses: mikepenz/xray-action@{latest-release}
  with:
    username: ${{ secrets.JIRA_USERNAME }}
    password: ${{ secrets.JIRA_PASSWORD }}
    xrayCloud: "false"
    xrayBaseUrl: "https://myjiraserver.example.com"
    testFormat: "junit"
    testPaths: "**/test/*.xml"
    testExecKey: "TEST-1"
    projectKey: "TEST"
```

⚠️ Xray Server/DC requires `test plan`, `test env`, `revision` to be defined via their custom field. See additional details on passing a custom [test execution json](#test-execution-json).

</p>
</details>


💡 Do not specify username and password in cleartext, instead prefer to read them from GitHub action secrets.

| **Input**                 | **Description**                                                                                                                                                | **Required** |
|---------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| `xrayCloud`               | Defines which variant of Xray to target [cloud vs Server/DC] (default="true")                                                                                  |              |
| `xrayBaseUrl`             | Defines the base URL if Xray Server/DC is chosen (only required if xrayCloud="false")                                                                          | x*           |
| `username`                | Xray API client id (cloud) or Jira username (Server/DC). (Required for xrayCloud)                                                                              | x*           |
| `password`                | Xray API client secret (cloud) or Jira password (Server/DC). (Required for xrayCloud)                                                                          | x*           |
| `xrayToken`               | Xray Personal Access Token. If provided username/password are ignored. (Xray Server/DC only)                                                                   |              |
| `testFormat`              | Describes the import formats ["xray", "cucumber", "behave", "junit", "testng", "nunit", "xunit", "robot", "bundle"]                                            | x            |
| `testPaths`               | [Glob](https://github.com/actions/toolkit/tree/master/packages/glob) expression to report paths. The default is `**/junit-reports/TEST-*.xml`.                 | x            |
| `testMerge`               | Merges together multiple test report files into a single report. Supported for: ["junit", "cucumber"]. (Default: true)                                                     |              |
| `testExecKey`             | Key of the Test Execution                                                                                                                                      | x            |
| `projectKey`              | Key of the project where the Test Execution (if the testExecKey parameter wasn't provided) and the tests (if they aren't created yet) are going to be created. | x            |
| `testPlanKey`             | Key of the Test Plan; if you specify the Test Plan, the Tests will be added automatically to the Test Plan if they're not part of it.                          |              |
| `testEnvironments`        | A string containing a list of test environments separated by ";"                                                                                               |              |
| `revision`                | Source code and documentation version used in the test execution.                                                                                              |              |
| `fixVersion`              | The Fix Version associated with the test execution (it supports only one value).                                                                               |              |
| `combineInSingleTestExec` | If no `testExecKey` is provided, it will generate a testExec with the first import, and reuse the same for all other imports. (Default: false)                 |              |
| `failOnImportError`       | Defines if the action should fail if an import error occurred. (Default: false)                                                                                |              |
| `continueOnImportError`   | Defines if the action should continue after a single import error occurred. (Default: true)                                                                    |              |
| `importParallelism`       | Specifies the level of parallelism to import to Xray. (Default: 2)                                                                                             |              |
| `responseTimeout`       | Specifies the maximum duration for a request (in milliseconds) to wait for a response to execute before timing out. The default is 60000 milliseconds.                                                                                             |              |
| `testExecutionJson`       | File path to a json file, containing the meta information to create the xray test execution ticket.                                                                           |              |
| `testJson`       | File path to a json file, containing the meta information to create the xray test ticket.                                                                           |              |

#### Test execution json

The test execution json should the meta information in the following format:

<details open>
<summary>Xray Cloud</summary>
<p>

```json
{
    "fields": {
        "summary": "Brand new Test execution",
        "issuetype": { "id": "10007" },
        "components": [
            { "name": "Interface" },
            { "name": "Core" }
        ]
    }
}
```

</p>
</details>

<details>
<summary>Xray Server/DC</summary>
<p>

⚠️ For Xray Server/DC environments `test plan`, `test env`, `revision` fields are required to be provided via their custom field. See the [official API documentation](https://docs.getxray.app/display/XRAY/Import+Execution+Results+-+REST#ImportExecutionResultsREST-XrayJSONresultsMultipart) for more details.

```json
{
    "fields": {
        "summary": "Brand new Test execution",
        "issuetype": { "id": "10007" },
        "components" : [
            { "name":"Interface" },
            { "name":"Core" }
        ],
        "customfield_10032" : [
            "TES-38"
        ]
    }
}
```

</p>
</details>  

💡 The import will fail if the provided issueType for example does not exist. Please ensure correct information is provided.

### Action outputs

After action execution it will return helpful information.

```yml
# ${{steps.{XRAY_STEP_ID}.outputs.count}}
${{steps.xray.outputs.count}}
```

A full set list of possible output values for this action.


| **Output**      | **Description**                        |
|-----------------|----------------------------------------|
| count           | The count of imported files.           |
| completed       | The count of completed imports.        |
| failed          | The count of failed imports.           |
| errorMessage    | The message of failed imports.         |
| errorStatusCode | The status code of failed imports.     |
| testExecKey     | The key of the created test execution. |

## Contribute 🧬

```bash
# Install the dependencies  
$ npm install

# Build the typescript and package it for distribution
$ npm run build && npm run package

# Run the tests, use to debug, and test it out
# Please note you have to uncomment the test
# Provide your xray instance username and password
# And then execute the test:
$ npm test

# Verify lint is happy
$ npm run lint -- --fix
```

## Xray

- [Xray](https://docs.getxray.app/site/xray) website
- Currently fully supporting all (non multipart) requests according to [Xray REST API documentation](https://docs.getxray.app/display/XRAY/Import+Execution+Results+-+REST#expander-339243592)
- Partially support for multipart request. Supports specifying test execution meta information [Xray REST API documentation](https://docs.getxray.app/display/XRAY/Import+Execution+Results+-+REST#expander-1959649602)

## Developed By

* Mike Penz
 * [mikepenz.com](http://mikepenz.com) - <mikepenz@gmail.com>
 * [paypal.me/mikepenz](http://paypal.me/mikepenz)

## Other actions

- [release-changelog-builder-action](https://github.com/mikepenz/release-changelog-builder-action)
- [action-junit-report](https://github.com/mikepenz/action-junit-report)
- [jira-release-composition-action](https://github.com/mikepenz/jira-release-composite-action)

## License

    Copyright 2025 Mike Penz

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
