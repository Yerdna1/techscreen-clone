"use client"

import { Accordion, AccordionItem } from "@/components/ui/accordion"

const faqs = [
  {
    question: "How do I get started?",
    answer:
      "Simply sign up, install Tech Screen, and start using it instantly—no complex setup required!",
  },
  {
    question: "What is Tech Screen?",
    answer:
      "Tech Screen is an AI-powered tool that helps you navigate technical interviews by providing real-time assistance. It works seamlessly in the background, ensuring you stay confident and perform at your best.",
  },
  {
    question: "Is Tech Screen detectable?",
    answer:
      "No. Tech Screen is completely invisible to screen-sharing software, screenshots, and recordings on platforms like Zoom, Google Meet, HackerRank, and CoderPad.",
  },
  {
    question: "How fast are the responses?",
    answer:
      "Tech Screen delivers instant and accurate responses, ensuring you get real-time assistance without delays, so you can focus on solving problems without interruptions.",
  },
  {
    question: "What are the pricing options?",
    answer:
      "We offer flexible pricing plans tailored to different needs. Check our pricing page for details on free trials and premium features.",
  },
  {
    question: "What types of input does Tech Screen support?",
    answer:
      "Tech Screen can process multiple types of input, including computer audio, microphone input, and screenshots.",
  },
]

export function FAQ() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold">Frequently Asked Questions</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about Tech Screen
          </p>
        </div>

        <Accordion className="space-y-2">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} title={faq.question}>
              <p className="text-muted-foreground">{faq.answer}</p>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
