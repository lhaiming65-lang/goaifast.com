-- The original site-wide automatic delivery switch also governs paid commerce orders.
-- Manual admin fulfillment remains available; no balance or payment state is altered.
CREATE OR REPLACE FUNCTION public.commerce_deliver(p_order_id uuid,p_manual boolean DEFAULT false) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE o commerce_orders%ROWTYPE; i commerce_order_items%ROWTYPE; n integer; needed integer;
BEGIN
 SELECT * INTO o FROM commerce_orders WHERE id=p_order_id FOR UPDATE;
 IF o.status NOT IN ('paid','processing') THEN RETURN; END IF;
 FOR i IN SELECT * FROM commerce_order_items WHERE order_id=o.id ORDER BY product_id LOOP
  IF p_manual OR (i.delivery_method <> 'manual' AND COALESCE((SELECT settings_payload->'autoDelivery' FROM go_site_settings WHERE id='default'),'true'::jsonb)<>'false'::jsonb) THEN
   -- A delayed webhook or manual fulfillment must never disclose an expired credential.
   UPDATE commerce_inventory SET status='disabled',order_id=NULL,item_id=NULL WHERE item_id=i.id AND status='reserved' AND expires_at<=now();
   SELECT i.quantity-(SELECT count(*) FROM commerce_deliveries WHERE item_id=i.id AND generation=0)-(SELECT count(*) FROM commerce_inventory WHERE item_id=i.id AND status='reserved') INTO needed;
   IF needed>0 THEN
    UPDATE commerce_inventory SET status='reserved',order_id=o.id,item_id=i.id WHERE id IN
     (SELECT id FROM commerce_inventory WHERE product_id=i.product_id AND status='available' AND (expires_at IS NULL OR expires_at>now()) ORDER BY expires_at ASC NULLS LAST,created_at,id LIMIT needed FOR UPDATE SKIP LOCKED);
   END IF;
   IF (SELECT count(*) FROM commerce_inventory WHERE item_id=i.id AND status='reserved')+(SELECT count(*) FROM commerce_deliveries WHERE item_id=i.id AND generation=0)<i.quantity THEN CONTINUE; END IF;
   INSERT INTO commerce_deliveries(order_id,item_id,inventory_id,secret)
     SELECT o.id,i.id,s.id,s.secret FROM commerce_inventory s WHERE s.item_id=i.id AND s.status='reserved' AND (s.expires_at IS NULL OR s.expires_at>now()) ON CONFLICT(inventory_id) DO NOTHING;
   UPDATE commerce_inventory SET status='delivered',delivered_at=now() WHERE item_id=i.id AND status='reserved' AND (expires_at IS NULL OR expires_at>now());
  END IF;
 END LOOP;
 IF (SELECT count(*) FROM commerce_deliveries WHERE order_id=o.id AND generation=0)=(SELECT sum(quantity) FROM commerce_order_items WHERE order_id=o.id) THEN
  UPDATE commerce_orders SET status='delivered',delivered_at=COALESCE(delivered_at,now()) WHERE id=o.id;
  INSERT INTO commerce_events(order_id,kind,message) VALUES(o.id,'delivered','数字商品已交付，请在订单详情查看并及时验证');
 ELSE
  UPDATE commerce_orders SET status='processing' WHERE id=o.id;
  INSERT INTO commerce_events(order_id,kind,message) SELECT o.id,'delivery_pending','已收款，正在等待人工交付或补充有效库存' WHERE NOT EXISTS(SELECT 1 FROM commerce_events WHERE order_id=o.id AND kind='delivery_pending');
 END IF;
END $$;
