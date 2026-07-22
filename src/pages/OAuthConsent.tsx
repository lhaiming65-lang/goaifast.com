import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type AuthOauth = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

function oauthApi(): AuthOauth {
  return (supabase.auth as unknown as { oauth: AuthOauth }).oauth;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Missing authorization_id");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      try {
        const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) return setError(error.message ?? String(error));
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e: any) {
        if (active) setError(e?.message ?? String(e));
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    try {
      const { data, error } = approve
        ? await oauthApi().approveAuthorization(authorizationId)
        : await oauthApi().denyAuthorization(authorizationId);
      if (error) {
        setBusy(false);
        return setError(error.message ?? String(error));
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setBusy(false);
        return setError("No redirect returned by the authorization server.");
      }
      window.location.href = target;
    } catch (e: any) {
      setBusy(false);
      setError(e?.message ?? String(e));
    }
  }

  if (error)
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border rounded-2xl p-6">
          <h1 className="text-xl font-semibold mb-2">Authorization error</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    );

  if (!details)
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-muted-foreground">
        Loading…
      </main>
    );

  const clientName = details.client?.name ?? details.client?.client_name ?? "an app";
  const scopes: string[] = Array.isArray(details.scopes)
    ? details.scopes
    : typeof details.scope === "string"
      ? details.scope.split(" ").filter(Boolean)
      : [];

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="max-w-md w-full bg-card border rounded-2xl p-6 space-y-5 shadow-soft">
        <div>
          <h1 className="text-2xl font-bold">Connect {clientName} to GoAifast</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {clientName} will be able to call GoAifast's enabled tools while you are signed in.
          </p>
        </div>
        {scopes.length > 0 && (
          <div className="text-sm">
            <div className="font-medium mb-1">Requested permissions</div>
            <ul className="list-disc list-inside text-muted-foreground">
              {scopes.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          This does not bypass GoAifast's permissions or backend policies.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => decide(true)} disabled={busy} className="flex-1">
            Approve
          </Button>
          <Button onClick={() => decide(false)} disabled={busy} variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </main>
  );
}
