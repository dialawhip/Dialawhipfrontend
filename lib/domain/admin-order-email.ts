import { formatMoney } from "../format";
import type { PricedLine } from "./pricing";

export interface AdminOrderEmailInput {
  orderId: string;
  reference: string;
  placedAt: Date;
  customerEmail: string;
  deliveryTier: "standard" | "priority" | "super";
  scheduledFor: string | null;
  customerNotes: string | null;
  address: {
    line1: string;
    line2: string | null;
    city: string | null;
    postcode: string;
  };
  lines: PricedLine[];
  subtotalPence: number;
  deliveryFeePence: number;
  vatPence: number;
  totalPence: number;
  brandName: string;
  brandColor: string;
  accentColor: string;
  adminLink: string | null;
  requiresIdVerification: boolean;
}

const TIER_LABEL: Record<AdminOrderEmailInput["deliveryTier"], string> = {
  standard: "Standard",
  priority: "Priority",
  super: "Super-rush",
};

/**
 * Render the email an admin receives when a new order is placed.
 * Returns both an HTML version (table-based for max email-client
 * compatibility) and a plain-text fallback.
 */
export function renderAdminOrderEmail(input: AdminOrderEmailInput): { subject: string; html: string; text: string } {
  const total = formatMoney(input.totalPence);
  const subject = `[${input.brandName}] New order ${input.reference} - ${total}`;

  const lineRowsHtml = input.lines
    .map((line, i) => {
      const name = escapeHtml(line.product.name);
      const variant = line.variant?.label ? `<div style="color:#6b6b6b;font-size:12px;margin-top:2px">${escapeHtml(line.variant.label)}</div>` : "";
      const onSale = line.unit_price_pence < line.list_price_pence;
      const priceCell = onSale
        ? `<span style="color:#c10b0b;font-weight:700">${formatMoney(line.unit_price_pence)}</span>
           <span style="color:#9a9a9a;text-decoration:line-through;font-size:11px;margin-left:4px">${formatMoney(line.list_price_pence)}</span>`
        : `<span style="font-weight:600">${formatMoney(line.unit_price_pence)}</span>`;
      const bg = i % 2 === 0 ? "#ffffff" : "#fafaf6";
      return `
        <tr style="background:${bg}">
          <td style="padding:12px 16px;border-bottom:1px solid #ececec;font-size:13px;color:#0b1d3a">
            <div style="font-weight:600">${name}</div>
            ${variant}
            ${line.statement_category ? `<div style="color:#6b6b6b;font-size:11px;margin-top:4px;text-transform:uppercase;letter-spacing:0.06em">Use: ${escapeHtml(line.statement_category)}</div>` : ""}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #ececec;font-size:13px;color:#0b1d3a;text-align:center;width:60px">${line.quantity}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #ececec;font-size:13px;color:#0b1d3a;text-align:right;width:120px">${priceCell}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #ececec;font-size:13px;color:#0b1d3a;text-align:right;width:90px;font-weight:700">${formatMoney(line.line_total_pence)}</td>
        </tr>`;
    })
    .join("");

  const addressBlock = [
    escapeHtml(input.address.line1),
    input.address.line2 ? escapeHtml(input.address.line2) : null,
    input.address.city ? escapeHtml(input.address.city) : null,
    escapeHtml(input.address.postcode),
  ]
    .filter(Boolean)
    .join("<br>");

  const placedAt = input.placedAt.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const scheduledLabel = input.scheduledFor
    ? new Date(input.scheduledFor).toLocaleString("en-GB", {
        timeZone: "Europe/London",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "ASAP";

  const cta = input.adminLink
    ? `<a href="${input.adminLink}" style="display:inline-block;background:${input.brandColor};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;font-size:14px;letter-spacing:0.02em">Open in admin →</a>`
    : "";

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4efe6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif;color:#0b1d3a">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe6;padding:32px 16px">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 18px 40px -24px rgba(11,29,58,0.25)">
            <!-- header -->
            <tr>
              <td style="background:${input.brandColor};padding:24px 28px;color:#ffffff">
                <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;opacity:0.7">${escapeHtml(input.brandName)} · admin</div>
                <div style="margin-top:6px;font-size:22px;font-weight:700">New order placed</div>
              </td>
            </tr>
            <!-- summary -->
            <tr>
              <td style="padding:28px">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom:18px">
                      <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b6b6b">Order</div>
                      <div style="margin-top:4px;font-size:28px;font-weight:700;letter-spacing:-0.01em">${escapeHtml(input.reference)}</div>
                      <div style="margin-top:2px;font-size:12px;color:#6b6b6b">Placed ${escapeHtml(placedAt)} London time</div>
                    </td>
                    <td align="right" style="padding-bottom:18px;vertical-align:bottom">
                      <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b6b6b">Total</div>
                      <div style="margin-top:4px;font-size:28px;font-weight:700;color:${input.brandColor}">${formatMoney(input.totalPence)}</div>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf6;border-radius:10px;margin-top:6px">
                  <tr>
                    <td style="padding:16px 18px;border-right:1px solid #ececec;width:50%;vertical-align:top">
                      <div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#6b6b6b">Customer</div>
                      <div style="margin-top:6px;font-size:13px;font-weight:600">${escapeHtml(input.customerEmail)}</div>
                    </td>
                    <td style="padding:16px 18px;width:50%;vertical-align:top">
                      <div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#6b6b6b">Delivery</div>
                      <div style="margin-top:6px;font-size:13px;font-weight:600">${escapeHtml(TIER_LABEL[input.deliveryTier])} · ${escapeHtml(scheduledLabel)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding:16px 18px;border-top:1px solid #ececec;font-size:13px;line-height:1.5">
                      <div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#6b6b6b">Drop to</div>
                      <div style="margin-top:6px">${addressBlock}</div>
                    </td>
                  </tr>
                </table>

                ${input.customerNotes ? `<div style="margin-top:18px;padding:14px 16px;background:#fff8e1;border:1px solid #f0e1a4;border-radius:8px;font-size:13px;line-height:1.5"><strong>Customer note:</strong> ${escapeHtml(input.customerNotes)}</div>` : ""}
                ${input.requiresIdVerification ? `<div style="margin-top:14px;padding:12px 14px;background:#fde8e2;border:1px solid #f1bca8;border-radius:8px;font-size:12px;color:#8b2a1d"><strong>Age-restricted items.</strong> Driver must verify ID on delivery.</div>` : ""}

                <!-- items -->
                <div style="margin-top:28px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b6b6b">Items</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border:1px solid #ececec;border-radius:10px;overflow:hidden">
                  <thead>
                    <tr style="background:#0b1d3a;color:#ffffff">
                      <th align="left" style="padding:10px 16px;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;font-weight:600">Item</th>
                      <th align="center" style="padding:10px 16px;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;font-weight:600">Qty</th>
                      <th align="right" style="padding:10px 16px;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;font-weight:600">Unit</th>
                      <th align="right" style="padding:10px 16px;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;font-weight:600">Line</th>
                    </tr>
                  </thead>
                  <tbody>${lineRowsHtml}</tbody>
                </table>

                <!-- totals -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px">
                  <tr>
                    <td style="text-align:right;padding:4px 0;font-size:13px;color:#6b6b6b">Subtotal</td>
                    <td style="text-align:right;padding:4px 0 4px 20px;font-size:13px;width:120px">${formatMoney(input.subtotalPence)}</td>
                  </tr>
                  <tr>
                    <td style="text-align:right;padding:4px 0;font-size:13px;color:#6b6b6b">Delivery</td>
                    <td style="text-align:right;padding:4px 0 4px 20px;font-size:13px;width:120px">${formatMoney(input.deliveryFeePence)}</td>
                  </tr>
                  ${input.vatPence > 0 ? `<tr>
                    <td style="text-align:right;padding:4px 0;font-size:13px;color:#6b6b6b">VAT</td>
                    <td style="text-align:right;padding:4px 0 4px 20px;font-size:13px;width:120px">${formatMoney(input.vatPence)}</td>
                  </tr>` : ""}
                  <tr>
                    <td style="text-align:right;padding:10px 0 0;font-size:14px;font-weight:700;border-top:2px solid #0b1d3a">Total</td>
                    <td style="text-align:right;padding:10px 0 0 20px;font-size:18px;font-weight:700;color:${input.brandColor};border-top:2px solid #0b1d3a;width:120px">${formatMoney(input.totalPence)}</td>
                  </tr>
                </table>

                ${cta ? `<div style="margin-top:28px;text-align:center">${cta}</div>` : ""}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#fafaf6;border-top:1px solid #ececec;font-size:11px;color:#6b6b6b;text-align:center">
                You're receiving this because you're listed as the order-notifications recipient for ${escapeHtml(input.brandName)}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `New order placed`,
    ``,
    `Reference:    ${input.reference}`,
    `Placed:       ${placedAt}`,
    `Total:        ${total}`,
    `Customer:     ${input.customerEmail}`,
    `Delivery:     ${TIER_LABEL[input.deliveryTier]} - ${scheduledLabel}`,
    `Address:      ${[input.address.line1, input.address.line2, input.address.city, input.address.postcode].filter(Boolean).join(", ")}`,
    input.customerNotes ? `Note:         ${input.customerNotes}` : null,
    input.requiresIdVerification ? `Age-restricted: yes - driver must verify ID` : null,
    ``,
    `Items`,
    ...input.lines.map((l) => {
      const v = l.variant?.label ? ` - ${l.variant.label}` : "";
      const onSale = l.unit_price_pence < l.list_price_pence;
      const unitStr = onSale
        ? `${formatMoney(l.unit_price_pence)} (was ${formatMoney(l.list_price_pence)})`
        : formatMoney(l.unit_price_pence);
      return `  ${l.quantity} x ${l.product.name}${v}  ${unitStr}  -> ${formatMoney(l.line_total_pence)}`;
    }),
    ``,
    `Subtotal:  ${formatMoney(input.subtotalPence)}`,
    `Delivery:  ${formatMoney(input.deliveryFeePence)}`,
    input.vatPence > 0 ? `VAT:       ${formatMoney(input.vatPence)}` : null,
    `Total:     ${formatMoney(input.totalPence)}`,
    ``,
    input.adminLink ? `Open: ${input.adminLink}` : `Order ID: ${input.orderId}`,
  ]
    .filter((s) => s !== null)
    .join("\n");

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
