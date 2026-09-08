import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  LogOut,
  Mail,
  Package,
  ShieldCheck,
  Trash2,
  UserCircle,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone?: string | null;
  created_at: string;
  updated_at: string;
}
async function errorText(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "context" in error &&
    error.context instanceof Response
  ) {
    try {
      const data = await error.context.clone().json();
      if (data.error) return String(data.error);
    } catch {
      /* Use the SDK message. */
    }
  }
  return error instanceof Error ? error.message : "操作失败，请稍后重试";
}
const section = "rounded-2xl border border-border bg-card p-6 md:p-8";
const field = "space-y-2";

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [loadError, setLoadError] = useState("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [emailNotice, setEmailNotice] = useState("");
  const [verificationAfter, setVerificationAfter] = useState(0);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setLoading(true);
    setLoadError("");
    Promise.resolve(
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    )
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setLoadError(error.message);
        else {
          const row = data as ProfileRow | null;
          setProfile(row);
          setFullName(row?.full_name ?? "");
          setAvatarUrl(row?.avatar_url ?? "");
          setPhone(row?.phone ?? "");
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setLoadError("个人资料加载失败，请刷新重试");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const run = async (name: string, action: () => Promise<void>) => {
    if (busy) return;
    setBusy(name);
    try {
      await action();
    } catch (error) {
      toast.error(await errorText(error));
    } finally {
      setBusy("");
    }
  };
  const reauthenticate = async (password: string) => {
    if (!user?.email) throw new Error("此账户未绑定邮箱，请联系客户支持");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (error || data.user?.id !== user.id)
      throw new Error(
        "当前密码不正确，或账户不支持密码登录。请先使用邮件设置密码。",
      );
  };
  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    void run("profile", async () => {
      if (!user) return;
      const avatar = avatarUrl.trim();
      if (avatar) {
        try {
          if (new URL(avatar).protocol !== "https:") throw new Error();
        } catch {
          throw new Error("头像需要使用有效的 HTTPS 图片链接");
        }
      }
      if (phone.trim() && !/^[+()\d\s-]{5,30}$/.test(phone.trim()))
        throw new Error("请输入有效的联系电话，可包含国家代码");
      const update = {
        full_name: fullName.trim() || null,
        avatar_url: avatar || null,
        phone: phone.trim() || null,
      };
      const { data, error } = await supabase
        .from("profiles")
        .update(update)
        .eq("id", user.id)
        .select("*")
        .single();
      if (error)
        throw new Error(
          error.message.includes("phone")
            ? "账户资料服务尚未升级，请联系管理员部署最新数据库迁移"
            : error.message,
        );
      setProfile(data as ProfileRow);
      const { error: displayError } = await supabase.auth.updateUser({ data: { full_name: update.full_name, avatar_url: update.avatar_url } });
      if (displayError) toast.info("资料已保存，账户菜单中的显示名称将在下次更新后刷新");
      else toast.success("个人资料已保存");
    });
  };
  const changeEmail = (event: FormEvent) => {
    event.preventDefault();
    void run("email", async () => {
      if (newEmail.trim().toLowerCase() === user?.email?.toLowerCase())
        throw new Error("新邮箱与当前邮箱相同");
      await reauthenticate(emailPassword);
      const { error } = await supabase.auth.updateUser(
        { email: newEmail.trim() },
        { emailRedirectTo: window.location.origin + "/profile" },
      );
      if (error) throw error;
      setEmailPassword("");
      setEmailNotice(
        "申请已提交，请检查新、旧邮箱并完成确认。登录邮箱会在验证成功后更新。",
      );
      toast.success("请前往邮箱完成确认");
    });
  };
  const changePassword = (event: FormEvent) => {
    event.preventDefault();
    void run("password", async () => {
      if (newPassword.length < 8 || newPassword.length > 72)
        throw new Error("新密码需要 8–72 个字符");
      if (newPassword !== confirmPassword)
        throw new Error("两次输入的新密码不一致");
      if (newPassword === currentPassword)
        throw new Error("新密码不能与当前密码相同");
      await reauthenticate(currentPassword);
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        current_password: currentPassword,
      });
      if (error) throw error;
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      const { error: revokeError } = await supabase.auth.signOut({
        scope: "others",
      });
      if (revokeError)
        toast.warning(
          "密码已修改，但其他设备退出失败，请稍后使用“退出所有设备”重试",
        );
      else toast.success("密码已更新，其他设备已退出登录");
    });
  };
  const resetPassword = () =>
    void run("reset", async () => {
      if (!user?.email) return;
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) throw error;
      toast.success("密码设置邮件已发送，请检查邮箱");
    });
  const deleteAccount = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || deletePhrase !== "删除我的账号") return;
    setBusy("delete");
    setDeleteError("");
    try {
      const { data, error } = await supabase.functions.invoke(
        "account-delete",
        { body: { password: deletePassword, confirmation: deletePhrase } },
      );
      if (error) throw error;
      if (!data?.deleted)
        throw new Error(data?.error || "账号删除未完成，请稍后重试");
      await supabase.auth.signOut({ scope: "local" });
      toast.success("账号已删除，个人资料已清除");
      navigate("/", { replace: true });
    } catch (error) {
      setDeleteError(await errorText(error));
    } finally {
      setBusy("");
      setDeletePassword("");
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            返回商城
          </Link>
          <span className="font-semibold">GoAifast · 账户中心</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:py-12">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white">
            <UserCircle className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">我的账户</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              管理资料、安全设置和购物服务
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              to: "/orders",
              title: "我的订单",
              sub: "查看卡密、交付与售后",
              icon: Package,
            },
            {
              to: "/wallet",
              title: "我的钱包",
              sub: "余额、充值与原路退款",
              icon: Wallet,
            },
            {
              to: "/support",
              title: "售后与投诉",
              sub: "商品问题与服务跟进",
              icon: ShieldCheck,
            },
          ].map(({ to, title, sub, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <Icon className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
        <section className={section}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">个人资料</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {user?.email_confirmed_at ? "邮箱已验证" : "邮箱尚未验证"}
            </span>
          </div>
          <p className="mb-5 flex items-center gap-2 break-all text-sm text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            {user?.email}
          </p>
          {!user?.email_confirmed_at && (
            <Button
              variant="outline"
              size="sm"
              className="mb-5"
              disabled={!!busy}
              onClick={() =>
                void run("verify", async () => {
                  if (!user?.email) return;
                  if (Date.now() < verificationAfter)
                    throw new Error("邮件已发送，请一分钟后重试");
                  const { error } = await supabase.auth.resend({
                    type: "signup",
                    email: user.email,
                    options: {
                      emailRedirectTo: window.location.origin + "/profile",
                    },
                  });
                  if (error) throw error;
                  setVerificationAfter(Date.now() + 60_000);
                  toast.success("验证邮件已发送");
                })
              }
            >
              重新发送验证邮件
            </Button>
          )}
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在读取资料…
            </div>
          ) : loadError ? (
            <p role="alert" className="text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <form onSubmit={saveProfile} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className={field}>
                  <Label htmlFor="profile-name">昵称</Label>
                  <Input
                    id="profile-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    maxLength={100}
                    autoComplete="name"
                    placeholder="如何称呼你"
                  />
                </div>
                <div className={field}>
                  <Label htmlFor="profile-phone">联系电话（选填）</Label>
                  <Input
                    id="profile-phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    type="tel"
                    autoComplete="tel"
                    maxLength={30}
                    placeholder="含国家 / 地区代码"
                  />
                  <p className="text-xs text-muted-foreground">
                    用于联系，不作为登录或身份验证方式。
                  </p>
                </div>
              </div>
              <div className={field}>
                <Label htmlFor="profile-avatar">头像图片链接（选填）</Label>
                <Input
                  id="profile-avatar"
                  type="url"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  maxLength={2048}
                  placeholder="https://…"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  注册于{" "}
                  {new Date(
                    profile?.created_at || user?.created_at || Date.now(),
                  ).toLocaleDateString("zh-CN")}
                </p>
                <Button type="submit" disabled={!!busy}>
                  {busy === "profile" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  保存资料
                </Button>
              </div>
            </form>
          )}
        </section>
        <section className={section}>
          <h2 className="text-lg font-semibold">登录与安全</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            更换邮箱或密码前需要验证当前密码。使用第三方登录且未设置密码，可先通过邮件设置。
          </p>
          <button
            type="button"
            disabled={!!busy}
            onClick={resetPassword}
            className="mt-2 text-sm text-primary hover:underline disabled:opacity-50"
          >
            发送密码设置 / 重置邮件
          </button>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <form onSubmit={changeEmail} className="space-y-4">
              <h3 className="font-medium">更换登录邮箱</h3>
              <div className={field}>
                <Label htmlFor="new-email">新邮箱</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  required
                  maxLength={255}
                  autoComplete="email"
                />
              </div>
              <div className={field}>
                <Label htmlFor="email-password">当前密码</Label>
                <Input
                  id="email-password"
                  type="password"
                  value={emailPassword}
                  onChange={(event) => setEmailPassword(event.target.value)}
                  required
                  maxLength={72}
                  autoComplete="current-password"
                />
              </div>
              {emailNotice && (
                <p
                  role="status"
                  className="rounded-lg bg-primary/5 p-3 text-xs leading-relaxed"
                >
                  {emailNotice}
                </p>
              )}
              <Button variant="outline" type="submit" disabled={!!busy}>
                {busy === "email" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                验证并更换邮箱
              </Button>
            </form>
            <form onSubmit={changePassword} className="space-y-4">
              <h3 className="font-medium">修改密码</h3>
              <div className={field}>
                <Label htmlFor="current-password">当前密码</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                  maxLength={72}
                  autoComplete="current-password"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className={field}>
                  <Label htmlFor="new-password">新密码</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                  />
                </div>
                <div className={field}>
                  <Label htmlFor="confirm-password">确认新密码</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                8–72 个字符。修改成功后，其他设备需要重新登录。
              </p>
              <Button variant="outline" type="submit" disabled={!!busy}>
                {busy === "password" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                更新密码
              </Button>
            </form>
          </div>
        </section>
        <section
          className={
            section +
            " flex flex-col justify-between gap-5 sm:flex-row sm:items-center"
          }
        >
          <div>
            <h2 className="font-semibold">退出登录</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              退出当前账号及其他设备的登录会话。
            </p>
          </div>
          <Button
            variant="outline"
            disabled={!!busy}
            onClick={() =>
              void run("logout", async () => {
                await signOut();
                navigate("/", { replace: true });
              })
            }
          >
            <LogOut className="mr-2 h-4 w-4" />
            退出所有设备
          </Button>
        </section>
        <section className={section + " border-destructive/20"}>
          <h2 className="font-semibold text-destructive">注销并删除账号</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            删除后无法恢复登录和个人资料。请先完成订单与售后，并将钱包余额原路退回。交易、退款等必要记录会保留用于对账和争议处理。
          </p>
          <Button
            variant="outline"
            className="mt-4 text-destructive hover:text-destructive"
            disabled={!!busy}
            onClick={() => {
              setDeleteError("");
              setDeletePhrase("");
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            申请删除账号
          </Button>
        </section>
      </main>
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (busy !== "delete") {
            setDeleteOpen(open);
            setDeletePassword("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>永久删除账号</DialogTitle>
            <DialogDescription>
              此操作无法撤销。系统会检查余额、未完成订单、待支付款项与售后；存在未结事项时会拒绝删除并说明原因。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={deleteAccount} className="space-y-4">
            <div className={field}>
              <Label htmlFor="delete-password">当前密码</Label>
              <Input
                id="delete-password"
                type="password"
                required
                maxLength={72}
                autoComplete="current-password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
              />
            </div>
            <div className={field}>
              <Label htmlFor="delete-confirmation">
                请输入「删除我的账号」
              </Label>
              <Input
                id="delete-confirmation"
                autoComplete="off"
                value={deletePhrase}
                onChange={(event) => setDeletePhrase(event.target.value)}
                required
              />
            </div>
            {deleteError && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive"
              >
                {deleteError}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={busy === "delete"}
                onClick={() => {
                  setDeleteOpen(false);
                  setDeletePassword("");
                }}
              >
                保留账号
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={
                  !!busy || deletePhrase !== "删除我的账号" || !deletePassword
                }
              >
                {busy === "delete" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                确认永久删除
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
