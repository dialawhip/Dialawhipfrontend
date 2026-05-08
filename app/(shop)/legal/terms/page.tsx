import { StaticShell, Heading } from "@/components/shop/static-shell";

export const metadata = { title: "Terms & Conditions · Dialawhip" };

export default function TermsPage() {
  return (
    <StaticShell
      eyebrow="Legal"
      title={<>Terms &amp; <span className="italic font-light text-forest">conditions</span>.</>}
      updated="24 April 2026"
      lead="These terms govern your use of Dialawhip — the rapid catering-supplies service operating across Tyneside."
    >
      <Heading>1. Who we are</Heading>
      <p>
        Dialawhip Ltd, trading as Dialawhip, registered at Newcastle upon Tyne.
        References to "we", "us" and "our" are to Dialawhip. References to
        "you" are to the person placing an order.
      </p>

      <Heading>2. Eligibility</Heading>
      <p>
        You must be at least 18 years old to purchase from Dialawhip. You must
        provide government-issued photographic ID before your first order of
        age-restricted goods. We may refuse service at our discretion.
      </p>

      <Heading>3. Orders and pricing</Heading>
      <p>
        Prices are shown in Pounds Sterling and include VAT where applicable.
        We reserve the right to correct pricing errors. Orders are accepted
        when payment is captured; until then we may cancel without notice.
      </p>

      <Heading>4. Delivery</Heading>
      <p>
        Delivery estimates are based on live operational capacity and traffic.
        We do not guarantee arrival times. If we cannot reach you within the
        quoted window we will offer a refund for the priority surcharge.
      </p>

      <Heading>5. Age-restricted goods</Heading>
      <p>
        Nitrous oxide products are supplied exclusively for food preparation
        and culinary use under the Misuse of Drugs Act 2023. You must sign a
        statement of use at checkout. Misuse is a criminal offence and will be
        reported to Northumbria Police.
      </p>

      <Heading>6. Cancellations and refunds</Heading>
      <p>
        You may cancel an order before it is dispatched for a full refund.
        Once dispatched, age-restricted goods cannot be returned for hygiene
        reasons. Defective goods will be replaced or refunded.
      </p>

      <Heading>7. Liability</Heading>
      <p>
        Our liability to you is limited to the value of the order. We do not
        accept liability for indirect or consequential losses. Nothing in
        these terms limits liability for death or personal injury caused by
        our negligence.
      </p>

      <Heading>8. Governing law</Heading>
      <p>
        These terms are governed by the laws of England and Wales. Disputes
        fall under the exclusive jurisdiction of the English courts.
      </p>
    </StaticShell>
  );
}
