'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');

export async function getI18nMessages(locale: string) {
    try {
        const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
        const content = await fs.readFile(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`Error reading ${locale}.json:`, error);
        return null;
    }
}

export async function updateI18nMessages(locale: string, messages: any) {
    try {
        const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
        await fs.writeFile(filePath, JSON.stringify(messages, null, 2), 'utf8');
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error(`Error writing ${locale}.json:`, error);
        return { success: false, error: 'Failed to write file' };
    }
}
