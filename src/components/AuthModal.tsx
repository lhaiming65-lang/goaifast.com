import { useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import AuthForm from "./AuthForm";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: "signin" | "signup";
}

export default function AuthModal({ open, onOpenChange, initialMode = "signin" }: Props) {
  const { user } = useAuth();

  // Auto-close on successful auth (covers OAuth popup flows where onSuccess isn't invoked)
  useEffect(() => {
    if (open && user) onOpenChange(false);
  }, [open, user, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-8 rounded-2xl">
        <VisuallyHidden>
          <DialogTitle>{initialMode === "signup" ? "Sign up" : "Sign in"}</DialogTitle>
          <DialogDescription>Authenticate to your account</DialogDescription>
        </VisuallyHidden>
        <AuthForm initialMode={initialMode} onSuccess={() => onOpenChange(false)} compact />
      </DialogContent>
    </Dialog>
  );
}
