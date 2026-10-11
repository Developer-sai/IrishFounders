import type { Metadata } from "next";
import { Prose } from "@/components/marketing/prose";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <Prose title="Privacy policy" updated="Draft — requires legal review before public launch">
      <p>
        This draft explains how Irish Founders handles personal data under the GDPR. It must be reviewed by a qualified
        adviser and completed with the operator&apos;s legal identity and contact details before the platform opens to the public.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Account data: name, email address and password (stored hashed by our authentication provider).</li>
        <li>Application data: LinkedIn URLs, company details, interview answers and any supporting documents you upload.</li>
        <li>Content you post: profile information, posts, comments and messages.</li>
      </ul>
      <p>We do not ask for passports, PPS numbers or other government identity documents.</p>
      <h2>Why we collect it</h2>
      <p>
        To review membership applications and keep the community authentic (legitimate interests and, where applicable,
        consent), to operate the service, and to meet legal obligations such as handling illegal-content reports.
      </p>
      <h2>Who can access it</h2>
      <p>
        Verification evidence and interview notes are visible only to you and authorised administrators. Evidence files
        are stored in private storage and are never publicly accessible.
      </p>
      <h2>Retention</h2>
      <p>Rejected application data is deleted within a defined period after the decision. Operators must set and publish the exact periods.</p>
      <h2>Your rights</h2>
      <p>You may request access, correction, export or deletion of your data, and object to processing, by contacting the operator.</p>
    </Prose>
  );
}
