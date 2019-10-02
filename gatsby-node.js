/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

// You can delete this file if you're not using it
// const jsYaml = require(`js-yaml`)
// const _ = require(`lodash`)
// const path = require(`path`)

var SwaggerParser = require("swagger-parser")

async function parseOpenApiConfig(openApiYaml) {
  const validation = await SwaggerParser.validate(openApiYaml)
  console.log("api", validation)
  return validation
}

function removeGatsbyNodeFields(node) {
  const { id, children, parent, internal, ...restOfNode } = node
  return restOfNode
}

async function onCreateNode(
  { node, actions, loadNodeContent, createNodeId, createContentDigest },
  pluginOptions
) {
  if (node.internal.type !== "ApiYaml") return
  const { createNode, createParentChildLink, createNodeField } = actions
  async function createOpenApiNode(yamlNode, id) {
    const openApiConfig = removeGatsbyNodeFields(yamlNode)
    const { paths: apiPaths, ...openApi } = await parseOpenApiConfig(
      openApiConfig
    )

    const openApiNode = {
      ...openApi,
      id,
      children: [],
      parent: yamlNode.id,
      internal: {
        contentDigest: createContentDigest(openApi),
        type: "OpenApi",
      },
    }
    await createNode(openApiNode)
    createParentChildLink({ parent: yamlNode, child: openApiNode })
    for (const [path, methods] of Object.entries(apiPaths)) {
      console.log("path", path)
      console.log("methods", methods)
      const apiPathNode = {
        methods,
        path,
        id: path,
        children: [],
        parent: openApiNode.id,
        internal: {
          contentDigest: createContentDigest({ methods, path }),
          type: "ApiPath",
        },
      }
      await createNode(apiPathNode)
      createParentChildLink({ parent: openApiNode, child: apiPathNode })
    }
  }

  await createOpenApiNode(node, createNodeId(`${node.id} >>> OpenAPI`))
}

exports.onCreateNode = onCreateNode
