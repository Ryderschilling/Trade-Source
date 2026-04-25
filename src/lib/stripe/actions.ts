'use server'

import Stripe from 'stripe'
import { revalidatePath } from 'next/cache'
import { getStripe } from './client'
import { PRICES, ADDON_PRICE_MAP } from './products'
import { createClient } from '@/lib/supabase/server'

async function getContractor(businessId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' as const, supabase: null, contractor: null }

  const { data: contractor } = await supabase
    .from('contractors')
    .select('id, user_id, business_name, email, stripe_customer_id, stripe_subscription_id, subscription_status, listing_status, cancel_pending, cancel_at')
    .eq('id', businessId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!contractor) return { error: 'Not found' as const, supabase: null, contractor: null }
  return { error: null, supabase, contractor }
}

export async function createOrRetrieveCustomer(businessId: string): Promise<string> {
  const { error, supabase, contractor } = await getContractor(businessId)
  if (error || !supabase || !contractor) throw new Error(error ?? 'Not found')

  if (contractor.stripe_customer_id) return contractor.stripe_customer_id

  const customer = await getStripe().customers.create({
    name: contractor.business_name,
    email: contractor.email ?? undefined,
    metadata: { businessId },
  })

  await supabase
    .from('contractors')
    .update({ stripe_customer_id: customer.id })
    .eq('id', businessId)

  return customer.id
}

export async function createSubscription(businessId: string) {
  const { error, supabase, contractor } = await getContractor(businessId)
  if (error || !supabase || !contractor) return { error: error ?? 'Not found' }

  try {
    const customerId = await createOrRetrieveCustomer(businessId)

    const subscription = await getStripe().subscriptions.create({
      customer: customerId,
      items: [{ price: PRICES.BASE_50 }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    })

    await supabase
      .from('contractors')
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: 'active',
      })
      .eq('id', businessId)

    revalidatePath('/dashboard/billing')
    return { success: true, subscriptionId: subscription.id }
  } catch (err: any) {
    return { error: err.message ?? 'Stripe error' }
  }
}

export async function addAddon(businessId: string, addonType: string) {
  const { error, supabase, contractor } = await getContractor(businessId)
  if (error || !supabase || !contractor) return { error: error ?? 'Not found' }

  const price = ADDON_PRICE_MAP[addonType]
  if (!price) return { error: 'Unknown add-on type' }

  const { stripe_subscription_id } = contractor
  if (!stripe_subscription_id) return { error: 'No active subscription' }

  try {
    const item = await getStripe().subscriptionItems.create({
      subscription: stripe_subscription_id,
      price,
    })

    await supabase.from('business_addons').insert({
      business_id: businessId,
      addon_type: addonType as 'verified_badge' | 'lead_notifications' | 'homepage_slider' | 'featured_email',
      status: 'active',
      stripe_subscription_item_id: item.id,
    })

    revalidatePath('/dashboard/billing')
    return { success: true }
  } catch (err: any) {
    return { error: err.message ?? 'Stripe error' }
  }
}

export async function removeAddon(businessId: string, addonType: string) {
  const { error, supabase, contractor } = await getContractor(businessId)
  if (error || !supabase || !contractor) return { error: error ?? 'Not found' }

  const { data: addon } = await supabase
    .from('business_addons')
    .select('id, stripe_subscription_item_id')
    .eq('business_id', businessId)
    .eq('addon_type', addonType as 'verified_badge' | 'lead_notifications' | 'homepage_slider' | 'featured_email')
    .in('status', ['active', 'waitlisted', 'pending_review'])
    .maybeSingle()

  if (!addon) return { error: 'Add-on not found' }

  if (addon.stripe_subscription_item_id) {
    try {
      await getStripe().subscriptionItems.del(addon.stripe_subscription_item_id, {
        proration_behavior: 'create_prorations',
      })
    } catch (err: any) {
      return { error: err.message ?? 'Stripe error' }
    }
  }

  await supabase
    .from('business_addons')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      stripe_subscription_item_id: null,
    })
    .eq('id', addon.id)

  revalidatePath('/dashboard/billing')
  return { success: true }
}

export async function pauseListing(businessId: string) {
  const { error, supabase } = await getContractor(businessId)
  if (error || !supabase) return { error: error ?? 'Not found' }

  await supabase
    .from('contractors')
    .update({ listing_status: 'paused' })
    .eq('id', businessId)

  revalidatePath('/dashboard/billing')
  return { success: true }
}

export async function cancelSubscription(businessId: string) {
  const { error, supabase, contractor } = await getContractor(businessId)
  if (error || !supabase || !contractor) return { error: error ?? 'Not found' }

  if (!contractor.stripe_subscription_id) return { error: 'No active subscription found.' }

  try {
    const updated = await getStripe().subscriptions.update(
      contractor.stripe_subscription_id,
      { cancel_at_period_end: true }
    ) as Stripe.Subscription

    // cancel_at is set by Stripe when cancel_at_period_end=true (equals current_period_end)
    const periodEnd = updated.cancel_at ?? updated.items?.data?.[0]?.current_period_end
    const cancelAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : null

    await supabase
      .from('contractors')
      .update({
        subscription_status: 'active', // still active until period end
        cancel_pending: true,
        cancel_at: cancelAt,
      })
      .eq('id', businessId)

    revalidatePath('/dashboard/billing')
    return { success: true, cancel_at: cancelAt }
  } catch (err: any) {
    return { error: err.message ?? 'Stripe error' }
  }
}

export async function undoCancelSubscription(businessId: string) {
  const { error, supabase, contractor } = await getContractor(businessId)
  if (error || !supabase || !contractor) return { error: error ?? 'Not found' }

  if (!contractor.stripe_subscription_id) return { error: 'No active subscription found.' }

  try {
    await getStripe().subscriptions.update(
      contractor.stripe_subscription_id,
      { cancel_at_period_end: false }
    )

    await supabase
      .from('contractors')
      .update({
        subscription_status: 'active',
        cancel_pending: false,
        cancel_at: null,
      })
      .eq('id', businessId)

    revalidatePath('/dashboard/billing')
    return { success: true }
  } catch (err: any) {
    return { error: err.message ?? 'Stripe error' }
  }
}

export async function createFeaturedEmailCheckout(businessId: string, month: string) {
  const { error, supabase, contractor } = await getContractor(businessId)
  if (error || !supabase || !contractor) return { error: error ?? 'Not found' }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sourceatrade.com'

  try {
    const sessionParams: any = {
      mode: 'payment',
      line_items: [{ price: PRICES.FEATURED_EMAIL, quantity: 1 }],
      metadata: { businessId, month },
      success_url: `${appUrl}/dashboard/billing?email_reserved=true`,
      cancel_url: `${appUrl}/dashboard/billing`,
    }

    if (contractor.stripe_customer_id) {
      sessionParams.customer = contractor.stripe_customer_id
    } else if (contractor.email) {
      sessionParams.customer_email = contractor.email
      sessionParams.customer_creation = 'always'
    }

    const session = await getStripe().checkout.sessions.create(sessionParams)
    return { url: session.url }
  } catch (err: any) {
    return { error: err.message ?? 'Stripe error' }
  }
}
