import { NextResponse } from 'next/server';
import { syncAllIncome } from '@/lib/incomeService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // You can add a secret key check here for security
        // const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //   return new Response('Unauthorized', { status: 401 });
        // }

        await syncAllIncome();
        return NextResponse.json({ success: true, message: 'Income sync triggered successfully.' });
    } catch (error: any) {
        console.error('Error in sync-income cron:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
