declare module "swagger-jsdoc" {
  type SwaggerJSDocOptions = {
    definition: Record<string, unknown>;
    apis?: string[];
  };

  function swaggerJsdoc(options?: SwaggerJSDocOptions): Record<string, unknown>;

  export default swaggerJsdoc;
}
