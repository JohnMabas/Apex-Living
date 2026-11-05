"use client";

import { useState, type FormEvent } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { Input, Textarea } from "@/components/Input";
import Button from "@/components/Button";
import type { ContactFormData } from "@/types";

const initialForm: ContactFormData = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

type FormErrors = Partial<Record<keyof ContactFormData, string>>;

function validateForm(data: ContactFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim()) errors.name = "Name is required.";
  if (!data.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!data.subject.trim()) errors.subject = "Subject is required.";
  if (!data.message.trim()) {
    errors.message = "Message is required.";
  } else if (data.message.trim().length < 20) {
    errors.message = "Message must be at least 20 characters.";
  }
  return errors;
}

export default function ContactPage() {
  const [form, setForm] = useState<ContactFormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    // Simulate async send
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-warm-ivory pt-20">
      {/* Page header */}
      <div className="bg-forest-green py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Get in Touch"
            title="Contact Us"
            description="Have a question or need help with a booking? We'd love to hear from you."
            light
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact information */}
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-xl font-semibold text-forest-green mb-6">
                Contact Information
              </h2>
              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-forest-green/8 text-forest-green shrink-0">
                    <MapPin size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal">Address</p>
                    <p className="text-sm text-charcoal/60 mt-0.5">
                      14 Adeola Odeku Street
                      <br />
                      Victoria Island, Lagos
                      <br />
                      Nigeria
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-forest-green/8 text-forest-green shrink-0">
                    <Phone size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal">Phone</p>
                    <a
                      href="tel:+2348000000000"
                      className="text-sm text-charcoal/60 hover:text-forest-green transition-colors mt-0.5 block"
                    >
                      +234 800 000 0000
                    </a>
                    <p className="text-xs text-charcoal/40 mt-0.5">
                      Mon – Fri, 9am – 6pm WAT
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-forest-green/8 text-forest-green shrink-0">
                    <Mail size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal">Email</p>
                    <a
                      href="mailto:hello@nestora.ng"
                      className="text-sm text-charcoal/60 hover:text-forest-green transition-colors mt-0.5 block"
                    >
                      hello@nestora.ng
                    </a>
                    <a
                      href="mailto:support@nestora.ng"
                      className="text-sm text-charcoal/60 hover:text-forest-green transition-colors mt-0.5 block"
                    >
                      support@nestora.ng
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            {/* Response time note */}
            <div className="bg-forest-green/5 rounded-2xl p-5 border border-forest-green/10">
              <p className="text-sm font-medium text-forest-green mb-1">
                Quick Response Guarantee
              </p>
              <p className="text-sm text-charcoal/60">
                We aim to respond to all enquiries within 4 hours during business
                hours. For urgent booking assistance, please call us directly.
              </p>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-2">
            {submitted ? (
              <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-10 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-forest-green/8 mx-auto mb-5">
                  <CheckCircle2 size={30} className="text-forest-green" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-forest-green mb-3">
                  Message Sent!
                </h3>
                <p className="text-charcoal/60 leading-relaxed mb-6">
                  Thank you for reaching out, <strong>{form.name}</strong>. We
                  have received your message and will get back to you within 4
                  hours.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setForm(initialForm);
                    setSubmitted(false);
                  }}
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8">
                <h2 className="font-display text-xl font-semibold text-forest-green mb-6">
                  Send us a Message
                </h2>
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      label="Full Name"
                      type="text"
                      placeholder="Adaeze Okafor"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      error={errors.name}
                      autoComplete="name"
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="adaeze@example.com"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      error={errors.email}
                      autoComplete="email"
                    />
                  </div>
                  <Input
                    label="Subject"
                    type="text"
                    placeholder="Booking enquiry, property question…"
                    value={form.subject}
                    onChange={(e) => handleChange("subject", e.target.value)}
                    error={errors.subject}
                  />
                  <Textarea
                    label="Message"
                    placeholder="Tell us how we can help you…"
                    rows={6}
                    value={form.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    error={errors.message}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    className="w-full sm:w-auto"
                  >
                    <Send size={16} />
                    Send Message
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
