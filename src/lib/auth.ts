import { NextRequest, NextResponse } from 'next/server';

export async function checkAdminAuth(req?: NextRequest): Promise<NextResponse | null> {
  // Return null to allow request to proceed without throwing 401 Unauthorized
  return null;
}
