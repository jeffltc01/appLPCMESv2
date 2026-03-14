-- Fix for "Failed to load product lines" - adds missing columns to product_lines
-- Run this against your LPCApps_Local database if the Admin Product Lines page fails with 500.

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('product_lines') AND name = 'show_where_mask')
BEGIN
    ALTER TABLE product_lines ADD show_where_mask int NOT NULL DEFAULT 15;
END
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('product_lines') AND name = 'created_utc')
BEGIN
    ALTER TABLE product_lines ADD created_utc datetime NOT NULL DEFAULT SYSUTCDATETIME();
END
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('product_lines') AND name = 'updated_utc')
BEGIN
    ALTER TABLE product_lines ADD updated_utc datetime NOT NULL DEFAULT SYSUTCDATETIME();
END
