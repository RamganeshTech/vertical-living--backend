// src/validators/common.validator.ts

export function validateCommonFields(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    errors.push("Name is required and must be a non-empty string.");
  }

  return { valid: errors.length === 0, errors };
}
