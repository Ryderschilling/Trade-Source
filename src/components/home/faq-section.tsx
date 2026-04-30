import type { ReactNode } from "react";

interface FaqItem {
  question: string;
  answerText: string;
  answer: ReactNode;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do I verify a contractor's license in Florida?",
    answerText:
      "All licensed contractors in Florida are registered with the Florida Department of Business and Professional Regulation (DBPR). You can verify any contractor's license number and status on the DBPR license portal at myfloridalicense.com/DBPR. Contractors on Source A Trade who display the Licensed badge have confirmed an active Florida state license.",
    answer: (
      <>
        All licensed contractors in Florida are registered with the Florida{" "}
        <a
          href="https://www.myfloridalicense.com/DBPR/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:no-underline transition-colors"
        >
          Department of Business and Professional Regulation (DBPR)
        </a>
        . You can verify any contractor&apos;s license number and status on the DBPR license
        portal. Contractors on Source A Trade who display the Licensed badge have confirmed an
        active Florida state license.
      </>
    ),
  },
  {
    question: "What trades do you cover in the 30A area?",
    answerText:
      "Source A Trade covers the full range of home and property services across the 30A corridor — plumbing, electrical, HVAC, roofing, painting, landscaping, general contracting, pool service, pressure washing, flooring, pest control, house cleaning, and 20+ more trade categories.",
    answer: (
      <>
        Source A Trade covers the full range of home and property services across the 30A corridor
        {" "}— plumbing, electrical, HVAC, roofing, painting, landscaping, general contracting, pool
        service, pressure washing, flooring, pest control, house cleaning, and 20+ more trade
        categories.
      </>
    ),
  },
  {
    question: "Are all contractors on Source A Trade licensed and insured?",
    answerText:
      "Contractors who display the Verified badge on Source A Trade have provided proof of an active Florida state contractor license and current liability insurance. You can independently confirm any contractor's license status through the Florida DBPR license search. We always recommend asking for proof of insurance before work begins.",
    answer: (
      <>
        Contractors who display the Verified badge on Source A Trade have provided proof of an
        active Florida state contractor license and current liability insurance. You can
        independently confirm any contractor&apos;s license status through the{" "}
        <a
          href="https://www.myfloridalicense.com/DBPR/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:no-underline transition-colors"
        >
          Florida DBPR license search
        </a>
        . We always recommend asking for proof of insurance before work begins.
      </>
    ),
  },
  {
    question: "What areas does Source A Trade cover?",
    answerText:
      "Source A Trade covers the full 30A corridor and Northwest Florida, including Santa Rosa Beach, Seaside, Rosemary Beach, Alys Beach, Grayton Beach, Seagrove, Inlet Beach, Destin, Fort Walton Beach, and Navarre — all in Walton County and surrounding Emerald Coast communities.",
    answer: (
      <>
        Source A Trade covers the full 30A corridor and Northwest Florida, including Santa Rosa
        Beach, Seaside, Rosemary Beach, Alys Beach, Grayton Beach, Seagrove, Inlet Beach, Destin,
        Fort Walton Beach, and Navarre — all in{" "}
        <a
          href="https://www.co.walton.fl.us/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:no-underline transition-colors"
        >
          Walton County
        </a>{" "}
        and surrounding Emerald Coast communities.
      </>
    ),
  },
  {
    question: "How is Source A Trade different from other platforms?",
    answerText:
      "Source A Trade is hyper-local — built specifically for 30A and Northwest Florida, not a national platform. We do not sell your contact info as leads or auction requests to the highest bidder. All reviews come from verified local users, not imported or anonymous data. There are no pay-to-rank upgrades; all listed contractors receive equal visibility.",
    answer: (
      <>
        Source A Trade is hyper-local — built specifically for 30A and Northwest Florida, not a
        national platform. We do not sell your contact info as leads or auction requests to the
        highest bidder. All reviews come from verified local users, not imported or anonymous data.
        There are no pay-to-rank upgrades; all listed contractors receive equal visibility.
      </>
    ),
  },
];

export function FAQSection() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map(({ question, answerText }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answerText },
    })),
  };

  return (
    <section id="faq" className="sr-only">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div>
        <h2>Frequently asked questions</h2>
        <p>Everything you need to know about finding a contractor on 30A.</p>
        <div>
          {FAQ_ITEMS.map(({ question, answer }) => (
            <div key={question}>
              <h3>{question}</h3>
              <div>{answer}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
