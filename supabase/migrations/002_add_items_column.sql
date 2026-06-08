-- Add items JSONB column to store individual receipt line items with categories
alter table receipts add column if not exists items jsonb;
