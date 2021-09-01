import * as core from '@actions/core'
import * as path from 'path'
import * as fs from 'fs'
import FormData from 'form-data'

/**
 * Resolves the repository path, relatively to the GITHUB_WORKSPACE
 */
export function retrieveRepositoryPath(providedPath: string): string {
  let githubWorkspacePath = process.env['GITHUB_WORKSPACE']
  if (!githubWorkspacePath) {
    throw new Error('GITHUB_WORKSPACE not defined')
  }
  githubWorkspacePath = path.resolve(githubWorkspacePath)
  core.debug(`GITHUB_WORKSPACE = '${githubWorkspacePath}'`)

  let repositoryPath = providedPath || '.'
  repositoryPath = path.resolve(githubWorkspacePath, repositoryPath)
  core.debug(`repositoryPath = '${repositoryPath}'`)
  return repositoryPath
}

/**
 * Retrieves the json configuration specified
 */
export function resolveJson(
  githubWorkspacePath: string,
  file: string
): Object | undefined {
  if (file) {
    if (fs.existsSync(path.resolve(file))) {
      return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'))
    } else {
      return JSON.parse(
        fs.readFileSync(path.resolve(githubWorkspacePath, file), 'utf8')
      )
    }
  } else {
    return undefined
  }
}

/**
 * Do a request with options provided.
 *
 * @param {Object} options
 * @param {Object} data
 * @return {Promise} a promise of request
 */
export async function doFormDataRequest(
  formData: FormData,
  params: string | FormData.SubmitOptions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  return new Promise((resolve, reject) => {
    formData.submit(params, (err, res) => {
      if (err) {
        reject(err)
      } else {
        res.setEncoding('utf8')
        let responseBody = ''

        res.on('data', chunk => {
          responseBody += chunk
        })

        res.on('end', () => {
          try {
            core.debug(`Server response: ${responseBody}`)
            resolve(JSON.parse(responseBody))
          } catch (error) {
            reject(error)
          }
        })
      }
    })
  })
}
