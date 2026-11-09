import React from "react";
import { Helmet } from "react-helmet-async";
import "./InfoPages.css";
import PrivacyRequestForm from "./PrivacyRequestForm";

const PrivacyPolicy = () => (
  <main className="info-page-container">
    <Helmet>
      <title>Privacy Policy | Elevoni Farms</title>
      <meta name="description" content="Learn how Elevoni Agro Digital Solutions Ltd collects, uses, shares, protects and retains personal information." />
      <link rel="canonical" href="https://elevonifarms.vercel.app/privacy" />
      <meta name="robots" content="index,follow" />
    </Helmet>
    <p className="info-page-eyebrow">Privacy and data protection</p>
    <h1>Privacy Policy</h1>
    <p className="info-page-subtitle">Effective date: 9 November 2026</p>
    <p><strong>Elevoni Agro Digital Solutions Ltd</strong> (“Elevoni”, “we”, “us” or “our”) operates the Elevoni Farms website and related customer and vendor services. This notice explains how we process personal information when you browse our website, create an account, submit a buying requirement, apply as a vendor, list products, communicate with us or use an Elevoni assistant.</p>
    <p>Our privacy contact for requests and questions is <a href="mailto:ahashimbala01@gmail.com">ahashimbala01@gmail.com</a>. Please do not email passwords, card details, PINs or one-time passcodes.</p>

    <h2>1. Information we collect</h2>
    <ul>
      <li><strong>Account and identity information:</strong> name, email address, password hash, authentication identifiers and account role.</li>
      <li><strong>Customer and fulfilment information:</strong> phone number, delivery location, order contents, order status, enquiries and communications you choose to provide.</li>
      <li><strong>Vendor information:</strong> business and contact details, location, applications, product listings, inventory, sales records, buyer enquiries and supporting documents or images submitted to us.</li>
      <li><strong>Payment information:</strong> order totals, payment references, payment status and reconciliation information. Payment card credentials are handled by the payment provider; Elevoni does not ask for your card PIN or banking password.</li>
      <li><strong>Buying requirements:</strong> product, category, quantity, unit, delivery state or town, contact details, preferred language, source text and your express choice about sharing contact details with a suitable supplier.</li>
      <li><strong>Assistant and voice information:</strong> text prompts, selected language and audio recordings you actively submit for transcription. The application sends recordings to the configured transcription provider for processing; Elevoni does not intentionally retain the raw recording as a user account record. The resulting transcript may be used to complete the request you submit.</li>
      <li><strong>Technical and usage information:</strong> IP address and request metadata processed by the hosting/API environment for security and operation, plus optional analytics information only if you accept analytics cookies.</li>
      <li><strong>Privacy requests:</strong> your name, contact email, account email (if supplied), request type and details needed to verify and respond to an access, correction, deletion or other data protection request.</li>
    </ul>

    <h2>2. Why we use information and our legal bases</h2>
    <ul>
      <li><strong>Provide accounts, listings, enquiries, orders and support:</strong> to perform a contract or take steps you request before entering one.</li>
      <li><strong>Match a buying requirement with suitable suppliers:</strong> to take steps at your request. We share your contact details with a supplier only where you have expressly selected the contact-sharing consent on the requirement form.</li>
      <li><strong>Operate, secure and improve the service:</strong> our legitimate interests in preventing fraud, protecting accounts, troubleshooting and maintaining the platform, balanced against your rights.</li>
      <li><strong>Meet legal, tax, accounting and regulatory duties:</strong> compliance with legal obligations.</li>
      <li><strong>Optional analytics and promotional messages:</strong> consent where required. You can reject optional analytics and withdraw marketing consent at any time.</li>
    </ul>
    <p>We do not treat the consent to share contact details for a particular buying requirement as consent to receive marketing messages. Transactional messages and optional promotional messages are kept separate.</p>

    <h2>3. How Elevoni works as a marketplace</h2>
    <p>Elevoni Direct products are sourced or sold directly by Elevoni. Marketplace products are offered by independent vendors. When you enquire about a Marketplace listing, information you choose to send may be shared with the relevant vendor or used by Elevoni to facilitate the enquiry. A listing or match is not a confirmed order, guaranteed stock or proof that a transaction has been completed.</p>

    <h2>4. Service providers and disclosures</h2>
    <p>We disclose only information reasonably needed to operate the feature or meet a legal requirement. Depending on the feature and deployment configuration, providers may include:</p>
    <ul>
      <li><strong>Hosting and infrastructure:</strong> Vercel and MongoDB hosting providers.</li>
      <li><strong>AI and voice:</strong> OpenAI for assistant responses and configured speech transcription; ElevenLabs for speech generation; and a Dynamic ASR service hosted through Modal if that provider is enabled.</li>
      <li><strong>Payments:</strong> Paystack for payment processing and transaction verification.</li>
      <li><strong>Images and media:</strong> Cloudinary for media storage and delivery.</li>
      <li><strong>Authentication and analytics:</strong> Google for Google sign-in and Google Analytics only after optional analytics consent.</li>
      <li><strong>People and authorities:</strong> authorised Elevoni personnel, relevant suppliers when you consent to contact sharing, professional advisers, law enforcement or regulators where legally required.</li>
    </ul>
    <p>Some providers may process information outside Nigeria. Before production use, Elevoni must confirm the applicable provider data-processing terms, international transfer safeguards, security settings and retention options. Provider names above describe integrations present in the codebase and are not a claim that every provider is active for every request.</p>

    <h2>5. Retention</h2>
    <p>We keep personal information only for as long as reasonably necessary for the purposes described here, then delete or anonymise it unless a longer period is required or permitted by law. Our operating schedule is:</p>
    <ul>
      <li><strong>Account information:</strong> while the account remains active; after a verified closure request, delete or anonymise it within 30 days where feasible, subject to records that must be retained.</li>
      <li><strong>Orders, payment reconciliation, invoices and business records:</strong> for the period required by applicable tax, accounting, consumer-protection and limitation laws. These records may be retained after account closure.</li>
      <li><strong>Buying requirements and enquiries:</strong> while needed to facilitate the request and resolve related disputes, then deleted or anonymised under the operational retention schedule.</li>
      <li><strong>Security and diagnostic logs:</strong> normally up to 90 days unless required for an active investigation or legal obligation.</li>
      <li><strong>Privacy request records:</strong> normally up to 2 years after closure, or longer where needed to demonstrate compliance or handle a dispute.</li>
      <li><strong>Voice recordings:</strong> processed for transcription and not intentionally kept as application account records. Transcription providers may apply their own documented retention terms.</li>
      <li><strong>Optional analytics:</strong> according to the analytics configuration and the consent choice stored on your device.</li>
    </ul>
    <p>These are operational targets, not a promise to erase records that must lawfully be preserved. Elevoni should confirm statutory retention periods with its Nigerian tax and privacy advisers.</p>

    <h2>6. Your data protection rights</h2>
    <p>Subject to applicable law, you may request access to your personal information, correction, erasure, restriction, portability, object to certain processing, or withdraw consent where consent is the basis. You may also complain to the Nigeria Data Protection Commission. We may need to verify your identity and may retain information where a legal exception applies.</p>
    <p>To make a request, email <a href="mailto:ahashimbala01@gmail.com?subject=Elevoni%20Data%20Protection%20Request">ahashimbala01@gmail.com</a> with the subject “Elevoni Data Protection Request”. State whether you seek access, correction, deletion, restriction or objection, and provide the account email or phone number needed to locate your record. Do not send identity documents unless we request a secure verification method.</p>
    <p><a href="mailto:ahashimbala01@gmail.com?subject=Elevoni%20Account%20Closure%20and%20Data%20Deletion%20Request&body=Please%20help%20me%20close%20my%20Elevoni%20account%20and%20assess%20my%20personal%20data%20for%20deletion.%0AAccount%20email%20or%20phone:%20">Request account closure or data deletion</a></p>

    <PrivacyRequestForm />

    <h2>7. Security</h2>
    <p>We use technical and organisational safeguards appropriate to the information and risks, including access controls, authentication, input validation, security logging and service-provider controls. No internet service can guarantee absolute security. Please use a unique password, protect your device and report suspected account compromise promptly.</p>

    <h2>8. Children</h2>
    <p>Elevoni's services are intended for adults and business users. Do not create an account or submit another person's personal information if you are not authorised to do so. Contact us if you believe a child has submitted personal information.</p>

    <h2>9. Cookies and analytics</h2>
    <p>Essential browser storage may be used for application preferences and operation. Optional Google Analytics is disabled until you accept analytics in the cookie banner. You can change your choice through the Cookie Policy page. See our <a href="/cookies">Cookie Policy</a> for details.</p>

    <h2>10. Changes and contact</h2>
    <p>We may update this notice as the service or applicable law changes. The effective date above will be revised when a material update is published. For privacy questions, data requests or complaints, contact <a href="mailto:ahashimbala01@gmail.com">ahashimbala01@gmail.com</a>.</p>
    <p className="info-callout-box">This notice is an operational privacy statement prepared from the application features reviewed. It is not a legal opinion or proof of regulatory compliance. Elevoni should obtain a Nigerian privacy-law review, confirm its controller details and complete processor agreements before representing the platform as fully compliant.</p>
  </main>
);

export default PrivacyPolicy;
