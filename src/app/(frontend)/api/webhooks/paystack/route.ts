import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY!
  const payloadText = await request.text()
  
  // 1. Compute the cryptographic signature using your secure API key
  const hash = crypto
    .createHmac('sha512', secret)
    .update(payloadText)
    .digest('hex')

  const signature = request.headers.get('x-paystack-signature')
  
  // 2. Terminate the process if the signature is invalid or spoofed
  if (hash !== signature) {
    return NextResponse.json({ error: 'Unauthorized payload signature' }, { status: 401 })
  }

  const event = JSON.parse(payloadText)

  if (event.event === 'charge.success') {
    const payload = await getPayload({ config })
    const { email, metadata, amount } = event.data

    // 3. Convert total payment amount from minor units (e.g. kobo/cents) back to standard dollars
    const checkoutTotal = amount / 100
    
    // 4. Calculate the dynamic 25% affiliate split on the server side
    const affiliateCommission = checkoutTotal * 0.25

    // 5. Grant access to the student by creating an enrollment row
    await payload.create({
      collection: 'enrollments',
      data: {
        email: email,
        course: metadata.course_id,
        isActive: true
      }
    })

    // 6. If an active affiliate code is attached to the checkout metadata, record their commission
    if (metadata.ref_code) {
      // Find the affiliate profile associated with that code
      const matchingAffiliate = await payload.find({
        collection: 'affiliates',
        where: {
          referralCode: { equals: metadata.ref_code.toUpperCase().trim() },
          status: { equals: 'approved' } // Only credit active, un-suspended accounts
        }
      })

      if (matchingAffiliate.docs.length > 0) {
        const affiliateId = matchingAffiliate.docs[0].id

        // Create the immutable accounting ledger row using the calculated 25% split
        await payload.create({
          collection: 'referrals',
          data: {
            affiliate: affiliateId,
            course: metadata.course_id,
            referredEmail: email,
            commissionAmount: affiliateCommission, // Dynamically set to 25% of purchase price
            payoutStatus: 'unpaid'
          }
        })
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
