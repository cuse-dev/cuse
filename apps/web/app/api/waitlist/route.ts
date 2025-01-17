import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    if (!process.env.RESEND_AUDIENCE_ID) {
        throw new Error('RESEND_AUDIENCE_ID is not set');
    }
    try {
        const { email } = await request.json();
        const { data, error } = await resend.contacts.create({
            audienceId: process.env.RESEND_AUDIENCE_ID,
            email: email,
        });
        if (error) {
            throw new Error(error.message);
        }
        return Response.json({ data });
    } catch (error) {
        console.error(error);
        return Response.json({ error }, { status: 500 });
    }
}