"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SubmissionResult = {
  id?: number;
  message?: string;
  notificationSent?: boolean;
  error?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSubmissionResult(value: unknown): SubmissionResult {
  if (!isRecord(value)) return {};
  const record = value;
  return {
    ...(typeof record.id === "number" ? { id: record.id } : {}),
    ...(typeof record.message === "string" ? { message: record.message } : {}),
    ...(typeof record.notificationSent === "boolean"
      ? { notificationSent: record.notificationSent }
      : {}),
    ...(typeof record.error === "string" ? { error: record.error } : {}),
  };
}

export function AffiliateDisputeForm() {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("referral");
  const [details, setDetails] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/affiliate/disputes", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, details }),
      });
      const responseBody = parseSubmissionResult(await response.json());
      if (!response.ok) {
        throw new Error(responseBody.error ?? "Your dispute could not be submitted.");
      }

      setResult(responseBody);
      setSubject("");
      setDetails("");
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Your dispute could not be submitted.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button onClick={() => setOpen(true)} type="button">
        Create dispute
      </Button>
      {result && (
        <p
          className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary"
          role="status"
        >
          {result.message}{" "}
          {typeof result.id === "number" && (
            <span className="font-semibold">Reference: #{result.id}</span>
          )}
        </p>
      )}
      <Dialog
        onOpenChange={(nextOpen) => {
          if (!pending) setOpen(nextOpen);
        }}
        open={open}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Godaapp support</DialogTitle>
            <DialogDescription>
              Describe the referral, payout, or account issue. Your case is saved
              in the portal and support is notified by email.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium">
                Category
                <select
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) => setCategory(event.target.value)}
                  required
                  value={category}
                >
                  <option value="referral">Referral or commission</option>
                  <option value="payout">Payout request</option>
                  <option value="account">Account access</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Subject
                <Input
                  className="min-h-10"
                  maxLength={160}
                  minLength={3}
                  onChange={(event) => setSubject(event.target.value)}
                  required
                  value={subject}
                />
              </label>
            </div>
            <label className="grid gap-1.5 text-sm font-medium">
              What happened?
              <textarea
                className="min-h-32 rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                maxLength={4000}
                minLength={20}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Include relevant dates and a referral or payout reference if you have one."
                required
                value={details}
              />
              <span className="text-xs font-normal text-muted-foreground">
                Do not include bank account numbers, wallet credentials, or full identity-document numbers.
              </span>
            </label>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <DialogFooter>
              <Button
                disabled={pending}
                onClick={() => setOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={pending} type="submit">
                {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Send aria-hidden="true" />}
                Submit dispute
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
