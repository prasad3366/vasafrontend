import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How long do VASA perfumes last?",
    answer: "Our perfumes are crafted with premium ingredients and typically last 6-8 hours on the skin. Eau de Parfum concentrations offer even longer-lasting wear, up to 12 hours."
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 30-day satisfaction guarantee. If you're not completely satisfied with your purchase, you can return unopened bottles for a full refund. Opened bottles can be exchanged once within 14 days."
  },
  {
    question: "Are VASA perfumes cruelty-free?",
    answer: "Absolutely. All VASA fragrances are cruelty-free and never tested on animals. We're committed to ethical and sustainable practices throughout our production process."
  },
  {
    question: "How should I store my perfume?",
    answer: "Store your perfume in a cool, dry place away from direct sunlight and extreme temperatures. Keep the bottle tightly closed when not in use to preserve the fragrance quality."
  },
  {
    question: "Do you offer gift sets or bundles?",
    answer: "Yes — we curate seasonal gift sets and fragrance bundles at a discounted price. They're perfect for gifting and include elegant packaging options. Check the 'Collections' page for current bundles."
  },
  {
    question: "How can I choose the right fragrance for me?",
    answer: "Not sure where to start? Try our scent finder on the product pages, read customer reviews, or order a sample if available. Think about whether you prefer fresh, woody, floral or oriental notes — our descriptions list top/heart/base notes to help."
  },
  {
    question: "Do you offer promotions or membership discounts?",
    answer: "Subscribe to our newsletter for exclusive offers, early access to launches and member-only discounts. We also run seasonal promotions and bundle deals to help you save."
  },
  {
    question: "What makes VASA perfumes unique?",
    answer: "VASA perfumes are crafted by master perfumers using the finest natural and synthetic ingredients. Each fragrance undergoes extensive testing and refinement to create unique, long-lasting scents that tell a story."
  }
];

const FAQ = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about VASA perfumes
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
              <AccordionTrigger className="text-left hover:text-primary transition-colors py-4">
                <span className="font-semibold">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
