import React from "react";
import { Helmet } from "react-helmet-async";
import "./InfoPages.css";

export default function Terms() {
  return (
    <main className="info-page-container">
      <Helmet>
        <title>Terms and Conditions | Elevoni Farms</title>
        <meta name="description" content="Terms governing use of Elevoni Farms, Elevoni Direct and the independent vendor marketplace." />
        <link rel="canonical" href="https://elevonifarms.vercel.app/terms" />
      </Helmet>
      <p className="info-page-eyebrow">Using Elevoni</p>
      <h1>Terms and Conditions</h1>
      <p className="info-page-subtitle">Effective date: 9 November 2026</p>
      <p>These terms govern access to the Elevoni Farms website and related services operated by Elevoni Agro Digital Solutions Ltd (“Elevoni”, “we”, “us”). By using the service, you agree to these terms. If you do not agree, do not use the service.</p>

      <h2>1. What Elevoni provides</h2>
      <p>Elevoni provides agricultural product discovery, direct product sales where identified as Elevoni Direct, and a marketplace where independent vendors can publish listings subject to review. Some features help buyers submit requirements and help vendors discover relevant buyer demand.</p>
      <p><strong>Elevoni Direct:</strong> products identified as sold or supplied directly by Elevoni are handled by Elevoni, subject to the product and checkout details shown.</p>
      <p><strong>Marketplace:</strong> marketplace listings are offers or enquiries from independent vendors. Unless a checkout flow expressly says otherwise, an enquiry, listing or match is not a confirmed order, stock reservation, completed sale or guarantee of fulfilment. Buyers should confirm stock, specification, final price, payment recipient and delivery arrangements before paying a vendor.</p>

      <h2>2. Accounts and acceptable use</h2>
      <ul>
        <li>Provide accurate, current information and keep your login credentials confidential.</li>
        <li>Do not impersonate another person, create unauthorised accounts, bypass vendor approval or misuse another user's data.</li>
        <li>Do not upload unlawful, misleading, infringing, malicious or unsafe content.</li>
        <li>Do not probe, disrupt, scrape, reverse engineer or attempt unauthorised access to the platform or its infrastructure.</li>
        <li>Notify Elevoni promptly if you suspect unauthorised account access.</li>
      </ul>

      <h2>3. Vendor responsibilities</h2>
      <p>Vendors are responsible for the accuracy and legality of their listings, product descriptions, prices, quantities, availability, quality claims, licences and fulfilment commitments. Vendors must keep stock information current, respond honestly to enquiries, respect buyer privacy and comply with applicable food safety, animal health, trade, tax and consumer laws. Elevoni may review, reject, suspend or remove listings or vendor access where reasonably necessary for safety, compliance, quality or platform integrity.</p>

      <h2>4. Buying requirements and matching</h2>
      <p>A buying requirement is a request for supplier discovery, not an order. Elevoni may use the details supplied to identify potential matches. A match is not confirmation of stock or a promise that a vendor will accept the request. Your contact details will be shared with a suitable supplier for that requirement only if you expressly select the contact-sharing consent provided in the form or otherwise authorise the disclosure.</p>

      <h2>5. Prices, payments, delivery and refunds</h2>
      <p>Prices, units, delivery charges, taxes and other material costs must be reviewed before payment. The amount shown at the final payment step is the amount to be charged for that transaction. Paystack may process eligible online payments; Elevoni may receive payment references and status information for reconciliation. Never share your card PIN, banking password or one-time passcode.</p>
      <p>Unless a checkout clearly states otherwise, Marketplace payments and fulfilment arrangements are made with the independent vendor. Confirm the payment recipient directly before transferring funds. For Elevoni Direct orders, the order confirmation and applicable delivery information govern the transaction.</p>
      <p>Elevoni does not currently offer an automatically renewing subscription through the reviewed customer checkout. If a paid subscription or recurring charge is introduced, its price, billing frequency, renewal and cancellation terms will be shown before enrolment.</p>
      <p>Cancellation, return and refund requests will be assessed under the transaction terms and applicable Nigerian consumer-protection law. Nothing in these terms removes rights that cannot lawfully be excluded, including statutory rights relating to defective or misdescribed goods.</p>

      <h2>6. AI assistant and automated information</h2>
      <p>Assistant responses, transcriptions, product discovery and match suggestions are aids. They may misunderstand speech, local product names, quantities, availability or context. Check extracted details before submitting a buying requirement or acting on a recommendation. Elevoni does not treat an AI suggestion as proof of product availability, a confirmed transaction or professional legal, medical or financial advice.</p>

      <h2>7. Intellectual property</h2>
      <p>Elevoni and its licensors retain rights in the platform, branding, original software, design and content they own. You retain rights in content you submit, but grant Elevoni a limited, non-exclusive permission to host, display and process it as necessary to operate the service, review listings, facilitate enquiries and meet legal obligations. You must have permission to submit images, text, logos and other material.</p>

      <h2>8. Third-party services</h2>
      <p>The platform may rely on third-party services for hosting, payments, authentication, AI, voice, analytics and media. Those services may have their own terms and privacy notices. Elevoni is not responsible for independent third-party services outside its reasonable control, but this does not limit obligations that applicable law places on Elevoni.</p>

      <h2>9. Availability, suspension and termination</h2>
      <p>We may update, restrict or suspend features to protect users, investigate suspected misuse, maintain the platform or comply with law. We aim to give reasonable notice where practicable. You may stop using the service and request account closure through our privacy contact. Records may be retained where required for legal, accounting, fraud-prevention or dispute purposes.</p>

      <h2>10. Liability and consumer rights</h2>
      <p>To the extent permitted by law, Elevoni is not responsible for independent vendor acts, inaccurate vendor stock reports, off-platform payment arrangements or delivery commitments made directly by a vendor. This does not exclude liability for fraud, deliberate misconduct, negligence or any liability that cannot lawfully be excluded. Nothing in these terms limits statutory consumer rights.</p>

      <h2>11. Governing law and disputes</h2>
      <p>These terms are governed by the laws of the Federal Republic of Nigeria. Please contact Elevoni first so we can try to resolve a concern. This does not prevent you from exercising rights or remedies available through a competent regulator or court.</p>

      <h2>12. Contact and updates</h2>
      <p>Questions about these terms: <a href="mailto:ahashimbala01@gmail.com">ahashimbala01@gmail.com</a>. We may update these terms as the service changes. The effective date above identifies the current published version.</p>
      <p className="info-callout-box">These terms are a product-specific draft based on the codebase reviewed. They should be approved by a Nigerian lawyer before production use, especially the vendor marketplace, consumer returns, agency, tax and liability provisions.</p>
    </main>
  );
}
