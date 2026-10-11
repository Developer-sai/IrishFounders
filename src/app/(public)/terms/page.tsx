import type { Metadata } from "next";
import { Prose } from "@/components/marketing/prose";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <Prose title="Terms of service" updated="Draft — requires legal review before public launch">
      <p>By using Irish Founders you agree to these terms. This draft must be reviewed by a qualified adviser before launch.</p>
      <h2>Membership</h2>
      <p>Membership is free and granted at our discretion after verification. We may suspend or remove accounts that breach these terms or our community guidelines.</p>
      <h2>Your content</h2>
      <p>You are responsible for what you post. You must not post illegal, misleading or infringing content. We may remove content and will explain moderation decisions.</p>
      <h2>No financial advice</h2>
      <p>
        Irish Founders facilitates professional networking and introductions only. Nothing on the platform is financial,
        investment, legal or tax advice, and we do not arrange or process investment transactions.
      </p>
      <h2>Appeals</h2>
      <p>If we remove content or restrict an account you may appeal by contacting us with your reasons.</p>
    </Prose>
  );
}
