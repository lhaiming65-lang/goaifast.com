export type AdminRow = { id: string; [key: string]: unknown };
export type AdminTableChange = { table: string; upserts: AdminRow[]; deletes: string[] };

// Compare the edited draft with its loaded baseline, never with an empty table.
// Only changed fields are sent, so another operator's unrelated edits survive.
export function changedRows(table: string, before: AdminRow[], after: AdminRow[]): AdminTableChange {
  const previous = new Map(before.map(row => [row.id, row]));
  const remaining = new Set(after.map(row => row.id));
  const upserts: AdminRow[] = [];
  for (const row of after) {
    const old = previous.get(row.id);
    const patch: AdminRow = { id: row.id };
    for (const [key, value] of Object.entries(row)) {
      if (key !== "id" && key !== "updated_at" && (!old || JSON.stringify(old[key]) !== JSON.stringify(value))) patch[key] = value;
    }
    if (!old || Object.keys(patch).length > 1) upserts.push(patch);
  }
  return { table, upserts, deletes: before.filter(row => !remaining.has(row.id)).map(row => row.id) };
}
