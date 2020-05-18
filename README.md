# gatsby-transformer-openapi

**This project is a work in progress and is not currently suitable for use.**

Converts OpenAPI 3.0 YAML definitions into to Gatsby GraphQL nodes

```graphql
query GetOpenAPIConfiguration {
  openApi {
    openapi
    info {
      title
      version
      license {
        name
      }
    }
    paths: childrenApiPath {
      path
      methods: childrenApiMethod {
        operationId
        method
        summary
        tags
        parameters: childApiParameter {
          name
          in
          description
          schema {
            type
          }
        }
        responses: childrenApiResponse {
          code
          description
          schema: childApiObjectSchema {
            required
            properties: childrenApiObjectSchemaProperty {
              type
              format
              fieldName
            }
          }
        }
      }
    }
  }
}

```
