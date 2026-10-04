"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";

const questions = [
  {
    question: "What is Cobbins AI?",
    answer: "Cobbins is a searchable library of real web-app screens with an AI workspace for turning selected references into editable React or HTML.",
  },
  {
    question: "Can I search by how a screen looks?",
    answer: "Yes. Start with a screen or image and Cobbins finds interfaces with similar composition, hierarchy, density, and interaction patterns.",
  },
  {
    question: "Can I organize screens for a project?",
    answer: "Save screens into shared collections, add context, and keep the complete research trail beside the interface you generate.",
  },
  {
    question: "Does Cobbins generate working code?",
    answer: "Yes. Generated studies can be refined in the workspace and exported as editable React or HTML that your team can own.",
  },
  {
    question: "Can my whole product team use it?",
    answer: "Team workspaces support shared collections, comments, generation history, and reusable visual briefs with clear permissions.",
  },
];

export function FaqSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="faq" className="section faq-section" aria-labelledby="faq-heading">
      <motion.div
        className="faq-chat"
        initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.55 }}
      >
        <p className="faq-time">Every day, 9:01 AM</p>
        <h2 id="faq-heading" className="sr-only">Frequently asked questions about Cobbins</h2>

        <Accordion.Root type="single" collapsible defaultValue="item-0" className="faq-list">
          {questions.map((item, index) => (
            <Accordion.Item value={`item-${index}`} className="faq-item" key={item.question}>
              <Accordion.Header>
                <Accordion.Trigger className="faq-trigger">
                  <span>{item.question}</span>
                  <Plus aria-hidden />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="faq-content">
                <p>{item.answer}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>

        <a className="faq-contact" href="mailto:support@cobbins.ai">Still curious? Ask the Cobbins team ↗</a>
      </motion.div>
    </section>
  );
}
