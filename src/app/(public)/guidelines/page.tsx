import type { Metadata } from "next";
import { Prose } from "@/components/marketing/prose";

export const metadata: Metadata = { title: "Community guidelines" };

export default function GuidelinesPage() {
  return (
    <Prose title="Community guidelines" updated="Draft">
      <ul>
        <li>Be yourself. Only represent companies you genuinely work for.</li>
        <li>No fake engagement, spam, or unsolicited sales messages.</li>
        <li>Respect confidentiality. Do not share private messages or non-public information.</li>
        <li>Be constructive. Feedback should be specific, honest and kind.</li>
        <li>No illegal, hateful, harassing or misleading content.</li>
        <li>Report concerns using the report button. Reports are reviewed by moderators.</li>
      </ul>
    </Prose>
  );
}
