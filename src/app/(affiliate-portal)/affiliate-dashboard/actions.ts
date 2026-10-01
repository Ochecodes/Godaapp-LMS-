'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface AffiliateMetrics {
  totalReferrals: number
  totalEarned: number
  totalWithdrawn: number
  availableBalance: number
  accountStatus: 'pending' | 'approved' | 'suspended'
}

/**
 * 1. SECURE METRICS ENGINE: Computes the Double-Entry Ledger balance on the cloud server.
 */
export async function getAffiliateDashboardMetrics(): Promise<AffiliateMetrics> {
  const payload = await getPayload({ config })
  const supabase = await createClient()

  // Verify the active Supabase user session token
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required.')

  // Fetch the target Payload User row matching this Supabase ID
  const payloadUser = await payload.find({
    collection: 'users',
    where: { supabase_uid: { equals: user.id } },
    limit: 1,
  })
  if (payloadUser.docs.length === 0) throw new Error('Platform profile mismatch.')

  // Find the associated Affiliate account setup
  const affiliateAccount = await payload.find({
    collection: 'affiliates',
    where: { user: { equals: payloadUser.docs[0].id } },
    limit: 1,
  })
  if (affiliateAccount.docs.length === 0) {
    return { totalReferrals: 0, totalEarned: 0, totalWithdrawn: 0, availableBalance: 0, accountStatus: 'pending' }
  }

  const affiliate = affiliateAccount.docs[0]

  // Query all immutable 25% commission credit logs
  const referralsLog = await payload.find({
    collection: 'referrals',
    where: { affiliate: { equals: affiliate.id } },
    limit: 10000, // Aggregate safety envelope limit
  })

  // Query all debit logs (Withdrawal requests marked as settled/approved)
  const payoutsLog = await payload.find({
    collection: 'payout-requests',
    where: { 
      affiliate: { equals: affiliate.id },
      status: { equals: 'approved' }
    },
    limit: 10000,
  })

  // Calculate metrics using safe server-side double-entry math
  const totalReferrals = referralsLog.docs.length
  
  const totalEarned = referralsLog.docs.reduce(
    (sum, doc) => sum + (doc.commissionAmount || 0), 0
  )
  
  const totalWithdrawn = payoutsLog.docs.reduce(
    (sum, doc) => sum + (doc.amountRequested || 0), 0
  )

  const availableBalance = totalEarned - totalWithdrawn

  return {
    totalReferrals,
    totalEarned,
    totalWithdrawn,
    availableBalance,
    accountStatus: affiliate.status as 'pending' | 'approved' | 'suspended',
  }
}

/**
 * 2. TRANSACTION EXECUTION ENGINE: Validates thresholds and files payout requests safely.
 */
export async function requestAffiliateWithdrawal(formData: FormData) {
  const payload = await getPayload({ config })
  const supabase = await createClient()

  // 1. Verify Authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Authorization required.' }

  // 2. Fetch User Profile
  const payloadUser = await payload.find({
    collection: 'users',
    where: { supabase_uid: { equals: user.id } },
    limit: 1,
  })
  if (payloadUser.docs.length === 0) return { success: false, error: 'User mapping not found.' }

  // 3. Fetch Affiliate Profile
  const affiliateAccount = await payload.find({
    collection: 'affiliates',
    where: { user: { equals: payloadUser.docs[0].id } },
    limit: 1,
  })
  if (affiliateAccount.docs.length === 0) return { success: false, error: 'Affiliate profile missing.' }

  const affiliate = affiliateAccount.docs[0]

  // 4. Anti-Fraud Check: block suspended accounts from accessing funds
  if (affiliate.status !== 'approved') {
    return { success: false, error: 'Withdrawal locked. Account state must be active.' }
  }

  // 5. Re-compute Ledger Balance on the server to prevent front-end field injection
  const currentMetrics = await getAffiliateDashboardMetrics()
  const requestedAmount = parseFloat(formData.get('amount') as string)

  if (isNaN(requestedAmount) || requestedAmount <= 0) {
    return { success: false, error: 'Invalid monetary value specified.' }
  }

  if (requestedAmount > currentMetrics.availableBalance) {
    return { success: false, error: 'Insufficient available ledger funds.' }
  }

  // 6. Append secure Debit row into the tracking tables
  await payload.create({
    collection: 'payout-requests',
    data: {
      affiliate: affiliate.id,
      amountRequested: requestedAmount,
      status: 'pending',
    },
  })

  // 7. Evict Next.js static edge caches to show updated parameters instantly
  revalidatePath('/affiliate-dashboard')
  
  return { success: true }
}
