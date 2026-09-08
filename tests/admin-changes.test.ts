import assert from "node:assert/strict";
import { changedRows } from "../src/lib/adminChanges.ts";

Deno.test("editing a customer sends only the changed field and does not purge other rows", () => {
  const before = [{ id: "one", notes: "before", risk_tag: "normal", updated_at: "yesterday" }];
  const after = [{ ...before[0], notes: "after", updated_at: "today" }];
  assert.deepEqual(changedRows("go_customers", before, after), {
    table: "go_customers", upserts: [{ id: "one", notes: "after" }], deletes: [],
  });
});
Deno.test("unchanged products are not resubmitted when saving another operations module", () => {
  const before = [{ id: "sku", price_usd: 8, stock: 7, updated_at: "yesterday" }];
  assert.deepEqual(changedRows("go_products", before, [{ ...before[0], updated_at: "today" }]), {
    table: "go_products", upserts: [], deletes: [],
  });
});
Deno.test("deletions target only records removed from the loaded baseline", () => {
  assert.deepEqual(changedRows("go_suppliers", [{ id: "existing", name: "old" }], [{ id: "new", name: "new" }]), {
    table: "go_suppliers", upserts: [{ id: "new", name: "new" }], deletes: ["existing"],
  });
});
