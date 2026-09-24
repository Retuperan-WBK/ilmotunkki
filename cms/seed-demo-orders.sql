-- Development only: run against the local Docker Compose database, never production.
-- From the repository root: docker compose exec -T db psql -U postgres -d strapi < cms/seed-demo-orders.sql
-- Direct inserts avoid Strapi order lifecycle hooks that send customer emails.
-- Requires an empty orders table and the existing ticket types and seating plan.
\set ON_ERROR_STOP on
BEGIN;

DO $seed$
DECLARE
  first_names text[] := ARRAY['Aino', 'Eero', 'Kaisa', 'Mikko', 'Salla', 'Oona', 'Leo', 'Veera'];
  ticket_types text[];
  placed_count integer;
  customer_id integer;
  order_id integer;
  group_id integer;
  item_id integer;
  item_type_id integer;
  seat_id integer;
  created timestamp;
  ticket_slug text;
  i integer;
  j integer;
BEGIN
  IF EXISTS (SELECT 1 FROM orders) THEN
    RAISE EXCEPTION 'Demo seed requires an empty development orders table';
  END IF;

  IF (SELECT count(*) FROM item_types WHERE slug IN ('iiluokka', 'iluokka', 'deluxe', 'opiskelija')) <> 4 THEN
    RAISE EXCEPTION 'Demo seed requires the existing four ticket types';
  END IF;

  SELECT id INTO group_id FROM groups WHERE name = 'Demo-ryhmä (vain kehitys)';
  IF group_id IS NULL THEN
    INSERT INTO groups (name, created_at, updated_at)
    VALUES ('Demo-ryhmä (vain kehitys)', now(), now())
    RETURNING id INTO group_id;
  END IF;

  FOR i IN 1..8 LOOP
    created := now() - (8 - i) * interval '1 day';
    ticket_types := CASE i
      WHEN 1 THEN ARRAY['iiluokka', 'iiluokka']
      WHEN 2 THEN ARRAY['iluokka', 'iluokka', 'deluxe']
      WHEN 3 THEN ARRAY['deluxe']
      WHEN 4 THEN ARRAY['iiluokka', 'opiskelija', 'iiluokka']
      WHEN 5 THEN ARRAY['iluokka', 'deluxe']
      WHEN 6 THEN ARRAY['iiluokka', 'opiskelija', 'iluokka']
      WHEN 7 THEN ARRAY['opiskelija']
      ELSE ARRAY['deluxe', 'deluxe']
    END;
    placed_count := CASE i
      WHEN 1 THEN 2
      WHEN 2 THEN 1
      WHEN 3 THEN 1
      WHEN 4 THEN 0
      WHEN 5 THEN 2
      WHEN 6 THEN 2
      WHEN 7 THEN 0
      ELSE 2
    END;

    INSERT INTO customers (
      first_name, last_name, email, uid, locale, accept, special_arragements,
      created_at, updated_at
    ) VALUES (
      first_names[i], 'Demo',
      'demo-order-' || lpad(i::text, 2, '0') || '@example.invalid',
      'demo-concert-customer-' || lpad(i::text, 2, '0'),
      CASE WHEN i = 6 THEN 'en' ELSE 'fi' END,
      true,
      CASE WHEN i = 5 THEN 'Esteetön sisäänkäynti (demo)' END,
      created, created
    ) RETURNING id INTO customer_id;

    INSERT INTO orders (uid, status, kutsuvieras, tickets_sent, created_at, updated_at)
    VALUES (
      'demo-concert-order-' || lpad(i::text, 2, '0'),
      CASE WHEN i = 4 THEN 'admin-new' ELSE 'ok' END,
      i = 3, i = 1, created, created
    ) RETURNING id INTO order_id;

    INSERT INTO orders_customer_links (order_id, customer_id, order_order)
    VALUES (order_id, customer_id, 1);

    IF i IN (3, 4) THEN
      INSERT INTO orders_group_links (order_id, group_id, order_order)
      VALUES (order_id, group_id, i - 2);
    END IF;

    FOR j IN 1..array_length(ticket_types, 1) LOOP
      ticket_slug := ticket_types[j];
      SELECT id INTO STRICT item_type_id FROM item_types WHERE slug = ticket_slug;

      INSERT INTO items (created_at, updated_at)
      VALUES (created, created)
      RETURNING id INTO item_id;
      INSERT INTO items_order_links (item_id, order_id, item_order)
      VALUES (item_id, order_id, j);
      INSERT INTO items_item_type_links (item_id, item_type_id)
      VALUES (item_id, item_type_id);

      IF j <= placed_count THEN
        -- Student tickets use an available second-class seat.
        SELECT s.id INTO seat_id
        FROM seats s
        JOIN seats_item_type_links st ON st.seat_id = s.id
        JOIN item_types t ON t.id = st.item_type_id
        JOIN seats_section_links ssl ON ssl.seat_id = s.id
        JOIN sections sec ON sec.id = ssl.section_id
        WHERE t.slug = CASE WHEN ticket_slug = 'opiskelija' THEN 'iiluokka' ELSE ticket_slug END
          AND sec.name = CASE WHEN i IN (1, 6) AND ticket_slug IN ('iiluokka', 'opiskelija')
                              THEN 'Parveke' ELSE 'Permanto' END
          AND NOT EXISTS (SELECT 1 FROM items_seat_links isl WHERE isl.seat_id = s.id)
        ORDER BY s.id
        LIMIT 1;

        IF seat_id IS NULL THEN
          RAISE EXCEPTION 'No free matching seat for order %, ticket %', i, j;
        END IF;

        INSERT INTO items_seat_links (item_id, seat_id) VALUES (item_id, seat_id);
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Seeded 8 demo orders with 17 tickets, 10 assigned seats and one demo group';
END
$seed$;

COMMIT;
