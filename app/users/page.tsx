import { createServerSupabaseClient } from "@/lib/server-utils";
import { redirect } from "next/navigation";

function SettingsError({ message }: { message: string }) {
  return (
    <>
      <h3 className="text-lg font-medium">Error</h3>
      <p>{message}</p>
    </>
  );
}

export default async function UsersPage() {
  // Create supabase server component client and obtain user session from stored cookie
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // Users who are already signed in should be redirected to species page
    redirect("/");
  }

  const { data, error } = await supabase.from("profiles").select();

  if (error) {
    return <SettingsError message={error.message} />;
  }

  if (!data || data.length === 0) {
    return <SettingsError message="No profiles found." />;
  }


  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">User Information</h1>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Display Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Biography
            </th>
          </tr>
        </thead>
        <tbody>
        {data.map((profile) => (
          <tr key={profile.id}>
            <td className="px-6 py-4 whitespace-nowrap">{profile.email}</td>
            <td className="px-6 py-4 whitespace-nowrap">{profile.display_name}</td>
            <td className="px-6 py-4 whitespace-nowrap">{profile.biography || 'N/A'}</td>
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  );
}
