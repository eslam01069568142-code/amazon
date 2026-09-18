import { cookies } from 'next/headers';

export async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get('admin_auth');
  return adminAuth?.value === 'true';
}
