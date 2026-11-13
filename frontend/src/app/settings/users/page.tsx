'use client';

import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ReadOnlyNotice } from '@/components/ui/ReadOnlyNotice';
import { Skeleton } from '@/components/ui/Skeleton';
import { UsersTable } from '@/components/settings/UsersTable';
import { PasswordAccountForm } from '@/components/settings/PasswordAccountForm';
import { USERS_KEY, fetchUsers } from '@/components/settings/usersApi';
import type { UsersResponse } from '@/types/api';

export default function UsersAccessPage() {
  const { data: session, status } = useSession();
  const isOwner = session?.user?.role === 'owner';

  // A non-owner never fires the request: a null key means no fetch.
  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
    isOwner ? USERS_KEY : null,
    fetchUsers,
  );

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <UsersIcon className="h-8 w-8 text-foreground-muted" />
              <h1 className="text-2xl font-bold text-foreground">Users and access</h1>
            </div>

            {status === 'loading' ? (
              <Skeleton.Card />
            ) : !isOwner ? (
              <ReadOnlyNotice hint="Only the site owner can manage who has access." />
            ) : (
              <div className="space-y-8">
                <UsersTable
                  users={data?.users}
                  isLoading={isLoading}
                  error={error}
                  onRetry={() => void mutate()}
                  onChanged={() => mutate()}
                />
                <section aria-labelledby="add-account-heading">
                  <h2 id="add-account-heading" className="text-lg font-semibold text-foreground mb-4">
                    Add a password account
                  </h2>
                  <PasswordAccountForm onCreated={() => mutate()} />
                </section>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
