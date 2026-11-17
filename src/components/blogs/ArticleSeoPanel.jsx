"use client";

import { useMemo } from "react";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { slugify } from "@/lib/slugify";
import { cardClass, inputClass, labelClass } from "./formStyles";

const MAX_FAQS = 10;

function countWords(html = "") {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();

  return text ? text.split(/\s+/).length : 0;
}

function CharCount({ value, max }) {
  return (
    <span
      className={`text-xs ${value.length > max ? "text-rose-600" : "text-slate-400"}`}
    >
      {value.length}/{max}
    </span>
  );
}

// SEO fields, FAQ builder and a live checklist.
// values: the blog form state, onChange(field, value)
export default function ArticleSeoPanel({ values, onChange, hasCoverImage }) {
  const metaTitle = values.seoTitle.trim() || values.title.trim();
  const metaDescription = values.seoDescription.trim() || values.excerpt.trim();
  const keyword = values.focusKeyword.trim().toLowerCase();

  const wordCount = useMemo(() => countWords(values.content), [values.content]);

  const checks = [
    {
      label: "SEO title is 30–70 characters",
      passed: metaTitle.length >= 30 && metaTitle.length <= 70,
    },
    {
      label: "Meta description is 120–170 characters",
      passed: metaDescription.length >= 120 && metaDescription.length <= 170,
    },
    { label: "Focus keyword is set", passed: Boolean(keyword) },
    {
      label: "Focus keyword is in the SEO title",
      passed: Boolean(keyword) && metaTitle.toLowerCase().includes(keyword),
    },
    {
      label: "Focus keyword is in the meta description",
      passed:
        Boolean(keyword) && metaDescription.toLowerCase().includes(keyword),
    },
    {
      label: "Focus keyword is in the slug",
      passed: Boolean(keyword) && values.slug.includes(slugify(keyword)),
    },
    {
      label: `Content has at least 300 words (${wordCount})`,
      passed: wordCount >= 300,
    },
    { label: "Cover image is added", passed: Boolean(hasCoverImage) },
  ];

  const passedCount = checks.filter((check) => check.passed).length;

  const updateFaq = (index, field, value) => {
    onChange(
      "faqs",
      values.faqs.map((faq, i) => (i === index ? { ...faq, [field]: value } : faq)),
    );
  };

  const addFaq = () => {
    if (values.faqs.length >= MAX_FAQS) return;
    onChange("faqs", [...values.faqs, { question: "", answer: "" }]);
  };

  const removeFaq = (index) => {
    onChange(
      "faqs",
      values.faqs.filter((_, i) => i !== index),
    );
  };

  return (
    <section className={cardClass}>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-900">SEO</h2>
        <p className="mt-1 text-sm text-slate-500">
          Optional. Empty fields fall back to the title and excerpt.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="seoTitle" className={labelClass}>
              SEO Title
            </label>
            <CharCount value={values.seoTitle} max={70} />
          </div>
          <input
            id="seoTitle"
            type="text"
            maxLength={70}
            value={values.seoTitle}
            onChange={(e) => onChange("seoTitle", e.target.value)}
            placeholder={values.title || "Title shown in search results"}
            className={inputClass}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="seoDescription" className={labelClass}>
              Meta Description
            </label>
            <CharCount value={values.seoDescription} max={170} />
          </div>
          <textarea
            id="seoDescription"
            rows={3}
            maxLength={170}
            value={values.seoDescription}
            onChange={(e) => onChange("seoDescription", e.target.value)}
            placeholder={values.excerpt || "Description shown in search results"}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label htmlFor="focusKeyword" className={labelClass}>
            Focus Keyword
          </label>
          <input
            id="focusKeyword"
            type="text"
            maxLength={80}
            value={values.focusKeyword}
            onChange={(e) => onChange("focusKeyword", e.target.value)}
            placeholder="e.g. next.js dashboard"
            className={inputClass}
          />
        </div>

        {/* Checklist */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-sm font-medium text-slate-700">
            SEO checklist ({passedCount}/{checks.length})
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {checks.map((check) => (
              <li key={check.label} className="flex items-start gap-2 text-sm">
                {check.passed ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                )}
                <span className={check.passed ? "text-slate-700" : "text-slate-500"}>
                  {check.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* FAQs */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              FAQs ({values.faqs.length}/{MAX_FAQS})
            </p>
            <button
              type="button"
              onClick={addFaq}
              disabled={values.faqs.length >= MAX_FAQS}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add FAQ
            </button>
          </div>

          {values.faqs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
              No FAQs yet. FAQs can show as rich results in Google.
            </p>
          ) : (
            <div className="space-y-3">
              {values.faqs.map((faq, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-xl border border-slate-200 p-3"
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="text"
                      maxLength={200}
                      value={faq.question}
                      onChange={(e) => updateFaq(index, "question", e.target.value)}
                      placeholder={`Question ${index + 1}`}
                      aria-label={`FAQ question ${index + 1}`}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      aria-label={`Remove FAQ ${index + 1}`}
                      className="cursor-pointer rounded-lg p-2.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={1000}
                    value={faq.answer}
                    onChange={(e) => updateFaq(index, "answer", e.target.value)}
                    placeholder="Answer"
                    aria-label={`FAQ answer ${index + 1}`}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
