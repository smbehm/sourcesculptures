import { useEffect } from "react";

const AdminSettings = () => {
  useEffect(() => { document.title = "Settings — Admin"; }, []);
  return (
    <div className="px-8 py-6 max-w-3xl">
      <h1 className="font-display uppercase text-2xl font-bold mb-2">Site Settings</h1>
      <p className="text-sm text-muted-foreground">More no-code controls (hero copy, contact details, social links) can be added here on request.</p>
    </div>
  );
};

export default AdminSettings;
