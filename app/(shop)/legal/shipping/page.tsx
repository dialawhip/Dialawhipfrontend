import { StaticShell, Heading } from "@/components/shop/static-shell";

export const metadata = { title: "Shipping & Payment · Dialawhip" };

export default function ShippingPage() {
  return (
    <StaticShell
      eyebrow="Legal"
      title={<>Shipping &amp; <span className="italic font-light text-forest">payment</span>.</>}
      updated="24 April 2026"
      lead="Everything you need to know about how we deliver, what it costs, and how to pay."
    >
      <Heading>Coverage</Heading>
      <p>
        We deliver across the North East from our Newcastle base — broadly
        NE1–NE34, SR1–SR6 and DH1–DH9, covering Gateshead, South Shields,
        Sunderland, Durham, Whitley Bay and the surrounding towns. Enter your
        postcode on the homepage for a live ETA.
      </p>

      <Heading>Delivery tiers</Heading>
      <p>
        <strong>Standard</strong> — average 18–35 minutes depending on zone.
        Included in the delivery fee.<br />
        <strong>Priority (+£5)</strong> — jumps the queue, average 10–20
        minutes.<br />
        <strong>Super-priority (+£15)</strong> — immediate dispatch, used for
        genuine emergencies only.
      </p>

      <Heading>Cutoff times</Heading>
      <p>
        We operate 7 days a week, 18:00 until 06:00 AM. Orders placed within operating hours are dispatched
        immediately; outside of hours, orders are queued for the next morning.
      </p>

      <Heading>Minimum order</Heading>
      <p>Minimum order value is £15 before delivery fee.</p>

      <Heading>Payment methods</Heading>
      <p>
        Visa, Mastercard, American Express, Apple Pay, Google Pay, Klarna
        (Pay in 3), and cash on delivery. Trade accounts are invoiced monthly
        against approved credit.
      </p>

      <Heading>Refunds</Heading>
      <p>
        If we miss your stated window by more than 15 minutes we will refund
        the priority surcharge automatically. Defective goods are refunded in
        full. Age-restricted goods cannot be returned once delivered.
      </p>
    </StaticShell>
  );
}
