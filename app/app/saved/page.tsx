import { auth, createClerkClient } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { getUserPlanSimple, PLAN_CONFIG } from '@/lib/entitlements';
import { DashboardLayout } from '@/components/DashboardLayout';
import SavedGenerationsClient from '@/components/SavedGenerationsClient';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export default async function SavedPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  
  const user = await clerkClient.users.getUser(userId);
  const plan = await getUserPlanSimple(user);
  
  if (!PLAN_CONFIG[plan].canSaveGenerations) {
    notFound(); // 404 for Free users
  }
  
  // Render saved generations list with dashboard layout
  return (
    <DashboardLayout>
      <SavedGenerationsClient />
    </DashboardLayout>
  );
}
