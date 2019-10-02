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
  // Get built-in actions and create custom action helpers
  const { createNode, createParentChildLink, createNodeField } = actions
  function constructNode({ content, parentNode, id, type }) {
    return {
      ...content,
      id,
      children: [],
      parent: parentNode.id,
      internal: {
        contentDigest: createContentDigest(content),
        type,
      },
    }
  }
  // Filter out nodes that we don't care about
  if (node.internal.type !== "ApiYaml") return

  // Node Factories
  async function createOpenApiNode(yamlNode) {
    const openApiConfig = removeGatsbyNodeFields(yamlNode)
    const { paths, ...openApi } = await parseOpenApiConfig(openApiConfig)
    const openApiNode = constructNode({
      id: createNodeId(`${yamlNode.id} >>> OpenAPI`),
      content: openApi,
      parentNode: yamlNode,
      type: "OpenApi",
    })
    await createNode(openApiNode)
    createParentChildLink({ parent: yamlNode, child: openApiNode })

    // Create a Path node for each path in the API spec
    for (const [path, methods] of Object.entries(paths)) {
      createPathNode(openApiNode, { path, methods })
    }
  }
  async function createPathNode(openApiNode, pathConfig) {
    const { methods, ...path } = pathConfig
    const apiPathNode = constructNode({
      id: createNodeId(path),
      content: path,
      parentNode: openApiNode,
      type: "ApiPath",
    })
    await createNode(apiPathNode)
    createParentChildLink({ parent: openApiNode, child: apiPathNode })

    // Create a Method node for each method in the path
    for (const [method, details] of Object.entries(methods)) {
      createMethodNode(apiPathNode, { method, details })
    }
  }
  async function createMethodNode(apiPathNode, { method, details }) {
    const apiMethodNode = constructNode({
      id: createNodeId(method),
      content: { method, details },
      parentNode: apiPathNode,
      type: "ApiMethod",
    })
    await createNode(apiMethodNode)
    createParentChildLink({ parent: apiPathNode, child: apiMethodNode })
  }

  // Do the magic
  await createOpenApiNode(node)
}

exports.onCreateNode = onCreateNode
