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

async function onCreateNode(
  { node, actions, loadNodeContent, createNodeId, createContentDigest },
  pluginOptions
) {
  if(node.internal.type !== "ApiYaml") {
    return
  }
  const { id, children, parent, internal, ...openApiConfig } = node
  const parsedNode = await parseOpenApiConfig(openApiConfig)
  const success = parsedNode.paths["/pets"]["get"]["responses"]["200"]
  const { createNode, createParentChildLink, createNodeField } = actions
  function removeGatsbyNodeFields(yamlNode) {
    const { id: yamlNodeId, children, parent, internal, ...openApiConfig } = yamlNode
    return openApiConfig
  }
  async function createOpenApiNode(yamlNode, id) {
    const openApiConfig = removeGatsbyNodeFields(yamlNode)
    console.log("openApiConfig", openApiConfig)
    const openApi = await parseOpenApiConfig(openApiConfig)
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
    createNode(openApiNode)
    createParentChildLink({ parent: yamlNode, child: openApiNode })
  }
  await createOpenApiNode(node, createNodeId(`${node.id} >>> OpenAPI`))
}

exports.onCreateNode = onCreateNode
