import type { Metadata } from "next";
import { Prose } from "@/components/marketing/prose";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <Prose title="About Irish Founders">
      <p>
        Irish Founders is an independent, curated network for companies built in Ireland. It connects verified founders, Irish or international, with investors, ecosystem partners and customers from anywhere in the world.
      </p>
      <p>
        Our mission is to create a trusted environment where genuine founders can discover startups, share knowledge,
        find collaborators, build meaningful relationships, and support one another.
      </p>
      <h2>Membership</h2>
      <p>
        Membership is free and subject to an application, verification, and approval process. Founders provide a real
        company website, a company LinkedIn page with at least 50 followers and recent posts, evidence of their link to
        the company, and complete a short interview. Every application is reviewed by a person.
      </p>
      <h2>What a badge means</h2>
      <ul>
        <li>Verified Founder: approved membership after our review.</li>
        <li>Verified Startup: the company was reviewed by our team.</li>
        <li>Verified Investor: identity and professional background reviewed. This is not a guarantee of financial capacity or investment commitment.</li>
      </ul>
      <h2>Independence and scope</h2>
      <p>
        Irish Founders operates independently and is not affiliated with or endorsed by any government agency or startup
        organisation unless expressly stated. The platform facilitates professional networking and introductions. It does
        not provide financial or investment advice, arrange investment transactions, or guarantee investment outcomes.
      </p>
    </Prose>
  );
}
