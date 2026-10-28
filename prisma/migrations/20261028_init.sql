-- Markose PostgreSQL Invariants & Migration (Section 4.3 of Design Document)
-- Triggers, CHECK Constraints, and pg_trgm Search Indexes

CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Financial & Quantity CHECK Constraints
ALTER TABLE "order_items"
  ADD CONSTRAINT "chk_order_items_quantity" CHECK (quantity BETWEEN 1 AND 1000),
  ADD CONSTRAINT "chk_order_items_unit_price" CHECK (unit_price_snapshot >= 0),
  ADD CONSTRAINT "chk_order_items_line_discount" CHECK (line_discount >= 0 AND line_discount <= (unit_price_snapshot * quantity)),
  ADD CONSTRAINT "chk_order_items_line_total" CHECK (line_total = (unit_price_snapshot * quantity) - line_discount);

ALTER TABLE "orders"
  ADD CONSTRAINT "chk_orders_subtotal" CHECK (subtotal >= 0),
  ADD CONSTRAINT "chk_orders_discount_amount" CHECK (discount_amount >= 0 AND discount_amount <= subtotal),
  ADD CONSTRAINT "chk_orders_shipping_fee" CHECK (shipping_fee >= 0),
  ADD CONSTRAINT "chk_orders_total_amount" CHECK (total_amount = subtotal - discount_amount + shipping_fee);

ALTER TABLE "landing_page_products"
  ADD CONSTRAINT "chk_lpp_max_quantity" CHECK (max_quantity BETWEEN 1 AND 100),
  ADD CONSTRAINT "chk_lpp_price_override" CHECK (price_override IS NULL OR price_override >= 0);

-- 2. Append-Only Trigger for order_status_history (Reject UPDATE and DELETE)
CREATE OR REPLACE FUNCTION prevent_history_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Markose Security Invariant: order_status_history is append-only. UPDATE and DELETE are prohibited.'
    USING ERRCODE = '23505';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_status_history_append_only
BEFORE UPDATE OR DELETE ON "order_status_history"
FOR EACH ROW EXECUTE FUNCTION prevent_history_modification();

-- 3. Append-Only Trigger for audit_logs (Reject UPDATE and DELETE)
CREATE TRIGGER trg_audit_logs_append_only
BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW EXECUTE FUNCTION prevent_history_modification();

-- 4. Atomic Order Counter Allocation Function (Africa/Cairo Yearly Counter)
CREATE OR REPLACE FUNCTION allocate_order_number(p_year INT)
RETURNS INT AS $$
DECLARE
  v_next_val INT;
BEGIN
  INSERT INTO "order_counters" (year, last_value)
  VALUES (p_year, 1)
  ON CONFLICT (year)
  DO UPDATE SET last_value = "order_counters".last_value + 1
  RETURNING last_value INTO v_next_val;

  RETURN v_next_val;
END;
$$ LANGUAGE plpgsql;

-- 5. Full-text Trigram Indexes for Arabic Search
CREATE INDEX IF NOT EXISTS "idx_orders_search_trgm" ON "orders" USING gin (
  (order_number || ' ' || ship_name || ' ' || ship_phone) gin_trgm_ops
);

CREATE INDEX IF NOT EXISTS "idx_customers_search_trgm" ON "customers" USING gin (
  (full_name || ' ' || phone || ' ' || normalized_phone) gin_trgm_ops
);
