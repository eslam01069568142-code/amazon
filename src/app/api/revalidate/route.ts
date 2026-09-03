import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return handleRevalidate(req);
}

export async function POST(req: Request) {
  return handleRevalidate(req);
}

async function handleRevalidate(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    const pathParam = searchParams.get('path');

    // Optional secret check if REVALIDATION_SECRET env variable is set
    const expectedSecret = process.env.REVALIDATION_SECRET || process.env['REVALIDATION_SECRET'];
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ success: false, message: 'Invalid secret token' }, { status: 401 });
    }

    if (pathParam) {
      revalidatePath(pathParam);
    } else {
      // Revalidate layout and core pages
      revalidatePath('/', 'layout');
      revalidatePath('/', 'page');
      revalidatePath('/product/[id]', 'page');
      try {
        (revalidateTag as any)('products');
        (revalidateTag as any)('sections');
        (revalidateTag as any)('settings');
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      message: pathParam ? `Revalidated path '${pathParam}'` : 'Revalidated all pages and layouts successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Revalidation error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to revalidate' }, { status: 500 });
  }
}
