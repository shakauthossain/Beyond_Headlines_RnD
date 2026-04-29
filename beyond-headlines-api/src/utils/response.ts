import { Response } from 'express';

// Helper to include email in all responses
const withEmail = (res: Response, body: any) => {
  const email = res.locals.laravelUserEmail;
  return { ...body, ...(email && { email }) };
};

// Consistent response helpers — all include email from request
export const ok = (res: Response, data: any) => res.status(200).json(withEmail(res, { data }));

export const created = (res: Response, data: any) => res.status(201).json(withEmail(res, { data }));

export const noContent = (res: Response) => res.status(204).send();

export const notFound = (res: Response, msg: string) => res.status(404).json(withEmail(res, { error: msg }));

export const badRequest = (res: Response, msg: string) => res.status(400).json(withEmail(res, { error: msg }));

export const serverError = (res: Response, err: any) =>
  res.status(500).json(withEmail(res, { error: err?.message || 'Internal Server Error' }));

export const unauthorized = (res: Response, msg?: string) => res.status(401).json(withEmail(res, { error: msg || 'Unauthorized' }));

export const forbidden = (res: Response) => res.status(403).json(withEmail(res, { error: 'Forbidden' }));

export const list = (res: Response, data: any[], total: number, page?: number, limit?: number) =>
  res.status(200).json(withEmail(res, { data, meta: { total, page, limit } }));

export const validationError = (res: Response, details: any) =>
  res.status(422).json(withEmail(res, { error: 'Validation failed', details }));

export const prePublishError = (res: Response, missing: string[]) =>
  res.status(422).json(withEmail(res, { error: 'Pre-publish checklist failed', missing }));
