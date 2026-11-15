import { randomBytes } from "node:crypto";
import { getPayload } from "payload";
import type { Payload } from "payload";
import config from "@/payload.config";
import type { Affiliate, AffiliateApplication } from "../../payload-types";
import {
  ensurePayloadStudent,
  type StudentAuthUser,
} from "@/lib/course-enrollment";
import { normalizeAffiliateEmail } from "@/lib/affiliate-application";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function findApprovedAffiliateApplication(
  payload: Payload,
  email: string,
): Promise<AffiliateApplication | null> {
  const result = await payload.find({
    collection: "affiliate-applications",
    where: {
      and: [
        { email: { equals: normalizeAffiliateEmail(email) } },
        { status: { equals: "approved" } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  });

  return result.docs[0] ?? null;
}

export async function generateUniqueAffiliateReferralCode(payload: Payload): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referralCode = `GODA${randomBytes(4).toString("hex").toUpperCase()}`;
    const existing = await payload.find({
      collection: "affiliates",
      where: { referralCode: { equals: referralCode } },
      limit: 1,
      overrideAccess: true,
    });
    if (existing.docs.length === 0) return referralCode;
  }

  throw new Error("A unique affiliate referral code could not be generated.");
}

export async function ensureAffiliateMembership(
  payload: Payload,
  authUser: StudentAuthUser,
): Promise<{ application: AffiliateApplication; affiliate: Affiliate } | null> {
  if (!authUser.email) return null;

  const application = await findApprovedAffiliateApplication(payload, authUser.email);
  if (!application) return null;

  const platformUser = await ensurePayloadStudent(payload, {
    ...authUser,
    user_metadata: {
      ...authUser.user_metadata,
      full_name: application.fullName,
    },
  });

  const affiliateResult = await payload.find({
    collection: "affiliates",
    where: { user: { equals: platformUser.id } },
    limit: 1,
    overrideAccess: true,
  });

  let affiliate = affiliateResult.docs[0];
  if (affiliate) {
    if (affiliate.status !== "approved") {
      affiliate = await payload.update({
        collection: "affiliates",
        id: affiliate.id,
        data: { status: "approved" },
        overrideAccess: true,
      });
    }
  } else {
    affiliate = await payload.create({
      collection: "affiliates",
      data: {
        user: platformUser.id,
        referralCode: await generateUniqueAffiliateReferralCode(payload),
        referralLinkActive: true,
        status: "approved",
      },
      overrideAccess: true,
    });
  }

  const linkedAffiliateId =
    typeof application.affiliate === "number"
      ? application.affiliate
      : application.affiliate?.id ?? null;
  if (linkedAffiliateId !== affiliate.id) {
    await payload.update({
      collection: "affiliate-applications",
      id: application.id,
      data: { affiliate: affiliate.id },
      overrideAccess: true,
    });
  }

  return { application, affiliate };
}

export async function requireAffiliatePortalContext() {
  const authUser = await getAuthenticatedUser();
  if (!authUser?.email || !authUser.email_verified) return null;

  const payload = await getPayload({ config });
  const membership = await ensureAffiliateMembership(payload, {
    id: authUser.id,
    email: authUser.email,
    user_metadata: authUser.user_metadata,
  });

  return membership ? { ...membership, authUser } : null;
}
