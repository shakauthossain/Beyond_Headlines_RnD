import { Response } from 'express';

// Consistent response helpers
export const ok = (res: Response, data: any) => res.status(200).json({ data });

export const created = (res: Response, data: any) => res.status(201).json({ data });

export const noContent = (res: Response) => res.status(204).send();

export const notFound = (res: Response, msg: string) => res.status(404).json({ error: msg });

export const badRequest = (res: Response, msg: string) => res.status(400).json({ error: msg });

export const unauthorized = (res: Response) => res.status(401).json({ error: 'Unauthorized' });

export const forbidden = (res: Response) => res.status(403).json({ error: 'Forbidden' });

export const list = (res: Response, data: any[], total: number, page?: number, limit?: number) =>
  res.status(200).json({ data, meta: { total, page, limit } });

export const validationError = (res: Response, details: any) =>
  res.status(422).json({ error: 'Validation failed', details });

export const prePublishError = (res: Response, missing: string[]) =>
  res.status(422).json({ error: 'Pre-publish checklist failed', missing });
