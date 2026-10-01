import { z } from 'zod';

// Convierte un schema de zod en JSON Schema para OpenAPI (sin la clave $schema).
export function toSchema(zodSchema, io = 'input') {
  const { $schema, ...jsonSchema } = z.toJSONSchema(zodSchema, { io });
  return jsonSchema;
}

export const jsonBody = (schema) => ({
  required: true,
  content: { 'application/json': { schema } },
});

export const jsonResponse = (description, schema) => ({
  description,
  content: { 'application/json': { schema } },
});

export const errorResponse = (description) => jsonResponse(description, { $ref: '#/components/schemas/Error' });

export const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
};
