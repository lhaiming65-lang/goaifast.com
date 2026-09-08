-- Read-only schema inspection before installing the commerce migration.
-- This does not inspect customer rows, credentials, balances or inventory.
SELECT current_database() AS database_name, current_user AS database_role;

SELECT name, to_regclass(name) AS relation
FROM (VALUES ('public.profiles'), ('public.orders'), ('public.store_products'),
 ('public.user_roles'), ('auth.users'), ('supabase_migrations.schema_migrations')) x(name);

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('profiles','orders','store_products','user_roles')
ORDER BY table_name, ordinal_position;

SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname IN ('public','auth') AND p.proname IN ('has_role','handle_new_user','uid');

SELECT e.enumlabel FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
JOIN pg_enum e ON e.enumtypid=t.oid WHERE n.nspname='public' AND t.typname='app_role';

SELECT rolname FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role');

SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_name LIKE 'commerce\_%' ESCAPE '\';

SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p WHERE p.pronamespace='public'::regnamespace
AND (p.proname LIKE 'commerce\_%' ESCAPE '\' OR p.proname='sync_commerce_profile_email');

SELECT tgname, tgrelid::regclass AS relation, pg_get_triggerdef(oid) AS definition
FROM pg_trigger WHERE NOT tgisinternal
AND (tgrelid=to_regclass('auth.users') OR tgname LIKE 'commerce%');

SELECT conname, conrelid::regclass AS relation, pg_get_constraintdef(oid) AS definition
FROM pg_constraint WHERE contype='f' AND conrelid=to_regclass('public.orders');

SELECT tablename, policyname, roles, cmd, qual, with_check FROM pg_policies
WHERE schemaname='public' AND (tablename IN ('orders','profiles','store_products','user_roles','admin_site_store')
 OR tablename LIKE 'go\_%' ESCAPE '\') ORDER BY tablename, policyname;
