import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useViewerRole(activityHostId: string) {
  const [viewerRole, setViewerRole] = useState<"guest" | "host">("guest");

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        setViewerRole("guest");
        return;
      }

      setViewerRole(user.id === activityHostId ? "host" : "guest");
    };

    run();
  }, [activityHostId]);

  return viewerRole;
}