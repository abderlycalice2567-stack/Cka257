import Link from "next/link";

export const metadata = { title: "Not permitted" };

export default function Forbidden() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <h1 className="text-2xl font-bold">You don&apos;t have access to this area</h1>
      <p className="mt-3 text-sm text-muted">Your account doesn&apos;t include the permission this page needs. A Super Administrator can adjust your role.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link className="btn-outline btn-sm" href="/admin">Dashboard</Link>
        <Link className="btn-outline btn-sm" href="/en">Website</Link>
      </div>
    </div>
  );
}
