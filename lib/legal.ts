// Grind Studio's legal pages (app/legal), word for word as they were on
// ClickFunnels (www.thegrind.studio/<slug>, read 2026-11-03), at the same paths
// so old links keep working once the domain moves. Edit the wording here.

export type LegalBlock =
  { h: string } | { p: string } | { ul: string[] } | { ol: string[] };

export type LegalPage = {
  slug: string;
  title: string;
  updated: string; // "Last Updated"
  blocks: LegalBlock[];
  address: boolean; // ends with the company's address
};

export const COMPANY_ADDRESS = [
  "FFUNK Media LLC",
  "30 N Gould St, Suite R",
  "Sheridan, WY 82801",
  "United States",
];

export const LEGAL_PAGES: LegalPage[] = [
  {
    slug: "terms-and-conditions",
    title: "Terms & Conditions",
    updated: "January 9, 2026",
    blocks: [
      {
        h: "1. BUSINESS INFORMATION",
      },
      {
        p: "The Website located at https://thegrind.studio is owned and operated by FFUNK Media LLC, a limited liability company registered in the State of Wyoming. Our registered business address is 30 N Gould St, Suite R, Sheridan, WY 82801, United States. By using our website or purchasing any products, you agree to be bound by these terms in their entirety. For any inquiries or support requests, you may reach our team at support@thegrind.studio.",
      },
      {
        h: "2. DIGITAL PRODUCTS AND DELIVERY",
      },
      {
        p: "All products sold through Grind Studio are digital assets, including MIDI Drum Kits, Sample Packs, and Melodic Hooks. These are delivered in digital formats such as .ZIP, .MID, and .WAV files. Upon completion of your purchase, you will receive an automated email containing your download links. Furthermore, all purchases are accessible through the private Grind Studio Customer Portal.",
      },
      {
        h: "3. PRICING AND PAYMENTS",
      },
      {
        p: "All prices displayed on the Website are in Euros (€) or US Dollars ($) as specified at the point of sale. International customers are solely responsible for any local taxes, duties, or consumption taxes required by their specific jurisdiction. Payments are processed securely via third-party processors including Stripe and PayPal, and by purchasing, you agree to adhere to their respective terms of service.",
      },
      {
        h: "4. REFUND POLICY",
      },
      {
        p: "We offer a 14-Day Money-Back Satisfaction Guarantee. If you feel a product is not the right fit for your music production, you may request a refund by emailing support@thegrind.studio within 14 days of your purchase date. To prevent fraud and system abuse, we strictly enforce a lifetime limit of one refund per customer.",
      },
      {
        h: "5. CHARGEBACKS AND DISPUTES",
      },
      {
        p: "You agree to contact our support team at support@thegrind.studio to resolve any billing issues before initiating a dispute or chargeback with your bank or PayPal. If you open a chargeback or dispute before communicating with us in good faith, you immediately and permanently waive your right to a refund. FFUNK Media LLC reserves the right to submit these terms and your unique download logs to financial institutions to contest fraudulent claims. Any unauthorized chargeback will result in a permanent ban of your details from our ecosystem.",
      },
      {
        h: "6. INTELLECTUAL PROPERTY AND LICENSING",
      },
      {
        p: "FFUNK Media LLC remains the owner of all MIDI patterns and samples provided. Your purchase grants you a non-exclusive, worldwide, royalty-free usage license. VocaSpace™ and DopaBounce™ are proprietary sound-design technologies and trademarks of FFUNK Media LLC, and any unauthorized attempt to reverse-engineer these mechanisms is prohibited. You may use these sounds in your commercial musical works and keep 100% of your royalties, but you are strictly prohibited from reselling or redistributing the raw files in any sample pack or sound library format.",
      },
      {
        h: "7. LIMITATION OF LIABILITY",
      },
      {
        p: 'FFUNK Media LLC shall not be held liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our products. Our total liability to you for any claim shall not exceed the actual amount paid for the specific product in question. We provide these files "as is" and do not guarantee specific commercial success or placements as a result of their use.',
      },
      {
        h: "8. USER CONDUCT AND TRACKING",
      },
      {
        p: "You agree not to share your portal login credentials or unique download links with third parties. We utilize advanced internal tracking to detect multi-user access to single-user licenses. Any detected violations of this policy will lead to immediate account termination and the revocation of all download access without a refund.",
      },
      {
        h: "9. THIRD-PARTY PLATFORM DISCLAIMER",
      },
      {
        p: "This Website is not part of the Meta website, Meta Platforms, Inc., Google, or Alphabet Inc. Additionally, this site is NOT endorsed by Meta or Google in any way. FACEBOOK and INSTAGRAM are trademarks of META PLATFORMS, Inc. GOOGLE and YOUTUBE are trademarks of ALPHABET, Inc. You acknowledge that Grind Studio is an independent brand and has no official affiliation with these companies.",
      },
      {
        h: "10. REFERENCES TO ARTISTS AND PUBLIC FIGURES",
      },
      {
        p: 'All references to professional music producers, artists, or public figures on this Website are for educational and descriptive purposes only. Any quotes used are intended to illustrate general music production philosophies and are sourced from public interviews. These references do not imply that the mentioned artists use, endorse, or are affiliated with Grind Studio or its products. Our sounds are created "in the style of" or "inspired by" the work of these legends to help users achieve similar professional results.',
      },
      {
        h: "11. GOVERNING LAW AND AMENDMENTS",
      },
      {
        p: "These Terms shall be governed by and construed in accordance with the laws of the State of Wyoming, United States. Any legal action arising under these Terms shall be brought exclusively in the courts located in Sheridan, Wyoming. We reserve the right to update these Terms at any time, and your continued use of the Website after such changes are posted constitutes your acceptance of the new terms. For any legal or administrative questions, please contact support@thegrind.studio.",
      },
      {
        p: "If you have any questions about this policy, please contact us at support@thegrind.studio",
      },
    ],
    address: true,
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    updated: "January 9, 2026",
    blocks: [
      {
        h: "1. INTRODUCTION AND DATA CONTROLLER",
      },
      {
        p: "Welcome to Grind Studio. Your privacy is a top priority for us. This Privacy Policy describes how we collect, use, and protect your personal information when you visit https://thegrind.studio, download our free packs, or purchase our digital products. The data controller for this website is FFUNK Media LLC, a limited liability company registered in the State of Wyoming, located at 30 N Gould St, Suite R, Sheridan, WY 82801, United States. For any questions regarding data protection or our privacy practices, you may contact us at support@thegrind.studio.",
      },
      {
        h: "2. TYPES OF DATA COLLECTED",
      },
      {
        p: "We collect various types of information to provide our services and improve your shopping experience. When you subscribe to a free product or make a purchase, we collect identifying data such as your name and email address. During your navigation of the site, we automatically collect technical data through the use of cookies and similar technologies, including your IP address, browser type, viewed pages, and the time spent on the site. Regarding payments, we rely on trusted third-party processors such as Stripe and PayPal, and as a result, we do not store or have direct access to your full credit card numbers or sensitive financial information.",
      },
      {
        h: "3. PURPOSE OF DATA PROCESSING",
      },
      {
        p: 'Your data is primarily used to process and manage your orders, deliver digital product download links, and provide customer support. We also use your email address to send you our newsletter updates known as "Grind Minute," as well as promotional offers based on your interest in music production. You may choose to unsubscribe from these communications at any time by clicking the unsubscribe link found at the bottom of every email. Furthermore, data is processed to analyze the performance of our website and to optimize our marketing campaigns to ensure we reach the right audience.',
      },
      {
        h: "4. ADVERTISING TRACKING AND DISCLOSURES (META AND GOOGLE)",
      },
      {
        p: 'To provide you with relevant content and advertisements, we utilize tracking tools provided by Meta Platforms, Inc. (Facebook Pixel and Conversion API) and Google LLC (Google Ads and Analytics). These technologies allow Meta and Google to collect or receive information from our website and elsewhere on the internet and use that information to provide measurement services and targeted ads. Specifically, conversion tracking helps us understand the effectiveness of our advertisements on Facebook, Instagram, and YouTube. This data is processed in a pseudonymized form to create "Custom Audiences," allowing us to show our products to users who have previously interacted with Grind Studio. You can manage or opt-out of these tracking preferences through the ad settings on your Facebook or Google profiles.',
      },
      {
        h: "5. DATA SHARING WITH THIRD PARTIES",
      },
      {
        p: "We do not sell or rent your personal data to third parties for their marketing purposes. We only share your information with reliable service providers who are necessary for the operation of our business, such as ClickFunnels for website hosting, secure payment processors for transactions, and email marketing platforms for communication delivery. All such providers are bound by confidentiality agreements and are obligated to use the data exclusively for the purposes we have instructed.",
      },
      {
        h: "6. INTERNATIONAL DATA TRANSFERS",
      },
      {
        p: "Because FFUNK Media LLC is an entity based in the United States and utilizes servers primarily located in North America, your personal data may be transferred to and stored outside of the European Economic Area. We ensure that such transfers are conducted in compliance with applicable data protection laws, guaranteeing an adequate level of security through the use of standard contractual clauses approved by the relevant authorities. By using this website, you consent to your data being transferred to the United States and processed in accordance with this Privacy Policy.",
      },
      {
        h: "7. USER RIGHTS",
      },
      {
        p: "In accordance with global privacy regulations, such as the GDPR for residents of the European Union and the CCPA for residents of California, you have the right to access your personal data, request its rectification, limit its processing, or request its permanent deletion. If you wish to exercise any of these rights or if you have concerns about how we handle your data, please send a written request to support@thegrind.studio. We will respond to your request as quickly as possible and within the timeframes required by law.",
      },
      {
        h: "8. DATA SECURITY AND COOKIES",
      },
      {
        p: "We apply rigorous technical and organizational security measures to protect your data from unauthorized access, loss, or alteration. Our website uses the HTTPS protocol with SSL encryption to ensure that the transmission of data is secure. We also use cookies to manage the shopping cart and remember your preferences. You may choose to refuse cookies through your browser settings, although this may compromise the functionality of certain parts of the site and your overall shopping experience.",
      },
      {
        h: "9. UPDATES TO THIS POLICY",
      },
      {
        p: "We reserve the right to modify this Privacy Policy at any time to reflect changes in our practices or for other operational, legal, or regulatory reasons. Any changes will be effective immediately upon posting the updated policy on the Website. We encourage you to review this page periodically to stay informed about how we are protecting your information. Your continued use of the Website after such changes are posted constitutes your acceptance of the updated Privacy Policy. For further information, please reach out to us at support@thegrind.studio.",
      },
      {
        h: "10. CALIFORNIA PRIVACY RIGHTS",
      },
      {
        p: "If you are a California resident, you have the right to request access to, deletion of, or information about the personal data we collect about you. You also have the right to opt-out of the sale of your personal information. FFUNK Media LLC does not sell your personal information, but you may exercise your rights by contacting us at support@thegrind.studio",
      },
    ],
    address: false,
  },
  {
    slug: "refund-policy",
    title: "Refund Policy",
    updated: "June 9, 2026",
    blocks: [
      {
        p: 'This Refund Policy is an agreement between you and FFUNK Media LLC (doing business as "Grind Studio"), a Wyoming Limited Liability Company.',
      },
      {
        p: "At Grind Studio, we stand behind the quality of our products. Because our products are digital goods delivered instantly upon purchase, this policy explains when refunds are available and when they are not.",
      },
      {
        p: "By purchasing from our website, you agree to the following Refund Policy.",
      },
      {
        h: "1. Refund Eligibility (14 Days)",
      },
      {
        p: "We offer refunds within 14 days of purchase in the following situations:",
      },
      {
        ul: [
          "Defective files — the files are corrupted, incomplete, or do not function as intended. We will first provide a corrected replacement or fresh download; if we are unable to deliver working files, we will issue a full refund.",
          "Not as described — the product is materially different from its description on the product page.",
          "Download failure — you were unable to download or access your purchase. Contact support and we will restore your access; if we cannot, we will issue a full refund.",
          "Duplicate purchase — you were accidentally charged twice, or purchased the same product twice.",
        ],
      },
      {
        p: "For all quality-related issues, our first remedy is to repair or replace the files. Refunds are issued when we are unable to resolve the issue.",
      },
      {
        p: "The following are not valid grounds for a refund (see Section 5 for the full list): not having time to use the product, finding the product difficult to learn, or compatibility issues with software you do not own when the requirements were clearly stated on the product page.",
      },
      {
        h: "How to Request a Refund",
      },
      {
        ol: [
          "Email our support team at support@thegrind.studio.",
          'Use the subject line: "Refund Request - Order #[Your Order ID]".',
          "Briefly describe the issue. For defective-file claims, a short description of the problem is enough — we may ask follow-up questions to help diagnose it.",
        ],
      },
      {
        p: "If you follow this process and communicate with us in good faith, we will review your request and respond promptly, typically within 1–2 business days.",
      },
      {
        h: "2. Having Trouble Using the Product? Contact Us First",
      },
      {
        p: "Many refund requests come from setup or usability issues we can fix in minutes. If you are having trouble installing, loading, or using your purchase, email support@thegrind.studio before requesting a refund. We will help you get up and running.",
      },
      {
        p: "Refund requests citing difficulty of use will first be directed to our support team for assistance.",
      },
      {
        h: "3. Lifetime Refund Limit (Fraud Prevention)",
      },
      {
        p: "To protect our business from refund abuse, we enforce a limit of one (1) refund per customer.",
      },
      {
        p: "If you have previously requested and received a refund for any Grind Studio product, future purchases are not eligible for refunds, except where required by law or in cases of defective files that we are unable to repair or replace.",
      },
      {
        p: "We reserve the right to decline refunds and restrict purchasing where we detect repeat refund activity or attempts to circumvent this limit through multiple accounts or identities.",
      },
      {
        h: "4. Disputes & Chargebacks",
      },
      {
        p: "We take PayPal disputes and bank chargebacks seriously. These actions incur significant fees for our small business regardless of the outcome.",
      },
      {
        p: "Contact us first. By purchasing from Grind Studio, you agree to contact support@thegrind.studio and allow us a reasonable opportunity (at least 5 business days) to resolve any billing issue or refund request before opening a dispute with PayPal, Stripe, or your card issuer.",
      },
      {
        p: "If a dispute or chargeback is opened without contacting us first:",
      },
      {
        ul: [
          "We will respond to the dispute and submit this Refund Policy, your order records, and your download activity logs as evidence.",
          "If the dispute is resolved in our favor, the associated email address and billing details may be permanently restricted from future purchases at Grind Studio.",
        ],
      },
      {
        p: "We would much rather solve your problem directly — in most cases we can resolve issues faster than a dispute process can.",
      },
      {
        h: "5. Non-Refundable Situations",
      },
      {
        p: "We reserve the right to decline a refund in the following situations:",
      },
      {
        ul: [
          "The request is made more than 14 days after purchase.",
          "You changed your mind after downloading or accessing the files (see Section 1).",
          "The request is based on not having time to use the product.",
          "The request is based on the product requiring effort or learning to use, where the product functions as described.",
          "The product is incompatible with software or hardware you do not own, where system or software requirements were clearly stated on the product page.",
          "You have already received a refund for a previous purchase (see Section 3).",
          "The purchase was part of a bundle or discounted collection and the files have been downloaded or accessed.",
          "The purchase was made using a promotional code or during a sale explicitly marked as final sale.",
        ],
      },
      {
        h: "6. Store Credit",
      },
      {
        p: "In some situations where a refund is declined, we may — at our sole discretion — offer store credit toward a future purchase as a goodwill gesture. Store credit is not guaranteed, has no cash value, and is non-transferable.",
      },
      {
        h: "7. Processing Time",
      },
      {
        p: "If your refund is approved:",
      },
      {
        ul: [
          "We will initiate the refund immediately to your original payment method.",
          "It may take 5–10 business days for the funds to appear in your account, depending on your bank's processing times.",
        ],
      },
      {
        h: "8. Governing Law",
      },
      {
        p: "This Policy and any dispute arising from your purchase shall be governed by and construed in accordance with the laws of the State of Wyoming, United States, without regard to its conflict of law principles. If you are a consumer in the EU or UK, this choice of law does not deprive you of the protection of mandatory consumer protection provisions of your country of residence.",
      },
      {
        p: "If you have any questions about this policy, please contact us at support@thegrind.studio.",
      },
    ],
    address: true,
  },
];

export const legalPage = (slug: string) =>
  LEGAL_PAGES.find((p) => p.slug === slug);
