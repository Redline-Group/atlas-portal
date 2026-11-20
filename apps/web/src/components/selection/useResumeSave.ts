import { useEffect, useState } from "react";
import { useAuth } from "../chat/auth";
import { takeResumeSave } from "../../lib/authReturn";

/** Open state of the save-collection modal.
 *
 *  Reopens the modal after an OAuth round-trip that began in it: openAuth
 *  restores the URL (back to /atlas), and the resume flag — set only when
 *  sign-in is launched from the modal — flips it back open once the user is
 *  logged in. `user &&` short-circuits so the one-shot flag isn't consumed
 *  while auth is still resolving (user null on first render, then populates). */
export function useResumeSave() {
  const [showSave, setShowSave] = useState(false);
  const { user } = useAuth();
  useEffect(() => {
    if (user && takeResumeSave()) setShowSave(true);
  }, [user]);
  return [showSave, setShowSave] as const;
}
