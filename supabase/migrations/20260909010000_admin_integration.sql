-- Keep the original operations workspace and the checkout catalog connected.
-- Historical account pools and manually recorded transactions retain their IDs.
ALTER TABLE public.go_products ADD COLUMN commerce_product_id uuid REFERENCES public.store_products(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX go_products_commerce_product_id_key ON public.go_products(commerce_product_id);
UPDATE public.go_products g SET commerce_product_id=s.id FROM public.store_products s WHERE g.title_key=s.slug;

CREATE FUNCTION public.go_product_to_commerce() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target uuid; mode text;
BEGIN
 IF pg_trigger_depth()>1 THEN
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
 END IF;
 IF TG_OP='DELETE' THEN
  UPDATE store_products SET status='inactive' WHERE id=OLD.commerce_product_id;
  RETURN OLD;
 END IF;
 mode:=CASE NEW.delivery_mode WHEN 'manual' THEN 'manual' WHEN 'mixed' THEN 'auto_manual' ELSE 'automatic' END;
 IF TG_OP='INSERT' OR NEW.commerce_product_id IS NULL THEN
  INSERT INTO store_products(slug,title,category,price,original_price,cost,badge,status,delivery_method,subtitle,delivery_rules,detail_description,color,image_url)
  VALUES(NEW.title_key,NEW.title_key,NEW.category,NEW.price_usd,NEW.original_price_usd,NEW.cost_usd,COALESCE(NEW.badge,''),CASE WHEN NEW.status='enabled' THEN 'active' ELSE 'inactive' END,mode,COALESCE(NEW.subtitle,''),COALESCE(NEW.delivery,''),COALESCE(NEW.description,''),NEW.color,COALESCE(NEW.image_url,''))
  ON CONFLICT(slug) DO UPDATE SET updated_at=store_products.updated_at RETURNING id INTO target;
  NEW.commerce_product_id:=target;
 ELSE
  -- Field-level updates preserve independently configured warranty and replacement rules.
  UPDATE store_products s SET
   slug=CASE WHEN NEW.title_key IS DISTINCT FROM OLD.title_key THEN NEW.title_key ELSE s.slug END,
   title=CASE WHEN NEW.title_key IS DISTINCT FROM OLD.title_key THEN NEW.title_key ELSE s.title END,
   category=CASE WHEN NEW.category IS DISTINCT FROM OLD.category THEN NEW.category ELSE s.category END,
   price=CASE WHEN NEW.price_usd IS DISTINCT FROM OLD.price_usd THEN NEW.price_usd ELSE s.price END,
   original_price=CASE WHEN NEW.original_price_usd IS DISTINCT FROM OLD.original_price_usd THEN NEW.original_price_usd ELSE s.original_price END,
   cost=CASE WHEN NEW.cost_usd IS DISTINCT FROM OLD.cost_usd THEN NEW.cost_usd ELSE s.cost END,
   badge=CASE WHEN NEW.badge IS DISTINCT FROM OLD.badge THEN COALESCE(NEW.badge,'') ELSE s.badge END,
   status=CASE WHEN NEW.status IS DISTINCT FROM OLD.status THEN CASE WHEN NEW.status='enabled' THEN 'active' ELSE 'inactive' END ELSE s.status END,
   delivery_method=CASE WHEN NEW.delivery_mode IS DISTINCT FROM OLD.delivery_mode THEN mode ELSE s.delivery_method END,
   subtitle=CASE WHEN NEW.subtitle IS DISTINCT FROM OLD.subtitle THEN COALESCE(NEW.subtitle,'') ELSE s.subtitle END,
   delivery_rules=CASE WHEN NEW.delivery IS DISTINCT FROM OLD.delivery THEN COALESCE(NEW.delivery,'') ELSE s.delivery_rules END,
   detail_description=CASE WHEN NEW.description IS DISTINCT FROM OLD.description THEN COALESCE(NEW.description,'') ELSE s.detail_description END,
   color=CASE WHEN NEW.color IS DISTINCT FROM OLD.color THEN NEW.color ELSE s.color END,
   image_url=CASE WHEN NEW.image_url IS DISTINCT FROM OLD.image_url THEN COALESCE(NEW.image_url,'') ELSE s.image_url END
  WHERE s.id=NEW.commerce_product_id;
 END IF;
 -- Legacy stock is a supply estimate. Only commerce_inventory grants sellable units.
 RETURN NEW;
END $$;

CREATE FUNCTION public.go_product_from_commerce() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF pg_trigger_depth()>1 THEN RETURN NEW; END IF;
 INSERT INTO go_products(id,commerce_product_id,title_key,category,price_usd,original_price_usd,cost_usd,badge,status,delivery_mode,subtitle,delivery,description,color,image_url)
 VALUES('commerce-'||NEW.id,NEW.id,NEW.slug,NEW.category,NEW.price,COALESCE(NEW.original_price,NEW.price),COALESCE(NEW.cost,0),NEW.badge,CASE WHEN NEW.status='active' THEN 'enabled' ELSE 'disabled' END,CASE NEW.delivery_method WHEN 'manual' THEN 'manual' WHEN 'auto_manual' THEN 'mixed' ELSE 'auto' END,NEW.subtitle,NEW.delivery_rules,NEW.detail_description,COALESCE(NEW.color,'bg-gradient-to-br from-orange-500 to-rose-600'),NEW.image_url)
 ON CONFLICT(commerce_product_id) DO UPDATE SET
  title_key=excluded.title_key,category=excluded.category,price_usd=excluded.price_usd,original_price_usd=excluded.original_price_usd,
  cost_usd=excluded.cost_usd,badge=excluded.badge,status=excluded.status,delivery_mode=excluded.delivery_mode,
  subtitle=excluded.subtitle,delivery=excluded.delivery,description=excluded.description,color=excluded.color,image_url=excluded.image_url,
  updated_at=now();
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.go_product_to_commerce(),public.go_product_from_commerce() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER go_product_commerce_bridge BEFORE INSERT OR UPDATE OR DELETE ON public.go_products FOR EACH ROW EXECUTE FUNCTION public.go_product_to_commerce();
CREATE TRIGGER commerce_product_go_bridge AFTER INSERT OR UPDATE ON public.store_products FOR EACH ROW EXECUTE FUNCTION public.go_product_from_commerce();
-- Seed only catalog links and common product fields; do not move orders or credentials.
UPDATE public.store_products SET updated_at=updated_at;

CREATE FUNCTION public.go_admin_apply_changes(p_changes jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE batch jsonb; entry jsonb; tbl text; key text; columns text; assignments text; valid_columns text[]; old_row jsonb; applied integer:=0;
BEGIN
 IF NOT COALESCE(has_role(auth.uid(),'admin'),false) THEN RAISE EXCEPTION '仅管理员可保存运营数据' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_changes) IS DISTINCT FROM 'array' OR jsonb_array_length(p_changes)>10 OR octet_length(p_changes::text)>5000000 THEN RAISE EXCEPTION '保存内容无效或过大'; END IF;
 FOR batch IN SELECT value FROM jsonb_array_elements(p_changes) LOOP
  tbl:=batch->>'table';
  IF tbl IS NULL OR tbl NOT IN ('go_products','go_inventory_accounts','go_admin_orders','go_tickets','go_suppliers','go_customers','go_admin_operators','go_ip_pricing_rules','go_analytics_events','go_site_settings') THEN RAISE EXCEPTION '不允许修改该数据表'; END IF;
  SELECT array_agg(a.attname::text) INTO valid_columns FROM pg_attribute a WHERE a.attrelid=format('public.%I',tbl)::regclass AND a.attnum>0 AND NOT a.attisdropped AND a.attname NOT IN ('commerce_product_id','updated_at');
  IF jsonb_typeof(batch->'upserts') IS DISTINCT FROM 'array' OR jsonb_typeof(batch->'deletes') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION '保存格式无效'; END IF;
  FOR entry IN SELECT value FROM jsonb_array_elements(batch->'upserts') LOOP
   IF jsonb_typeof(entry) IS DISTINCT FROM 'object' OR nullif(entry->>'id','') IS NULL THEN RAISE EXCEPTION '缺少记录编号'; END IF;
   FOR key IN SELECT jsonb_object_keys(entry) LOOP
    IF NOT key=ANY(valid_columns) THEN RAISE EXCEPTION '不允许修改字段 %',key; END IF;
   END LOOP;
   EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id=$1 FOR UPDATE',tbl) INTO old_row USING entry->>'id';
   SELECT string_agg(format('%I',k),','),string_agg(format('%I=excluded.%I',k,k),',') FILTER(WHERE k<>'id') INTO columns,assignments FROM jsonb_object_keys(entry) k;
   IF old_row IS NULL THEN
    EXECUTE format('INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I,$1)',tbl,columns,columns,tbl) USING entry;
   ELSIF assignments IS NOT NULL THEN
    -- Merge with the locked row so omitted required fields and concurrent unrelated changes survive.
    EXECUTE format('UPDATE public.%I SET (%s)=(SELECT %s FROM jsonb_populate_record(NULL::public.%I,$1)),updated_at=now() WHERE id=$2',tbl,columns,columns,tbl) USING old_row||entry,entry->>'id';
   END IF;
   applied:=applied+1;
  END LOOP;
  FOR entry IN SELECT value FROM jsonb_array_elements(batch->'deletes') LOOP
   IF tbl='go_site_settings' THEN RAISE EXCEPTION '站点设置不能删除'; END IF;
   EXECUTE format('DELETE FROM public.%I WHERE id=$1',tbl) USING entry#>>'{}';
   applied:=applied+1;
  END LOOP;
 END LOOP;
 INSERT INTO commerce_audit(actor_id,action,details) VALUES(auth.uid(),'operations_saved',jsonb_build_object('records',applied));
 RETURN jsonb_build_object('saved',applied);
END $$;
REVOKE ALL ON FUNCTION public.go_admin_apply_changes(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.go_admin_apply_changes(jsonb) TO authenticated;
