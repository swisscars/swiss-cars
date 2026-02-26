import type { Metadata } from 'next';
import ContactPageClient from '@/components/contact/ContactPageClient';

export const metadata: Metadata = {
    title: 'Contact | SwissCars.md',
    description: 'Contactează SwissCars pentru orice informație legată de importul sau vânzarea auto din Elveția.',
};

export default function ContactPage() {
    return <ContactPageClient />;
}
